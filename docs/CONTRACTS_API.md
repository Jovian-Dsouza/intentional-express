# Contracts (Collaboration Matches) API

**Version**: 1.0  
**Last Updated**: October 2025

---

## Overview

The Contracts API manages collaboration matches, allowing users to view, accept, decline match requests, and access chat sessions.

---

## Endpoints

### 1. Get All Contracts

Retrieves user's match requests and established collaborations.

**Endpoint**: `GET /api/contracts`

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tab` | `string` | No | `pings` | `pings` (received) or `matched` |
| `status` | `string` | No | `all` | `pending`, `accepted`, `declined`, `all` |
| `limit` | `number` | No | `20` | Results per page |
| `cursor` | `string` | No | `null` | Pagination cursor |

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "contracts": [
      {
        "id": "clz1match...",
        "type": "ping_received",
        "status": "pending",
        "matchedAt": "2025-10-20T18:30:00Z",
        "otherUser": {
          "walletAddress": "0x742d35...",
          "zoraUsername": "Luna",
          "zoraAvatar": "https://...",
          "title": "3D Artist",
          "bio": "5 years of experience in music video VFX",
          "reputationScore": 82,
          "reputationTier": "established"
        },
        "intent": {
          "id": "cly8x9z...",
          "title": "Neon Dream VFX",
          "type": "collaboration",
          "description": "Looking for skilled 3D artist...",
          "paymentOptions": {
            "types": ["paid", "credits"],
            "details": {
              "paid": {
                "amount": "2000-3500",
                "currency": "USD"
              }
            }
          }
        },
        "chatSession": {
          "id": "clz1chat...",
          "active": true,
          "messagesExchanged": 0,
          "unreadCount": 0,
          "expiresAt": "2025-10-27T18:30:00Z"
        },
        "metadata": {
          "isSuperLike": false,
          "firstMessage": null
        },
        "timeAgo": "2h ago"
      },
      {
        "id": "clz1match002...",
        "type": "ping_received",
        "status": "pending",
        "matchedAt": "2025-10-20T13:30:00Z",
        "otherUser": {
          "walletAddress": "0x8529ab...",
          "zoraUsername": "Koda",
          "zoraAvatar": "https://...",
          "title": "Sound Designer",
          "bio": "Award-winning sound designer for films",
          "reputationScore": 91,
          "reputationTier": "elite"
        },
        "intent": {
          "id": "cly8x9z002...",
          "title": "Cyber Beats Mix",
          "type": "collaboration"
        },
        "chatSession": {
          "id": "clz1chat002...",
          "active": true,
          "messagesExchanged": 0,
          "unreadCount": 0,
          "expiresAt": "2025-10-27T13:30:00Z"
        },
        "timeAgo": "5h ago"
      },
      {
        "id": "clz1match003...",
        "type": "ping_received",
        "status": "pending",
        "matchedAt": "2025-10-19T18:30:00Z",
        "otherUser": {
          "walletAddress": "0x9635cd...",
          "zoraUsername": "Alex",
          "zoraAvatar": "https://...",
          "title": "Animator",
          "bio": "Freelance animator with Netflix credits",
          "reputationScore": 75,
          "reputationTier": "established"
        },
        "intent": {
          "id": "cly8x9z003...",
          "title": "Abstract Motion",
          "type": "collaboration"
        },
        "chatSession": {
          "id": "clz1chat003...",
          "active": true,
          "messagesExchanged": 0,
          "unreadCount": 0,
          "expiresAt": "2025-10-26T18:30:00Z"
        },
        "timeAgo": "1d ago"
      }
    ],
    "pagination": {
      "nextCursor": null,
      "hasMore": false
    },
    "stats": {
      "totalPingsReceived": 3,
      "totalMatchedCollabs": 5,
      "pendingActions": 3
    }
  }
}
```

---

### 2. Get Contract Details

