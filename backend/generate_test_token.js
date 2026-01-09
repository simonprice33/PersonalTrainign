const jwt = require('jsonwebtoken');

const JWT_SECRET = 'simonprice_pt_secure_jwt_secret_key_2024_change_this_in_production';

// Create a test token for client onboarding
const payload = {
  email: 'john.smith@example.com',
  name: 'John Smith',
  telephone: '07123456789',
  price: 125,
  billingDay: 8,
  type: 'client_onboarding'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

console.log('Test Token:', token);
console.log('Test URL:', `https://join-flow.preview.emergentagent.com/client-onboarding?token=${token}`);