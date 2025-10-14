# Intent Creation & Matching API - Implementation Guide

## Deep Dive: Intent Creation & Matching Logic

---

## Table of Contents
1. [Intent Creation Flow](#intent-creation-flow)
2. [Intent Matching Algorithm](#intent-matching-algorithm)
3. [State Machine](#state-machine)
4. [Database Queries](#database-queries)
5. [Smart Contract Integration](#smart-contract-integration)
6. [Edge Cases & Error Handling](#edge-cases--error-handling)

---

## Intent Creation Flow

### Step-by-Step Implementation

#### 1. Pre-Creation Validation

```typescript
async function validateIntentCreation(userId: string): Promise<ValidationResult> {
  // Check for existing active intent
  const activeIntent = await prisma.intent.findFirst({
    where: {
      userId,
      status: { in: ['pending_payment', 'active'] },
      expiresAt: { gt: new Date() }
    }
  });

  if (activeIntent) {
    throw new AppError('User already has an active intent', 409);
  }

  return { valid: true };
}
```

#### 2. Media Upload to IPFS (from URLs)

```typescript
import axios from 'axios';

async function uploadMediaToIPFS(media: IntentMediaInput): Promise<MediaUploadResult> {
  const results: MediaUploadResult = { images: [], video: undefined };

  // Upload images in parallel (max 3, 5MB each)
  if (media.images) {
    const imageUploads = media.images.map(async (image, index) => {
      // Fetch image from URL
      const response = await axios.get(image.url, {
        responseType: 'arraybuffer',
        timeout: 10000, // 10s timeout
        maxContentLength: 5 * 1024 * 1024 // 5MB max
      });

      const buffer = Buffer.from(response.data);
      
      if (buffer.length > 5 * 1024 * 1024) {
        throw new AppError(`Image ${index + 1} exceeds 5MB limit`, 400);
      }

      // Verify content type
      const contentType = response.headers['content-type'];
      if (!contentType?.startsWith('image/')) {
        throw new AppError(`Invalid image content type: ${contentType}`, 400);
      }

      // Upload to IPFS
      const pinataResult = await pinata.pinFileToIPFS(buffer);
      const thumbnail = await generateThumbnail(buffer, { width: 300, height: 300 });
      const thumbnailResult = await pinata.pinFileToIPFS(thumbnail);

      return {
        ipfsHash: pinataResult.IpfsHash,
        url: `ipfs://${pinataResult.IpfsHash}`,
        thumbnail: `ipfs://${thumbnailResult.IpfsHash}`,
        originalUrl: image.url
      };
    });

    results.images = await Promise.all(imageUploads);
  }

  // Upload video if present (max 50MB)
  if (media.video) {
    // Fetch video from URL
    const response = await axios.get(media.video.url, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30s timeout for larger videos
      maxContentLength: 50 * 1024 * 1024 // 50MB max
    });

    const videoBuffer = Buffer.from(response.data);
    
    if (videoBuffer.length > 50 * 1024 * 1024) {
      throw new AppError('Video exceeds 50MB limit', 400);
    }

    // Verify content type
    const contentType = response.headers['content-type'];
    if (!contentType?.startsWith('video/')) {
      throw new AppError(`Invalid video content type: ${contentType}`, 400);
    }

    // Upload to IPFS
    const pinataResult = await pinata.pinFileToIPFS(videoBuffer);
    results.video = {
      ipfsHash: pinataResult.IpfsHash,
      url: `ipfs://${pinataResult.IpfsHash}`,
      originalUrl: media.video.url
    };
  }

  return results;
}
```

#### 3. Calculate Activation Fee

```typescript
async function calculateActivationFee(
  intentType: IntentType,
  reputationEnabled: boolean
): Promise<ActivationFee> {
  const exchangeRate = await getZoraUsdRate();
  const baseFeeUsd = 2.5;
  const reputationMultiplier = reputationEnabled ? 2 : 1;
  const totalFeeUsd = baseFeeUsd * reputationMultiplier;
  const feeInZora = totalFeeUsd / exchangeRate;

  return {
    amount: feeInZora.toFixed(6),
    usdEquivalent: totalFeeUsd.toFixed(2),
    paymentAddress: process.env.PAYMENT_CONTRACT_ADDRESS!,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000)
  };
}
```

#### 4. Payment Verification & On-Chain Publication

```typescript
async function confirmPaymentAndPublish(
  intentId: string,
  transactionHash: string
): Promise<Intent> {
  // Verify transaction on Zora L2
  const tx = await verifyZoraTransaction(transactionHash);
  if (!tx.success) throw new AppError('Payment not confirmed', 400);

  const intent = await prisma.intent.findUnique({ where: { id: intentId } });
  if (tx.value < intent.activationFee) {
    throw new AppError('Insufficient payment', 402);
  }

  // Publish to smart contract
  const publishTx = await publishIntentOnChain(intent);

  // Update status
  const updatedIntent = await prisma.intent.update({
    where: { id: intentId },
    data: {
      status: 'active',
      paymentTxHash: transactionHash,
      onChainTxHash: publishTx.hash,
      publishedAt: new Date()
    }
  });

  await addToFeedCache(updatedIntent);
  await unlockUserFeed(intent.userId);

  return updatedIntent;
}
```

---

## Intent Matching Algorithm

### 1. Swipe Action Processing

```typescript
async function processSwipe(
  userId: string,
  targetIntentId: string,
  action: 'right' | 'left'
): Promise<SwipeResult> {
  // Get user's active intent
  const userIntent = await prisma.intent.findFirst({
    where: { userId, status: 'active', expiresAt: { gt: new Date() } }
  });

  if (!userIntent) throw new AppError('No active intent', 400);

  // Record swipe
  const swipe = await prisma.swipe.create({
    data: { userId, intentId: userIntent.id, targetIntentId, action }
  });

  // Check for mutual match on right swipe
  if (action === 'right') {
    const mutualMatch = await checkMutualMatch(userIntent.id, targetIntentId);
    
    if (mutualMatch) {
      const match = await createMatch(userIntent, targetIntentId);
      return { swipeId: swipe.id, matchDetected: true, match };
    }
  }

  return { swipeId: swipe.id, matchDetected: false };
}
```

### 2. Mutual Match Detection

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

### 3. Match Creation & Finalization

```typescript
async function createMatch(userIntent: Intent, targetIntentId: string): Promise<Match> {
  const targetIntent = await prisma.intent.findUnique({ where: { id: targetIntentId } });

  const match = await prisma.match.create({
    data: {
      user1Id: userIntent.userId,
      user2Id: targetIntent.userId,
      intent1Id: userIntent.id,
      intent2Id: targetIntent.id,
      status: 'pending',
      matchedAt: new Date()
    }
  });

  // Provision encrypted chat
  const chatSession = await provisionChatSession(match.id, [
    match.user1Id,
    match.user2Id
  ]);

  await emitEvent('match.created', { matchId: match.id });

  return match;
}

