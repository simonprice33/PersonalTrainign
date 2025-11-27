const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
const { ClientSecretCredential } = require('@azure/identity');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Initialize Stripe only if key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'YOUR_SECRET_KEY_HERE_FROM_LOCAL_ENV') {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe initialized');
} else {
  console.log('⚠️  Stripe key not configured - Stripe features will be disabled');
}

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB Connection
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'simonprice_pt_db';
let db = null;
let emailCollection = null;
let adminUsersCollection = null;
let clientsCollection = null;
let clientUsersCollection = null;

// Connect to MongoDB
MongoClient.connect(mongoUrl, { 
  serverSelectionTimeoutMS: 5000
})
  .then(async client => {
    console.log('✅ Connected to MongoDB');
    db = client.db(dbName);
    emailCollection = db.collection('mailing_list');
    adminUsersCollection = db.collection('admin_users');
    clientsCollection = db.collection('clients');
    clientUsersCollection = db.collection('client_users');
    
    // Create unique index on email field
    emailCollection.createIndex({ email: 1 }, { unique: true })
      .then(() => console.log('✅ Email index created'))
      .catch(err => console.log('ℹ️ Email index already exists'));
    
    // Create unique index on admin email field
    adminUsersCollection.createIndex({ email: 1 }, { unique: true })
      .then(() => console.log('✅ Admin users index created'))
      .catch(err => console.log('ℹ️ Admin users index already exists'));
    
    // Check for default admin user and create if not present
    try {
      const adminCount = await adminUsersCollection.countDocuments();
      
      if (adminCount === 0) {
        console.log('🔧 No admin users found. Creating default admin user...');
        
        const defaultEmail = 'simon.price@simonprice-pt.co.uk';
        const defaultPassword = 'Qwerty1234!!!';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        const defaultAdmin = {
          email: defaultEmail,
          password: hashedPassword,
          name: 'Simon Price',
          role: 'admin',
          created_at: new Date(),
          last_login: null
        };
        
        await adminUsersCollection.insertOne(defaultAdmin);
        console.log('✅ Default admin user created successfully');
        console.log(`   📧 Email: ${defaultEmail}`);
        console.log(`   🔑 Password: ${defaultPassword}`);
        console.log('   ⚠️  Please change the password after first login!');
      } else {
        console.log(`ℹ️  Found ${adminCount} admin user(s) in database`);
      }
    } catch (err) {
      console.error('❌ Error checking/creating default admin:', err.message);
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️ App will continue without database functionality');
  });

// Helper function to save or update email in database
async function saveEmail(email, optedIn, source, additionalData = {}) {
  if (!emailCollection) {
    console.log('⚠️ Database not available, skipping email storage');
    return;
  }

  try {
    const now = new Date();
    const existingEmail = await emailCollection.findOne({ email });

    if (existingEmail) {
      // Update existing record
      const updateData = {
        $set: {
          opted_in: optedIn,
          last_updated: now,
          source,
          ...additionalData
        }
      };

      // Set opt-in or opt-out date based on status
      if (optedIn && !existingEmail.opted_in) {
        updateData.$set.opt_in_date = now;
      } else if (!optedIn && existingEmail.opted_in) {
        updateData.$set.opt_out_date = now;
      }

      await emailCollection.updateOne({ email }, updateData);
      console.log(`📝 Updated email record for ${email} (opted_in: ${optedIn})`);
    } else {
      // Create new record
      const newEmail = {
        email,
        opted_in: optedIn,
        opt_in_date: optedIn ? now : null,
        opt_out_date: optedIn ? null : now,
        source,
        first_collected: now,
        last_updated: now,
        ...additionalData
      };

      await emailCollection.insertOne(newEmail);
      console.log(`✅ New email saved: ${email} from ${source} (opted_in: ${optedIn})`);
    }
  } catch (error) {
    console.error('❌ Error saving email to database:', error.message);
  }
}

// JWT Helper Functions
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_key_in_production';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '20m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: 'admin' },
    JWT_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRY }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: 'admin' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRY }
  );
}

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
}

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));

// CORS configuration (minimal changes)
// - Supports comma-separated CORS_ORIGINS env var
// - Falls back to localhost + your domain (http & https)
// - Allows preflight (OPTIONS)
const defaultOrigins = [
  'http://localhost:3000',
  'http://simonprice-pt.co.uk',
  'http://www.simonprice-pt.co.uk',
  'https://simonprice-pt.co.uk',
  'https://www.simonprice-pt.co.uk'
];

const allowedOrigins = (process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : defaultOrigins);

