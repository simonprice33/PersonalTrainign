const EmailService = require('../../../services/EmailService');

describe('EmailService', () => {
  let emailService;
  let mockEmailConfig;
  let mockGraphClient;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock graph client
    mockGraphClient = {
      api: jest.fn().mockReturnThis(),
      post: jest.fn().mockResolvedValue({ success: true })
    };

    // Mock email config
    mockEmailConfig = {
      getStatus: jest.fn(() => ({ configured: true })),
      getFromAddress: jest.fn(() => 'test@example.com'),
      createGraphClient: jest.fn().mockResolvedValue(mockGraphClient)
    };

    emailService = new EmailService(mockEmailConfig);
  });

  describe('sendPasswordSetupEmail', () => {
    it('should successfully send password setup email', async () => {
      await emailService.sendPasswordSetupEmail('client@example.com', 'http://localhost:3000/setup');

      expect(mockEmailConfig.createGraphClient).toHaveBeenCalled();
      expect(mockGraphClient.api).toHaveBeenCalledWith('/users/test@example.com/sendMail');
      expect(mockGraphClient.post).toHaveBeenCalled();
    });

    it('should throw error when email not configured', async () => {
      mockEmailConfig.getStatus.mockReturnValue({ configured: false });

      await expect(
        emailService.sendPasswordSetupEmail('client@example.com', 'http://localhost:3000/setup')
      ).rejects.toThrow('Email not configured');
    });

    it('should throw error when graph client creation fails', async () => {
      mockEmailConfig.createGraphClient.mockRejectedValue(new Error('Graph API error'));

      await expect(
        emailService.sendPasswordSetupEmail('client@example.com', 'http://localhost:3000/setup')
      ).rejects.toThrow('Graph API error');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send admin password reset email', async () => {
      await emailService.sendPasswordResetEmail(
        'admin@example.com',
        'http://localhost:3000/reset',
        'admin'
      );

      expect(mockGraphClient.api).toHaveBeenCalledWith('/users/test@example.com/sendMail');
      expect(mockGraphClient.post).toHaveBeenCalled();
    });

    it('should send client password reset email', async () => {
      await emailService.sendPasswordResetEmail(
        'client@example.com',
        'http://localhost:3000/reset',
        'client'
      );

      expect(mockGraphClient.api).toHaveBeenCalledWith('/users/test@example.com/sendMail');
      expect(mockGraphClient.post).toHaveBeenCalled();
    });
  });

  describe('sendPaymentLinkEmail', () => {
    it('should successfully send payment link email', async () => {
      await emailService.sendPaymentLinkEmail(
        'client@example.com',
        'John Doe',
        'http://localhost:3000/payment'
      );

      expect(mockEmailConfig.createGraphClient).toHaveBeenCalled();
      expect(mockGraphClient.post).toHaveBeenCalled();
    });
  });

  describe('sendPaymentMethodRequestEmail', () => {
    it('should successfully send payment method request email', async () => {
      await emailService.sendPaymentMethodRequestEmail('client@example.com', 'John Doe');

      expect(mockEmailConfig.createGraphClient).toHaveBeenCalled();
      expect(mockGraphClient.post).toHaveBeenCalled();
    });
  });

  describe('sendEmail', () => {
    it('should successfully send generic email with HTML content', async () => {
      await emailService.sendEmail(
        'recipient@example.com',
        'Test Subject',
        '<h1>Test Email</h1>'
      );

      expect(mockGraphClient.api).toHaveBeenCalledWith('/users/test@example.com/sendMail');
      expect(mockGraphClient.post).toHaveBeenCalled();
    });

    it('should successfully send generic email with text content', async () => {
      await emailService.sendEmail(
        'recipient@example.com',
        'Test Subject',
        null,
        'Plain text email'
      );

      expect(mockGraphClient.post).toHaveBeenCalled();
    });
  });
});
