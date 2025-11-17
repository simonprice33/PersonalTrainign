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
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB Connection
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'simonprice_pt_db';
let db = null;
let emailCollection = null;
let adminUsersCollection = null;
let clientsCollection = null;

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