async function finalizeMatch(matchId: string): Promise<Match> {
  const match = await prisma.match.findUnique({ where: { id: matchId } });

  // Execute on-chain intent burn
  const burnTx = await burnIntentsOnChain(match.intent1Id, match.intent2Id);

  // Update intents and match
  await prisma.$transaction([
    prisma.intent.update({
      where: { id: match.intent1Id },
      data: { status: 'matched', burnTxHash: burnTx.hash }
    }),
    prisma.intent.update({
      where: { id: match.intent2Id },
      data: { status: 'matched', burnTxHash: burnTx.hash }
    }),
    prisma.match.update({
      where: { id: matchId },
      data: { status: 'finalized', finalizeTxHash: burnTx.hash }
    })
  ]);

  await removeFromFeedCache(match.intent1Id);
  await removeFromFeedCache(match.intent2Id);

  return match;
}
```

---

## State Machine

### Intent States

```
PENDING_PAYMENT → ACTIVE → MATCHED
                    ↓
                  EXPIRED/BURNED
```

**Transitions:**
- `PENDING_PAYMENT → ACTIVE`: Payment confirmed
- `ACTIVE → MATCHED`: Mutual match detected, burned on-chain
- `ACTIVE → EXPIRED`: 24h timeout
- `ACTIVE → BURNED`: User cancels

### Match States

```
PENDING → FINALIZING → FINALIZED → [Chat Active]
```

---

## Database Queries

### Optimized Feed Query

```sql
SELECT i.*, u.zora_username, u.reputation_score
FROM intents i
INNER JOIN users u ON i.user_id = u.wallet_address
WHERE 
  i.type = $1                           -- Bucket filter
  AND i.status = 'active'
  AND i.expires_at > NOW()
  AND i.visibility = 'public'
  AND u.reputation_score >= $2           -- Reputation threshold
  AND i.user_id != $3                    -- Exclude self
  AND i.id NOT IN (                      -- Exclude swiped
    SELECT target_intent_id FROM swipes WHERE user_id = $3
  )
