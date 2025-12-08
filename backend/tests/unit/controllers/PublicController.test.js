const PublicController = require('../../../controllers/PublicController');

describe('PublicController', () => {
  let controller;
  let mockCollections;
  let mockEmailConfig;
  let mockConfig;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCollections = {
      contacts: {
        insertOne: jest.fn()
      },
      mailingList: {
        findOne: jest.fn(),
        insertOne: jest.fn(),
        updateOne: jest.fn()
      },
      tdeeResults: {
        insertOne: jest.fn()
      }
    };

    mockEmailConfig = {
      getStatus: jest.fn(() => ({ configured: false })),
      getFromAddress: jest.fn(() => 'test@example.com')
    };

    mockConfig = {
      frontendUrl: 'http://localhost:3000'
    };

    controller = new PublicController(mockCollections, mockEmailConfig, mockConfig);

    mockReq = {
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('healthCheck', () => {
    it('should return health check status', async () => {
      await controller.healthCheck(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: 'OK',
          service: 'Simon Price PT Backend',
          message: 'Server is running'
        })
      );
    });
  });

  describe('handleContact', () => {
    beforeEach(() => {
      // Mock validationResult to return no errors
      jest.mock('express-validator', () => ({
        validationResult: jest.fn(() => ({
          isEmpty: () => true,
          array: () => []
        }))
      }));
    });

    it('should successfully process contact form submission', async () => {
      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        message: 'I want to get fit',
        goals: 'weight-loss',
        experience: 'beginner'
      };

      mockCollections.contacts.insertOne.mockResolvedValue({ insertedId: 'contact123' });

      await controller.handleContact(mockReq, mockRes);

      expect(mockCollections.contacts.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          message: 'I want to get fit',
          goals: 'weight-loss',
          experience: 'beginner',
          status: 'new'
        })
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String)
      });
    });

    it('should add email to mailing list if opted in', async () => {
      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Test message',
        optedIn: true
      };

      mockCollections.contacts.insertOne.mockResolvedValue({ insertedId: 'contact123' });
      mockCollections.mailingList.findOne.mockResolvedValue(null);
      mockCollections.mailingList.insertOne.mockResolvedValue({ insertedId: 'sub123' });

      await controller.handleContact(mockReq, mockRes);

      expect(mockCollections.mailingList.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'john@example.com',
          name: 'John Doe',
          opted_in: true,
          source: 'contact_form'
        })
      );
    });

    it('should not add to mailing list if already subscribed', async () => {
      mockReq.body = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Test message',
        optedIn: true
      };

      mockCollections.contacts.insertOne.mockResolvedValue({ insertedId: 'contact123' });
      mockCollections.mailingList.findOne.mockResolvedValue({ email: 'john@example.com' });

      await controller.handleContact(mockReq, mockRes);

      expect(mockCollections.mailingList.insertOne).not.toHaveBeenCalled();
    });
  });

  describe('subscribeNewsletter', () => {
    it('should successfully subscribe email to newsletter', async () => {
      mockReq.body = {
        email: 'subscriber@example.com',
        name: 'Jane Doe'
      };

      mockCollections.mailingList.findOne.mockResolvedValue(null);
      mockCollections.mailingList.insertOne.mockResolvedValue({ insertedId: 'sub123' });

      await controller.subscribeNewsletter(mockReq, mockRes);

      expect(mockCollections.mailingList.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'subscriber@example.com',
          name: 'Jane Doe',
          opted_in: true,
          status: 'active',
          source: 'newsletter_form'
        })
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String)
      });
    });

    it('should return error if email already subscribed', async () => {
      mockReq.body = {
        email: 'existing@example.com'
      };

      mockCollections.mailingList.findOne.mockResolvedValue({
        email: 'existing@example.com'
      });

      await controller.subscribeNewsletter(mockReq, mockRes);

      expect(mockCollections.mailingList.insertOne).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email already subscribed'
      });
    });
  });

  describe('storeTDEEResults', () => {
    it('should store TDEE results with nested structure', async () => {
      mockReq.body = {
        email: 'user@example.com',
        joinMailingList: true,
        results: {
          tdee: 2500,
          goalCalories: 2000,
          macros: {
            protein: 150,
            carbs: 200,
            fat: 67
          }
        },
        userInfo: {
          age: 30,
          gender: 'male',
          weight: '80kg',
          height: '180cm',
          activityLevel: '1.55',
          goal: 'lose'
        }
      };

      mockCollections.tdeeResults.insertOne.mockResolvedValue({ insertedId: 'tdee123' });
      mockCollections.mailingList.findOne.mockResolvedValue(null);
      mockCollections.mailingList.insertOne.mockResolvedValue({ insertedId: 'sub123' });

      await controller.storeTDEEResults(mockReq, mockRes);

      expect(mockCollections.tdeeResults.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          age: 30,
          gender: 'male',
          tdee: 2500,
          goalCalories: 2000
        })
      );

      expect(mockCollections.mailingList.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          opted_in: true,
          source: 'tdee_calculator'
        })
      );
    });

    it('should store TDEE results with flat structure', async () => {
      mockReq.body = {
        email: 'user@example.com',
        name: 'Test User',
        age: 30,
        gender: 'male',
        weight: '80kg',
        height: '180cm',
        activityLevel: '1.55',
        goal: 'lose',
        tdee: 2500,
        goalCalories: 2000,
        joinMailingList: false
      };

      mockCollections.tdeeResults.insertOne.mockResolvedValue({ insertedId: 'tdee123' });

      await controller.storeTDEEResults(mockReq, mockRes);

      expect(mockCollections.tdeeResults.insertOne).toHaveBeenCalled();
      expect(mockCollections.mailingList.insertOne).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('should successfully unsubscribe email', async () => {
      mockReq.body = {
        email: 'unsubscribe@example.com'
      };

      mockCollections.mailingList.updateOne.mockResolvedValue({ matchedCount: 1 });

      await controller.unsubscribe(mockReq, mockRes);

      expect(mockCollections.mailingList.updateOne).toHaveBeenCalledWith(
        { email: 'unsubscribe@example.com' },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'unsubscribed'
          })
        })
      );

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String)
      });
    });

    it('should return 404 if email not found', async () => {
      mockReq.body = {
        email: 'notfound@example.com'
      };

      mockCollections.mailingList.updateOne.mockResolvedValue({ matchedCount: 0 });

      await controller.unsubscribe(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email not found in mailing list'
      });
    });
  });
});
