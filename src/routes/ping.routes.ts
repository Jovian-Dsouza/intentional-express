import { Router } from 'express';
import { PingController } from '../controllers/ping.controller';
import { PingRepository } from '../repositories/ping.repository';
import { MatchRepository } from '../repositories/match.repository';
import { CollabPostRepository } from '../repositories/collabPost.repository';
import { walletAuth } from '../middleware/walletAuth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { RespondToPingSchema, PaginationSchema } from '../schemas/collab.schema';
import { prisma } from '../lib/prisma';

const router = Router();

// Initialize repositories and controller
const pingRepo = new PingRepository(prisma);
const matchRepo = new MatchRepository(prisma);
const collabPostRepo = new CollabPostRepository(prisma);
const pingController = new PingController(pingRepo, matchRepo, collabPostRepo);

// Apply wallet authentication to all routes
router.use(walletAuth);

// GET /api/wallets/:walletAddress/pings/received - Get received pings
router.get('/:walletAddress/pings/received',
  validateQuery(PaginationSchema),
  pingController.getReceivedPings.bind(pingController)
);

// POST /api/pings/:pingId/respond - Respond to ping
router.post('/:pingId/respond',
  validateBody(RespondToPingSchema),
  pingController.respondToPing.bind(pingController)
);

export default router;
