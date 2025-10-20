# Swipe & Matching API Documentation

**Version**: 1.0  
**Last Updated**: October 2025

---

## Overview

The Swipe & Matching API enables users to discover and interact with Intents through swipe-based gestures. Users can filter by payment type, view detailed intent information, and perform actions (swipe left/right, super like) to find matches.

### Key Features
- **Swipe-based discovery**: Tinder-like card interface
- **Advanced filtering**: By payment type (Paid, Barter, Credits, Contract)
- **Real-time matching**: Instant match detection on mutual right swipes
- **Super like**: Premium action to stand out
- **Match notifications**: Real-time match events

---

## Table of Contents
1. [Get Swipe Deck](#get-swipe-deck)
2. [Perform Swipe Action](#perform-swipe-action)
3. [Get Intent Details](#get-intent-details)
4. [Super Like](#super-like)
5. [Get Matches](#get-matches)
6. [Data Models](#data-models)
7. [Matching Algorithm](#matching-algorithm)

---

## Get Swipe Deck

Retrieves a deck of Intents for swiping with filters.

### Endpoint
```
GET /api/swipe/deck
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | `string` | No | `all` | Intent type: `collaboration`, `hiring`, `networking`, `dating` |
| `paymentTypes` | `string[]` | No | `[]` | Filter by: `paid`, `barter`, `credits`, `contract` |
| `limit` | `number` | No | `10` | Cards to fetch (max: 20) |

### Headers
```
Authorization: Bearer <jwt_token>
X-Wallet-Address: <user_wallet_address>
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "id": "cly8x9z0a0000...",
        "type": "collaboration",
        "category": "VFX Artist",
        "title": "Neon Dream",
        "description": "Looking for a skilled VFX artist to create stunning neon effects for our cyberpunk...",
        "
": {
          "images": [
            {
              "url": "ipfs://QmXxxx...",
              "thumbnail": "ipfs://QmYyyy..."
            }
          ],
          "video": null
        },
        "creator": {
          "walletAddress": "0x742d35...",
          "zoraUsername": "@Dharma",
          "zoraAvatar": "https://...",
          "reputationScore": 78,
          "reputationTier": "established"
        },
        "paymentOptions": {
          "types": ["paid", "credits", "contract"],
          "details": {
            "paid": {
              "amount": "1500-3000",
              "currency": "USD",
              "frequency": "project"
            },
            "credits": {
              "amount": "500",
              "currency": "ORIGINALS_CREDITS"
            },
            "contract": {
              "duration": "3 months",
              "type": "freelance"
            }
          }
        },
        "tags": ["remote", "part-time", "3d", "blender"],
        "metadata": {
          "location": "Remote",
          "commitment": "part-time",
          "duration": "3-6 months"
        },
        "timestamps": {
          "publishedAt": "2025-10-20T14:30:00Z",
          "expiresAt": "2025-10-21T14:30:00Z",
          "timeRemaining": 82800
        }
      }
    ],
    "total": 156,
    "hasMore": true
  }
}
```

### Error Responses

#### 403 Forbidden - No Active Intent
```json
{
  "success": false,
  "error": {
    "code": "NO_ACTIVE_INTENT",
    "message": "Create an active intent to start swiping"
  }
}
```

---

## Perform Swipe Action

Records a swipe action and checks for matches.

### Endpoint
```
POST /api/swipe
```

### Request Body

```json
{
  "targetIntentId": "cly8x9z0a0000...",
  "action": "right",
  "metadata": {
    "viewDuration": 5200,
    "mediaViewed": ["image1", "image2"],
    "deviceType": "mobile"
  }
}
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targetIntentId` | `string` | Yes | Intent being swiped on |
| `action` | `string` | Yes | `left` (reject) or `right` (like) |
| `metadata.viewDuration` | `number` | No | Time spent viewing (ms) |
| `metadata.mediaViewed` | `string[]` | No | Media items viewed |

### Success Response (200 OK) - No Match

```json
{
  "success": true,
  "data": {
    "swipeId": "clz1abc...",
    "action": "right",
    "matchDetected": false,
    "remainingCards": 45
  }
}
```

### Success Response (200 OK) - Match Detected! 🎉

```json
{
  "success": true,
  "data": {
    "swipeId": "clz1abc...",
    "action": "right",
    "matchDetected": true,
    "match": {
      "id": "clz1match...",
      "status": "pending",
      "matchedAt": "2025-10-20T15:45:00Z",
      "user": {
        "walletAddress": "0x742d35...",
        "zoraUsername": "@Dharma",
        "zoraAvatar": "https://..."
      },
      "intent": {
        "id": "cly8x9z0a0000...",
        "title": "Neon Dream",
        "type": "collaboration"
      },
      "chatSession": {
        "id": "clz1chat...",
        "expiresAt": "2025-10-27T15:45:00Z",
        "encryptionEnabled": true
      }
    }
  }
}
```

### Error Responses

#### 400 Bad Request - Already Swiped
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_SWIPED",
    "message": "You already swiped on this intent"
  }
}
```

#### 410 Gone - Intent Expired
```json
{
  "success": false,
  "error": {
    "code": "INTENT_EXPIRED",
    "message": "This intent is no longer available"
  }
}
```

---

## Get Intent Details

Get full details of an intent card (triggered by middle info button).

### Endpoint
```
GET /api/swipe/intent/:intentId
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "cly8x9z0a0000...",
    "type": "collaboration",
    "category": "VFX Artist",
    "title": "Neon Dream",
    "description": "Looking for a skilled VFX artist to create stunning neon effects for our cyberpunk project. Must have experience with Blender, After Effects, and creating futuristic UI elements.",
    "media": {
      "images": [...],
      "video": {...}
    },
    "creator": {
      "walletAddress": "0x742d35...",
      "zoraUsername": "@Dharma",
      "zoraAvatar": "https://...",
      "zoraBio": "VFX artist & 3D creator",
      "reputationScore": 78,
      "reputationTier": "established",
      "totalMatches": 12,
      "successRate": 0.85,
      "portfolio": [
        {
          "title": "Cyberpunk City",
          "url": "https://...",
          "thumbnail": "https://..."
        }
      ]
    },
    "paymentOptions": {
      "types": ["paid", "credits", "contract"],
      "details": {...}
    },
    "requirements": {
      "skills": ["Blender", "After Effects", "3D Modeling"],
      "experience": "2+ years",
      "availability": "15-20 hrs/week"
    },
    "deliverables": [
      "5 unique neon effect animations",
      "Source files (.blend, .aep)",
      "Final renders in 4K"
    ],
    "timeline": {
      "start": "2025-11-01",
      "end": "2026-01-31",
      "milestones": [
        {
          "name": "Initial concepts",
          "deadline": "2025-11-15"
        }
      ]
    },
    "tags": ["remote", "part-time", "3d", "blender", "vfx"],
    "onChain": {
      "publishTxHash": "0xabcd...",
      "contractAddress": "0x1234...",
      "network": "zora-mainnet"
    }
  }
}
```

---

## Super Like

Premium action to stand out (shield/badge button).

### Endpoint
```
POST /api/swipe/super-like
```

### Request Body

```json
{
  "targetIntentId": "cly8x9z0a0000...",
  "message": "Your work is amazing! I'd love to collaborate on this project."
}
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targetIntentId` | `string` | Yes | Intent to super like |
| `message` | `string` | No | Optional message (max 280 chars) |

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "superLikeId": "clz1super...",
    "cost": {
      "amount": "0.001",
      "currency": "ZORA",
      "usdEquivalent": "2.00"
    },
    "notified": true,
    "matchDetected": false
  }
}
```

### Error Responses

#### 402 Payment Required
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient balance for super like",
    "required": {
      "amount": "0.001",
      "currency": "ZORA"
    }
  }
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "code": "SUPER_LIKE_LIMIT",
    "message": "Daily super like limit reached",
    "limit": 5,
    "resetsAt": "2025-10-21T00:00:00Z"
  }
}
```

