# Integration Tests

Integration tests for API endpoints and services.

## Structure

```
integration/
├── auth/              # Authentication & signup tests
├── file-operations/   # File upload/download tests
├── messaging/         # Messaging & conversations tests
├── settings/          # Settings & permissions tests
├── utils/             # Test utilities and helpers
└── README.md
```

## Running Tests

```bash
# Run all integration tests
npm test src/__tests__/integration

# Run specific test suite
npm test src/__tests__/integration/auth

# Run with coverage
npm run test:coverage:integration
```

## Test Phases

### Phase 1: Core Infrastructure & Authentication ✓
- Test utilities and mocks
- Authentication flows
- User signup (school, college, university, recruiter)

### Phase 2: File & Storage Operations
- File upload/download
- Storage service operations
- Document access

### Phase 3: Messaging & Real-time
- Conversation management
- Message sending/receiving
- Real-time subscriptions

### Phase 4: Settings & Permissions
- Role management
- Permission checks
- Module access control
