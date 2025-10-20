# Feed API Documentation

**Version**: 1.0  
**Last Updated**: October 2025

---

## Overview

The Feed API provides personalized content discovery for users based on Intent types. Users can browse active Intents from creators, filtered by type (collaboration, hiring, networking, dating) and reputation settings.

### Key Features
- **Type-based filtering**: PostFeed (all types) vs specialized feeds (CollabFeed, etc.)
- **Reputation filtering**: Optional reputation-based content filtering
- **Smart exclusions**: Automatically excludes user's own intents and previously swiped items
- **Pagination support**: Cursor-based pagination for infinite scroll
- **Rich media**: Images, videos, and creator profiles

---

## Table of Contents
1. [Get Feed](#get-feed)
2. [Get Feed Item Details](#get-feed-item-details)
3. [Data Models](#data-models)
4. [Feed Algorithms](#feed-algorithms)
5. [Error Handling](#error-handling)

---

## Get Feed

Retrieves a paginated feed of active Intents for the user.

### Endpoint
```
GET /api/feed
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | `string` | No | `all` | Filter by intent type: `all`, `collaboration`, `hiring`, `networking`, `dating` |
| `reputationMode` | `boolean` | No | `false` | Enable reputation-based filtering (2x activation fee required) |
| `limit` | `number` | No | `20` | Number of items per page (max: 50) |
| `cursor` | `string` | No | `null` | Pagination cursor from previous response |
| `minReputationScore` | `number` | No | `0` | Minimum reputation score (0-100) |

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
    "items": [
      {
        "id": "cly8x9z0a0000...",
        "type": "collaboration",
        "title": "New VFX breakdown coming soon 🔥✨",
        "description": "Looking for 3D artists to collaborate on an upcoming sci-fi project. Need expertise in Blender and Houdini.",
        "visibility": "public",
        "reputationEnabled": true,
        "status": "active",
        
        "media": {
          "images": [
            {
              "url": "ipfs://QmXxxx...",
              "thumbnail": "ipfs://QmYyyy...",
              "ipfsHash": "QmXxxx..."
            },
            {
              "url": "ipfs://QmZzzz...",
              "thumbnail": "ipfs://QmWwww...",
              "ipfsHash": "QmZzzz..."
            }
          ],
          "video": {
            "url": "ipfs://QmVvvv...",
            "ipfsHash": "QmVvvv...",
            "duration": 45000
          }
        },
        
        "pricing": {
          "activationFee": "0.002500",
          "activationFeeUsd": "5.00",
          "currency": "ZORA"
        },
        
        "creator": {
          "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
          "zoraUsername": "dharma.creates",
          "zoraAvatar": "https://zora.co/api/avatar/0x742d35...",
          "zoraBio": "VFX artist & 3D creator | Sci-fi enthusiast",
          "reputationScore": 78,
          "reputationTier": "established",
          "totalMatches": 12,
          "successRate": 0.85
        },
        
        "metadata": {
          "tags": ["vfx", "3d", "blender", "houdini", "sci-fi"],
          "location": "Remote",
          "duration": "3-6 months",
          "commitment": "part-time"
        },
        
        "stats": {
          "views": 245,
          "rightSwipes": 18,
          "leftSwipes": 7
        },
        
        "timestamps": {
          "createdAt": "2025-10-20T14:30:00Z",
          "publishedAt": "2025-10-20T14:32:15Z",
          "expiresAt": "2025-10-21T14:32:15Z"
        }
      }
    ],
    "pagination": {
      "nextCursor": "cly8x9z0a0010...",
      "hasMore": true,
      "total": 156
    }
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 403 Forbidden - No Active Intent
```json
{
  "success": false,
  "error": {
    "code": "NO_ACTIVE_INTENT",
    "message": "You must have an active intent to browse the feed",
    "details": {
      "hint": "Create an intent to unlock feed access",
      "canCreate": true
    }
  }
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Invalid query parameters",
    "details": {
      "limit": "Must be between 1 and 50"
    }
  }
}
```

### Example Request

```bash
curl -X GET "https://api.originals.app/api/feed?type=collaboration&limit=20&reputationMode=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "X-Wallet-Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

### Example Response (Empty Feed)

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "nextCursor": null,
      "hasMore": false,
      "total": 0
    },
    "message": "No more intents available. Check back later!"
  }
}
```

---

## Get Feed Item Details

Retrieve detailed information about a specific Intent from the feed.

### Endpoint
```
GET /api/feed/:intentId
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `intentId` | `string` | Yes | Unique Intent ID |

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
    "id": "cly8x9z0a0000...",
    "type": "collaboration",
    "title": "New VFX breakdown coming soon 🔥✨",
    "description": "Looking for 3D artists to collaborate on an upcoming sci-fi project...",
    "visibility": "public",
    "reputationEnabled": true,
    "status": "active",
    
    "media": {
      "images": [...],
      "video": {...}
    },
    
    "pricing": {
      "activationFee": "0.002500",
      "activationFeeUsd": "5.00",
      "currency": "ZORA"
    },
    
    "creator": {
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "zoraUsername": "dharma.creates",
      "zoraAvatar": "https://zora.co/api/avatar/0x742d35...",
      "zoraBio": "VFX artist & 3D creator",
      "reputationScore": 78,
      "reputationTier": "established",
      "totalMatches": 12,
      "successRate": 0.85
    },
    
    "metadata": {
      "tags": ["vfx", "3d", "blender"],
      "customFields": {
        "location": "Remote",
        "duration": "3-6 months"
      }
    },
    
    "onChain": {
      "publishTxHash": "0xabcd1234...",
      "smartContractAddress": "0x9876fedc...",
      "blockNumber": 12345678,
      "network": "zora-mainnet"
    },
    
    "timestamps": {
      "createdAt": "2025-10-20T14:30:00Z",
      "publishedAt": "2025-10-20T14:32:15Z",
      "expiresAt": "2025-10-21T14:32:15Z",
      "timeRemaining": 82800
    }
  }
}
```

### Error Responses

#### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "INTENT_NOT_FOUND",
    "message": "Intent not found or no longer available"
  }
}
```