---

## Get Matches

Retrieve user's matches.

### Endpoint
```
GET /api/matches
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | `string` | No | `all` | Filter: `pending`, `finalized`, `expired` |
| `limit` | `number` | No | `20` | Results per page |
| `cursor` | `string` | No | `null` | Pagination cursor |

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "clz1match...",
        "status": "pending",
        "matchedAt": "2025-10-20T15:45:00Z",
        "otherUser": {
          "walletAddress": "0x742d35...",
          "zoraUsername": "@Dharma",
          "zoraAvatar": "https://..."
        },
        "theirIntent": {
          "id": "cly8x9z0a0000...",
          "title": "Neon Dream",
          "type": "collaboration"
        },
        "yourIntent": {
          "id": "cly8x9z0a0001...",
          "title": "Cyberpunk Game Dev",
          "type": "collaboration"
        },
        "chatSession": {
          "id": "clz1chat...",
          "active": true,
          "messagesExchanged": 5,
          "expiresAt": "2025-10-27T15:45:00Z"
        },
        "nextStep": "finalize"
      }
    ],
    "pagination": {
      "nextCursor": "clz1match002...",
      "hasMore": true
    },
    "stats": {
      "total": 12,
      "pending": 3,
      "finalized": 8,
      "expired": 1
    }
  }
}
```

---

## Data Models

### SwipeDeckCard

