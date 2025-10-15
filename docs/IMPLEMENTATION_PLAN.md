# Intentional Backend Implementation Plan
## Test-Driven Development Approach

**Focus**: Intent APIs & Matching Algorithm  
**Approach**: Test-Driven Development (TDD)  
**Runtime**: Bun instead of npm  
**Database**: PostgreSQL with Prisma ORM

---

## Overview

This plan follows a strict TDD approach where tests are written BEFORE implementation. Each phase includes:
1. **Write failing tests**
2. **Implement minimal code to pass tests**
3. **Refactor while keeping tests green**
4. **Integration testing**

---

## Phase 1: Setup & Database Schema (Foundation)

### 1.1 Environment Setup
- [x] Update package.json to use Bun
- [ ] Install dependencies with Bun
- [ ] Configure TypeScript for Bun runtime
- [ ] Setup test framework (Bun test or Jest with Bun)
- [ ] Configure Prisma with Bun

**Commands:**
```bash
bun install
bun prisma generate
```

### 1.2 Database Schema Design
- [ ] Update Prisma schema for Intent system
- [ ] Create migration for new schema
- [ ] Run migration locally
- [ ] Seed test data

**New Models Required:**
- `User` (enhanced with Zora profile fields)
- `Intent` (core model)
- `IntentMedia` (images and video)
- `Swipe` (swipe actions)
- `Match` (mutual matches)
- `ChatSession` (optional for MVP)

**Key Indexes:**
- `intents(status, expiresAt)`
- `intents(type, publishedAt)`
- `swipes(userId, intentId)`
- `swipes(targetIntentId, action)`
- `matches(user1Id, user2Id)`

### 1.3 Configuration Files
- [ ] Update `.env.example` with all required variables
- [ ] Create `.env.test` for test database
- [ ] Configure Bun test environment
- [ ] Setup mock services (IPFS, Zora SDK)

**Estimated Time**: 2-3 hours

---

## Phase 2: Core Models & Utilities (TDD)

### 2.1 User Model & Repository
**Test First:**
```typescript
describe('UserRepository', () => {
  it('should create user with wallet address', async () => {});
  it('should find user by wallet address', async () => {});
  it('should update Zora profile cache', async () => {});
  it('should calculate reputation score', async () => {});
  it('should check for active intent', async () => {});
});
```

**Implementation:**
- [ ] Create `src/repositories/user.repository.ts`
- [ ] Write tests
- [ ] Implement UserRepository methods
- [ ] All tests pass

### 2.2 Media Upload Service
**Test First:**
```typescript
describe('MediaUploadService', () => {
  it('should validate URL format', async () => {});
  it('should reject private IPs', async () => {});
  it('should fetch image from URL', async () => {});
  it('should validate image content type', async () => {});
  it('should validate image integrity', async () => {});
  it('should generate thumbnail', async () => {});
  it('should upload to IPFS mock', async () => {});
  it('should handle fetch timeout', async () => {});
  it('should handle invalid content', async () => {});
});
```

**Implementation:**
- [ ] Create `src/services/media-upload.service.ts`
- [ ] Write tests with mocks (axios, sharp, pinata)
- [ ] Implement URL validation
- [ ] Implement fetch logic
- [ ] Implement content validation
- [ ] Implement IPFS upload
- [ ] All tests pass

### 2.3 Validation Schemas (Zod)
**Test First:**
```typescript
describe('Intent Validation Schemas', () => {
  it('should validate create intent input', async () => {});
  it('should reject invalid intent type', async () => {});
  it('should reject too many tags', async () => {});
  it('should reject invalid media URLs', async () => {});
});
```

**Implementation:**
- [ ] Create `src/schemas/intent.schema.ts`
- [ ] Write tests
- [ ] Implement Zod schemas
- [ ] All tests pass

**Estimated Time**: 4-5 hours

---

## Phase 3: Intent Creation API (TDD)

### 3.1 Intent Repository
**Test First:**
```typescript
describe('IntentRepository', () => {
  it('should create intent with media', async () => {});
  it('should find intent by id', async () => {});
  it('should find active intent by userId', async () => {});
  it('should update intent status', async () => {});
  it('should check single active intent rule', async () => {});
  it('should get intents by status', async () => {});
});
```