const corsOptions = {
  origin: (origin, cb) => {
    // If CORS_ORIGINS is "*", allow all origins
    if (allowedOrigins.includes('*')) return cb(null, true);
    // If no origin (like Postman/curl), allow it
    if (!origin) return cb(null, true);
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
// Ensure preflight works for all /api/* routes
app.options('/api/*', cors(corsOptions));

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

// Microsoft Graph API client configuration
const createGraphClient = () => {
  const credential = new ClientSecretCredential(
    process.env.TENANT_ID,
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
  );

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default']
  });

  return Client.initWithMiddleware({
    authProvider: authProvider
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

    const { name, email, phone, goals, experience, message, recaptchaToken } = req.body;

    // COMMENTED OUT - reCAPTCHA verification - Revisit later
    // if (recaptchaToken) {
    //   try {
    //     console.log(`🔍 Verifying reCAPTCHA token for ${email}...`);
    //     const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/x-www-form-urlencoded',
    //       },
    //       body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
    //     });

    //     const recaptchaData = await recaptchaResponse.json();
    //     console.log(`🔍 reCAPTCHA response:`, recaptchaData);
        
    //     // reCAPTCHA v2 only returns success true/false (no score)
    //     if (recaptchaData.success) {
    //       console.log(`✅ reCAPTCHA v2 verification passed for ${email}`);
    //     } else {
    //       console.log(`⚠️ reCAPTCHA v2 verification failed for ${email}`);
    //       return res.status(400).json({
    //         success: false,
    //         message: 'reCAPTCHA verification failed. Please try again.'
    //       });
    //     }
    //   } catch (error) {
    //     console.log(`⚠️ reCAPTCHA verification error: ${error.message}`);
    //   }
    // } else {
    //   console.log(`⚠️ No reCAPTCHA token provided for ${email}`);
    // }

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

    // Save email to database first (assume opted in from contact form)
    await saveEmail(email, true, 'contact_form', {
      name,
      phone: phone || null,
      goals,
      experience: experience || null
    });

    // Create Graph client and send email
    const graphClient = createGraphClient();

    const emailMessage = {
      subject: emailSubject,
      body: {
        contentType: 'HTML',
        content: emailHtml
      },
      toRecipients: [
        {
          emailAddress: {
            address: process.env.EMAIL_TO
          }
        }
      ],
      replyTo: [
        {
            emailAddress: {
              address: email,
              name: name
            }
        }
      ]
    };

    await graphClient
      .api(`/users/${process.env.EMAIL_FROM}/sendMail`)
      .post({
        message: emailMessage,
        saveToSentItems: true
      });

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

// Client Contact Request endpoint
app.post('/api/client-contact', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('bestTimeToCall').trim().notEmpty().withMessage('Best time to call is required')
], async (req, res) => {
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

    const { name, email, phone, bestTimeToCall, joinMailingList } = req.body;

    // Create email content for Simon
    const emailSubject = `🔔 New Client Contact Request from ${name}`;
    
    const emailHtml = `
    <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #00BFFF 0%, #0099cc 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">📞 New Client Contact Request</h1>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px;">
        <p style="color: #1a1a2e; font-size: 16px; margin-bottom: 25px;">
          You have a new contact request from your website:
        </p>
        
        <!-- Client Details -->
        <div style="background: #f8f9ff; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #00BFFF;">
          <h2 style="color: #1a1a2e; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Client Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #00BFFF; font-weight: 600; width: 40%;">Name:</td>
              <td style="padding: 8px 0; color: #1a1a2e;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #00BFFF; font-weight: 600;">Email:</td>
              <td style="padding: 8px 0; color: #1a1a2e;"><a href="mailto:${email}" style="color: #00BFFF; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #00BFFF; font-weight: 600;">Phone:</td>
              <td style="padding: 8px 0; color: #1a1a2e;"><a href="tel:${phone}" style="color: #00BFFF; text-decoration: none;">${phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #00BFFF; font-weight: 600;">Best Time to Call:</td>
              <td style="padding: 8px 0; color: #1a1a2e; font-weight: 600;">${bestTimeToCall.replace(/-/g, ' ').toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #00BFFF; font-weight: 600;">Mailing List:</td>
              <td style="padding: 8px 0; color: #1a1a2e;">${joinMailingList ? '✅ Yes' : '❌ No'}</td>
            </tr>
          </table>
        </div>
        
        <!-- Action Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="tel:${phone}" style="display: inline-block; background: linear-gradient(135deg, #00BFFF 0%, #0099cc 100%); color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 600;">
            📞 Call ${name.split(' ')[0]} Now
          </a>
        </div>
        
        <!-- Timestamp -->
        <div style="text-align: center; padding: 15px; background: #f0f0f0; border-radius: 8px; margin-top: 20px;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            Received: ${new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}
          </p>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background: #1a1a2e; padding: 20px; text-align: center;">
        <p style="color: rgba(255, 255, 255, 0.8); margin: 0; font-size: 14px;">Simon Price Personal Training</p>
        <p style="color: rgba(255, 255, 255, 0.6); margin: 5px 0 0 0; font-size: 12px;">Client Contact Request System</p>
      </div>
    </div>
    `;

    // Save email to database first
    // joinMailingList checkbox: checked = user WANTS to join (opted_in = true)
    const optedIn = joinMailingList || false;
    await saveEmail(email, optedIn, 'client_inquiry', {
      name,
      phone,
      best_time_to_call: bestTimeToCall
    });

    // Create Graph client and send email
    const graphClient = createGraphClient();

    const emailMessage = {
      subject: emailSubject,
      body: {
        contentType: 'HTML',
        content: emailHtml
      },
      toRecipients: [
        {
          emailAddress: {
            address: process.env.EMAIL_TO || 'simon.price@simonprice-pt.co.uk'
          }
        }
      ]
    };

    await graphClient
      .api(`/users/${process.env.EMAIL_FROM}/sendMail`)
      .post({
        message: emailMessage,
        saveToSentItems: true
      });

    // Log successful submission
    console.log(`✅ Client contact request from ${name} (${email}) sent to ${process.env.EMAIL_TO} at ${new Date().toISOString()}`);
    console.log(`   Best time to call: ${bestTimeToCall}, Mailing list: ${joinMailingList ? 'No' : 'Yes'}`);

    res.status(200).json({
      success: true,
      message: 'Your request has been submitted successfully!'
    });

  } catch (error) {
    console.error('❌ Client contact request error:', error);

    res.status(500).json({
      success: false,
      message: 'Sorry, there was a problem submitting your request. Please try again or contact us directly.'
    });
  }
});


// TDEE Results Email endpoint
app.post('/api/tdee-results', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('results').isObject().withMessage('Results data is required'),
  body('userInfo').isObject().withMessage('User info is required')
], async (req, res) => {
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

    const { email, joinMailingList, results, userInfo } = req.body;

    // Create email content
    const emailSubject = `🏋️ Your TDEE Calculation Results - Simon Price PT`;
    
    const emailHtml = `
    <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #00BFFF 0%, #0099cc 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">🏋️ Your TDEE Results</h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Simon Price Personal Training</p>
      </div>
      
      <!-- User Info -->
      <div style="padding: 30px;">
        <div style="background: #f8f9ff; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #00BFFF;">
          <h2 style="color: #1a1a2e; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Your Information</h2>
          <div style="display: grid; gap: 10px;">
            <div><strong style="color: #00BFFF;">Age:</strong> ${userInfo.age} years</div>
            <div><strong style="color: #00BFFF;">Gender:</strong> ${userInfo.gender.charAt(0).toUpperCase() + userInfo.gender.slice(1)}</div>
            <div><strong style="color: #00BFFF;">Weight:</strong> ${userInfo.weight}</div>
            <div><strong style="color: #00BFFF;">Height:</strong> ${userInfo.height}</div>
            <div><strong style="color: #00BFFF;">Activity Level:</strong> ${userInfo.activityLevel === '1.2' ? 'Sedentary' : userInfo.activityLevel === '1.375' ? 'Light' : userInfo.activityLevel === '1.55' ? 'Moderate' : userInfo.activityLevel === '1.725' ? 'Active' : 'Very Active'}</div>
            <div><strong style="color: #00BFFF;">Goal:</strong> ${userInfo.goal === 'lose' ? 'Lose Weight' : userInfo.goal === 'gain' ? 'Gain Weight' : 'Maintain Weight'}</div>
          </div>
        </div>
        
        <!-- Results -->
        <div style="background: #f0f8ff; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
          <h2 style="color: #1a1a2e; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; text-align: center;">Your Results</h2>
          
          <div style="display: grid; gap: 15px;">
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="color: #666; font-size: 14px; margin-bottom: 5px;">BMR (Basal Metabolic Rate)</div>
              <div style="color: #00BFFF; font-size: 32px; font-weight: bold;">${results.bmr}</div>
              <div style="color: #999; font-size: 12px;">calories/day at rest</div>
            </div>
            
            <div style="background: linear-gradient(135deg, #00BFFF 0%, #0099cc 100%); padding: 20px; border-radius: 8px; text-align: center;">
              <div style="color: rgba(255,255,255,0.9); font-size: 14px; margin-bottom: 5px;">TDEE (Total Daily Energy Expenditure)</div>
              <div style="color: white; font-size: 36px; font-weight: bold;">${results.tdee}</div>
              <div style="color: rgba(255,255,255,0.8); font-size: 12px;">calories/day to maintain</div>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; border: 2px solid #00BFFF;">
              <div style="color: #666; font-size: 14px; margin-bottom: 5px;">Goal Calories</div>
              <div style="color: #00BFFF; font-size: 32px; font-weight: bold;">${results.goalCalories}</div>
              <div style="color: #999; font-size: 12px;">calories/day for your goal</div>
            </div>
          </div>
        </div>
        
        <!-- Macros -->
        <div style="background: #f8f9ff; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
          <h3 style="color: #1a1a2e; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Recommended Macronutrients</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
            <div style="text-align: center;">
              <div style="color: #00BFFF; font-size: 28px; font-weight: bold;">${results.macros.protein}g</div>
              <div style="color: #666; font-size: 14px;">Protein</div>
            </div>
            <div style="text-align: center;">
              <div style="color: #00BFFF; font-size: 28px; font-weight: bold;">${results.macros.carbs}g</div>
              <div style="color: #666; font-size: 14px;">Carbs</div>
            </div>
            <div style="text-align: center;">
              <div style="color: #00BFFF; font-size: 28px; font-weight: bold;">${results.macros.fat}g</div>
              <div style="color: #666; font-size: 14px;">Fats</div>
            </div>
          </div>
        </div>
        
        <!-- CTA -->
        <div style="background: linear-gradient(135deg, #00BFFF 0%, #0099cc 100%); padding: 25px; border-radius: 12px; text-align: center;">
          <h3 style="color: white; margin: 0 0 10px 0; font-size: 20px; font-weight: 600;">Ready to Achieve Your Goals?</h3>
          <p style="color: rgba(255,255,255,0.9); margin: 0 0 20px 0;">Get personalized training and nutrition plans tailored to your results</p>
          <a href="https://simonprice-pt.co.uk#contact" style="background: white; color: #00BFFF; padding: 12px 24px; border-radius: 25px; text-decoration: none; font-weight: 600; display: inline-block;">Book Free Consultation</a>
        </div>
        
        ${joinMailingList ? '<div style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 8px; text-align: center; border: 2px solid #28a745;"><p style="margin: 0; color: #28a745; font-weight: 600;">✅ You\'ve been added to our mailing list!</p><p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Expect exclusive fitness tips and offers soon.</p></div>' : ''}
      </div>
      
      <!-- Footer -->
      <div style="background: #1a1a2e; padding: 20px; text-align: center;">
        <p style="color: rgba(255, 255, 255, 0.8); margin: 0; font-size: 14px;">This email was sent from Simon Price PT</p>
        <p style="color: rgba(255, 255, 255, 0.6); margin: 5px 0 0 0; font-size: 12px;">📧 simon.price@simonprice-pt.co.uk | 🌐 simonprice-pt.co.uk</p>
      </div>
    </div>
    `;

    // Save email to database first with mailing list preference
    await saveEmail(email, joinMailingList, 'tdee_calculator', {
      age: userInfo.age,
      gender: userInfo.gender,
      goal: userInfo.goal
    });

    // Create Graph client and send email
    const graphClient = createGraphClient();

    const emailMessage = {
      subject: emailSubject,
      body: {
        contentType: 'HTML',
        content: emailHtml
      },
      toRecipients: [
        {
          emailAddress: {
            address: email
          }
        }
      ]
    };

    await graphClient
      .api(`/users/${process.env.EMAIL_FROM}/sendMail`)
      .post({
        message: emailMessage,
        saveToSentItems: true
      });

    // Log successful submission
    console.log(`✅ TDEE results sent to ${email} ${joinMailingList ? '(joined mailing list)' : ''} at ${new Date().toISOString()}`);

    res.status(200).json({
      success: true,
      message: 'Your TDEE results have been sent to your email!'
    });

  } catch (error) {
    console.error('❌ TDEE results email error:', error);

    res.status(500).json({
      success: false,
      message: 'Sorry, there was a problem sending your results. Please try again or contact us directly.'
    });
  }
});