#### 410 Gone - Expired Intent
```json
{
  "success": false,
  "error": {
    "code": "INTENT_EXPIRED",
    "message": "This intent has expired",
    "details": {
      "expiredAt": "2025-10-19T14:32:15Z"
    }
  }
}
```

---

## Data Models

### FeedItem

```typescript
interface FeedItem {
  id: string;
  type: IntentType;
  title: string;
  description: string;
  visibility: 'public' | 'private';
  reputationEnabled: boolean;
  status: IntentStatus;
  media: MediaContent;
  pricing: PricingInfo;
  creator: CreatorProfile;
  metadata: IntentMetadata;
  stats?: FeedStats;
  timestamps: Timestamps;
}
```

### MediaContent

```typescript
interface MediaContent {
  images: ImageMedia[];
  video?: VideoMedia;
}

interface ImageMedia {
  url: string;           // ipfs://...
  thumbnail: string;     // ipfs://... (300x300 optimized)
  ipfsHash: string;
}

interface VideoMedia {
  url: string;           // ipfs://...
  ipfsHash: string;
  duration?: number;     // milliseconds
}
```

### PricingInfo

```typescript
interface PricingInfo {
  activationFee: string;      // In ZORA (decimal string)
  activationFeeUsd: string;   // USD equivalent
  currency: 'ZORA';
}
```

### CreatorProfile

```typescript
interface CreatorProfile {
  walletAddress: string;
  zoraUsername: string | null;
  zoraAvatar: string | null;
  zoraBio: string | null;
  reputationScore: number;      // 0-100
  reputationTier: ReputationTier;
  totalMatches: number;
  successRate: number;          // 0-1
}

type ReputationTier = 'newcomer' | 'rising' | 'established' | 'elite';
```

### IntentMetadata

```typescript
interface IntentMetadata {
  tags: string[];
  customFields?: Record<string, any>;
}
```

### FeedStats

```typescript
interface FeedStats {
  views: number;
  rightSwipes: number;
  leftSwipes: number;
}
```

### Timestamps

```typescript
interface Timestamps {
  createdAt: string;      // ISO 8601
  publishedAt: string;    // ISO 8601
  expiresAt: string;      // ISO 8601
  timeRemaining?: number; // seconds
}
```

### IntentType

