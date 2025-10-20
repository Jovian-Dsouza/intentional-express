# Profile API Documentation

**Version**: 1.0  
**Last Updated**: October 2025

---

## Overview

The Profile API manages user profiles, including Zora integration, CreatorCoin stats, portfolio content, and professional settings.

---

## Table of Contents
1. [Get User Profile](#get-user-profile)
2. [Update Profile](#update-profile)
3. [Get Profile Stats](#get-profile-stats)
4. [Get User Content](#get-user-content)
5. [Upload Portfolio Item](#upload-portfolio-item)
6. [Get CreatorCoin Data](#get-creatorcoin-data)
7. [Update Availability](#update-availability)

---

## Get User Profile

Retrieve complete user profile information.

### Endpoint
```
GET /api/profile/:walletAddress
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `walletAddress` | `string` | Yes | User's wallet address or "me" for current user |

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "user": {
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "zoraUsername": "Dharma",
      "zoraAvatar": "https://zora.co/api/avatar/0x742d35...",
      "zoraBio": "VFX artist & 3D creator | Cyberpunk enthusiast",
      "verified": true,
      "isCreatorCoinHolder": true,
      "availableForCollabs": true,
      "status": "CreatorCoin Holder • Available for Collabs"
    },
    "skills": [
      {
        "name": "VFX",
        "category": "technical",
        "verified": true
      },
      {
        "name": "3D Animation",
        "category": "technical",
        "verified": true
      },
      {
        "name": "Motion Graphics",
        "category": "creative",
        "verified": false
      },
      {
        "name": "Color Grading",
        "category": "technical",
        "verified": false
      }
    ],
    "stats": {
      "creatorCoin": {
        "marketCap": "0.08",
        "currency": "ETH",
        "change24h": 12.0,
        "holders": 156,
        "price": "0.00051"
      },
      "content": {
        "total": 24,
        "recent": 3,
        "views": 12453,
        "likes": 892
      },
      "gigs": {
        "total": 47,
        "completed": 39,
        "recent": 8,
        "successRate": 0.95
      }
    },
    "reputation": {
      "score": 82,
      "tier": "established",
      "totalMatches": 15,
      "successRate": 0.87,
      "reviews": 12,
      "avgRating": 4.6
    },
    "social": {
      "twitter": "@dharma_creates",
      "website": "https://dharma.art",
      "discord": "dharma#1234"
    },
    "metadata": {
      "memberSince": "2024-03-15T00:00:00Z",
      "lastActiveAt": "2025-10-20T14:30:00Z",
      "location": "Remote",
      "timezone": "UTC+5:30"
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
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
```

---

## Update Profile

Update user profile information.

### Endpoint
```
PATCH /api/profile
```

### Request Body

```json
{
  "zoraBio": "Award-winning VFX artist | Available for collaborations",
  "skills": ["VFX", "3D Animation", "Motion Graphics", "Color Grading"],
  "availableForCollabs": true,
  "social": {
    "twitter": "@dharma_creates",
    "website": "https://dharma.art",
    "discord": "dharma#1234"
  },
  "settings": {
    "reputationModeDefault": true,
    "notificationsEnabled": true,
    "privacyLevel": "public"
  }
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Profile updated successfully",
    "user": {
      "walletAddress": "0x742d35...",
      "zoraUsername": "Dharma",
      "zoraBio": "Award-winning VFX artist...",
      "skills": [...],
      "availableForCollabs": true
    }
  }
}
```

### Validation Rules

- `zoraBio`: Max 280 characters
- `skills`: Max 10 skills
- `social.twitter`: Must be valid Twitter handle
- `social.website`: Must be valid URL

---

## Get Profile Stats

Retrieve detailed profile statistics.

### Endpoint
```
GET /api/profile/:walletAddress/stats
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | `string` | No | `30d` | Stats period: `7d`, `30d`, `90d`, `all` |

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "creatorCoin": {
      "marketCap": "0.08",
      "currency": "ETH",
      "usdValue": "256.00",
      "change24h": 12.0,
      "change7d": 18.5,
      "change30d": 45.2,
      "holders": 156,
      "price": "0.00051",
      "volume24h": "0.12",
      "contractAddress": "0x9876fedc...",
      "network": "zora-mainnet",
      "chartData": [
        {
          "timestamp": "2025-10-20T00:00:00Z",
          "price": "0.00048",
          "volume": "0.05"
        }
      ]
    },
    "content": {
      "total": 24,
      "recentlyAdded": 3,
      "totalViews": 12453,
      "totalLikes": 892,
      "totalComments": 156,
      "avgEngagement": 8.2,
      "topPerforming": [
        {
          "id": "content-123",
          "title": "Neon City",
          "views": 2341,
          "likes": 189
        }
      ]
    },
    "gigs": {
      "total": 47,
      "completed": 39,
      "inProgress": 5,
      "recentlyCompleted": 8,
      "cancelled": 3,
      "successRate": 0.95,
      "avgCompletionTime": "12 days",
      "repeatClients": 15,
      "revenue": {
        "total": "45000",
        "currency": "USD",
        "average": "957"
      }
    },
    "reputation": {
      "score": 82,
      "tier": "established",
      "totalMatches": 15,
      "successRate": 0.87,
      "reviews": 12,
      "avgRating": 4.6,
      "badges": [
        {
          "id": "early-adopter",
          "name": "Early Adopter",
          "earnedAt": "2024-03-15T00:00:00Z"
        },
        {
          "id": "top-creator",
          "name": "Top Creator",
          "earnedAt": "2024-08-20T00:00:00Z"
        }
      ]
    }
  }
}
```

---

## Get User Content

Retrieve user's portfolio content.

### Endpoint
```
GET /api/profile/:walletAddress/content
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | `string` | No | `all` | `all`, `images`, `videos`, `3d` |
| `tab` | `string` | No | `content` | `content` or `pro` (premium work) |
| `limit` | `number` | No | `12` | Items per page |
| `cursor` | `string` | No | `null` | Pagination cursor |
| `sortBy` | `string` | No | `recent` | `recent`, `popular`, `oldest` |

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "content-001",
        "type": "image",
        "title": "Cyberpunk Neon",
        "description": "VFX work for music video",
        "media": {
          "url": "ipfs://QmXxxx...",
          "thumbnail": "ipfs://QmYyyy...",
          "width": 1920,
          "height": 1080
        },
        "isPro": false,
        "metadata": {
          "software": ["Blender", "After Effects"],
          "category": "VFX",
          "tags": ["cyberpunk", "neon", "3d"]
        },
        "stats": {
          "views": 2341,
          "likes": 189,
          "comments": 23
        },
        "createdAt": "2025-10-15T12:00:00Z"
      },
      {
        "id": "content-002",
        "type": "video",
        "title": "Studio Setup",
        "media": {
          "url": "ipfs://QmZzzz...",
          "thumbnail": "ipfs://QmWwww...",
          "duration": 30000
        },
        "isPro": false,
        "stats": {
          "views": 1823,
          "likes": 156,
          "comments": 12
        },
        "createdAt": "2025-10-10T09:00:00Z"
      }
    ],
    "pagination": {
      "nextCursor": "content-013",
      "hasMore": true
    },
    "stats": {
      "totalContent": 24,
      "totalPro": 8
    }
  }
}
```

---

## Upload Portfolio Item

Add new content to portfolio.

### Endpoint
```
POST /api/profile/content
```

### Request Body

```json
{
  "type": "image",
  "title": "Neon City Dreams",
  "description": "Cyberpunk cityscape with neon effects",
  "mediaUrl": "https://example.com/image.jpg",
  "isPro": false,
  "metadata": {
    "software": ["Blender", "Photoshop"],
    "category": "VFX",
    "tags": ["cyberpunk", "cityscape", "3d"],
    "projectDate": "2025-10-01"
  }
}
```

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "content-025",
    "message": "Content uploaded successfully",
    "item": {
      "id": "content-025",
      "type": "image",
      "title": "Neon City Dreams",
      "media": {
        "url": "ipfs://QmNewHash...",
        "thumbnail": "ipfs://QmThumb..."
      },
      "createdAt": "2025-10-20T15:30:00Z"
    }
  }
}
```

---

## Get CreatorCoin Data

Retrieve detailed CreatorCoin information.

### Endpoint
```
GET /api/profile/:walletAddress/creator-coin
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "creatorCoin": {
      "contractAddress": "0x9876fedc...",
      "network": "zora-mainnet",
      "symbol": "DHARMA",
      "name": "Dharma Creator Coin",
      "totalSupply": "1000000",
      "circulatingSupply": "156000",
      "marketCap": {
        "eth": "0.08",
        "usd": "256.00"
      },
      "price": {
        "current": "0.00051",
        "change24h": 12.0,
        "change7d": 18.5,
        "allTimeHigh": "0.00089",
        "allTimeLow": "0.00012"
      },
      "holders": {
        "count": 156,
        "topHolders": [
          {
            "address": "0xabcd...",
            "balance": "50000",
            "percentage": 32.05
          }
        ]
      },
      "volume": {
        "volume24h": "0.12",
        "volume7d": "0.87",
        "volume30d": "3.45"
      },
      "trading": {
        "buyTax": 5.0,
        "sellTax": 5.0,
        "liquidity": "2.5 ETH"
      },
      "chartData": {
        "price": [...],
        "volume": [...]
      }
    },
    "userHolding": {
      "isHolder": true,
      "balance": "5000",
      "percentage": 3.21,
      "valueEth": "2.55",
      "valueUsd": "8160.00",
      "profitLoss": {
        "eth": "0.45",
        "usd": "1440.00",
        "percentage": 21.4
      }
    }
  }
}
```

---

## Update Availability

Toggle availability for collaborations.

### Endpoint
```
PATCH /api/profile/availability
```

### Request Body

```json
{
  "availableForCollabs": true,
  "intentTypes": ["collaboration", "hiring"],
  "minBudget": 1000,
  "preferredPaymentTypes": ["paid", "credits"]
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Availability updated",
    "availableForCollabs": true,
    "status": "Available for Collabs"
  }
}
```

---

## Delete Portfolio Item

Remove content from portfolio.

### Endpoint
```
DELETE /api/profile/content/:contentId
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Content deleted successfully"
  }
}
```

---

## Get Profile Settings

Retrieve user settings.

### Endpoint
```
GET /api/profile/settings
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "settings": {
      "privacy": {
        "profileVisibility": "public",
        "showStats": true,
        "showCreatorCoin": true,
        "showPortfolio": true
      },
      "notifications": {
        "matchNotifications": true,
        "messageNotifications": true,
        "emailNotifications": false,
        "pushNotifications": true
      },
      "defaults": {
        "reputationModeDefault": true,
        "autoAcceptMatches": false
      },
      "preferences": {
        "theme": "dark",
        "language": "en"
      }
    }
  }
}
```

---

## Update Profile Settings

Update user settings.

### Endpoint
```
PATCH /api/profile/settings
```

### Request Body

```json
{
  "privacy": {
    "profileVisibility": "public",
    "showStats": true
  },
  "notifications": {
    "matchNotifications": true,
    "emailNotifications": false
  }
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Settings updated successfully"
  }
}
```

---

## Data Models

### UserProfile

```typescript
interface UserProfile {
  walletAddress: string;
  zoraUsername: string;
  zoraAvatar: string;
  zoraBio: string;
  verified: boolean;
  isCreatorCoinHolder: boolean;
  availableForCollabs: boolean;
  status: string;
}
```

### Skill

```typescript
interface Skill {
  name: string;
  category: 'technical' | 'creative' | 'business';
  verified: boolean;
}
```

### ProfileStats

```typescript
interface ProfileStats {
  creatorCoin: CreatorCoinStats;
  content: ContentStats;
  gigs: GigStats;
  reputation: ReputationStats;
}

