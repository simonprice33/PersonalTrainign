// Mock data for tests

const mockUser = {
  email: 'test@example.com',
  password: '$2a$10$N9qo8uLOickgx2ZMRZoMye...', // bcrypt hash of 'password123'
  name: 'Test User',
  role: 'admin',
  created_at: new Date('2024-01-01'),
  last_login: null
};

const mockClient = {
  customer_id: 'cus_test123',
  name: 'Test Client',
  email: 'client@example.com',
  phone: '+1234567890',
  address: {
    line1: '123 Test St',
    city: 'Test City',
    postal_code: '12345',
    country: 'US'
  },
  status: 'active',
  subscription_status: 'active',
  subscription_id: 'sub_test123',
  created_at: new Date('2024-01-01')
};

const mockClientUser = {
  email: 'client@example.com',
  password: '$2a$10$N9qo8uLOickgx2ZMRZoMye...',
  status: 'active',
  created_at: new Date('2024-01-01')
};

const mockStripeCustomer = {
  id: 'cus_test123',
  email: 'client@example.com',
  name: 'Test Client',
  phone: '+1234567890',
  address: {
    line1: '123 Test St',
    city: 'Test City',
    postal_code: '12345',
    country: 'US'
  }
};

const mockStripeSubscription = {
  id: 'sub_test123',
  customer: 'cus_test123',
  status: 'active',
  items: {
    data: [
      {
        price: {
          id: 'price_test123',
          unit_amount: 9900
        }
      }
    ]
  }
};

module.exports = {
  mockUser,
  mockClient,
  mockClientUser,
  mockStripeCustomer,
  mockStripeSubscription
};
