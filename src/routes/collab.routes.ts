import { Router } from 'express';
import { CollabController } from '../controllers/collab.controller';
import { CollabPostRepository } from '../repositories/collabPost.repository';
import { PingRepository } from '../repositories/ping.repository';
import { walletAuth } from '../middleware/walletAuth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { 
  MintPostCoinSchema,
  UpdateCollabStatusSchema, 
  PingCollabSchema, 
  FeedQuerySchema 
} from '../schemas/collab.schema';
import { prisma } from '../lib/prisma';

const router = Router();

// Initialize repositories and controller
const collabPostRepo = new CollabPostRepository(prisma);
const pingRepo = new PingRepository(prisma);
const collabController = new CollabController(collabPostRepo, pingRepo);

// Apply wallet authentication to all routes
router.use(walletAuth);

// GET /api/collabs/feed - Get collaboration feed
router.get('/feed', 
  validateQuery(FeedQuerySchema),
  collabController.getFeed.bind(collabController)
);

// POST /api/collabs/mint-postcoin - Create collaboration post and mint PostCoin
router.post('/mint-postcoin',
  validateBody(MintPostCoinSchema),
  collabController.createCollabPost.bind(collabController)
);

// PATCH /api/collabs/:collabId - Update collaboration status
router.patch('/:collabId',
  validateBody(UpdateCollabStatusSchema),
  collabController.updateCollabStatus.bind(collabController)
);

// POST /api/collabs/:collabId/ping - Ping a collaboration post
router.post('/:collabId/ping',
  validateBody(PingCollabSchema),
  collabController.pingCollabPost.bind(collabController)
);

export default router;