interface CreatorCoinStats {
  marketCap: string;
  currency: 'ETH';
  change24h: number;
  holders: number;
  price: string;
}

interface ContentStats {
  total: number;
  recent: number;
  views: number;
  likes: number;
}

interface GigStats {
  total: number;
  completed: number;
  recent: number;
  successRate: number;
}
```

### PortfolioItem

```typescript
interface PortfolioItem {
  id: string;
  type: 'image' | 'video' | '3d';
  title: string;
  description?: string;
  media: MediaContent;
  isPro: boolean;
  metadata: PortfolioMetadata;
  stats: ContentStats;
  createdAt: string;
}

interface PortfolioMetadata {
  software: string[];
  category: string;
  tags: string[];
  projectDate?: string;
}
```

---

## Business Logic

### Status String Generation

```typescript
function generateStatusString(user: User): string {
  const parts: string[] = [];
  
  if (user.isCreatorCoinHolder) {
    parts.push('CreatorCoin Holder');
  }
  
  if (user.availableForCollabs) {
    parts.push('Available for Collabs');
  } else {
    parts.push('Not Available');
  }
  
  return parts.join(' • ');
}
```

### Skill Verification

```typescript
async function verifySkill(
  userId: string,
  skill: string
): Promise<boolean> {
  // Check if user has completed gigs in this category
  const gigs = await prisma.match.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: 'finalized',
      intent: {
        metadata: {
          path: ['tags'],
          array_contains: skill.toLowerCase()
        }
      }
    }
  });
  
  // Verified if 5+ completed gigs with this skill
  return gigs.length >= 5;
}
```

### Stats Calculation

```typescript
async function calculateProfileStats(
  userId: string,
  period: string
): Promise<ProfileStats> {
  const startDate = getPeriodStartDate(period);
  
  // Content stats
  const contentStats = await prisma.portfolioItem.aggregate({
    where: {
      userId,
      createdAt: { gte: startDate }
    },
    _count: true,
    _sum: {
      views: true,
      likes: true
    }
  });
  
  // Gig stats
  const gigStats = await prisma.match.aggregate({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: 'finalized',
      finalizedAt: { gte: startDate }
    },
    _count: true
  });
  
  // CreatorCoin stats
  const coinStats = await getCreatorCoinStats(userId);
  
  return {
    content: {
      total: contentStats._count,
      views: contentStats._sum.views,
      likes: contentStats._sum.likes
    },
    gigs: {
      total: gigStats._count,
      completed: gigStats._count
    },
    creatorCoin: coinStats
  };
}
```

---

## UI Integration

### Profile Page Component

```typescript
const ProfilePage: React.FC = () => {
  const { walletAddress } = useParams();
  const { data, loading } = useProfile(walletAddress);
  const [activeTab, setActiveTab] = useState<'content' | 'pro'>('content');

  if (loading) return <Loader />;

  return (
    <div className="profile-page">
      {/* Header */}
      <header>
        <h1>Profile</h1>
        <button className="settings-btn">
          <SettingsIcon />
        </button>
      </header>

      {/* User Info */}
      <div className="user-info">
        <div className="avatar-container">
          <img src={data.user.zoraAvatar} className="avatar" />
          {data.user.verified && (
            <div className="verified-badge">✓</div>
          )}
        </div>

        <h2>{data.user.zoraUsername}</h2>
        <p className="status">{data.user.status}</p>

        {/* Skills */}
        <div className="skills">
          {data.skills.map(skill => (
            <span 
              key={skill.name}
              className={`skill-tag ${skill.verified ? 'verified' : ''}`}
            >
              {skill.name}
            </span>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          title="CC Market Cap"
          value={`${data.stats.creatorCoin.marketCap} ETH`}
          change={data.stats.creatorCoin.change24h}
        />
        <StatCard
          title="Content"
          value={data.stats.content.total}
          badge={`+${data.stats.content.recent}`}
        />
        <StatCard
          title="Gigs"
          value={data.stats.gigs.total}
          badge={`+${data.stats.gigs.recent}`}
        />
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === 'content' ? 'active' : ''}
          onClick={() => setActiveTab('content')}
        >
          Content
        </button>
        <button
          className={activeTab === 'pro' ? 'active' : ''}
          onClick={() => setActiveTab('pro')}
        >
          Pro
        </button>
      </div>

      {/* Content Grid */}
      <ContentGrid tab={activeTab} userId={walletAddress} />
    </div>
  );
};
```

### Stat Card Component

```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  badge?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  badge 
}) => {
  return (
    <div className="stat-card">
      <div className="stat-header">{title}</div>
      <div className="stat-value">{value}</div>
      {change !== undefined && (
        <div className={`stat-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </div>
      )}
      {badge && (
        <div className="stat-badge">{badge}</div>
      )}
    </div>
  );
};
```

---

## Performance Optimization

### Caching Strategy

```typescript
// Cache profile data for 5 minutes
const PROFILE_CACHE_TTL = 300;

async function getCachedProfile(walletAddress: string) {
  const cacheKey = `profile:${walletAddress}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const profile = await fetchProfile(walletAddress);
  await redis.setex(cacheKey, PROFILE_CACHE_TTL, JSON.stringify(profile));
  
  return profile;
}

// Invalidate cache on profile update
async function invalidateProfileCache(walletAddress: string) {
  await redis.del(`profile:${walletAddress}`);
  await redis.del(`profile:${walletAddress}:stats`);
  await redis.del(`profile:${walletAddress}:content`);
}
```

---

## Testing

```typescript
describe('GET /api/profile/:walletAddress', () => {
  it('should return user profile', async () => {
    const response = await request(app)
      .get('/api/profile/0x742d35...')
      .expect(200);

    expect(response.body.data.user.zoraUsername).toBe('Dharma');
    expect(response.body.data.skills).toHaveLength(4);
  });

  it('should return 404 for non-existent user', async () => {
    const response = await request(app)
      .get('/api/profile/0xinvalid...')
      .expect(404);

    expect(response.body.error.code).toBe('USER_NOT_FOUND');
  });
});

describe('PATCH /api/profile', () => {
  it('should update profile successfully', async () => {
    const response = await request(app)
      .patch('/api/profile')
      .set('Authorization', userToken)
      .send({
        zoraBio: 'Updated bio',
        availableForCollabs: false
      })
      .expect(200);

    expect(response.body.data.user.zoraBio).toBe('Updated bio');
  });
});
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `USER_NOT_FOUND` | 404 | User doesn't exist |
| `UNAUTHORIZED` | 401 | Not authorized |
| `INVALID_BIO_LENGTH` | 400 | Bio exceeds 280 chars |
| `TOO_MANY_SKILLS` | 400 | Max 10 skills allowed |
| `INVALID_SOCIAL_URL` | 400 | Invalid social link |
| `UPLOAD_FAILED` | 500 | Content upload failed |

---

**End of Documentation**
