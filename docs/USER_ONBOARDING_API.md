# User Onboarding API - cURL Examples

This file contains working cURL commands for testing the User Onboarding API endpoints.

## Setup

Set your base URL and wallet addresses:

```bash
export BASE_URL="http://localhost:3000/api"
export ZORA_WALLET="0x1111111111111111111111111111111111111111"
export REGULAR_WALLET="0x2222222222222222222222222222222222222222"
```

## 1. Check User Onboarding Status

### GET /api/users/:zoraWalletAddress/onboarding-status

Check if a user is onboarded and get their profile data.

```bash
# Check onboarding status for a user
curl -X GET "$BASE_URL/users/$ZORA_WALLET/onboarding-status" \
  -H "Content-Type: application/json"
```

**Response (User Onboarded):**
```json
{
  "success": true,
  "isOnboarded": true,
  "data": {
    "userId": "clx1234567890abcdef",
    "userType": "indie",
    "creativeDomains": ["film", "music"],
    "status": "available",
    "profileData": {
      "name": "John Doe",
      "tagline": "Creative filmmaker",
      "orgName": null,
      "orgType": null,
      "collabCount": 0,
      "deltaCollabs": 0,
      "skills": ["VFX", "3D Animation", "Motion Graphics", "Color Grading"]
    },
    "walletAddress": "0x2222222222222222222222222222222222222222",
    "zoraWalletAddress": "0x1111111111111111111111111111111111111111",
    "onboardedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response (User Not Onboarded):**
```json
{
  "success": true,
  "isOnboarded": false,
  "data": null
}
```

## 2. Complete User Onboarding

### POST /api/users/:zoraWalletAddress/onboard

Complete the user onboarding process with profile data.

```bash
# Complete onboarding for indie user
export ZORA_WALLET="0x5b93ff82faaf241c15997ea3975419dddd8362c5"
curl -X POST "$BASE_URL/users/$ZORA_WALLET/onboard" \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "indie",
    "creativeDomains": ["film", "music", "photography"],
    "status": "available",
    "profileData": {
      "name": "John Doe",
      "tagline": "Creative filmmaker and photographer",
      "orgName": "",
      "orgType": "",
      "skills": ["VFX", "3D Animation", "Motion Graphics", "Color Grading"]
    },
    "zoraWalletAddress": "0x5b93ff82faaf241c15997ea3975419dddd8362c5"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "clx1234567890abcdef",
    "isOnboarded": true,
    "message": "Onboarding completed successfully"
  }
}
```

### Complete onboarding for commercial user

```bash
# Complete onboarding for commercial user
curl -X POST "$BASE_URL/users/$ZORA_WALLET/onboard" \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "commercial",
    "creativeDomains": ["advertising", "branding"],
    "status": "gigs",
    "profileData": {
      "name": "Jane Smith",
      "tagline": "Creative Director at Tech Corp",
      "orgName": "Tech Corp",
      "orgType": "Agency",
      "skills": ["Brand Strategy", "Creative Direction", "Team Management"]
    },
    "walletAddress": "0x2222222222222222222222222222222222222222",
    "zoraWalletAddress": "0x1111111111111111111111111111111111111111"
  }'
```

## 3. Error Examples

### Invalid wallet address format

```bash
curl -X GET "$BASE_URL/users/invalid-wallet/onboarding-status" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid path parameters",
    "details": [
      {
        "field": "zoraWalletAddress",
        "message": "Invalid Zora wallet address format"
      }
    ]
  }
}
```

### Duplicate onboarding attempt

```bash
curl -X POST "$BASE_URL/users/$ZORA_WALLET/onboard" \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "indie",
    "creativeDomains": ["film"],
    "status": "available",
    "profileData": {
      "name": "John Doe",
      "tagline": "Creative filmmaker",
      "skills": ["VFX"]
    },
    "zoraWalletAddress": "0x1111111111111111111111111111111111111111"
  }'
```

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "User is already onboarded"
  }
}
```

### Validation errors

```bash
curl -X POST "$BASE_URL/users/$ZORA_WALLET/onboard" \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "invalid",
    "creativeDomains": [],
    "status": "available",
    "profileData": {
      "name": "",
      "tagline": "Creative filmmaker",
      "skills": []
    },
    "zoraWalletAddress": "0x1111111111111111111111111111111111111111"
  }'
```

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "userType",
        "message": "Invalid enum value. Expected 'indie' | 'commercial', received 'invalid'"
      },
      {
        "field": "creativeDomains",
        "message": "At least one creative domain is required"
      },
      {
        "field": "profileData.name",
        "message": "Name is required"
      },
      {
        "field": "profileData.skills",
        "message": "At least one skill is required"
      }
    ]
  }
}
```

## 4. Testing Workflow

### Complete onboarding workflow

```bash
# 1. Check if user is onboarded (should return false initially)
curl -X GET "$BASE_URL/users/$ZORA_WALLET/onboarding-status" \
  -H "Content-Type: application/json"

# 2. Complete onboarding
curl -X POST "$BASE_URL/users/$ZORA_WALLET/onboard" \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "indie",
    "creativeDomains": ["film", "music"],
    "status": "available",
    "profileData": {
      "name": "John Doe",
      "tagline": "Creative filmmaker",
      "skills": ["VFX", "3D Animation"]
    },
    "zoraWalletAddress": "0x1111111111111111111111111111111111111111"
  }'

# 3. Check onboarding status again (should return true with data)
curl -X GET "$BASE_URL/users/$ZORA_WALLET/onboarding-status" \
  -H "Content-Type: application/json"
```

## 5. Data Schema Reference

### OnboardingData Schema

```typescript
interface OnboardingData {
  userType: "indie" | "commercial";
  creativeDomains: string[];  // Array of domain IDs
  status: "available" | "gigs" | "collabs" | "exploring";
  profileData: {
    name: string;
    tagline: string;
    orgName?: string;  // For commercial users
    orgType?: string;  // For commercial users
    skills: string[];
  };
  walletAddress?: string | null;
  zoraWalletAddress: string;
}
```

### User Status Values

- `available` - User is available for collaborations
- `gigs` - User is looking for gigs
- `collabs` - User is looking for collaborations
- `exploring` - User is exploring opportunities

### User Type Values

- `indie` - Independent creator
- `commercial` - Commercial/business user

## 6. Common Error Codes

- `UNAUTHORIZED` - Missing or invalid authentication
- `NOT_FOUND` - User not found
- `FORBIDDEN` - User doesn't have permission to access this data
- `CONFLICT` - User is already onboarded
- `VALIDATION_ERROR` - Invalid request data
- `INTERNAL_ERROR` - Server error