// Newsletter Subscription endpoint (Footer)
app.post('/api/newsletter/subscribe', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Save email to database with opted_in=true (newsletter subscription)
    await saveEmail(email, true, 'newsletter_footer', {
      subscribed_via: 'footer'
    });

    console.log(`✅ Newsletter subscription: ${email} (footer)`);

    res.status(200).json({
      success: true,
      message: 'Successfully subscribed to fitness tips and updates!'
    });

  } catch (error) {
    console.error('❌ Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe. Please try again.'
    });
  }
});

// Unsubscribe endpoint
app.post('/api/unsubscribe', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // SECURITY: Always return success to prevent email enumeration attacks
    // This prevents attackers from discovering which emails are in our database
    
    if (emailCollection) {
      // Check if email exists in database
      const existingEmail = await emailCollection.findOne({ email });

      if (existingEmail && existingEmail.opted_in) {
        // Only update if email exists and is currently opted in
        await emailCollection.updateOne(
          { email },
          { 
            $set: { 
              opted_in: false,
              opt_out_date: new Date(),
              last_updated: new Date()
            } 
          }
        );
        console.log(`📭 Unsubscribed: ${email}`);
      } else if (existingEmail && !existingEmail.opted_in) {
        // Already unsubscribed - log but don't change anything
        console.log(`ℹ️ Unsubscribe attempt for already unsubscribed email: ${email}`);
      } else {
        // Email not found - log but still return success
        console.log(`ℹ️ Unsubscribe attempt for non-existent email: ${email}`);
      }
    }

    // Always return success message regardless of whether email exists
    // This prevents email enumeration attacks
    res.status(200).json({
      success: true,
      message: 'You have been successfully unsubscribed from our mailing list. We\'re sorry to see you go!'
    });

  } catch (error) {
    console.error('❌ Unsubscribe error:', error);
    // Even on error, return success to prevent information leakage
    res.status(200).json({
      success: true,
      message: 'You have been successfully unsubscribed from our mailing list. We\'re sorry to see you go!'
    });
  }
});

// ============================================================================
// ADMIN AUTHENTICATION & MANAGEMENT ENDPOINTS
// ============================================================================

// Admin Setup Endpoint - Creates default admin user (one-time use)
app.post('/api/admin/setup', async (req, res) => {
  try {
    if (!adminUsersCollection) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    // Check if any admin users exist
    const existingAdmin = await adminUsersCollection.findOne({});
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin user already exists. Use login instead.'
      });
    }

    // Create default admin user
    const defaultEmail = 'simon.price@simonprice-pt.co.uk';
    const defaultPassword = 'Qwerty1234!!!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const adminUser = {
      email: defaultEmail,
      password: hashedPassword,
      name: 'Simon Price',
      role: 'admin',
      created_at: new Date(),
      last_login: null
    };

    await adminUsersCollection.insertOne(adminUser);

    console.log(`✅ Default admin user created: ${defaultEmail}`);

    res.status(201).json({
      success: true,
      message: 'Default admin user created successfully',
      email: defaultEmail
    });

  } catch (error) {
    console.error('❌ Admin setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin user'
    });
  }
});

