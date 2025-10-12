const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientCredentialProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));

// CORS configuration for local development
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting for contact form
const contactLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many contact form submissions from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to contact form
app.use('/api/contact', contactLimiter);

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    },
    requireTLS: true,
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    // Exchange Online SMTP AUTH requirements
    authMethod: 'LOGIN'
  });
};

// Validation rules for contact form
const contactValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim()
    .escape(),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone number must be less than 20 characters')
    .trim(),
  body('goals')
    .isIn(['weight-loss', 'muscle-gain', 'strength', 'endurance', 'general', 'other'])
    .withMessage('Please select a valid fitness goal'),
  body('experience')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Please select a valid experience level'),
  body('message')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Message must be less than 1000 characters')
    .trim()
];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Simon Price PT Backend',
    environment: process.env.NODE_ENV
  });
});

// Contact form endpoint
app.post('/api/contact', contactValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Please check your form inputs',
        errors: errors.array()
      });
    }

    const { name, email, phone, goals, experience, message } = req.body;

    // Create email content
    const emailSubject = `🏋️ New PT Consultation Request from ${name}`;
    const emailText = `
New consultation request from your website:

👤 Name: ${name}
📧 Email: ${email}
📱 Phone: ${phone || 'Not provided'}
🎯 Fitness Goals: ${goals}
💪 Experience Level: ${experience || 'Not specified'}

💬 Message:
${message || 'No additional message'}

---
Reply directly to: ${email}
Submitted at: ${new Date().toLocaleString('en-GB')}
    `;

    const emailHtml = `
    <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #00BFFF 0%, #0099cc 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">🏋️ New PT Consultation Request</h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Simon Price Personal Training</p>
      </div>
      
      <!-- Client Information -->
      <div style="padding: 30px;">
        <div style="background: #f8f9ff; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #00BFFF;">
          <h2 style="color: #1a1a2e; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Client Information</h2>
          <div style="display: grid; gap: 15px;">
            <div><strong style="color: #00BFFF;">👤 Name:</strong> <span style="color: #333;">${name}</span></div>
            <div><strong style="color: #00BFFF;">📧 Email:</strong> <a href="mailto:${email}" style="color: #00BFFF; text-decoration: none;">${email}</a></div>
            <div><strong style="color: #00BFFF;">📱 Phone:</strong> <span style="color: #333;">${phone || 'Not provided'}</span></div>
            <div><strong style="color: #00BFFF;">🎯 Fitness Goals:</strong> <span style="color: #333; text-transform: capitalize;">${goals.replace('-', ' ')}</span></div>
            <div><strong style="color: #00BFFF;">💪 Experience:</strong> <span style="color: #333; text-transform: capitalize;">${experience || 'Not specified'}</span></div>
          </div>
        </div>
        
        ${message ? `
        <div style="background: #f0f8ff; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #00BFFF;">
          <h3 style="color: #1a1a2e; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">💬 Message:</h3>
          <p style="color: #333; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
        </div>
        ` : ''}
        
        <!-- Action Section -->
        <div style="background: #e8f5e8; padding: 25px; border-radius: 12px; text-align: center; border-left: 4px solid #28a745;">
          <p style="margin: 0 0 15px 0; color: #333;"><strong>⏰ Submitted:</strong> ${new Date().toLocaleString('en-GB')}</p>
          <a href="mailto:${email}" style="background: #00BFFF; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 10px;">Reply to ${name}</a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background: #1a1a2e; padding: 20px; text-align: center;">
        <p style="color: rgba(255, 255, 255, 0.8); margin: 0; font-size: 14px;">This email was sent from your Simon Price PT website contact form</p>
      </div>
    </div>
    `;

    // Create and verify transporter
    const transporter = createTransporter();
    await transporter.verify();

    // Send email
    const mailOptions = {
      from: `"Simon Price PT Website" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_TO,
      replyTo: email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    };

    await transporter.sendMail(mailOptions);

    // Log successful submission (don't log sensitive data in production)
    console.log(`✅ Contact form submitted by ${name} (${email}) at ${new Date().toISOString()}`);

    res.status(200).json({
      success: true,
      message: 'Thank you for your interest! Simon will get back to you within 24 hours.'
    });

  } catch (error) {
    console.error('❌ Contact form submission error:', error);

    // Different error messages based on error type
    let errorMessage = 'Sorry, there was a problem sending your message. Please try again or contact simon.price.33@hotmail.com directly.';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email configuration error. Please contact simon.price.33@hotmail.com directly.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection error. Please try again in a few minutes or contact simon.price.33@hotmail.com directly.';
    }

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simon Price PT Backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📧 Email configured for: ${process.env.EMAIL_TO}`);
  console.log(`🔗 CORS enabled for: ${process.env.CORS_ORIGIN}`);
});

module.exports = app;