**Endpoint**: `GET /api/contracts/:matchId`

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "clz1match...",
    "status": "pending",
    "matchedAt": "2025-10-20T18:30:00Z",
    "otherUser": {
      "walletAddress": "0x742d35...",
      "zoraUsername": "Luna",
      "zoraAvatar": "https://...",
      "zoraBio": "VFX artist specializing in neon aesthetics",
      "title": "3D Artist",
      "reputationScore": 82,
      "totalMatches": 15,
      "successRate": 0.87,
      "portfolio": [
        {
          "title": "Cyberpunk City",
          "url": "https://...",
          "thumbnail": "https://..."
        }
      ]
    },
    "theirIntent": {
      "id": "cly8x9z...",
      "title": "Neon Dream VFX",
      "type": "collaboration",
      "description": "Looking for skilled 3D artist for cyberpunk project...",
      "media": {
        "images": [...]
      },
      "paymentOptions": {...},
      "requirements": {
        "skills": ["Blender", "After Effects"],
        "experience": "3+ years"
      }
    },
    "yourIntent": {
      "id": "cly8x9z001...",
      "title": "Music Video Collaborations",
      "type": "collaboration"
    },
    "chatSession": {
      "id": "clz1chat...",
      "active": true,
      "encryptionEnabled": true,
      "messagesExchanged": 0,
      "expiresAt": "2025-10-27T18:30:00Z"
    }
  }
}
```

---

### 3. Accept Match

Accept a collaboration match and activate chat.

**Endpoint**: `POST /api/contracts/:matchId/accept`

**Request Body**:
```json
{
  "message": "Hey Luna! Excited to work on Neon Dream together!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "matchId": "clz1match...",
    "status": "accepted",
    "chatSession": {
      "id": "clz1chat...",
      "active": true,
      "url": "/chat/clz1chat..."
    },
    "message": "Match accepted! Chat is now active."
  }
}
```

---

### 4. Decline Match

Decline a collaboration match.

**Endpoint**: `POST /api/contracts/:matchId/decline`

**Request Body**:
```json
{
  "reason": "not_interested"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "matchId": "clz1match...",
    "status": "declined",
    "message": "Match declined"
  }
}
```

---

### 5. Open Chat for Match

Get chat session details to open chat interface.

**Endpoint**: `GET /api/contracts/:matchId/chat`

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "chatSession": {
      "id": "clz1chat...",
      "matchId": "clz1match...",
      "active": true,
      "encryptionEnabled": true,
      "participants": [
        {
          "walletAddress": "0x742d35...",
          "zoraUsername": "Luna",
          "zoraAvatar": "https://..."
        },
        {
          "walletAddress": "0x123abc...",
          "zoraUsername": "CurrentUser",
          "zoraAvatar": "https://..."
        }
      ],
      "messagesExchanged": 5,
      "unreadCount": 2,
      "lastMessageAt": "2025-10-20T19:45:00Z",
      "expiresAt": "2025-10-27T18:30:00Z",
      "websocketUrl": "wss://api.originals.app/chat/clz1chat..."
    }
  }
}
```

**Error (404)**:
```json
{
  "success": false,
  "error": {
    "code": "CHAT_NOT_ACTIVE",
    "message": "Accept the match first to activate chat"
  }
}
```

---

## Data Models

### Contract

```typescript
interface Contract {
  id: string;
  type: 'ping_received' | 'matched_collab';
  status: ContractStatus;
  matchedAt: string;
  otherUser: UserProfile;
  intent: IntentSummary;
  chatSession: ChatSessionSummary;
  metadata: ContractMetadata;
  timeAgo: string;
}

type ContractStatus = 'pending' | 'accepted' | 'declined' | 'expired';
```

### UserProfile

```typescript
interface UserProfile {
  walletAddress: string;
  zoraUsername: string;
  zoraAvatar: string;
  title: string;
  bio: string;
  reputationScore: number;
  reputationTier: ReputationTier;
  totalMatches?: number;
  successRate?: number;
  portfolio?: PortfolioItem[];
}
```

### ChatSessionSummary

```typescript
interface ChatSessionSummary {
  id: string;
  active: boolean;
  messagesExchanged: number;
  unreadCount: number;
  expiresAt: string;
  lastMessageAt?: string;
}
```

---

## Business Logic

### Match Type Classification

```typescript
function classifyMatch(match: Match, userId: string): 'ping_received' | 'matched_collab' {
  // Ping received: Other user swiped right first, awaiting your action
  // Matched collab: Both users swiped right (mutual match)
  
  const userSwipe = match.swipes.find(s => s.userId === userId);
  const otherSwipe = match.swipes.find(s => s.userId !== userId);
  
  if (!userSwipe && otherSwipe.action === 'right') {
    return 'ping_received';
  }
  
  if (userSwipe?.action === 'right' && otherSwipe?.action === 'right') {
    return 'matched_collab';
  }
}
```