ORDER BY i.published_at DESC
LIMIT $4;
```

### Match Detection Query

```sql
SELECT s1.intent_id, s2.intent_id
FROM swipes s1
INNER JOIN swipes s2 ON 
  s1.target_intent_id = s2.intent_id AND
  s2.target_intent_id = s1.intent_id
WHERE s1.intent_id = $1 AND s2.intent_id = $2
  AND s1.action = 'right' AND s2.action = 'right';
```

---

## Smart Contract Integration

```typescript
import { createWalletClient, http } from 'viem';
import { zoraMainnet } from 'viem/chains';

async function publishIntentOnChain(intent: Intent) {
  const client = createWalletClient({
    chain: zoraMainnet,
    transport: http(process.env.ZORA_RPC_URL)
  });

  const metadata = {
    title: intent.title,
    images: intent.images.map(img => img.ipfsHash),
    expiresAt: intent.expiresAt.getTime()
  };

  const metadataHash = await uploadToIPFS(JSON.stringify(metadata));

  const tx = await client.writeContract({
    address: process.env.CONTRACT_ADDRESS as `0x${string}`,
    abi: intentMatchAbi,
    functionName: 'publishIntent',
    args: [intent.id, metadataHash, intent.type, BigInt(intent.expiresAt.getTime())]
  });

  return tx;
}

