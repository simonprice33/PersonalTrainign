const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to contact form
app.use('/api/contact', limiter);

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      ciphers: 'SSLv3'
    }
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
    service: 'Simon Price PT Backend'
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
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone, goals, experience, message } = req.body;

    // Create email content
    const emailSubject = `New PT Consultation Request from ${name}`;
    const emailText = `
New consultation request from your website:

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Fitness Goals: ${goals}
Experience Level: ${experience || 'Not specified'}

Message:
${message || 'No additional message'}

---
Reply directly to: ${email}
Submitted at: ${new Date().toLocaleString('en-GB')}
    `;

    const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #00BFFF;">New PT Consultation Request</h2>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Client Information:</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Fitness Goals:</strong> ${goals}</p>
        <p><strong>Experience Level:</strong> ${experience || 'Not specified'}</p>
      </div>
      
      ${message ? `
      <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Message:</h3>
        <p>${message}</p>
      </div>
      ` : ''}
      
      <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0;"><strong>Submitted:</strong> ${new Date().toLocaleString('en-GB')}</p>
        <p style="margin: 5px 0 0 0;">Reply directly to: <a href="mailto:${email}">${email}</a></p>
      </div>
    </div>
    `;

    // Create transporter
    const transporter = createTransporter();

    // Verify transporter
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
    console.log(`Contact form submitted by ${name} (${email}) at ${new Date().toISOString()}`);

    res.status(200).json({
      success: true,
      message: 'Thank you for your interest! Simon will get back to you within 24 hours.'
    });

  } catch (error) {
    console.error('Contact form submission error:', error);

    res.status(500).json({
      success: false,
      message: 'Sorry, there was a problem sending your message. Please try again or contact simon.price.33@hotmail.com directly.'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Simon Price PT Backend running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ Email configured for: ${process.env.EMAIL_TO}`);
});

module.exports = app;