// Admin Login
app.post('/api/admin/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
        errors: errors.array()
      });
    }

    if (!adminUsersCollection) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    const { email, password } = req.body;

    // Find admin user
    const admin = await adminUsersCollection.findOne({ email });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await adminUsersCollection.updateOne(
      { _id: admin._id },
      { $set: { last_login: new Date() } }
    );

    // Generate tokens
    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin);

    console.log(`✅ Admin login successful: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Refresh Access Token
app.post('/api/admin/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    jwt.verify(refreshToken, JWT_SECRET, async (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired refresh token'
        });
      }

      // Generate new access token
      const admin = await adminUsersCollection.findOne({ email: user.email });
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const accessToken = generateAccessToken(admin);

      res.status(200).json({
        success: true,
        accessToken
      });
    });

  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

// Forgot Password - Send reset email
app.post('/api/admin/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const { email } = req.body;

    // SECURITY: Always return success to prevent email enumeration
    // Check if admin exists but don't reveal if they don't
    let resetToken = null;
    
    if (adminUsersCollection) {
      const admin = await adminUsersCollection.findOne({ email });
      
      if (admin) {
        // Generate reset token (expires in 1 hour)
        resetToken = jwt.sign(
          { id: admin._id, email: admin.email, type: 'password_reset' },
          JWT_SECRET,
          { expiresIn: '1h' }
        );

        // Create reset link
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/reset-password?token=${resetToken}`;

        // Send email via Microsoft Graph API
        try {
          const graphClient = createGraphClient();

          const emailMessage = {
            message: {
              subject: 'Password Reset Request - Simon Price PT Admin',
              body: {
                contentType: 'HTML',
                content: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1a1a2e;">Password Reset Request</h2>
                    <p>You requested to reset your password for Simon Price PT Admin Dashboard.</p>
                    <p>Click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${resetLink}" 
                         style="background: linear-gradient(135deg, #d3ff62 0%, #a8d946 100%); 
                                color: #1a1a2e; 
                                padding: 12px 30px; 
                                text-decoration: none; 
                                border-radius: 25px; 
                                font-weight: bold;
                                display: inline-block;">
                        Reset Password
                      </a>
                    </div>
                    <p><strong>This link will expire in 1 hour.</strong></p>
                    <p>If you didn't request this reset, please ignore this email and your password will remain unchanged.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 12px;">
                      For security reasons, this link can only be used once. If you need another reset link, please request a new one.
                    </p>
                    <p style="color: #888; font-size: 12px;">
                      Simon Price Personal Training<br>
                      Bognor Regis, West Sussex, UK
                    </p>
                  </div>
                `
              },
              toRecipients: [
                {
                  emailAddress: {
                    address: email
                  }
                }
              ]
            },
            saveToSentItems: 'true'
          };

          await graphClient
            .api(`/users/${process.env.EMAIL_FROM}/sendMail`)
            .post(emailMessage);

          console.log(`📧 Password reset email sent to: ${email}`);
        } catch (emailError) {
          console.error('❌ Failed to send reset email:', emailError.message);
          // Don't reveal email sending failed - still return success
        }
      } else {
        console.log(`ℹ️ Password reset requested for non-existent email: ${email}`);
      }
    }

    // Always return success for security (don't reveal if email exists)
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    // Always return success even on error for security
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  }
});

// Reset Password - Verify token and update password
app.post('/api/admin/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { token, newPassword } = req.body;

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      
      // Check token type
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new password reset.'
      });
    }

    if (!adminUsersCollection) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    // Find admin user
    const { ObjectId } = require('mongodb');
    const admin = await adminUsersCollection.findOne({ _id: new ObjectId(decoded.id) });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await adminUsersCollection.updateOne(
      { _id: admin._id },
      { 
        $set: { 
          password: hashedPassword, 
          updated_at: new Date(),
          password_reset_at: new Date()
        } 
      }
    );

    console.log(`✅ Password reset successful for: ${admin.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now login with your new password.'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.'
    });
  }
});

// Change Password (requires authentication)
app.post('/api/admin/change-password', authenticateToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const admin = await adminUsersCollection.findOne({ email: req.user.email });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await adminUsersCollection.updateOne(
      { _id: admin._id },
      { $set: { password: hashedPassword, updated_at: new Date() } }
    );

    console.log(`✅ Password changed for: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// Get All Admin Users (protected)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    if (!adminUsersCollection) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    const users = await adminUsersCollection.find({}).project({ password: 0 }).toArray();

    res.status(200).json({
      success: true,
      users
    });

  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Create New Admin User (protected)
app.post('/api/admin/users', authenticateToken, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await adminUsersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      password: hashedPassword,
      name,
      role: 'admin',
      created_at: new Date(),
      created_by: req.user.email,
      last_login: null
    };

    const result = await adminUsersCollection.insertOne(newUser);

    console.log(`✅ New admin user created: ${email} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        _id: result.insertedId,
        email,
        name,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('❌ Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

// Reset User Password (protected, admin can reset another user's password)
app.post('/api/admin/users/:id/reset-password', authenticateToken, [
  body('newPassword').isLength({ min: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { newPassword } = req.body;
    const { ObjectId } = require('mongodb');

    const user = await adminUsersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await adminUsersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { password: hashedPassword, updated_at: new Date(), updated_by: req.user.email } }
    );

    console.log(`✅ Password reset for ${user.email} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// Delete Admin User (protected)
app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = require('mongodb');

    // Prevent deleting self
    const userToDelete = await adminUsersCollection.findOne({ _id: new ObjectId(id) });
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userToDelete.email === req.user.email) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await adminUsersCollection.deleteOne({ _id: new ObjectId(id) });

    console.log(`✅ User ${userToDelete.email} deleted by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// Get All Emails (protected)
app.get('/api/admin/emails', authenticateToken, async (req, res) => {
  try {
    if (!emailCollection) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    const { source, opted_in } = req.query;
    const filter = {};

    if (source) {
      filter.source = source;
    }

    if (opted_in !== undefined) {
      filter.opted_in = opted_in === 'true';
    }

    const emails = await emailCollection.find(filter).sort({ last_updated: -1 }).toArray();

    res.status(200).json({
      success: true,
      count: emails.length,
      emails
    });

  } catch (error) {
    console.error('❌ Get emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emails'
    });
  }
});

// Export Emails to CSV (protected)
app.get('/api/admin/emails/export', authenticateToken, async (req, res) => {
  try {
    if (!emailCollection) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    const emails = await emailCollection.find({}).sort({ last_updated: -1 }).toArray();

    // Convert to CSV
    const csvHeader = 'Email,Opted In,Source,Name,Phone,First Collected,Last Updated\n';
    const csvRows = emails.map(e => {
      return `"${e.email}","${e.opted_in}","${e.source}","${e.name || ''}","${e.phone || ''}","${e.first_collected}","${e.last_updated}"`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=emails-export.csv');
    res.status(200).send(csv);

    console.log(`✅ Email export by ${req.user.email}`);

  } catch (error) {
    console.error('❌ Export emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export emails'
    });
  }
});

// ============================================================================
// CLIENT MANAGEMENT & STRIPE SUBSCRIPTION ENDPOINTS
// ============================================================================

// Create Payment Link (Admin - JWT Protected)
app.post('/api/admin/create-payment-link', authenticateToken, [
  body('name').notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('telephone').notEmpty(),
  body('price').isInt({ min: 1 }).optional(),
  body('billingDay').isInt({ min: 1, max: 28 }).optional(),
  body('expirationDays').isInt({ min: 1, max: 30 }).optional(),
  body('prorate').isBoolean().optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { name, email, telephone, price, billingDay, expirationDays, prorate } = req.body;
    const expDays = expirationDays || 7;

    // Generate payment link token with configurable expiry
    const tokenPayload = {
      name,
      email,
      telephone,
      price: price || 125,
      billingDay: billingDay || 1,
      prorate: prorate !== undefined ? prorate : true,
      type: 'payment_onboarding'
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: `${expDays}d` });

    // Create payment link
    const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/client-onboarding?token=${token}`;

    // Send email to client
    try {
      const graphClient = createGraphClient();

      const emailMessage = {
        message: {
          subject: 'Complete Your Personal Training Registration',
          body: {
            contentType: 'HTML',
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a2e;">Welcome to Simon Price Personal Training!</h2>
                <p>Hi ${name},</p>
                <p>Thank you for choosing Simon Price PT. To complete your registration and set up your monthly subscription, please click the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${paymentLink}" 
                     style="background: linear-gradient(135deg, #d3ff62 0%, #a8d946 100%); 
                            color: #1a1a2e; 
                            padding: 15px 40px; 
                            text-decoration: none; 
                            border-radius: 30px; 
                            font-weight: bold;
                            display: inline-block;
                            font-size: 16px;">
                    Complete Registration
                  </a>
                </div>

                <p><strong>Your Subscription Details:</strong></p>
                <ul>
                  <li>Monthly Price: £${price || 125}</li>
                  <li>Billing Date: ${billingDay || 1}${billingDay === 1 ? 'st' : billingDay === 2 ? 'nd' : billingDay === 3 ? 'rd' : 'th'} of each month</li>
                  ${prorate !== false ? '<li>First charge will be prorated based on your signup date</li>' : '<li>Full monthly charge applies immediately</li>'}
                </ul>

                <p style="color: #888; font-size: 14px; margin-top: 30px;">
                  This link will expire in ${expDays} day${expDays > 1 ? 's' : ''}. If you have any questions, please contact Simon directly.
                </p>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                
                <p style="color: #888; font-size: 12px;">
                  Simon Price Personal Training<br>
                  Bognor Regis, West Sussex, UK<br>
                  simon.price@simonprice-pt.co.uk
                </p>
              </div>
            `
          },
          toRecipients: [
            {
              emailAddress: {
                address: email
              }
            }
          ]
        },
        saveToSentItems: 'true'
      };

      await graphClient
        .api(`/users/${process.env.EMAIL_FROM}/sendMail`)
        .post(emailMessage);

      console.log(`📧 Payment link sent to: ${email} (£${price || 125}/month)`);
    } catch (emailError) {
      console.error('❌ Failed to send payment link email:', emailError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to send email. Please try again.'
      });
    }

    // Save client to database immediately (in pending state)
    try {
      if (clientsCollection) {
        const now = new Date();
        const clientData = {
          name,
          email,
          telephone,
          price: price || 125,
          billingDay: billingDay || 1,
          prorate: prorate !== undefined ? prorate : true,
          status: 'pending', // Mark as pending until onboarding complete
          onboarding_token: token,
          token_expires_at: new Date(now.getTime() + (expDays * 24 * 60 * 60 * 1000)),
          link_created_at: now,
          link_created_by: req.user.email, // Admin who created the link
          stripe_customer_id: null,
          stripe_subscription_id: null,
          created_at: now,
          updated_at: now
        };

        // Check if client already exists (by email)
        const existingClient = await clientsCollection.findOne({ email });
        
        if (existingClient) {
          // Update existing pending client
          await clientsCollection.updateOne(
            { email },
            { 
              $set: {
                ...clientData,
                updated_at: now
              }
            }
          );
          console.log(`📝 Updated existing pending client: ${email}`);
        } else {
          // Insert new pending client
          await clientsCollection.insertOne(clientData);
          console.log(`📝 Saved new pending client: ${email}`);
        }
      }
    } catch (dbError) {
      console.error('❌ Failed to save client to database:', dbError.message);
      // Don't fail the request - email was sent successfully
    }

    res.status(200).json({
      success: true,
      message: 'Payment link sent successfully',
      paymentLink,
      expiresIn: `${expDays} day${expDays > 1 ? 's' : ''}`
    });

  } catch (error) {
    console.error('❌ Create payment link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment link'
    });
  }
});