### Time Ago Formatting

```typescript
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}
```

---

## UI Integration

### Contracts List Component

```typescript
const ContractsList: React.FC = () => {
  const [tab, setTab] = useState<'pings' | 'matched'>('pings');
  const { data, loading } = useContracts({ tab });

  return (
    <div className="contracts-page">
      <header>
        <h1>Contracts</h1>
        <p>Manage your collaboration matches</p>
      </header>

      <div className="tabs">
        <button 
          className={tab === 'pings' ? 'active' : ''}
          onClick={() => setTab('pings')}
        >
          Pings Received
        </button>
        <button 
          className={tab === 'matched' ? 'active' : ''}
          onClick={() => setTab('matched')}
        >
          Matched Collabs
        </button>
      </div>

      <div className="contracts-list">
        {data?.contracts.map(contract => (
          <ContractCard
            key={contract.id}
            contract={contract}
            onAccept={() => handleAccept(contract.id)}
            onDecline={() => handleDecline(contract.id)}
            onOpenChat={() => handleOpenChat(contract.id)}
            onViewProfile={() => handleViewProfile(contract.otherUser)}
          />
        ))}
      </div>
    </div>
  );
};
```

### Contract Card Component

```typescript
interface ContractCardProps {
  contract: Contract;
  onAccept: () => void;
  onDecline: () => void;
  onOpenChat: () => void;
  onViewProfile: () => void;
}

const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  onAccept,
  onDecline,
  onOpenChat,
  onViewProfile
}) => {
  return (
    <div 
      className="contract-card"
      onClick={onOpenChat}
    >
      <img 
        src={contract.otherUser.zoraAvatar} 
        className="avatar"
      />
      
      <div className="content">
        <div className="header">
          <h3>{contract.otherUser.zoraUsername}</h3>
          <span className="time">{contract.timeAgo}</span>
        </div>
        
        <p className="title">
          {contract.otherUser.title} • {contract.intent.title}
        </p>
        
        <p className="bio">{contract.otherUser.bio}</p>
        
        <div className="actions" onClick={(e) => e.stopPropagation()}>
          <button onClick={onAccept}>Accept</button>
          <button onClick={onViewProfile}>Profile</button>
          <button onClick={onDecline}>Decline</button>
        </div>
      </div>
    </div>
  );
};
```

### Opening Chat

```typescript
async function handleOpenChat(matchId: string) {
  try {
    const response = await fetch(`/api/contracts/${matchId}/chat`);
    const { data } = await response.json();
    
    if (data.chatSession.active) {
      // Navigate to chat
      router.push(`/chat/${data.chatSession.id}`);
    } else {
      // Show accept prompt
      showAlert('Accept this match to start chatting');
    }
  } catch (error) {
    if (error.code === 'CHAT_NOT_ACTIVE') {
      showAlert('Accept the match first to activate chat');
    }
  }
}
```

---

## Error Handling

| Code | HTTP | Description |
|------|------|-------------|
| `MATCH_NOT_FOUND` | 404 | Match doesn't exist |
| `CHAT_NOT_ACTIVE` | 404 | Chat not activated yet |
| `ALREADY_RESPONDED` | 400 | Already accepted/declined |
| `MATCH_EXPIRED` | 410 | Match has expired |
| `UNAUTHORIZED` | 401 | Not authorized |

---

## Testing

```typescript
describe('GET /api/contracts', () => {
  it('should return pings received', async () => {
    const response = await request(app)
      .get('/api/contracts?tab=pings')
      .set('Authorization', userToken)
      .expect(200);

    expect(response.body.data.contracts).toHaveLength(3);
    expect(response.body.data.contracts[0].type).toBe('ping_received');
  });
});

describe('POST /api/contracts/:matchId/accept', () => {
  it('should activate chat session', async () => {
    const response = await request(app)
      .post(`/api/contracts/${matchId}/accept`)
      .send({ message: 'Hello!' })
      .expect(200);

    expect(response.body.data.status).toBe('accepted');
    expect(response.body.data.chatSession.active).toBe(true);
  });
});
```

---

**End of Documentation**