async function burnIntentsOnChain(intent1Id: string, intent2Id: string) {
  const client = createWalletClient({ /* config */ });

  const tx = await client.writeContract({
    address: process.env.CONTRACT_ADDRESS as `0x${string}`,
    abi: intentMatchAbi,
    functionName: 'finalizeMatch',
    args: [intent1Id, intent2Id]
  });

  return tx;
}
```

---

## Edge Cases & Error Handling

### 1. Simultaneous Match (Race Condition)

**Solution**: Use database transactions with serializable isolation

```typescript
await prisma.$transaction(async (tx) => {
  const [intent1, intent2] = await tx.intent.findMany({
    where: { id: { in: [intent1Id, intent2Id] }, status: 'active' }
  });
  
  if (!intent1 || !intent2) throw new AppError('Intent expired', 410);
  
  return tx.match.create({ data: { /* ... */ } });
}, { isolationLevel: 'Serializable' });
```

### 2. Payment Timeout Cleanup

```typescript
async function cleanupExpiredPayments() {
  const expired = await prisma.intent.findMany({
    where: {
      status: 'pending_payment',
      paymentExpiresAt: { lt: new Date() }
    }
  });

  for (const intent of expired) {
    await deleteIPFSMedia(intent.id);
    await prisma.intent.delete({ where: { id: intent.id } });
  }
}
```

### 3. On-Chain Transaction Retry

```typescript
async function publishWithRetry(intent: Intent, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await publishIntentOnChain(intent);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

### 4. URL Validation & Fetch Errors

**Problem**: Media URLs may be unreachable, blocked by CORS, or contain malicious content.

**Solution**: Comprehensive validation and error handling

```typescript
async function validateAndFetchMediaUrl(
  url: string,
  type: 'image' | 'video'
): Promise<Buffer> {
  // Validate URL format
  const parsedUrl = new URL(url);
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new AppError('Only HTTP/HTTPS URLs are allowed', 400);
  }

  // Block internal/private IPs
  const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '10.', '172.', '192.168.'];
  if (blockedHosts.some(host => parsedUrl.hostname.includes(host))) {
    throw new AppError('Private/internal URLs are not allowed', 400);
  }

  try {
    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    const timeout = type === 'image' ? 10000 : 30000;

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout,
      maxContentLength: maxSize,
      maxRedirects: 3,
      headers: {
        'User-Agent': 'IntentionalBot/1.0'
      }
    });

    // Verify content type
    const contentType = response.headers['content-type'];
    const expectedPrefix = type === 'image' ? 'image/' : 'video/';
    
    if (!contentType?.startsWith(expectedPrefix)) {
      throw new AppError(
        `Invalid ${type} content type: ${contentType}`,
        400
      );
    }

    return Buffer.from(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new AppError(`${type} URL fetch timed out`, 400);
      }
      if (error.response?.status === 404) {
        throw new AppError(`${type} not found at URL`, 404);
      }
      if (error.response?.status === 403) {
        throw new AppError(`${type} URL access forbidden`, 403);
      }
    }
    throw new AppError(`Failed to fetch ${type} from URL`, 400);
  }
}
```

### 5. Malformed Image/Video Content

**Problem**: URL returns valid content-type but corrupted file.

**Solution**: Validate file integrity before IPFS upload

```typescript
import sharp from 'sharp';

async function validateImageIntegrity(buffer: Buffer): Promise<void> {
  try {
    const metadata = await sharp(buffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image dimensions');
    }
    
    // Minimum dimensions check
    if (metadata.width < 100 || metadata.height < 100) {
      throw new Error('Image dimensions too small (min 100x100)');
    }
  } catch (error) {
    throw new AppError('Corrupted or invalid image file', 400);
  }
}

async function validateVideoIntegrity(buffer: Buffer): Promise<void> {
  // Basic validation - check for common video file signatures
  const signatures = {
    mp4: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ftyp
    webm: [0x1A, 0x45, 0xDF, 0xA3] // EBML
  };

  const hasValidSignature = Object.values(signatures).some(sig =>
    buffer.subarray(0, sig.length).equals(Buffer.from(sig))
  );

  if (!hasValidSignature) {
    throw new AppError('Invalid video file format', 400);
  }
}
```

---

## Performance Optimizations

### Feed Caching (Redis)

```typescript
const FEED_CACHE_TTL = 300; // 5 minutes

async function getCachedFeed(userId: string, bucket: string) {
  const cacheKey = `feed:${userId}:${bucket}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const feed = await generateFeed(userId, bucket);
  await redis.setex(cacheKey, FEED_CACHE_TTL, JSON.stringify(feed));
  
  return feed;
}
```

### Database Indexing

```sql
-- Critical indexes for performance
CREATE INDEX idx_intents_status_expires ON intents(status, expires_at);
CREATE INDEX idx_intents_type_published ON intents(type, published_at);
CREATE INDEX idx_swipes_user_intent ON swipes(user_id, intent_id);
CREATE INDEX idx_swipes_target ON swipes(target_intent_id, action);
CREATE INDEX idx_matches_users ON matches(user1_id, user2_id);
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('Intent Creation', () => {
  it('should reject if user has active intent', async () => {
    await expect(createIntent(userId, data)).rejects.toThrow('already has active');
  });

  it('should upload media to IPFS', async () => {
    const result = await uploadMediaToIPFS(media);
    expect(result.images).toHaveLength(3);
  });
});

describe('Match Detection', () => {
  it('should detect mutual match', async () => {
    await processSwipe(user1, intent2, 'right');
    const result = await processSwipe(user2, intent1, 'right');
    expect(result.matchDetected).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('Full Intent Flow', () => {
  it('should create, pay, publish, match, and finalize', async () => {
    const intent = await createIntent(user1, data);
    await confirmPayment(intent.id, txHash);
    await processSwipe(user2, intent.id, 'right');
    const match = await processSwipe(user1, user2Intent.id, 'right');
    await finalizeMatch(match.matchId);
    
    const finalMatch = await getMatch(match.matchId);
    expect(finalMatch.status).toBe('finalized');
  });
});
```

---

**Last Updated**: October 2025  
**Version**: 1.0
