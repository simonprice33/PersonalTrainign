# Backend Unit Tests

## Overview

Comprehensive unit test suite for the refactored SOLID backend architecture using Jest.

## Test Structure

```
tests/
├── unit/
│   ├── controllers/     # Controller tests with mocked services
│   ├── services/        # Service tests with mocked dependencies
│   ├── models/          # Model tests with mocked MongoDB collections
│   ├── middleware/      # Middleware tests with mocked requests
│   └── config/          # Configuration tests
├── integration/         # Integration tests (to be added)
├── helpers/
│   └── mockData.js      # Shared mock data
├── setup.js             # Global test setup
└── README.md            # This file
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run with coverage report
```bash
npm run test:coverage
```

### Run only unit tests
```bash
npm run test:unit
```

### Run only integration tests
```bash
npm run test:integration
```

## Test Coverage Summary

| Module | Coverage |
|--------|----------|
| AuthMiddleware | 94% |
| AuthService | 78% |
| PublicController | 66% |
| User Model | 54% |
| EmailService | 41% |

## Writing Tests

### Example Test Structure

```javascript
const ServiceName = require('../../../services/ServiceName');

describe('ServiceName', () => {
  let service;
  let mockDependencies;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockDependencies = {
      collection: {
        findOne: jest.fn(),
        insertOne: jest.fn()
      }
    };

    service = new ServiceName(mockDependencies);
  });

  describe('methodName', () => {
    it('should do something successfully', async () => {
      // Arrange
      mockDependencies.collection.findOne.mockResolvedValue({ data: 'test' });

      // Act
      const result = await service.methodName('param');

      // Assert
      expect(result).toBeDefined();
      expect(mockDependencies.collection.findOne).toHaveBeenCalled();
    });

    it('should handle errors appropriately', async () => {
      // Arrange
      mockDependencies.collection.findOne.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.methodName('param')).rejects.toThrow('Database error');
    });
  });
});
```

## Mocking Best Practices

### 1. Mock External Dependencies
Always mock external services like:
- MongoDB collections
- Stripe API
- Microsoft Graph API
- Email services

### 2. Use Jest Mocks
```javascript
jest.mock('external-module', () => ({
  method: jest.fn()
}));
```

### 3. Clear Mocks Between Tests
```javascript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 4. Test Both Success and Failure Paths
```javascript
it('should handle success', async () => {
  mock.method.mockResolvedValue(successData);
  // test success path
});

it('should handle failure', async () => {
  mock.method.mockRejectedValue(new Error('Failed'));
  // test failure path
});
```

## Test Assertions

### Common Patterns

#### Testing Function Calls
```javascript
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
expect(mockFunction).toHaveBeenCalledTimes(1);
```

#### Testing Return Values
```javascript
expect(result).toBe(expectedValue);
expect(result).toEqual(expectedObject);
expect(result).toHaveProperty('key', 'value');
```

#### Testing Errors
```javascript
await expect(asyncFunction()).rejects.toThrow('Error message');
expect(() => syncFunction()).toThrow('Error message');
```

#### Testing Object Structure
```javascript
expect(result).toEqual(expect.objectContaining({
  key: 'value',
  nested: expect.any(Object)
}));
```

## Coverage Goals

Target coverage thresholds:
- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

## Continuous Integration

Tests should be run:
- Before every commit (pre-commit hook)
- In CI/CD pipeline
- Before deployment

## Testing Strategy

### Unit Tests
- Test individual functions in isolation
- Mock all external dependencies
- Fast execution (<5s for entire suite)

### Integration Tests (Future)
- Test multiple modules together
- Use in-memory MongoDB
- Test actual API endpoints
- Test database operations

### E2E Tests (Future)
- Test complete user flows
- Use test database
- Test frontend + backend integration

## Debugging Tests

### Run specific test file
```bash
npm test -- AuthService.test.js
```

### Run specific test
```bash
npm test -- -t "should authenticate admin"
```

### Debug in VSCode
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

## Common Issues

### Issue: Module not found
**Solution**: Ensure correct relative paths in require statements

### Issue: Async timeout
**Solution**: Increase timeout in jest.config.js or use `jest.setTimeout(10000)`

### Issue: Mocks not working
**Solution**: Ensure `jest.clearAllMocks()` is called in `beforeEach`

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure tests pass
3. Maintain >70% coverage
4. Document complex test scenarios

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [TDD Guide](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