```typescript
interface SwipeDeckCard {
  id: string;
  type: IntentType;
  category: string;
  title: string;
  description: string;
  media: MediaContent;
  creator: CreatorProfile;
  paymentOptions: PaymentOptions;
  tags: string[];
  metadata: IntentMetadata;
  timestamps: Timestamps;
}
```

### PaymentOptions

```typescript
interface PaymentOptions {
  types: PaymentType[];
  details: {
    paid?: {
      amount: string;
      currency: string;
      frequency: 'hourly' | 'project' | 'monthly';
    };
    barter?: {
      offering: string;
      seeking: string;
    };
    credits?: {
      amount: string;
      currency: 'ORIGINALS_CREDITS';
    };
    contract?: {
      duration: string;
      type: 'full-time' | 'part-time' | 'freelance';
    };
  };
}

type PaymentType = 'paid' | 'barter' | 'credits' | 'contract';
```

### SwipeAction

```typescript
interface SwipeAction {
  targetIntentId: string;
  action: 'left' | 'right';
  metadata?: {
    viewDuration?: number;
    mediaViewed?: string[];
    deviceType?: string;
  };
}
```

### Match

```typescript
interface Match {
  id: string;
  status: MatchStatus;
  matchedAt: string;
  user: MatchUser;
  intent: MatchIntent;
  chatSession: ChatSession;
}

type MatchStatus = 'pending' | 'finalizing' | 'finalized' | 'expired';
```

### SuperLike

```typescript
interface SuperLike {
  targetIntentId: string;
  message?: string;
  cost: {
    amount: string;
    currency: 'ZORA';
    usdEquivalent: string;
  };
}
```

---

## Matching Algorithm

### Match Detection Flow

```typescript
async function processSwipe(
  userId: string,
  targetIntentId: string,
  action: SwipeAction
): Promise<SwipeResult> {
  // 1. Get user's active intent
  const userIntent = await getUserActiveIntent(userId);
  if (!userIntent) throw new Error('NO_ACTIVE_INTENT');

  // 2. Record swipe
  const swipe = await prisma.swipe.create({
    data: {
      userId,
      intentId: userIntent.id,
      targetIntentId,
      action: action.action,
      viewDuration: action.metadata?.viewDuration,
      mediaViewed: action.metadata?.mediaViewed || []
    }
  });

  // 3. Check for mutual match (only on right swipe)
  if (action.action === 'right') {
    const mutualMatch = await checkMutualMatch(
      userIntent.id,
      targetIntentId
    );

    if (mutualMatch) {
      const match = await createMatch(userIntent, targetIntentId);
      
      // Emit real-time event
      await emitMatchEvent(match);
      
      return {
        swipeId: swipe.id,
        matchDetected: true,
        match
      };
    }
  }

  return {
    swipeId: swipe.id,
    matchDetected: false
  };
}
```

### Mutual Match Detection

```typescript
async function checkMutualMatch(
  intentId: string,
  targetIntentId: string
): Promise<boolean> {
  const reciprocalSwipe = await prisma.swipe.findFirst({
    where: {
      intentId: targetIntentId,
      targetIntentId: intentId,
      action: 'right'
    }
  });

  return reciprocalSwipe !== null;
}
```

### Match Creation

```typescript
async function createMatch(
  userIntent: Intent,
  targetIntentId: string
): Promise<Match> {
  const targetIntent = await prisma.intent.findUnique({
    where: { id: targetIntentId },
    include: { user: true }
  });

  // Create match in transaction
  const match = await prisma.$transaction(async (tx) => {
    // Create match record
    const newMatch = await tx.match.create({
      data: {
        user1Id: userIntent.userId,
        user2Id: targetIntent.userId,
        intent1Id: userIntent.id,
        intent2Id: targetIntent.id,
        status: 'pending',
        matchedAt: new Date()
      }
    });

    // Provision encrypted chat session
    const chatSession = await tx.chatSession.create({
      data: {
        matchId: newMatch.id,
        encryptionKey: generateEncryptionKey(),
        active: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    return { ...newMatch, chatSession };
  });

  return match;
}
```

---

## Filter Implementation

### Payment Type Filtering

```typescript
async function getSwipeDeck(
  userId: string,
  filters: SwipeFilters
): Promise<SwipeDeckCard[]> {
  const where: any = {
    status: 'active',
    expiresAt: { gt: new Date() },
    userId: { not: userId }
  };

  // Payment type filtering
  if (filters.paymentTypes?.length > 0) {
    where.metadata = {
      path: ['paymentOptions', 'types'],
      array_contains: filters.paymentTypes
    };
  }

  const intents = await prisma.intent.findMany({
    where,
    include: { user: true },
    orderBy: { publishedAt: 'desc' },
    take: filters.limit || 10
  });

  return intents.map(formatSwipeCard);
}
```

### Filter Options

