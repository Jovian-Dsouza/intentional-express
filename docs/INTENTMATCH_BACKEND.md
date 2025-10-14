# Intentional Backend Documentation
## Zora L2 - Intent-Based Matchmaking Platform

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core APIs](#core-apis)
4. [Intent Creation API (Detailed)](#intent-creation-api-detailed)
5. [Intent Matching API (Detailed)](#intent-matching-api-detailed)
6. [Additional Services](#additional-services)
7. [Data Models](#data-models)
8. [Event System](#event-system)
9. [Security & Privacy](#security--privacy)

---

## Overview

Intentional is a Web3-native matchmaking platform built on Zora L2, leveraging CreatorCoin presence, on-chain intents, and reputation systems to facilitate meaningful connections between creators, collaborators, and professionals.

### Key Principles
- **On-chain source of truth**: Zora L2 blockchain for intent state
- **Privacy by design**: Minimal PII, ephemeral messaging
- **Creator-first**: Integrated with Zora profiles and CreatorCoin
- **Fee-based activation**: Economic alignment via activation fees
- **Reputation-gated**: Optional quality filtering for high-value intents

---

## Architecture

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (managed)
- **Cache**: Redis (feed/swipe cache)
- **Media Storage**: IPFS (Pinata/web3.storage)
- **Blockchain**: Zora L2 via Zora SDK
- **ORM**: Prisma

### System Components

```
┌─────────────────┐
│   Frontend      │
│   (Mobile/Web)  │
└────────┬────────┘
         │
    ┌────▼─────────────────────────────────┐
    │      Express Backend (Node.js)       │
    │  ┌──────────────────────────────┐   │
    │  │  Intent Creation Service     │   │
    │  │  Intent Matching Service     │   │
    │  │  Feed Service                │   │
    │  │  Profile Aggregation         │   │
    │  │  Payment Oracle              │   │
    │  └──────────────────────────────┘   │
    └─┬──────┬──────┬────────┬────────┬───┘
      │      │      │        │        │
   ┌──▼──┐ ┌─▼──┐ ┌─▼──┐  ┌─▼────┐ ┌─▼─────┐
   │ DB  │ │Redis│ │IPFS│  │Zora  │ │Worker │
   │(PG) │ │     │ │    │  │ L2   │ │Queue  │
   └─────┘ └────┘ └────┘  └──────┘ └───────┘
```

### Database Schema Overview
- `users` - Wallet address, Zora profile cache, settings
- `intents` - Intent metadata, IPFS hashes, bucket, visibility
- `matches` - Mutual match state, on-chain tx reference
- `swipes` - Right/left swipe history
- `chat_sessions` - Ephemeral chat metadata (keys only)

---

## Core APIs

### Base URL
```
https://api-intentional.jovihost.site/v1
```

### Authentication
All requests require Bearer token (JWT signed by wallet):
```
Authorization: Bearer <JWT_TOKEN>
```

### Standard Response Format
```json
{
  "status": "success" | "error",
  "data": {},
  "message": "Optional message",
  "timestamp": "ISO-8601"
}
```

---

## Intent Creation API (Detailed)

### POST `/api/intents/create`
**Purpose**: Create a new intent with media assets and publish to on-chain registry.

#### Request Flow
1. Validate user has no active intent
2. Fetch media from provided URLs and upload to IPFS
3. Create intent record in database
4. Await activation fee payment
5. Publish to on chain
6. Lock feed until on-chain confirmation

#### Request Body
```json
{
  "type": "collaboration" | "hiring" | "networking" | "dating",
  "title": "string (3-100 chars)",
  "description": "string (10-500 chars)",
  "visibility": "public" | "private",
  "reputationEnabled": boolean,
  "duration": number, // hours, default 24, max 168
  "tags": ["string"], // max 5 tags
  "media": {
    "images": [
      {
        "url": "https://example.com/image1.jpg",
        "mimeType": "image/jpeg | image/png | image/gif"
      }
    ], // max 3 images
    "video": {
      "url": "https://example.com/video.mp4",
      "mimeType": "video/mp4 | video/webm"
    } // optional, max 1 video
  },
  "metadata": {
    "location": "string", // optional
    "availability": "string", // optional
    "customFields": {} // optional
  }
}
```

#### Validation Rules
- **Single active intent**: User cannot have more than one active intent
- **Media limits**: Max 3 images (each ≤5MB) + 1 video (≤50MB)
- **Media URLs**: Must be publicly accessible HTTP/HTTPS URLs
- **Supported formats**: Images (JPEG, PNG, GIF), Videos (MP4, WebM)
- **Bucket assignment**: Auto-assigned based on intent type
- **Reputation threshold**: If enabled, user must meet minimum reputation score
- **Activation fee**: Must be paid before on-chain publication

#### Response (Success - 201 Created)
```json
{
  "status": "success",
  "data": {
    "intentId": "string (UUID)",
    "status": "pending_payment",
    "activationFee": {
      "amount": "0.001",
      "currency": "ZORA",
      "usdEquivalent": "2.50",
      "paymentAddress": "0x...",
      "expiresAt": "ISO-8601"
    },
    "media": {
      "images": [
        {
          "ipfsHash": "Qm...",
          "url": "ipfs://Qm..."
        }
      ],
      "video": {
        "ipfsHash": "Qm...",
        "url": "ipfs://Qm..."
      }
    },
    "createdAt": "ISO-8601",
    "expiresAt": "ISO-8601"
  }
}
```

#### Error Responses
```json
// 409 Conflict - Active intent exists
{
  "status": "error",
  "message": "User already has an active intent",
  "data": {
    "existingIntentId": "UUID",
    "expiresAt": "ISO-8601"
  }
}

// 400 Bad Request - Validation error
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title must be between 3-100 characters"
    }
  ]
}

// 402 Payment Required - Insufficient balance
{
  "status": "error",
  "message": "Insufficient ZORA balance for activation fee",
  "data": {
    "required": "0.001 ZORA",
    "available": "0.0005 ZORA"
  }
}

// 400 Bad Request - Media URL fetch failed
{
  "status": "error",
  "message": "Failed to fetch media from URL",
  "errors": [
    {
      "field": "media.images[0].url",
      "message": "URL is not accessible or timed out"
    }
  ]
}

// 400 Bad Request - Invalid media content
{
  "status": "error",
  "message": "Invalid media content",
  "errors": [
    {
      "field": "media.video",
      "message": "Content type must be video/*, received: application/octet-stream"
    }
  ]
}
```

### POST `/api/intents/:intentId/confirm-payment`
**Purpose**: Confirm activation fee payment and trigger on-chain publication.

#### Request Body
```json
{
  "transactionHash": "0x...",
  "network": "zora-mainnet"
}
```

#### Processing Steps
1. Verify transaction on Zora L2
2. Call `publishIntent()` on smart contract
3. Update intent status to "active"
4. Add intent to discovery feed
5. Unlock user's swipe feed
6. Emit `intent.published` event

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "intentId": "UUID",
    "status": "active",
    "onChainTxHash": "0x...",
    "publishedAt": "ISO-8601",
    "feedUnlocked": true
  }
}
```

### PATCH `/api/intents/:intentId/update`
**Purpose**: Update intent metadata (limited fields, requires re-verification).

#### Allowed Updates (Before First Match)
- `description`
- `tags`
- `visibility`
- `metadata.customFields`

#### Request Body
```json
{
  "description": "Updated description",
  "tags": ["new-tag-1", "new-tag-2"],
  "visibility": "private"
}
```

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "intentId": "UUID",
    "updatedFields": ["description", "tags"],
    "updatedAt": "ISO-8601"
  }
}
```

### POST `/api/intents/:intentId/renew`
**Purpose**: Extend intent expiration (requires additional fee).

#### Request Body
```json
{
  "additionalHours": 24 // max 168 total lifetime
}
```

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "intentId": "UUID",
    "newExpiresAt": "ISO-8601",
    "additionalFee": {
      "amount": "0.0005 ZORA",
      "paymentAddress": "0x..."
    }
  }
}
```

### DELETE `/api/intents/:intentId`
**Purpose**: Expire intent early (burns on-chain, refunds partial fee).

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "intentId": "UUID",
    "status": "expired",
    "burnTxHash": "0x...",
    "refundAmount": "0.0003 ZORA",
    "refundTxHash": "0x..."
  }
}
```

---

## Intent Matching API (Detailed)

### POST `/api/swipes/action`
**Purpose**: Record a swipe action (right/left) and check for mutual match.

#### Request Body
```json
{
  "targetIntentId": "UUID",
  "action": "right" | "left",
  "metadata": {
    "viewDuration": 5000, // milliseconds
    "mediaViewed": ["image1", "video"],
    "timestamp": "ISO-8601"
  }
}
```

#### Processing Logic
1. Validate user has active intent
2. Validate target intent is active and visible
3. Check if user already swiped on target
4. Record swipe in database
5. If action is "right", check for mutual match
6. If mutual match detected, trigger match finalization

#### Response (200 OK - No Match)
```json
{
  "status": "success",
  "data": {
    "swipeId": "UUID",
    "action": "right",
    "targetIntentId": "UUID",
    "matchDetected": false,
    "recordedAt": "ISO-8601"
  }
}
```

#### Response (201 Created - Mutual Match!)
```json
{
  "status": "success",
  "data": {
    "swipeId": "UUID",
    "matchDetected": true,
    "matchId": "UUID",
    "match": {
      "id": "UUID",
      "userId": "0x...",
      "matchedUserId": "0x...",
      "intentId": "UUID",
      "matchedIntentId": "UUID",
      "matchedAt": "ISO-8601",
      "status": "finalizing", // pending on-chain burn
      "chatSession": {
        "sessionId": "UUID",
        "encryptionKey": "base64_key",
        "expiresAt": "ISO-8601"
      }
    }
  }
}
```

### POST `/api/matches/:matchId/finalize`
**Purpose**: Execute on-chain intent burn and finalize match state.

#### Processing Steps
1. Verify mutual match exists
2. Call `finalizeMatch()` on smart contract (burns both intents)
3. Update both intents to "matched" status
4. Remove both intents from discovery feed
5. Provision encrypted chat session
6. Emit `match.finalized` event to both users

#### Request Body
```json
{
  "confirmBurn": true
}
```

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "matchId": "UUID",
    "status": "finalized",
    "onChainTxHash": "0x...",
    "intentsBurned": ["UUID", "UUID"],
    "chatSession": {
      "sessionId": "UUID",
      "websocketUrl": "wss://chat.Intentional.app/session/...",
      "encryptionKey": "base64_key",
      "expiresAt": "ISO-8601 (7 days default)"
    },
    "finalizedAt": "ISO-8601"
  }
}
```

### GET `/api/matches`
**Purpose**: Retrieve user's match history.

#### Query Parameters
- `status` - Filter by status: "pending" | "finalized" | "expired"
- `limit` - Results per page (default 20, max 100)
- `offset` - Pagination offset

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "matches": [
      {
        "matchId": "UUID",
        "matchedUser": {
          "walletAddress": "0x...",
          "zoraProfile": {
            "username": "creator123",
            "avatar": "ipfs://...",
            "bio": "...",
            "creatorCoinAddress": "0x..."
          }
        },
        "intent": {
          "title": "Looking for...",
          "type": "collaboration"
        },
        "matchedAt": "ISO-8601",
        "status": "finalized",
        "chatSessionActive": true
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### GET `/api/matches/:matchId`
**Purpose**: Get detailed match information.

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "matchId": "UUID",
    "users": [
      {
        "walletAddress": "0x...",
        "zoraProfile": {...},
        "intent": {
          "id": "UUID",
          "title": "...",
          "description": "...",
          "media": {...}
        }
      },
      {
        "walletAddress": "0x...",
        "zoraProfile": {...},
        "intent": {...}
      }
    ],
    "matchedAt": "ISO-8601",
    "finalizedAt": "ISO-8601",
    "onChainTxHash": "0x...",
    "chatSession": {
      "sessionId": "UUID",
      "active": true,
      "messagesExchanged": 42,
      "lastActivityAt": "ISO-8601",
      "expiresAt": "ISO-8601"
    },
    "status": "finalized"
  }
}
```

### DELETE `/api/matches/:matchId/chat`
**Purpose**: End chat session early (both parties must consent or auto-expires).

#### Response (200 OK)
```json
{
  "status": "success",
  "data": {
    "matchId": "UUID",
    "chatSessionId": "UUID",
    "status": "terminated",
    "terminatedAt": "ISO-8601",
    "reason": "mutual_consent" | "timeout" | "user_report"
  }
}
```

---

## Additional Services

### 1. Feed & Discovery API

#### GET `/api/feed`
**Purpose**: Retrieve swipeable intents based on user's bucket and filters.

```json
GET /api/feed?bucket=collaboration&reputationEnabled=true&limit=20
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "intents": [
      {
        "intentId": "UUID",
        "user": {
          "walletAddress": "0x...",
          "zoraProfile": {
            "username": "creator123",
            "avatar": "ipfs://...",
            "bio": "...",
            "reputation": {
              "score": 850,
              "badge": "verified_creator"
            }
          }
        },
        "title": "Looking for React developer",
        "description": "...",
        "type": "hiring",
        "tags": ["react", "typescript", "web3"],
        "media": {
          "images": [...],
          "video": {...}
        },
        "publishedAt": "ISO-8601",
        "expiresAt": "ISO-8601"
      }
    ],
    "feedMetadata": {
      "bucket": "collaboration",
      "totalAvailable": 156,
      "lastRefreshedAt": "ISO-8601"
    }
  }
}
```

**Feed Algorithm:**
1. Filter out expired/matched intents
2. Filter by bucket type
3. Apply reputation threshold if enabled
4. Exclude already-swiped intents
5. Apply diversity scoring (prevent same user flooding)
6. Return randomized batch (prevent gaming)

### 2. Wallet & Profile Integration

#### GET `/api/profile/:walletAddress`
**Purpose**: Fetch and cache Zora profile metadata.

```json
{
  "status": "success",
  "data": {
    "walletAddress": "0x...",
    "zoraProfile": {
      "username": "creator123",
      "displayName": "Creator Name",
      "avatar": "ipfs://...",
      "bio": "Creative professional...",
      "creatorCoinAddress": "0x...",
      "socialLinks": {
        "twitter": "...",
        "website": "..."
      },
      "onChainActivity": {
        "postsCount": 42,
        "collectionsCount": 5,
        "totalVolume": "1.5 ETH"
      },
      "reputation": {
        "score": 850,
        "tier": "verified_creator",
        "attestations": [...]
      }
    },
    "IntentionalStats": {
      "activeIntents": 1,
      "totalMatches": 12,
      "successRate": 0.75
    },
    "cachedAt": "ISO-8601"
  }
}
```

#### POST `/api/profile/onboard`
**Purpose**: First-time user onboarding, CreatorCoin check/mint.

```json
{
  "walletAddress": "0x...",
  "signature": "0x..." // proof of ownership
}
```

**Processing:**
1. Verify wallet signature
2. Check for CreatorCoin presence via Zora SDK
3. If no CreatorCoin, initiate mint transaction
4. Fetch Zora profile metadata
5. Create user record in database
6. Return onboarding status

### 3. Payment & Fee Handling

#### GET `/api/fees/activation`
**Purpose**: Get current activation fee in ZORA/USD.

```json
{
  "status": "success",
  "data": {
    "baseFee": {
      "zora": "0.001",
      "usd": "2.50"
    },
    "reputationModeFee": {
      "zora": "0.002",
      "usd": "5.00"
    },
    "renewalFee": {
      "zora": "0.0005",
      "usd": "1.25"
    },
    "exchangeRate": {
      "zora_usd": 2500,
      "lastUpdated": "ISO-8601"
    }
  }
}
```

#### POST `/api/payments/verify`
**Purpose**: Verify payment transaction on Zora L2.

```json
{
  "transactionHash": "0x...",
  "expectedAmount": "0.001",
  "paymentType": "activation" | "renewal"
}
```

### 4. Reputation System

#### GET `/api/reputation/:walletAddress`
**Purpose**: Get user's reputation score and breakdown.

```json
{
  "status": "success",
  "data": {
    "walletAddress": "0x...",
    "reputationScore": 850,
    "tier": "verified_creator",
    "components": {
      "onChainActivity": 200,
      "zoraProfile": 150,
      "successfulMatches": 300,
      "communityAttestations": 200
    },
    "badges": [
      {
        "name": "verified_creator",
        "earnedAt": "ISO-8601"
      }
    ],
    "thresholds": {
      "hiring": 700,
      "collaboration": 500
    },
    "calculatedAt": "ISO-8601"
  }
}
```

---

## Data Models

### Intent Schema
```typescript
interface Intent {
  id: string; // UUID
  userId: string; // wallet address
  type: 'collaboration' | 'hiring' | 'networking' | 'dating';
  title: string;
  description: string;
  visibility: 'public' | 'private';
  reputationEnabled: boolean;
  status: 'pending_payment' | 'active' | 'matched' | 'expired' | 'burned';
  
  // Media
  images: IPFSMedia[]; // max 3
  video?: IPFSMedia;
  
  // Metadata
  tags: string[]; // max 5
  metadata: Record<string, any>;
  
  // On-chain
  onChainTxHash?: string;
  smartContractAddress: string;
  
  // Lifecycle
  createdAt: Date;
  publishedAt?: Date;
  expiresAt: Date;
  matchedAt?: Date;
  
  // Relations
  matches?: Match[];
  swipes?: Swipe[];
}

interface IPFSMedia {
  ipfsHash: string;
  url: string;
  mimeType: string;
  size: number;
  thumbnail?: string;
}
```

### Match Schema
```typescript
interface Match {
  id: string; // UUID
  
  // Participants
  user1Id: string;
  user2Id: string;
  intent1Id: string;
  intent2Id: string;
  
  // State
  status: 'pending' | 'finalizing' | 'finalized' | 'expired';
  
  // On-chain
  finalizeTxHash?: string;
  burnedAt?: Date;
  
  // Chat
  chatSessionId?: string;
  chatExpiresAt?: Date;
  
  // Lifecycle
  matchedAt: Date;
  finalizedAt?: Date;
  
  // Relations
  chatSession?: ChatSession;
}
```

### Swipe Schema
```typescript
interface Swipe {
  id: string; // UUID
  userId: string;
  intentId: string;
  targetIntentId: string;
  action: 'right' | 'left';
  
  // Metadata
  viewDuration: number; // ms
  mediaViewed: string[];
  
  // Timestamps
  swipedAt: Date;
}
```

### User Schema
```typescript
interface User {
  id: string; // wallet address
  
  // Zora Profile (cached)
  zoraUsername?: string;
  zoraAvatar?: string;
  zoraBio?: string;
  creatorCoinAddress?: string;
  profileCachedAt?: Date;
  
  // Reputation
  reputationScore: number;
  reputationTier: string;
  
  // Settings
  settings: {
    reputationModeDefault: boolean;
    notificationsEnabled: boolean;
    privacyLevel: 'public' | 'private';
  };
  
  // Stats
  totalIntentsCreated: number;
  totalMatches: number;
  successRate: number;
  
  // Lifecycle
  onboardedAt: Date;
  lastActiveAt: Date;
  
  // Relations
  intents?: Intent[];
  matches?: Match[];
  swipes?: Swipe[];
}
```

---

## Event System

### WebSocket Events (Real-time)

**Connection:**
```javascript
wss://api.Intentional.app/ws?token=<JWT>
```

**Server → Client Events:**

```typescript
// New match detected
{
  "event": "match.created",
  "data": {
    "matchId": "UUID",
    "matchedUser": {...},
    "matchedIntent": {...}
  }
}

// Match finalized on-chain
{
  "event": "match.finalized",
  "data": {
    "matchId": "UUID",
    "txHash": "0x...",
    "chatSession": {...}
  }
}

// Intent expiring soon (2h warning)
{
  "event": "intent.expiring_soon",
  "data": {
    "intentId": "UUID",
    "expiresAt": "ISO-8601",
    "renewalUrl": "/api/intents/{id}/renew"
  }
}

// Intent expired
{
  "event": "intent.expired",
  "data": {
    "intentId": "UUID",
    "expiredAt": "ISO-8601"
  }
}

// Feed updated
{
  "event": "feed.updated",
  "data": {
    "newIntentsCount": 5,
    "lastRefreshedAt": "ISO-8601"
  }
}
```

### Webhook Events (Backend → Backend)

**Configured per integration:**
```
POST https://partner-service.com/webhooks/Intentional
```

**Payload:**
```json
{
  "eventType": "match.finalized" | "intent.created" | "payment.received",
  "timestamp": "ISO-8601",
  "data": {...},
  "signature": "HMAC-SHA256"
}
```

---

## Security & Privacy

### Authentication
- **JWT tokens** signed by user's wallet (EIP-712)
- **Token expiry**: 24 hours
- **Refresh flow**: Sign new message with wallet

### Privacy Guarantees
1. **No PII storage**: Only wallet address and public Zora profile
2. **Ephemeral chat**: Messages not persisted after session expires
3. **Encrypted chat**: E2E encryption keys generated per match
4. **Intent visibility**: User-controlled public/private setting
5. **Data deletion**: Right to be forgotten (GDPR compliant)

### Rate Limiting
- **Intent creation**: 1 per 24h per user
- **Swipe actions**: 100 per hour per user
- **Feed refresh**: 1 per minute per user
- **API calls**: 1000 per hour per IP

### Abuse Prevention
- **Spam detection**: Pattern analysis on swipe behavior
- **Reputation decay**: Inactive users lose reputation over time
- **Manual moderation**: Admin tools for flagged content
- **Automated filters**: Content moderation on intent text/media

---

## Deployment & Operations

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Zora L2
ZORA_RPC_URL=https://rpc.zora.energy
ZORA_CHAIN_ID=7777777
SMART_CONTRACT_ADDRESS=0x...

# IPFS
PINATA_API_KEY=...
PINATA_SECRET=...

# Services
JWT_SECRET=...
WEBHOOK_SECRET=...

# Monitoring
SENTRY_DSN=...
DATADOG_API_KEY=...
```

### Performance Targets
- **API latency**: p95 < 200ms
- **Feed refresh**: < 1s for 20 intents
- **Match finalization**: < 5s (incl. on-chain tx)
- **WebSocket latency**: < 50ms

### Monitoring & Observability
- **Metrics**: Prometheus/Datadog
- **Logging**: Structured JSON logs
- **Tracing**: OpenTelemetry
- **Alerts**: PagerDuty integration

---

## Future Enhancements

### Phase 2
- **Escrow mechanism**: Hold funds until match is successful
- **Advanced reputation**: On-chain attestations, verifiable credentials
- **Multi-intent**: Allow users to have 2-3 active intents in different buckets
- **AI matching**: ML-based intent recommendations

### Phase 3
- **Group intents**: Team-based collaboration matching
- **Video chat**: In-app video calls for matched users
- **Analytics dashboard**: Deep insights for creators
- **Mobile SDK**: Native iOS/Android integration

---

## API Rate Limits Summary

| Endpoint | Rate Limit | Burst |
|----------|-----------|-------|
| POST /intents/create | 1 per 24h | N/A |
| POST /swipes/action | 100 per hour | 10 |
| GET /feed | 60 per hour | 5 |
| GET /profile/* | 1000 per hour | 20 |
| POST /matches/finalize | 10 per hour | 2 |

---

## Error Codes Reference

| Code | Status | Description |
|------|--------|-------------|
| 1001 | 400 | Invalid request body |
| 1002 | 401 | Unauthorized (invalid JWT) |
| 1003 | 403 | Forbidden (insufficient permissions) |
| 1004 | 404 | Resource not found |
| 1005 | 409 | Conflict (active intent exists) |
| 1006 | 402 | Payment required |
| 1007 | 429 | Rate limit exceeded |
| 2001 | 400 | Intent validation failed |
| 2002 | 400 | Media upload failed |
| 2003 | 500 | IPFS service unavailable |
| 3001 | 400 | Match not found |
| 3002 | 409 | Match already finalized |
| 3003 | 500 | On-chain transaction failed |
| 4001 | 400 | Invalid payment transaction |
| 4002 | 402 | Insufficient balance |

---

## Support & Contact

- **Documentation**: https://docs.Intentional.app
- **API Status**: https://status.Intentional.app
- **Developer Discord**: https://discord.gg/Intentional
- **Email**: developers@Intentional.app

---

**Last Updated**: October 2025  
**API Version**: v1.0.0  
**Document Version**: 1.0