```typescript
type IntentType = 
  | 'collaboration'
  | 'hiring'
  | 'networking'
  | 'dating';
```

### IntentStatus

```typescript
type IntentStatus = 
  | 'pending_payment'
  | 'active'
  | 'matched'
  | 'expired'
  | 'burned';
```

---

## Feed Algorithms

### Feed Generation Logic

The feed is generated using the following algorithm:

```typescript
async function generateFeed(
  userId: string,
  filters: FeedFilters
): Promise<FeedItem[]> {
  const userIntent = await getUserActiveIntent(userId);
  
  if (!userIntent) {
    throw new AppError('NO_ACTIVE_INTENT', 403);
  }

  const swipedIntentIds = await getSwipedIntents(userId);

  const query = {
    where: {
      status: 'active',
      expiresAt: { gt: new Date() },
      visibility: 'public',
      userId: { not: userId },
      id: { notIn: swipedIntentIds },
      
      // Type filter
      ...(filters.type !== 'all' && { type: filters.type }),
      
      // Reputation filter
      ...(filters.reputationMode && {
        reputationEnabled: true,
        user: {
          reputationScore: { gte: filters.minReputationScore }
        }
      })
    },
    orderBy: [
      { publishedAt: 'desc' }
    ],
    include: {
      user: true
    }
  };

  return await prisma.intent.findMany(query);
}
```

### Ranking Algorithm (Future Enhancement)

```typescript
interface RankingFactors {
  recency: number;           // Weight: 0.4
  creatorReputation: number; // Weight: 0.3
  engagement: number;        // Weight: 0.2
  relevance: number;         // Weight: 0.1
}

function calculateScore(intent: Intent): number {
  const ageInHours = (Date.now() - intent.publishedAt.getTime()) / 3600000;
  const recencyScore = Math.max(0, 1 - (ageInHours / 24));
  
  const reputationScore = intent.user.reputationScore / 100;
  
  const engagementScore = intent.stats.rightSwipes / 
    Math.max(1, intent.stats.views);
  
  const relevanceScore = calculateRelevance(intent.tags, userPreferences);
  
  return (
    recencyScore * 0.4 +
    reputationScore * 0.3 +
    engagementScore * 0.2 +
    relevanceScore * 0.1
  );
}
```

### Exclusion Rules

1. **Self-exclusion**: User's own intents are never shown
2. **Swipe history**: Previously swiped intents (left or right) are excluded
3. **Matched intents**: Already matched intents are excluded
4. **Expired intents**: Intents past their expiration time
5. **Reputation mismatch**: If reputation mode is enabled, only show intents from users meeting the threshold

### Pagination

Uses cursor-based pagination for consistent results:

```typescript
interface PaginationParams {
  cursor?: string;    // Intent ID
  limit: number;      // Max 50
}

async function getPaginatedFeed(params: PaginationParams) {
  const items = await prisma.intent.findMany({
    take: params.limit + 1,
    skip: params.cursor ? 1 : 0,
    cursor: params.cursor ? { id: params.cursor } : undefined,
    // ... other query params
  });

  const hasMore = items.length > params.limit;
  const results = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore ? results[results.length - 1].id : null;

  return {
    items: results,
    pagination: {
      nextCursor,
      hasMore
    }
  };
}
```

---

## Feed Access Control

### Unlocking Feed Access

Users must have an active intent to browse the feed:

```typescript
async function checkFeedAccess(userId: string): Promise<boolean> {
  const activeIntent = await prisma.intent.findFirst({
    where: {
      userId,
      status: 'active',
      expiresAt: { gt: new Date() }
    }
  });

  return activeIntent !== null;
}
```

### Feed Locking Rules

- Feed is **locked** when user has no active intent
- Feed is **unlocked** when user creates and pays for an intent
- Feed remains **unlocked** for 24 hours (intent lifetime)
- Feed **re-locks** when intent expires or gets matched

---

## Caching Strategy

### Redis Cache Implementation

```typescript
const FEED_CACHE_TTL = 300; // 5 minutes

async function getCachedFeed(
  userId: string,
  filters: FeedFilters
): Promise<FeedItem[]> {
  const cacheKey = `feed:${userId}:${JSON.stringify(filters)}`;
  
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const feed = await generateFeed(userId, filters);
  
  await redis.setex(
    cacheKey,
    FEED_CACHE_TTL,
    JSON.stringify(feed)
  );

  return feed;
}
```