Based on UI chips:
- **All**: No payment filter
- **Paid**: `paymentTypes: ['paid']`
- **Barter**: `paymentTypes: ['barter']`
- **Credits**: `paymentTypes: ['credits']`
- **Contract**: `paymentTypes: ['contract']`

---

## Real-Time Match Notifications

### WebSocket Integration

```typescript
// Client subscribes to match events
socket.on('match.detected', (data: MatchEvent) => {
  showMatchModal(data.match);
  playMatchSound();
  vibrate();
});

// Server emits on match
async function emitMatchEvent(match: Match) {
  const event: MatchEvent = {
    type: 'match.detected',
    match: {
      id: match.id,
      otherUser: match.user2,
      intent: match.intent2,
      chatSessionId: match.chatSession.id
    },
    timestamp: new Date().toISOString()
  };

  await io.to(match.user1Id).emit('match.detected', event);
  await io.to(match.user2Id).emit('match.detected', event);
}
```

---

## UI Integration Guide

### Swipe Card Component

```typescript
interface SwipeCardProps {
  card: SwipeDeckCard;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onViewDetails: () => void;
  onSuperLike: () => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({
  card,
  onSwipeLeft,
  onSwipeRight,
  onViewDetails,
  onSuperLike
}) => {
  return (
    <div className="swipe-card">
      {/* Category badge */}
      <div className="category-badge">{card.category}</div>

      {/* Media */}
      <img src={resolveIPFS(card.media.images[0].url)} />

      {/* Content */}
      <div className="card-content">
        <h2>{card.title}</h2>
        <div className="creator">
          <img src={card.creator.zoraAvatar} />
          <span>{card.creator.zoraUsername}</span>
        </div>
        <p>{card.description}</p>

        {/* Payment tags */}
        <div className="tags">
          {card.paymentOptions.types.map(type => (
            <span key={type} className={`tag ${type}`}>
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="actions">
        <button className="reject" onClick={onSwipeLeft}>
          ✕
        </button>
        <button className="info" onClick={onViewDetails}>
          ℹ️
        </button>
        <button className="like" onClick={onSwipeRight}>
          ♥
        </button>
        <button className="super-like" onClick={onSuperLike}>
          🛡️
        </button>
      </div>
    </div>
  );
};
```

### Swipe Gesture Handling

```typescript
const useSwipeGesture = (onSwipe: (direction: 'left' | 'right') => void) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = () => {
    if (Math.abs(position.x) > 100) {
      const direction = position.x > 0 ? 'right' : 'left';
      onSwipe(direction);
    } else {
      setPosition({ x: 0, y: 0 });
    }
    setIsDragging(false);
  };

  return { position, isDragging, handleDragEnd };
};
```

---

## Performance & Optimization

### Database Indexes

```sql
CREATE INDEX idx_swipes_mutual_match 
  ON swipes(intent_id, target_intent_id, action);

CREATE INDEX idx_matches_user_status 
  ON matches(user1_id, user2_id, status);
```

### Caching Strategy

```typescript
// Pre-fetch next cards
async function prefetchCards(userId: string) {
  const cacheKey = `swipe:deck:${userId}`;
  const cached = await redis.get(cacheKey);
  
  if (!cached) {
    const cards = await getSwipeDeck(userId, { limit: 20 });
    await redis.setex(cacheKey, 600, JSON.stringify(cards));
  }
}
```

---

## Testing

```typescript
describe('POST /api/swipe', () => {
  it('should detect mutual match', async () => {
    // User A swipes right on User B's intent
    await request(app)
      .post('/api/swipe')
      .send({
        targetIntentId: userBIntentId,
        action: 'right'
      })
      .set('Authorization', userAToken);

    // User B swipes right on User A's intent
    const response = await request(app)
      .post('/api/swipe')
      .send({
        targetIntentId: userAIntentId,
        action: 'right'
      })
      .set('Authorization', userBToken)
      .expect(200);

    expect(response.body.data.matchDetected).toBe(true);
    expect(response.body.data.match).toBeDefined();
  });

  it('should create chat session on match', async () => {
    const match = await createMatch(intent1, intent2.id);
    
    const chatSession = await prisma.chatSession.findUnique({
      where: { matchId: match.id }
    });

    expect(chatSession).toBeDefined();
    expect(chatSession.active).toBe(true);
  });
});
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `NO_ACTIVE_INTENT` | 403 | User has no active intent |
| `ALREADY_SWIPED` | 400 | Already swiped on this intent |
| `INTENT_EXPIRED` | 410 | Intent no longer available |
| `INSUFFICIENT_BALANCE` | 402 | Can't afford super like |
| `SUPER_LIKE_LIMIT` | 429 | Daily limit reached |
| `SELF_SWIPE` | 400 | Can't swipe own intent |

---

**End of Documentation**