// Resend Payment Link (Admin - JWT Protected)
app.post('/api/admin/resend-payment-link', authenticateToken, [
  body('email').isEmail().normalizeEmail(),
  body('expirationDays').isInt({ min: 1, max: 30 }).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { email, expirationDays } = req.body;
    const expDays = expirationDays || 7;

    // Find client in pending clients collection or use provided data
    if (!clientsCollection) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    // Find the most recent client record with this email
    const existingClient = await clientsCollection
      .find({ email })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray();

    if (!existingClient || existingClient.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found. Please create a new payment link.'
      });
    }

    const client = existingClient[0];

    // Generate new payment link token with configurable expiry
    const tokenPayload = {
      name: client.name,
      email: client.email,
      telephone: client.telephone,
      price: client.price || 125,
      billingDay: client.billingDay || 1,
      prorate: client.prorate !== undefined ? client.prorate : true,
      type: 'payment_onboarding'
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: `${expDays}d` });

    // Create payment link
    const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/client-onboarding?token=${token}`;

    // Send email to client
    try {
      const graphClient = createGraphClient();

      const emailMessage = {
        message: {
          subject: 'Reminder: Complete Your Personal Training Registration',
          body: {
            contentType: 'HTML',
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a2e;">Complete Your Registration - Simon Price PT</h2>
                <p>Hi ${client.name},</p>
                <p>This is a reminder to complete your registration and set up your monthly subscription for Simon Price Personal Training.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${paymentLink}" 
                     style="background: linear-gradient(135deg, #d3ff62 0%, #a8d946 100%); 
                            color: #1a1a2e; 
                            padding: 15px 40px; 
                            text-decoration: none; 
                            border-radius: 30px; 
                            font-weight: bold;
                            display: inline-block;
                            font-size: 16px;">
                    Complete Registration
                  </a>
                </div>

                <p><strong>Your Subscription Details:</strong></p>
                <ul>
                  <li>Monthly Price: £${client.price || 125}</li>
                  <li>Billing Date: ${client.billingDay || 1}${(client.billingDay || 1) === 1 ? 'st' : (client.billingDay || 1) === 2 ? 'nd' : (client.billingDay || 1) === 3 ? 'rd' : 'th'} of each month</li>
                  ${(client.prorate !== false) ? '<li>First charge will be prorated based on your signup date</li>' : '<li>Full monthly charge applies immediately</li>'}
                </ul>

                <p style="color: #888; font-size: 14px; margin-top: 30px;">
                  This link will expire in ${expDays} day${expDays > 1 ? 's' : ''}. If you have any questions, please contact Simon directly.
                </p>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                
                <p style="color: #888; font-size: 12px;">
                  Simon Price Personal Training<br>
                  Bognor Regis, West Sussex, UK<br>
                  simon.price@simonprice-pt.co.uk
                </p>
              </div>
            `
          },
          toRecipients: [
            {
              emailAddress: {
                address: email
              }
            }
          ]
        },
        saveToSentItems: 'true'
      };

      await graphClient
        .api(`/users/${process.env.EMAIL_FROM}/sendMail`)
        .post(emailMessage);

      console.log(`📧 Payment link resent to: ${email} (expires in ${expDays} days)`);
    } catch (emailError) {
      console.error('❌ Failed to resend payment link email:', emailError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to send email. Please try again.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment link resent successfully',
      paymentLink,
      expiresIn: `${expDays} day${expDays > 1 ? 's' : ''}`
    });

  } catch (error) {
    console.error('❌ Resend payment link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend payment link'
    });
  }
});

// Validate Payment Token (Client - Public)
app.post('/api/client/validate-token', [
  body('token').notEmpty()
], async (req, res) => {
  try {
    const { token } = req.body;

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      
      if (decoded.type !== 'payment_onboarding') {
        throw new Error('Invalid token type');
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired link. Please request a new payment link.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: decoded.name,
        email: decoded.email,
        telephone: decoded.telephone,
        price: decoded.price,
        billingDay: decoded.billingDay
      }
    });

  } catch (error) {
    console.error('❌ Validate token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate token'
    });
  }
});

// Create Setup Intent (Client - Public)
app.post('/api/client/create-setup-intent', async (req, res) => {
  try {
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ['card'],
    });

    res.status(200).json({
      success: true,
      clientSecret: setupIntent.client_secret
    });

  } catch (error) {
    console.error('❌ Create setup intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment form'
    });
  }
});

