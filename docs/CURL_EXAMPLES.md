# CollabFeed API - cURL Examples

This file contains working cURL commands for testing all CollabFeed API endpoints.

## Setup

Set your base URL and wallet addresses:

```bash
export BASE_URL="http://localhost:3000/api"
export CREATOR_WALLET="0x1111111111111111111111111111111111111111"
export COLLABORATOR_WALLET="0x2222222222222222222222222222222222222222"
```

## 1. Health Check

```bash
curl -X GET "http://localhost:3000/health"
```

## 2. Get Collaboration Feed

```bash
# Basic feed
curl -X GET "$BASE_URL/collabs/feed" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json"

# Filtered feed
curl -X GET "$BASE_URL/collabs/feed?filter=paid&location=LA&page=1&limit=10" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json"
```

## 3. Create Collaboration Post

```bash
curl -X POST "$BASE_URL/collabs" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
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

## 4. Update Collaboration Status

```bash
# Replace COLLAB_ID with actual ID from create response
curl -X PATCH "$BASE_URL/collabs/COLLAB_ID" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "closed"
  }'
```

## 5. Ping Collaboration Post

```bash
# Replace COLLAB_ID with actual ID
curl -X POST "$BASE_URL/collabs/COLLAB_ID/ping" \
  -H "X-Zora-Wallet: $COLLABORATOR_WALLET" \
  -H "Content-Type: application/json" \
  -d '{
    "interestedRole": "3D Artist",
    "bio": "5 years of experience in music video VFX"
  }'
```

## 6. Get Received Pings

```bash
# All pings
curl -X GET "$BASE_URL/wallets/$CREATOR_WALLET/pings/received" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json"

# Only pending pings
curl -X GET "$BASE_URL/wallets/$CREATOR_WALLET/pings/received?status=pending&page=1&limit=20" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json"
```

## 7. Respond to Ping

```bash
# Accept ping (replace PING_ID with actual ID)
curl -X POST "$BASE_URL/pings/PING_ID/respond" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "accept"
  }'

# Decline ping
curl -X POST "$BASE_URL/pings/PING_ID/respond" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "decline"
  }'
```

## 8. Get Matches

```bash
# All matches
curl -X GET "$BASE_URL/wallets/$CREATOR_WALLET/matches" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json"

# Only active matches
curl -X GET "$BASE_URL/wallets/$CREATOR_WALLET/matches?status=active&page=1&limit=20" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json"
```

## 9. Get Messages

```bash
# Replace MATCH_ID with actual ID
curl -X GET "$BASE_URL/matches/MATCH_ID/messages?page=1&limit=50" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json"
```

## 10. Send Message

```bash
# Text message
curl -X POST "$BASE_URL/matches/MATCH_ID/messages" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Looking forward to working together!",
    "messageType": "text"
  }'

# Message with attachment
curl -X POST "$BASE_URL/matches/MATCH_ID/messages" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Here are the project files",
    "messageType": "file",
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

## 11. Mark Messages as Read

```bash
curl -X POST "$BASE_URL/matches/MATCH_ID/messages/read" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json"
```

## Complete Workflow Example

Here's a complete workflow from creating a collaboration to sending messages:

```bash
#!/bin/bash

# Set variables
export BASE_URL="http://localhost:3000/api"
export CREATOR_WALLET="0x1111111111111111111111111111111111111111"
export COLLABORATOR_WALLET="0x2222222222222222222222222222222222222222"

echo "=== 1. Create Collaboration Post ==="
COLLAB_RESPONSE=$(curl -s -X POST "$BASE_URL/collabs" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
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
    ]
  }')

echo $COLLAB_RESPONSE
COLLAB_ID=$(echo $COLLAB_RESPONSE | jq -r '.data.id')
echo "Created collaboration with ID: $COLLAB_ID"

echo -e "\n=== 2. Ping Collaboration Post ==="
PING_RESPONSE=$(curl -s -X POST "$BASE_URL/collabs/$COLLAB_ID/ping" \
  -H "X-Zora-Wallet: $COLLABORATOR_WALLET" \
  -H "Content-Type: application/json" \
  -d '{
    "interestedRole": "3D Artist",
    "bio": "5 years of experience in music video VFX"
  }')

echo $PING_RESPONSE
PING_ID=$(echo $PING_RESPONSE | jq -r '.data.pingId')
echo "Created ping with ID: $PING_ID"

echo -e "\n=== 3. Accept Ping ==="
MATCH_RESPONSE=$(curl -s -X POST "$BASE_URL/pings/$PING_ID/respond" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "accept"
  }')

echo $MATCH_RESPONSE

echo -e "\n=== 4. Get Matches ==="
curl -s -X GET "$BASE_URL/wallets/$CREATOR_WALLET/matches" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json" | jq

echo -e "\n=== 5. Send Message ==="
MATCH_ID="match_001"  # Replace with actual match ID from step 4
curl -s -X POST "$BASE_URL/matches/$MATCH_ID/messages" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Looking forward to working together!",
    "messageType": "text"
  }' | jq

echo -e "\n=== 6. Get Messages ==="
curl -s -X GET "$BASE_URL/matches/$MATCH_ID/messages" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json" | jq
```

## Error Testing

Test error scenarios:

```bash
# Missing wallet header
curl -X GET "$BASE_URL/collabs/feed"

# Invalid wallet format
curl -X GET "$BASE_URL/collabs/feed" \
  -H "X-Zora-Wallet: invalid-wallet"

# Invalid request data
curl -X POST "$BASE_URL/collabs" \
  -H "X-Zora-Wallet: $CREATOR_WALLET" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "",
    "paymentType": "invalid"
  }'

# Non-existent resource
curl -X GET "$BASE_URL/collabs/nonexistent" \
  -H "X-Zora-Wallet: $CREATOR_WALLET"
```

## Performance Testing

Test with different pagination parameters:

```bash
# Large page size
curl -X GET "$BASE_URL/collabs/feed?page=1&limit=50" \
  -H "X-Zora-Wallet: $CREATOR_WALLET"

# High page number
curl -X GET "$BASE_URL/collabs/feed?page=100&limit=20" \
  -H "X-Zora-Wallet: $CREATOR_WALLET"
```

## Notes

- Replace placeholder IDs (COLLAB_ID, PING_ID, MATCH_ID) with actual IDs from API responses
- All wallet addresses must be valid Ethereum addresses (42 characters starting with 0x)
- The server must be running on localhost:3000 for these examples to work
- Use `jq` for pretty-printing JSON responses: `curl ... | jq`
- Add `-v` flag to curl for verbose output to see request/response headers