**Implementation:**
- [ ] Create `src/repositories/intent.repository.ts`
- [ ] Write tests
- [ ] Implement repository methods
- [ ] All tests pass

### 3.2 Intent Service (Business Logic)
**Test First:**
```typescript
describe('IntentService', () => {
  describe('validateIntentCreation', () => {
    it('should pass when no active intent', async () => {});
    it('should fail when active intent exists', async () => {});
    it('should fail when reputation too low', async () => {});
  });

  describe('createIntent', () => {
    it('should create intent with valid data', async () => {});
    it('should upload media to IPFS', async () => {});
    it('should calculate activation fee', async () => {});
    it('should set pending_payment status', async () => {});
  });

  describe('confirmPayment', () => {
    it('should verify transaction hash', async () => {});
    it('should publish to on-chain (mock)', async () => {});
    it('should update status to active', async () => {});
    it('should unlock user feed', async () => {});
  });

  describe('updateIntent', () => {
    it('should update allowed fields', async () => {});
    it('should reject update after match', async () => {});
  });

  describe('expireIntent', () => {
    it('should mark intent as expired', async () => {});
    it('should remove from feed cache', async () => {});
  });
});
```

**Implementation:**
- [ ] Create `src/services/intent.service.ts`
- [ ] Write all test cases
- [ ] Implement validation logic
- [ ] Implement creation logic
- [ ] Implement payment confirmation
- [ ] Implement update logic
- [ ] Implement expiry logic
- [ ] All tests pass

### 3.3 Intent Controller
**Test First (Integration):**
```typescript
describe('POST /api/intents/create', () => {
  it('should return 201 with intent id', async () => {});
  it('should return 409 when active intent exists', async () => {});
  it('should return 400 for invalid data', async () => {});
  it('should return 400 for media fetch failure', async () => {});
});

describe('POST /api/intents/:id/confirm-payment', () => {
  it('should return 200 and activate intent', async () => {});
  it('should return 404 for invalid intent', async () => {});
  it('should return 400 for invalid tx', async () => {});
});

describe('PATCH /api/intents/:id', () => {
  it('should update intent', async () => {});
  it('should return 404 for non-existent', async () => {});
});

describe('DELETE /api/intents/:id', () => {
  it('should expire intent', async () => {});
  it('should return 404 for non-existent', async () => {});
});
```

**Implementation:**
- [ ] Create `src/routes/intents.route.ts`
- [ ] Create `src/controllers/intent.controller.ts`
- [ ] Write integration tests
- [ ] Implement controller methods
- [ ] Wire up routes
- [ ] All tests pass

**Estimated Time**: 6-8 hours

---

## Phase 4: Swipe & Matching Algorithm (TDD)

### 4.1 Swipe Repository
**Test First:**
```typescript
describe('SwipeRepository', () => {
  it('should create swipe record', async () => {});
  it('should find swipe by userId and targetIntentId', async () => {});
  it('should get all swipes for user', async () => {});
  it('should check if reciprocal swipe exists', async () => {});
});
```

**Implementation:**
- [ ] Create `src/repositories/swipe.repository.ts`
- [ ] Write tests
- [ ] Implement repository methods
- [ ] All tests pass

### 4.2 Match Repository
**Test First:**
```typescript
describe('MatchRepository', () => {
  it('should create match', async () => {});
  it('should find match by id', async () => {});
  it('should get matches by userId', async () => {});
  it('should update match status', async () => {});
  it('should check if match exists between intents', async () => {});
});
```

**Implementation:**
- [ ] Create `src/repositories/match.repository.ts`
- [ ] Write tests
- [ ] Implement repository methods
- [ ] All tests pass