### Cache Invalidation

Cache is invalidated on:
- New intent published
- Intent expired
- Intent matched
- User swipes on intent

---

## Performance Optimization

### Database Indexes

```sql
-- Essential indexes for feed queries
CREATE INDEX idx_intents_feed_active 
  ON intents(status, expires_at, visibility, published_at);

CREATE INDEX idx_intents_type_published 
  ON intents(type, published_at);

CREATE INDEX idx_users_reputation 
  ON users(reputation_score);
```

### Query Optimization

- Use `LIMIT` to cap results
- Index on `(status, expiresAt, visibility)` for fast filtering
- Composite index on `(type, publishedAt)` for sorting
- Avoid `COUNT(*)` for total count in real-time (use cached approximation)

---

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `NO_ACTIVE_INTENT` | 403 | User has no active intent |
| `INVALID_PARAMETERS` | 400 | Invalid query parameters |
| `INTENT_NOT_FOUND` | 404 | Intent does not exist |
| `INTENT_EXPIRED` | 410 | Intent has expired |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Rate Limiting

```
- 100 requests per minute per user
- 1000 requests per hour per user
```

---

## UI Integration Guide

### Feed Display Pattern

Based on the UI screenshot:

```typescript
// Mobile Feed Component
interface FeedCardProps {
  intent: FeedItem;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onBuy: () => void;
}

const FeedCard: React.FC<FeedCardProps> = ({ intent, onSwipeLeft, onSwipeRight, onBuy }) => {
  return (
    <div className="feed-card">
      {/* Media (full screen background) */}
      <div className="media-container">
        {intent.media.images.length > 0 && (
          <img src={resolveIPFS(intent.media.images[0].url)} />
        )}
      </div>

      {/* Header */}
      <div className="header">
        <div className="creator">
          <img src={intent.creator.zoraAvatar} />
          <span>{intent.creator.zoraUsername}</span>
        </div>
      </div>

      {/* Content */}
      <div className="content">
        <h2>{intent.title}</h2>
        <p className="price">${intent.pricing.activationFeeUsd}</p>
        
        {/* Actions */}
        <div className="actions">
          <button onClick={onSwipeLeft}>
            <CommentIcon />
          </button>
          <button onClick={onSwipeLeft}>
            <ShareIcon />
          </button>
          <button className="buy-btn" onClick={onBuy}>
            Buy
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Infinite Scroll Implementation

```typescript
const useFeedScroll = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading) return;
    
    setLoading(true);
    const response = await fetch(
      `/api/feed?cursor=${cursor || ''}&limit=20`
    );
    const data = await response.json();
    
    setItems([...items, ...data.items]);
    setCursor(data.pagination.nextCursor);
    setLoading(false);
  };

  return { items, loadMore, hasMore: cursor !== null };
};
```

---

## Testing

### Unit Tests

```typescript
describe('GET /api/feed', () => {
  it('should return feed items for user with active intent', async () => {
    const response = await request(app)
      .get('/api/feed?type=collaboration&limit=10')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toBeInstanceOf(Array);
    expect(response.body.data.items.length).toBeLessThanOrEqual(10);
  });

  it('should return 403 if user has no active intent', async () => {
    const response = await request(app)
      .get('/api/feed')
      .set('Authorization', `Bearer ${noIntentUserToken}`)
      .expect(403);

    expect(response.body.error.code).toBe('NO_ACTIVE_INTENT');
  });

  it('should exclude already swiped intents', async () => {
    // User swipes on intent
    await request(app)
      .post('/api/swipe')
      .send({ intentId: 'intent-123', action: 'left' });

    // Check feed doesn't include it
    const response = await request(app)
      .get('/api/feed')
      .expect(200);

    const intentIds = response.body.data.items.map(i => i.id);
    expect(intentIds).not.toContain('intent-123');
  });
});
```

---

## Changelog

### Version 1.0 (October 2025)
- Initial Feed API design
- Support for type-based filtering
- Reputation mode filtering
- Cursor-based pagination
- Feed access control implementation

---

**End of Documentation**
