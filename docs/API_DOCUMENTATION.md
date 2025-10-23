# CollabFeed API Documentation

This document provides comprehensive documentation for the CollabFeed API endpoints, including request/response schemas and curl examples.

## Authentication

All API endpoints require wallet authentication via the `X-Zora-Wallet` header:

```bash
X-Zora-Wallet: 0x1234567890123456789012345678901234567890
```

## Base URL

```
http://localhost:3000/api
```

## Error Response Format

All error responses follow this standardized format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": [
      {
        "field": "fieldName",
        "message": "Field-specific error message"
      }
    ]
  }
}
```

## API Endpoints

### 1. Collaboration Feed

#### GET /api/collabs/feed

Get paginated collaboration posts with filtering options.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 50) - Items per page
- `filter` (string, optional) - Filter by: `paid`, `barter`, `credits`, `contract`, `freestyle`, `remote`
- `location` (string, optional) - Filter by location

**Response:**
```json
{
  "success": true,
  "data": {
    "collabs": [
      {
        "id": "collab_001",
        "coinAddress": "0x1234567890123456789012345678901234567890",
        "creatorWallet": "0x1111111111111111111111111111111111111111",
        "role": "Mix Engineer",
        "paymentType": "paid",
        "credits": false,
        "workStyle": "freestyle",
        "location": "LA",
        "status": "open",
        "collaborators": [
          {
            "role": "Mix Engineer",
            "creatorType": "indie",
            "credits": 25,
            "compensationType": "paid",
            "timeCommitment": "one_time",
            "jobDescription": "Must have experience with electronic music"
          }
        ],
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "expiresAt": "2024-03-15T23:59:59Z",
        "coinData": {
          "name": "Mix Engineer Coin",
          "symbol": "MIXEN",
          "description": "Collaboration opportunity: Mix Engineer",
          "totalSupply": "1000000",
          "marketCap": "5000",
          "volume24h": "250",
          "creatorAddress": "0x1111111111111111111111111111111111111111",
          "createdAt": "2024-01-01T00:00:00Z",
          "uniqueHolders": 15,
          "mediaContent": {
            "previewImage": "https://example.com/image.jpg"
          }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

**Curl Example:**
```bash
curl -X GET "http://localhost:3000/api/collabs/feed?page=1&limit=20&filter=paid&location=LA" \
  -H "X-Zora-Wallet: 0x1111111111111111111111111111111111111111" \
  -H "Content-Type: application/json"
```

### 2. Create Collaboration Post

#### POST /api/collabs

Create a new collaboration post and mint a Zora coin.

**Request Body:**
```json
{
  "role": "Mix Engineer",
  "paymentType": "paid",
  "credits": false,
  "workStyle": "freestyle",
  "location": "LA",
  "collaborators": [
    {
      "role": "Mix Engineer",
      "creatorType": "indie",
      "credits": 25,
      "compensationType": "paid",
      "timeCommitment": "one_time",
      "jobDescription": "Must have experience with electronic music"
    }
  ],
  "expiresAt": "2024-03-15T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "collab_001",
    "coinAddress": "0x1234567890123456789012345678901234567890",
    "coinMinted": true,
    "message": "Collaboration post created and Zora coin minted successfully"
  }
}
```

**Curl Example:**
```bash
curl -X POST "http://localhost:3000/api/collabs" \
  -H "X-Zora-Wallet: 0x1111111111111111111111111111111111111111" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Mix Engineer",
    "paymentType": "paid",
    "credits": false,
    "workStyle": "freestyle",
    "location": "LA",
    "collaborators": [
      {
        "role": "Mix Engineer",
        "creatorType": "indie",
        "credits": 25,
        "compensationType": "paid",
        "timeCommitment": "one_time",
        "jobDescription": "Must have experience with electronic music"
      }
    ],
    "expiresAt": "2024-03-15T23:59:59Z"
  }'
```

### 3. Update Collaboration Status

#### PATCH /api/collabs/:collabId

Update the status of a collaboration post.

**Request Body:**
```json
{
  "status": "closed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Collaboration post status updated"
  }
}
```

**Curl Example:**
```bash
curl -X PATCH "http://localhost:3000/api/collabs/collab_001" \
  -H "X-Zora-Wallet: 0x1111111111111111111111111111111111111111" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "closed"
  }'
```

### 4. Ping Collaboration Post

#### POST /api/collabs/:collabId/ping

Send a ping/like to a collaboration post.

**Request Body:**
```json
{
  "interestedRole": "3D Artist",
  "bio": "5 years of experience in music video VFX"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pingId": "ping_001",
    "message": "Ping sent successfully"
  }
}
```

**Curl Example:**
```bash
curl -X POST "http://localhost:3000/api/collabs/collab_001/ping" \
  -H "X-Zora-Wallet: 0x2222222222222222222222222222222222222222" \
  -H "Content-Type: application/json" \
  -d '{
    "interestedRole": "3D Artist",
    "bio": "5 years of experience in music video VFX"
  }'
```

### 5. Get Received Pings

#### GET /api/wallets/:walletAddress/pings/received

Get pings received on user's collaboration posts.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 50) - Items per page
- `status` (string, optional) - Filter by status: `pending`, `accepted`, `declined`

**Response:**
```json
{
  "success": true,
  "data": {
    "pings": [
      {
        "id": "ping_001",
        "collabPostId": "collab_001",
        "pingedWallet": "0x2222222222222222222222222222222222222222",
        "interestedRole": "3D Artist",
        "bio": "5 years of experience in music video VFX",
        "status": "pending",
        "createdAt": "2024-01-15T11:00:00Z",
        "respondedAt": null,
        "collabPost": {
          "id": "collab_001",
          "role": "Mix Engineer",
          "coinAddress": "0x1234567890123456789012345678901234567890"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

**Curl Example:**
```bash
curl -X GET "http://localhost:3000/api/wallets/0x1111111111111111111111111111111111111111/pings/received?page=1&limit=20&status=pending" \
  -H "X-Zora-Wallet: 0x1111111111111111111111111111111111111111" \
  -H "Content-Type: application/json"
```

### 6. Respond to Ping

#### POST /api/pings/:pingId/respond

Accept or decline a ping.

**Request Body:**
```json
{
  "action": "accept"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Ping accept successfully",
    "matchCreated": true
  }
}
```

**Curl Example:**
```bash
curl -X POST "http://localhost:3000/api/pings/ping_001/respond" \
  -H "X-Zora-Wallet: 0x1111111111111111111111111111111111111111" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "accept"
  }'
```

### 7. Get Matches

#### GET /api/wallets/:walletAddress/matches

Get active matched collaborations.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 50) - Items per page
- `status` (string, optional) - Filter by status: `active`, `completed`, `cancelled`

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "match_001",
        "collabPostId": "collab_001",
        "creatorWallet": "0x1111111111111111111111111111111111111111",
        "collaboratorWallet": "0x2222222222222222222222222222222222222222",
        "projectName": "Mix Engineer",
        "role": "3D Artist",
        "status": "active",
        "createdAt": "2024-01-15T12:00:00Z",
        "lastMessageAt": "2024-01-15T12:00:00Z",
        "unreadCount": 0
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

**Curl Example:**
```bash
curl -X GET "http://localhost:3000/api/wallets/0x1111111111111111111111111111111111111111/matches?page=1&limit=20&status=active" \
  -H "X-Zora-Wallet: 0x1111111111111111111111111111111111111111" \
  -H "Content-Type: application/json"
```

### 8. Get Messages

#### GET /api/matches/:matchId/messages

Get messages for a match.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50, max: 50) - Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_001",
        "matchId": "match_001",
        "senderWallet": "0x1111111111111111111111111111111111111111",
        "content": "Looking forward to working together!",
        "messageType": "text",
        "attachments": [],
        "createdAt": "2024-01-15T12:30:00Z",
        "readAt": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

**Curl Example:**
```bash
curl -X GET "http://localhost:3000/api/matches/match_001/messages?page=1&limit=50" \
  -H "X-Zora-Wallet: 0x1111111111111111111111111111111111111111" \
  -H "Content-Type: application/json"
```

### 9. Send Message

#### POST /api/matches/:matchId/messages

Send a message in a match.

**Request Body:**
```json
{
  "content": "Looking forward to working together!",
  "messageType": "text",
  "attachments": [
    {
      "fileName": "project.zip",
      "fileUrl": "https://example.com/file.zip",
      "fileType": "application/zip",
      "fileSize": 1024000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_001",
    "message": "Message sent successfully"
  }
}
```

**Curl Example:**
```bash
curl -X POST "http://localhost:3000/api/matches/match_001/messages" \
  -H "X-Zora-Wallet: 0x1111111111111111111111111111111111111111" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Looking forward to working together!",
    "messageType": "text",
    "attachments": [
      {
        "fileName": "project.zip",
        "fileUrl": "https://example.com/file.zip",
        "fileType": "application/zip",
        "fileSize": 1024000
      }
    ]
  }'
```

### 10. Mark Messages as Read

#### POST /api/matches/:matchId/messages/read

Mark messages as read for a match.

**Response:**
```json
{
  "success": true,
  "data": {
    "markedCount": 3,
    "message": "Messages marked as read"
  }
}
```

**Curl Example:**
```bash
curl -X POST "http://localhost:3000/api/matches/match_001/messages/read" \
  -H "X-Zora-Wallet: 0x1111111111111111111111111111111111111111" \
  -H "Content-Type: application/json"
```

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid wallet address |
| `VALIDATION_ERROR` | Invalid request data format |
| `NOT_FOUND` | Resource not found |
| `FORBIDDEN` | Insufficient permissions |
| `CONFLICT` | Duplicate resource or conflict |
| `BAD_REQUEST` | Invalid request parameters |
| `INTERNAL_ERROR` | Server error |

## Data Models

### CollaboratorRole
```typescript
{
  role: string;                    // Role name (max 100 chars)
  creatorType: 'indie' | 'org' | 'brand';
  credits: number;                 // 0-100
  compensationType: 'paid' | 'barter' | 'both';
  timeCommitment: 'ongoing' | 'one_time';
  jobDescription?: string;         // Optional (max 500 chars)
}
```

### MessageAttachment
```typescript
{
  fileName: string;
  fileUrl: string;                // Valid URL
  fileType: string;
  fileSize: number;                // Positive number
}
```

## Status Values

### CollabStatus
- `open` - Posting is open for applications
- `shortlisted` - Applications are being reviewed
- `signed` - Collaboration agreement signed
- `closed` - Posting is closed

### PingStatus
- `pending` - Awaiting response
- `accepted` - Ping accepted, match created
- `declined` - Ping declined

### MatchStatus
- `active` - Collaboration is ongoing
- `completed` - Collaboration finished
- `cancelled` - Collaboration cancelled

### MessageType
- `text` - Text message
- `image` - Image attachment
- `file` - File attachment
- `milestone` - Project milestone update

## Rate Limiting

API endpoints are rate-limited to prevent abuse. Current limits:
- 100 requests per minute per wallet address
- 10 collaboration posts per hour per wallet address
- 50 pings per hour per wallet address

## WebSocket Events (Future Enhancement)

Real-time events will be available via WebSocket:
- `ping:received` - New ping received
- `match:created` - New match created
- `message:received` - New message received
- `collab:status_changed` - Collaboration status updated