### 4.3 Matching Service (Core Algorithm)
**Test First:**
```typescript
describe('MatchingService', () => {
  describe('processSwipe', () => {
    it('should record left swipe without matching', async () => {});
    it('should record right swipe without match', async () => {});
    it('should detect mutual match on right swipe', async () => {});
    it('should fail when no active intent', async () => {});
  });

  describe('checkMutualMatch', () => {
    it('should return true when reciprocal swipe exists', async () => {});
    it('should return false when no reciprocal swipe', async () => {});
    it('should return false when reciprocal is left', async () => {});
  });

  describe('createMatch', () => {
    it('should create match record', async () => {});
    it('should provision chat session', async () => {});
    it('should emit match.created event', async () => {});
  });

  describe('finalizeMatch', () => {
    it('should burn intents on-chain (mock)', async () => {});
    it('should update both intents to matched', async () => {});
    it('should remove from feed cache', async () => {});
    it('should update match status to finalized', async () => {});
  });
});
```

**Implementation:**
- [ ] Create `src/services/matching.service.ts`
- [ ] Write all test cases
- [ ] Implement swipe processing
- [ ] Implement mutual match detection
- [ ] Implement match creation
- [ ] Implement match finalization
- [ ] All tests pass

### 4.4 Swipe & Match Controllers
**Test First (Integration):**
```typescript
describe('POST /api/swipes/action', () => {
  it('should return 200 for left swipe', async () => {});
  it('should return 200 for right swipe (no match)', async () => {});
  it('should return 201 for mutual match', async () => {});
  it('should return 400 when no active intent', async () => {});
  it('should return 409 when already swiped', async () => {});
});

describe('POST /api/matches/:id/finalize', () => {
  it('should finalize match', async () => {});
  it('should return 404 for invalid match', async () => {});
  it('should return 409 when already finalized', async () => {});
});

describe('GET /api/matches', () => {
  it('should return user matches', async () => {});
  it('should paginate results', async () => {});
  it('should filter by status', async () => {});
});

describe('GET /api/matches/:id', () => {
  it('should return match details', async () => {});
  it('should return 404 for non-existent', async () => {});
});
```

**Implementation:**
- [ ] Create `src/routes/swipes.route.ts`
- [ ] Create `src/routes/matches.route.ts`
- [ ] Create `src/controllers/swipe.controller.ts`
- [ ] Create `src/controllers/match.controller.ts`
- [ ] Write integration tests
- [ ] Implement controllers
- [ ] Wire up routes
- [ ] All tests pass

**Estimated Time**: 8-10 hours

---

## Phase 5: Match Finalization API (TDD)

### 5.1 On-Chain Integration Service (Mock)
**Test First:**
```typescript
describe('BlockchainService', () => {
  it('should publish intent to chain (mock)', async () => {});
  it('should verify transaction hash', async () => {});
  it('should burn intents on match (mock)', async () => {});
  it('should handle transaction failure', async () => {});
  it('should retry on timeout', async () => {});
});
```

**Implementation:**
- [ ] Create `src/services/blockchain.service.ts`
- [ ] Write tests with mocks
- [ ] Implement mock blockchain calls
- [ ] Implement retry logic
- [ ] All tests pass

### 5.2 Chat Session Service
**Test First:**
```typescript
describe('ChatSessionService', () => {
  it('should provision encrypted chat session', async () => {});
  it('should generate encryption keys', async () => {});
  it('should set expiry (7 days)', async () => {});
  it('should activate chat on match finalize', async () => {});
});
```

**Implementation:**
- [ ] Create `src/services/chat-session.service.ts`
- [ ] Write tests
- [ ] Implement chat provisioning
- [ ] All tests pass

**Estimated Time**: 3-4 hours

---

## Phase 6: Feed & Discovery API (TDD)

### 6.1 Feed Service
**Test First:**
```typescript
describe('FeedService', () => {
  describe('generateFeed', () => {
    it('should return active intents for bucket', async () => {});
    it('should exclude expired intents', async () => {});
    it('should exclude already swiped', async () => {});
    it('should exclude own intent', async () => {});
    it('should apply reputation filter', async () => {});
    it('should apply visibility filter', async () => {});
    it('should paginate results', async () => {});
  });

  describe('caching', () => {
    it('should cache feed in Redis', async () => {});
    it('should return cached feed', async () => {});
    it('should invalidate after TTL', async () => {});
  });
});
```

**Implementation:**
- [ ] Create `src/services/feed.service.ts`
- [ ] Write tests
- [ ] Implement feed query logic
- [ ] Implement caching (Redis mock)
- [ ] All tests pass