// Complete Onboarding (Client - Public)
app.post('/api/client/complete-onboarding', [
  body('token').notEmpty(),
  body('paymentMethodId').notEmpty(),
  body('dateOfBirth').notEmpty(),
  body('addressLine1').notEmpty(),
  body('city').notEmpty(),
  body('postcode').notEmpty(),
  body('emergencyContactName').notEmpty(),
  body('emergencyContactNumber').notEmpty(),
  body('emergencyContactRelationship').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields',
        errors: errors.array()
      });
    }

    const {
      token,
      paymentMethodId,
      dateOfBirth,
      addressLine1,
      addressLine2,
      city,
      postcode,
      emergencyContactName,
      emergencyContactNumber,
      emergencyContactRelationship
    } = req.body;

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired link'
      });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: decoded.email,
      name: decoded.name,
      phone: decoded.telephone,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
      metadata: {
        source: 'simonprice_pt_onboarding'
      }
    });

    // Calculate billing cycle anchor (next occurrence of billing day)
    const now = new Date();
    const currentDay = now.getDate();
    const billingDay = decoded.billingDay;
    
    let billingDate = new Date(now.getFullYear(), now.getMonth(), billingDay);
    
    // If billing day has passed this month, set for next month
    if (currentDay >= billingDay) {
      billingDate.setMonth(billingDate.getMonth() + 1);
    }
    
    const billingCycleAnchor = Math.floor(billingDate.getTime() / 1000);

    // Find or create product
    let product;
    const products = await stripe.products.search({
      query: "active:'true' AND name:'Personal Training Plan'",
      limit: 1
    });

    if (products.data.length > 0) {
      product = products.data[0];
      console.log(`✅ Using existing product: ${product.id}`);
    } else {
      product = await stripe.products.create({
        name: 'Personal Training Plan',
        description: 'Monthly personal training subscription'
      });
      console.log(`✅ Created new product: ${product.id}`);
    }

    // Find or create price for this specific amount
    const priceAmount = decoded.price * 100; // Convert to pence
    let price;
    
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      currency: 'gbp',
      type: 'recurring',
      limit: 100
    });

    // Find matching price
    price = prices.data.find(p => 
      p.unit_amount === priceAmount && 
      p.recurring?.interval === 'month'
    );

    if (price) {
      console.log(`✅ Using existing price: ${price.id} (£${decoded.price}/month)`);
    } else {
      price = await stripe.prices.create({
        product: product.id,
        currency: 'gbp',
        unit_amount: priceAmount,
        recurring: {
          interval: 'month'
        }
      });
      console.log(`✅ Created new price: ${price.id} (£${decoded.price}/month)`);
    }

    // Create subscription using the price ID
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price: price.id
      }],
      billing_cycle_anchor: billingCycleAnchor,
      proration_behavior: decoded.prorate !== false ? 'create_prorations' : 'none',
      metadata: {
        client_name: decoded.name,
        billing_day: billingDay
      }
    });

    // Update client in database (should already exist from create-payment-link)
    const clientUpdateData = {
      client_id: customer.id,
      date_of_birth: new Date(dateOfBirth),
      address_line_1: addressLine1,
      address_line_2: addressLine2 || null,
      city,
      postcode,
      country: req.body.country || 'GB',
      emergency_contact_name: emergencyContactName,
      emergency_contact_number: emergencyContactNumber,
      emergency_contact_relationship: emergencyContactRelationship,
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      payment_method_id: paymentMethodId,
      subscription_status: subscription.status,
      status: 'active', // Update from pending to active
      onboarding_completed_at: new Date(),
      updated_at: new Date()
    };

    if (clientsCollection) {
      // Try to update existing pending record
      const result = await clientsCollection.updateOne(
        { email: decoded.email },
        { $set: clientUpdateData }
      );

      // If no existing record (shouldn't happen, but handle it), insert new one
      if (result.matchedCount === 0) {
        console.log('⚠️ No pending client found, creating new record');
        await clientsCollection.insertOne({
          name: decoded.name,
          email: decoded.email,
          telephone: decoded.telephone,
          price: decoded.price,
          billingDay: billingDay,
          prorate: decoded.prorate,
          ...clientUpdateData,
          created_at: new Date()
        });
      } else {
        console.log(`✅ Updated client record from pending to active: ${decoded.email}`);
      }
    }

    // Send confirmation emails
    try {
      const graphClient = createGraphClient();

      // Email to admin
      const adminEmail = {
        message: {
          subject: `New Client Subscription: ${decoded.name}`,
          body: {
            contentType: 'HTML',
            content: `
              <div style="font-family: Arial, sans-serif;">
                <h2>New Client Subscription</h2>
                <p>A new client has completed their onboarding:</p>
                <ul>
                  <li><strong>Name:</strong> ${decoded.name}</li>
                  <li><strong>Email:</strong> ${decoded.email}</li>
                  <li><strong>Phone:</strong> ${decoded.telephone}</li>
                  <li><strong>Monthly Price:</strong> £${decoded.price}</li>
                  <li><strong>Billing Day:</strong> ${billingDay}${billingDay === 1 ? 'st' : billingDay === 2 ? 'nd' : billingDay === 3 ? 'rd' : 'th'} of each month</li>
                  <li><strong>Subscription Status:</strong> ${subscription.status}</li>
                </ul>
                <p>Login to your admin dashboard to view full details.</p>
              </div>
            `
          },
          toRecipients: [{
            emailAddress: { address: process.env.EMAIL_TO }
          }]
        }
      };

      await graphClient.api(`/users/${process.env.EMAIL_FROM}/sendMail`).post(adminEmail);

      // Email to client
      const clientEmail = {
        message: {
          subject: 'Welcome to Simon Price Personal Training!',
          body: {
            contentType: 'HTML',
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a2e;">Welcome Aboard, ${decoded.name}!</h2>
                <p>Thank you for subscribing to Simon Price Personal Training. Your subscription is now active!</p>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Subscription Details:</h3>
                  <ul style="list-style: none; padding: 0;">
                    <li>💰 <strong>Monthly Price:</strong> £${decoded.price}</li>
                    <li>📅 <strong>Billing Date:</strong> ${billingDay}${billingDay === 1 ? 'st' : billingDay === 2 ? 'nd' : billingDay === 3 ? 'rd' : 'th'} of each month</li>
                    <li>✅ <strong>Status:</strong> Active</li>
                  </ul>
                </div>

                <p>I'm excited to help you achieve your fitness goals! I'll be in touch shortly to schedule our first session.</p>

                <p style="margin-top: 30px;">
                  Best regards,<br>
                  <strong>Simon Price</strong><br>
                  Personal Trainer<br>
                  📧 simon.price@simonprice-pt.co.uk<br>
                  📱 ${decoded.telephone}
                </p>
              </div>
            `
          },
          toRecipients: [{
            emailAddress: { address: decoded.email }
          }]
        }
      };

      await graphClient.api(`/users/${process.env.EMAIL_FROM}/sendMail`).post(clientEmail);

      // Send password creation email
      const passwordToken = jwt.sign(
        { email: decoded.email, type: 'client_password_setup' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const passwordSetupLink = `${process.env.FRONTEND_URL}/client-create-password/${passwordToken}`;

      const passwordEmail = {
        message: {
          subject: 'Set Up Your Client Portal Access - Simon Price PT',
          body: {
            contentType: 'HTML',
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Set Up Your Client Portal</h2>
                <p>Hi ${decoded.name},</p>
                <p>Welcome! You now have access to your personal client portal where you can manage your subscription, update your information, and more.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${passwordSetupLink}" 
                     style="background: linear-gradient(135deg, #d3ff62 0%, #a8d946 100%); 
                            color: #1a1a2e; 
                            padding: 15px 40px; 
                            text-decoration: none; 
                            border-radius: 30px; 
                            font-weight: bold;
                            display: inline-block;">
                    Create Your Password
                  </a>
                </div>

                <p><strong>What you can do in the portal:</strong></p>
                <ul>
                  <li>View your subscription details</li>
                  <li>Update payment method</li>
                  <li>Update your address</li>
                  <li>Manage your account</li>
                </ul>

                <p style="color: #888; font-size: 14px; margin-top: 30px;">This link will expire in 7 days.</p>
              </div>
            `
          },
          toRecipients: [{
            emailAddress: { address: decoded.email }
          }]
        }
      };

      await graphClient.api(`/users/${process.env.EMAIL_FROM}/sendMail`).post(passwordEmail);
      console.log(`📧 Password setup link sent to: ${decoded.email}`);

    } catch (emailError) {
      console.error('❌ Failed to send confirmation emails:', emailError.message);
    }

    console.log(`✅ New client onboarded: ${decoded.name} (${decoded.email}) - £${decoded.price}/month`);

    res.status(200).json({
      success: true,
      message: 'Subscription created successfully!',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        nextBillingDate: new Date(billingCycleAnchor * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Complete onboarding error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete onboarding'
    });
  }
});

// Get All Clients (Admin - JWT Protected)
app.get('/api/admin/clients', authenticateToken, async (req, res) => {
  try {
    if (!clientsCollection) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    const clients = await clientsCollection.find({}).sort({ created_at: -1 }).toArray();

    res.status(200).json({
      success: true,
      count: clients.length,
      clients
    });

  } catch (error) {
    console.error('❌ Get clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients'
    });
  }
});

// Update Client (Admin - JWT Protected)
app.put('/api/admin/clients/:email', authenticateToken, [
  body('name').optional().notEmpty(),
  body('telephone').optional().notEmpty(),
  body('price').optional().isInt({ min: 1 }),
  body('billingDay').optional().isInt({ min: 1, max: 28 }),
  body('prorate').optional().isBoolean(),
  body('addressLine1').optional(),
  body('addressLine2').optional(),
  body('city').optional(),
  body('postcode').optional(),
  body('country').optional(),
  body('emergencyContactName').optional(),
  body('emergencyContactNumber').optional(),
  body('emergencyContactRelationship').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { email } = req.params;
    const updateData = req.body;

    if (!clientsCollection) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    // Find the client
    const client = await clientsCollection.findOne({ email });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Build update object
    const updates = {
      updated_at: new Date(),
      updated_by: req.user.email
    };

    // Add fields that are being updated
    if (updateData.name) updates.name = updateData.name;
    if (updateData.telephone) updates.telephone = updateData.telephone;
    if (updateData.addressLine1) updates.address_line_1 = updateData.addressLine1;
    if (updateData.addressLine2 !== undefined) updates.address_line_2 = updateData.addressLine2;
    if (updateData.city) updates.city = updateData.city;
    if (updateData.postcode) updates.postcode = updateData.postcode;
    if (updateData.country) updates.country = updateData.country;
    if (updateData.emergencyContactName) updates.emergency_contact_name = updateData.emergencyContactName;
    if (updateData.emergencyContactNumber) updates.emergency_contact_number = updateData.emergencyContactNumber;
    if (updateData.emergencyContactRelationship) updates.emergency_contact_relationship = updateData.emergencyContactRelationship;
    if (updateData.prorate !== undefined) updates.prorate = updateData.prorate;

    // Handle price update (requires Stripe update if subscription exists)
    if (updateData.price && client.stripe_subscription_id && stripe) {
      try {
        const newPriceAmount = updateData.price * 100;
        
        // Find or create product
        let product;
        const products = await stripe.products.search({
          query: "active:'true' AND name:'Personal Training Plan'",
          limit: 1
        });

        if (products.data.length > 0) {
          product = products.data[0];
        } else {
          product = await stripe.products.create({
            name: 'Personal Training Plan',
            description: 'Monthly personal training subscription'
          });
        }

        // Find or create price
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
          currency: 'gbp',
          type: 'recurring',
          limit: 100
        });

        let price = prices.data.find(p => 
          p.unit_amount === newPriceAmount && 
          p.recurring?.interval === 'month'
        );

        if (!price) {
          price = await stripe.prices.create({
            product: product.id,
            currency: 'gbp',
            unit_amount: newPriceAmount,
            recurring: { interval: 'month' }
          });
        }

        // Update subscription with new price
        const subscription = await stripe.subscriptions.retrieve(client.stripe_subscription_id);
        await stripe.subscriptions.update(client.stripe_subscription_id, {
          items: [{
            id: subscription.items.data[0].id,
            price: price.id
          }],
          proration_behavior: 'create_prorations'
        });

        updates.price = updateData.price;
        updates.subscription_price = updateData.price;
        console.log(`✅ Updated subscription price for ${email}: £${updateData.price}/month`);
      } catch (stripeError) {
        console.error('❌ Stripe price update error:', stripeError.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to update subscription price in Stripe'
        });
      }
    } else if (updateData.price) {
      updates.price = updateData.price;
    }

    // Handle billing day update
    if (updateData.billingDay) {
      updates.billingDay = updateData.billingDay;
      // Note: Stripe billing anchor can't be changed after subscription is created
      // This will only affect display/tracking, not actual Stripe billing
    }

    // Update in database
    await clientsCollection.updateOne(
      { email },
      { $set: updates }
    );

    // Fetch updated client
    const updatedClient = await clientsCollection.findOne({ email });

    console.log(`✅ Updated client: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      client: updatedClient
    });

  } catch (error) {
    console.error('❌ Update client error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update client'
    });
  }
});

// Create Stripe Customer Portal Session (Admin or Client - JWT Protected)
app.post('/api/create-portal-session', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID required'
      });
    }

    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe not configured'
      });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/admin/clients`
    });

    res.status(200).json({
      success: true,
      url: session.url
    });

  } catch (error) {
    console.error('❌ Create portal session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create portal session'
    });
  }
});