### 6.2 Feed Controller
**Test First (Integration):**
```typescript
describe('GET /api/feed', () => {
  it('should return intents for user', async () => {});
  it('should filter by bucket type', async () => {});
  it('should apply reputation filter', async () => {});
  it('should exclude swiped intents', async () => {});
  it('should return 400 for invalid params', async () => {});
});
```

**Implementation:**
- [ ] Create `src/routes/feed.route.ts`
- [ ] Create `src/controllers/feed.controller.ts`
- [ ] Write integration tests
- [ ] Implement controller
- [ ] All tests pass

**Estimated Time**: 4-5 hours

---

## Phase 7: Integration Tests & Edge Cases

### 7.1 Full Flow Integration Tests
```typescript
describe('Complete Intent Flow', () => {
  it('should create → pay → publish → match → finalize', async () => {
    // User1 creates intent
    // User2 creates intent
    // User1 right swipes User2
    // User2 right swipes User1
    // Match created
    // Match finalized
    // Both intents burned
  });
});

describe('Edge Cases', () => {
  it('should handle simultaneous swipes (race condition)', async () => {});
  it('should handle intent expiry during matching', async () => {});
  it('should handle payment timeout', async () => {});
  it('should handle media fetch failure', async () => {});
  it('should cleanup expired intents', async () => {});
});
```

### 7.2 Performance Tests
```typescript
describe('Performance', () => {
  it('should handle 100 concurrent intent creations', async () => {});
  it('should generate feed in <500ms', async () => {});
  it('should process swipe in <100ms', async () => {});
});
```

**Estimated Time**: 3-4 hours

---

## Implementation Order (TDD Workflow)

### Week 1: Foundation
- **Day 1-2**: Phase 1 - Setup, Schema, Migrations
- **Day 3-4**: Phase 2 - Core Models & Utilities (TDD)
- **Day 5**: Phase 3 Start - Intent Repository (TDD)

### Week 2: Core Features
- **Day 1-3**: Phase 3 - Intent Creation API (TDD)
- **Day 4-5**: Phase 4 Start - Swipe & Match Repositories (TDD)

### Week 3: Matching Algorithm
- **Day 1-3**: Phase 4 - Matching Service & Controllers (TDD)
- **Day 4**: Phase 5 - Match Finalization (TDD)
- **Day 5**: Phase 6 - Feed API (TDD)

### Week 4: Polish & Testing
- **Day 1-2**: Phase 7 - Integration Tests
- **Day 3**: Edge Cases & Error Handling
- **Day 4**: Performance Optimization
- **Day 5**: Documentation & Deployment Prep

---

## TDD Checklist for Each Feature

- [ ] **Red**: Write failing test
- [ ] **Green**: Write minimal code to pass
- [ ] **Refactor**: Clean up code
- [ ] **Commit**: Commit with test passing
- [ ] **Repeat**: Next test case

---

## Testing Strategy

### Unit Tests
- All services
- All repositories
- All utilities
- All validators

### Integration Tests
- All API endpoints
- Database operations
- External service mocks

### E2E Tests
- Complete user flows
- Match algorithm flow
- Error scenarios

### Test Coverage Target
- Minimum: 80%
- Target: 90%+

---

## Key Dependencies to Add

```json
{
  "dependencies": {
    "axios": "^1.6.2",
    "sharp": "^0.33.1",
    "ioredis": "^5.3.2",
    "viem": "^1.20.0"
  },
  "devDependencies": {
    "@types/sharp": "^0.32.0",
    "supertest": "^6.3.3"
  }
}
```

---

## Mock Services Required

1. **IPFS Mock**: Mock Pinata API responses
2. **Blockchain Mock**: Mock Zora L2 contract calls
3. **Redis Mock**: Mock Redis for feed caching
4. **Zora SDK Mock**: Mock profile fetching

---

## Success Criteria

✅ All tests pass (100%)  
✅ Test coverage >85%  
✅ Intent creation API functional  
✅ Matching algorithm works correctly  
✅ Feed returns appropriate intents  
✅ Edge cases handled  
✅ Performance targets met  
✅ Database migrations run successfully  

---

**Next Step**: Start with Phase 1 - Update Prisma schema and run migrations locally.