// Cancel Subscription (Admin - JWT Protected)
app.post('/api/admin/client/:id/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!clientsCollection) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    const client = await clientsCollection.findOne({ stripe_customer_id: id });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Cancel subscription in Stripe at end of billing period
    const updatedSubscription = await stripe.subscriptions.update(
      client.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    // Update database
    await clientsCollection.updateOne(
      { stripe_customer_id: id },
      { 
        $set: { 
          subscription_status: 'canceling',
          cancel_at_period_end: true,
          subscription_ends_at: new Date(updatedSubscription.current_period_end * 1000),
          updated_at: new Date()
        }
      }
    );

    console.log(`❌ Subscription set to cancel at period end for: ${client.name} (${client.email})`);

    res.status(200).json({
      success: true,
      message: 'Subscription will be canceled at the end of the current billing period',
      endsAt: new Date(updatedSubscription.current_period_end * 1000)
    });

  } catch (error) {
    console.error('❌ Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

// ============================================================================
// ADMIN - CLIENT USER MANAGEMENT
// ============================================================================

// Get All Client Users (Admin - JWT Protected)
app.get('/api/admin/client-users', authenticateToken, async (req, res) => {
  try {
    if (!clientUsersCollection || !clientsCollection) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    // Get all client users with their status from clients collection
    const clientUsers = await clientUsersCollection.find({}).toArray();
    
    // Merge with client data to get status
    const enrichedUsers = await Promise.all(
      clientUsers.map(async (user) => {
        const client = await clientsCollection.findOne({ email: user.email });
        return {
          ...user,
          status: client?.status || 'pending',
          created_at: user.created_at || client?.created_at
        };
      })
    );

    res.status(200).json({
      success: true,
      clientUsers: enrichedUsers
    });

  } catch (error) {
    console.error('❌ Get client users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client users'
    });
  }
});

// Update Client User Status (Admin - JWT Protected)
app.put('/api/admin/client-users/:email/status', authenticateToken, [
  body('status').isIn(['pending', 'active', 'suspended', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
        errors: errors.array()
      });
    }

    const { email } = req.params;
    const { status } = req.body;

    if (!clientsCollection) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    // Update status in clients collection
    const result = await clientsCollection.updateOne(
      { email },
      { 
        $set: { 
          status,
          updated_at: new Date(),
          updated_by: req.user.email
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    console.log(`✅ Client user status updated: ${email} -> ${status}`);

    res.status(200).json({
      success: true,
      message: 'Status updated successfully'
    });

  } catch (error) {
    console.error('❌ Update client user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
});

// ============================================================================
// ADMIN - IMPORT CUSTOMERS FROM STRIPE
// ============================================================================

// Fetch Customer Data from Stripe (Admin - JWT Protected)
app.post('/api/admin/import-customers/fetch', authenticateToken, [
  body('customerIds').isArray({ min: 1 }).withMessage('Customer IDs must be a non-empty array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe not configured'
      });
    }

    const { customerIds } = req.body;
    const customerData = [];
    const errors = [];

    for (const customerId of customerIds) {
      try {
        // Fetch customer from Stripe
        const customer = await stripe.customers.retrieve(customerId);
        
        if (customer.deleted) {
          errors.push({
            customerId,
            error: 'Customer has been deleted in Stripe'
          });
          continue;
        }

        // Check if customer already exists in database
        const existingClient = await clientsCollection.findOne({ stripe_customer_id: customerId });
        
        if (existingClient) {
          errors.push({
            customerId,
            email: customer.email,
            error: 'Customer already exists in database'
          });
          continue;
        }

        // Fetch subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          limit: 1
        });

        let status = 'pending';
        let subscription = null;
        let hasPaymentMethod = false;

        if (subscriptions.data.length > 0) {
          subscription = subscriptions.data[0];
          
          // Check if subscription has a payment method
          hasPaymentMethod = !!subscription.default_payment_method;
          
          // Determine status based on subscription and payment method
          if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
            status = 'cancelled';
          } else if (subscription.status === 'active' && hasPaymentMethod) {
            status = 'active';
          } else {
            status = 'pending';
          }
        }

        // Prepare customer data
        customerData.push({
          stripe_customer_id: customerId,
          name: customer.name || '',
          email: customer.email || '',
          telephone: customer.phone || '',
          address: {
            line1: customer.address?.line1 || '',
            line2: customer.address?.line2 || '',
            city: customer.address?.city || '',
            postcode: customer.address?.postal_code || '',
            country: customer.address?.country || ''
          },
          status,
          hasPaymentMethod,
          stripe_subscription_id: subscription?.id || null,
          subscription_status: subscription?.status || null,
          current_period_end: subscription?.current_period_end ? new Date(subscription.current_period_end * 1000) : null
        });

      } catch (error) {
        console.error(`❌ Error fetching customer ${customerId}:`, error.message);
        errors.push({
          customerId,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      customers: customerData,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    console.error('❌ Fetch customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer data'
    });
  }
});

// Save Imported Customers (Admin - JWT Protected)
app.post('/api/admin/import-customers/save', authenticateToken, [
  body('customers').isArray({ min: 1 }).withMessage('Customers must be a non-empty array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    if (!clientsCollection || !clientUsersCollection) {
      return res.status(503).json({
        success: false,
        message: 'Database not available'
      });
    }

    const { customers } = req.body;
    const savedCustomers = [];
    const saveErrors = [];

    for (const customer of customers) {
      try {
        // Check again if customer exists (in case of concurrent requests)
        const existingClient = await clientsCollection.findOne({ 
          $or: [
            { stripe_customer_id: customer.stripe_customer_id },
            { email: customer.email }
          ]
        });
        
        if (existingClient) {
          saveErrors.push({
            email: customer.email,
            error: 'Customer already exists'
          });
          continue;
        }

        // Prepare client document
        const clientDocument = {
          stripe_customer_id: customer.stripe_customer_id,
          name: customer.name,
          email: customer.email,
          telephone: customer.telephone || '',
          address: customer.address,
          status: customer.status,
          stripe_subscription_id: customer.stripe_subscription_id,
          subscription_status: customer.subscription_status,
          current_period_end: customer.current_period_end,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: req.user.email,
          imported: true
        };

        // Save to clients collection
        await clientsCollection.insertOne(clientDocument);

        // Create client user account
        const clientUser = {
          email: customer.email,
          password: null, // Password will be set when they create it
          status: customer.status,
          created_at: new Date()
        };

        await clientUsersCollection.insertOne(clientUser);

        // Send appropriate emails
        const graphClient = createGraphClient();

        // 1. Send password creation email
        const passwordToken = jwt.sign(
          { email: customer.email, type: 'client_password_setup' },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        const passwordSetupLink = `${process.env.FRONTEND_URL}/client-create-password/${passwordToken}`;

        const passwordEmail = {
          message: {
            subject: 'Set Up Your Client Portal Access - Simon Price PT',
            body: {
              contentType: 'HTML',
              content: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Set Up Your Client Portal</h2>
                  <p>Hi ${customer.name},</p>
                  <p>Welcome! You now have access to your personal client portal where you can manage your subscription, update your information, and more.</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${passwordSetupLink}" 
                       style="background: linear-gradient(135deg, #d3ff62 0%, #a8d946 100%); 
                              color: #1a1a2e; 
                              padding: 15px 40px; 
                              text-decoration: none; 
                              border-radius: 30px; 
                              font-weight: bold;
                              display: inline-block;">
                      Create Your Password
                    </a>
                  </div>

                  <p><strong>What you can do in the portal:</strong></p>
                  <ul>
                    <li>View your subscription details</li>
                    <li>Update payment method</li>
                    <li>Update your address</li>
                    <li>Manage your account</li>
                  </ul>

                  <p style="color: #888; font-size: 14px; margin-top: 30px;">This link will expire in 7 days.</p>
                </div>
              `
            },
            toRecipients: [{
              emailAddress: { address: customer.email }
            }]
          }
        };

        await graphClient.api(`/users/${process.env.EMAIL_FROM}/sendMail`).post(passwordEmail);
        console.log(`📧 Password setup email sent to: ${customer.email}`);

        // 2. If status is pending (no payment method), send card details request email
        if (customer.status === 'pending' && !customer.hasPaymentMethod) {
          const cardDetailsEmail = {
            message: {
              subject: 'Payment Details Required - Simon Price PT',
              body: {
                contentType: 'HTML',
                content: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Payment Details Required</h2>
                    <p>Hi ${customer.name},</p>
                    <p>To complete your subscription setup, we need you to add your payment details.</p>
                    
                    <p>Once you've created your password and logged into your client portal, you'll be able to add your payment method securely through our payment provider, Stripe.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                      <p style="margin: 0;"><strong>Next Steps:</strong></p>
                      <ol style="margin: 10px 0; padding-left: 20px;">
                        <li>Create your password using the link in the previous email</li>
                        <li>Log in to your client portal</li>
                        <li>Navigate to "Manage Billing" to add your payment method</li>
                      </ol>
                    </div>

                    <p>If you have any questions or need assistance, please don't hesitate to contact me.</p>
                    
                    <p style="margin-top: 30px;">
                      Best regards,<br>
                      <strong>Simon Price</strong><br>
                      Personal Trainer<br>
                      📧 simon.price@simonprice-pt.co.uk
                    </p>
                  </div>
                `
              },
              toRecipients: [{
                emailAddress: { address: customer.email }
              }]
            }
          };

          await graphClient.api(`/users/${process.env.EMAIL_FROM}/sendMail`).post(cardDetailsEmail);
          console.log(`📧 Card details request email sent to: ${customer.email}`);
        }

        savedCustomers.push({
          email: customer.email,
          name: customer.name,
          status: customer.status
        });

        console.log(`✅ Imported customer: ${customer.name} (${customer.email}) - Status: ${customer.status}`);

      } catch (error) {
        console.error(`❌ Error saving customer ${customer.email}:`, error.message);
        saveErrors.push({
          email: customer.email,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully imported ${savedCustomers.length} customer(s)`,
      customers: savedCustomers,
      errors: saveErrors.length > 0 ? saveErrors : null
    });

  } catch (error) {
    console.error('❌ Save customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save customers'
    });
  }
});

// ============================================================================
// CLIENT AUTHENTICATION & PORTAL ENDPOINTS
// ============================================================================

// Create Client Password (Client - Public with Token)
app.post('/api/client/create-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired link'
      });
    }

    if (decoded.type !== 'client_password_setup') {
      return res.status(400).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to client_users collection
    if (clientUsersCollection) {
      await clientUsersCollection.updateOne(
        { email: decoded.email },
        {
          $set: {
            password: hashedPassword,
            password_set_at: new Date(),
            updated_at: new Date()
          }
        },
        { upsert: true }
      );
    }

    console.log(`✅ Client password created: ${decoded.email}`);

    res.status(200).json({
      success: true,
      message: 'Password created successfully'
    });

  } catch (error) {
    console.error('❌ Create client password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create password'
    });
  }
});

// Client Login
app.post('/api/client/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    if (!clientUsersCollection) {
      return res.status(503).json({
        success: false,
        message: 'Service unavailable'
      });
    }

    // Find client user
    const clientUser = await clientUsersCollection.findOne({ email });

    if (!clientUser || !clientUser.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, clientUser.password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Get client details
    const client = await clientsCollection.findOne({ email });

    // Generate tokens
    const accessToken = jwt.sign(
      { email, type: 'client' },
      JWT_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { email, type: 'client' },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRY }
    );

    console.log(`✅ Client login successful: ${email}`);

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      client: {
        name: client?.name,
        email: client?.email,
        telephone: client?.telephone,
        subscriptionStatus: client?.subscription_status
      }
    });

  } catch (error) {
    console.error('❌ Client login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Client Forgot Password
app.post('/api/client/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email'
      });
    }

    const { email } = req.body;

    // Check if client exists
    const client = await clientsCollection.findOne({ email });

    if (!client) {
      // Don't reveal if email exists
      return res.status(200).json({
        success: true,
        message: 'If an account exists, a password reset link has been sent'
      });
    }

    // Generate reset token (24 hour expiry)
    const resetToken = jwt.sign(
      { email, type: 'client_password_reset' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const resetLink = `${process.env.FRONTEND_URL}/client-reset-password/${resetToken}`;

    // Send email
    try {
      const graphClient = createGraphClient();

      const emailMessage = {
        message: {
          subject: 'Reset Your Password - Simon Price PT',
          body: {
            contentType: 'HTML',
            content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset Request</h2>
                <p>Hi ${client.name},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" 
                     style="background: linear-gradient(135deg, #d3ff62 0%, #a8d946 100%); 
                            color: #1a1a2e; 
                            padding: 15px 40px; 
                            text-decoration: none; 
                            border-radius: 30px; 
                            font-weight: bold;
                            display: inline-block;">
                    Reset Password
                  </a>
                </div>

                <p style="color: #888; font-size: 14px;">This link will expire in 24 hours.</p>
                <p style="color: #888; font-size: 14px;">If you didn't request this, please ignore this email.</p>
              </div>
            `
          },
          toRecipients: [{ emailAddress: { address: email } }]
        }
      };

      await graphClient.api(`/users/${process.env.EMAIL_FROM}/sendMail`).post(emailMessage);
      console.log(`📧 Password reset link sent to: ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('❌ Client forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request'
    });
  }
});

// Client Reset Password
app.post('/api/client/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link'
      });
    }

    if (decoded.type !== 'client_password_reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await clientUsersCollection.updateOne(
      { email: decoded.email },
      {
        $set: {
          password: hashedPassword,
          updated_at: new Date()
        }
      },
      { upsert: true }
    );

    console.log(`✅ Client password reset: ${decoded.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('❌ Client reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// Stripe Webhook Handler
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        if (clientsCollection) {
          await clientsCollection.updateOne(
            { stripe_subscription_id: subscription.id },
            { $set: { subscription_status: subscription.status, updated_at: new Date() } }
          );
        }
        console.log(`📝 Subscription updated: ${subscription.id} - ${subscription.status}`);
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        if (clientsCollection) {
          await clientsCollection.updateOne(
            { stripe_subscription_id: deletedSub.id },
            { $set: { subscription_status: 'canceled', updated_at: new Date() } }
          );
        }
        console.log(`❌ Subscription deleted: ${deletedSub.id}`);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log(`⚠️ Payment failed for customer: ${failedInvoice.customer}`);
        // Could send email notification here
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log(`✅ Payment succeeded for customer: ${invoice.customer}`);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    res.status(500).send('Webhook handler failed');
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
  console.log(`📧 Graph API configured for: ${process.env.EMAIL_TO}`);
  console.log(`🔗 CORS allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`📨 Tenant: ${process.env.TENANT_ID}`);
});

module.exports = app;
