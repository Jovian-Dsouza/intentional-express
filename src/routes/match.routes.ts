import { Router } from 'express';
import { MatchController } from '../controllers/match.controller';
import { MatchRepository } from '../repositories/match.repository';
import { MessageRepository } from '../repositories/message.repository';
import { walletAuth } from '../middleware/walletAuth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { SendMessageSchema, PaginationSchema } from '../schemas/collab.schema';
import { prisma } from '../lib/prisma';

const router = Router();

// Initialize repositories and controller
const matchRepo = new MatchRepository(prisma);
const messageRepo = new MessageRepository(prisma);
const matchController = new MatchController(matchRepo, messageRepo);

// Apply wallet authentication to all routes
router.use(walletAuth);

// GET /api/wallets/:walletAddress/matches - Get matches
router.get('/:walletAddress/matches',
  validateQuery(PaginationSchema),
  matchController.getMatches.bind(matchController)
);

// GET /api/matches/:matchId/messages - Get messages
router.get('/:matchId/messages',
  validateQuery(PaginationSchema),
  matchController.getMessages.bind(matchController)
);

// POST /api/matches/:matchId/messages - Send message
router.post('/:matchId/messages',
  validateBody(SendMessageSchema),
  matchController.sendMessage.bind(matchController)
);

// POST /api/matches/:matchId/messages/read - Mark messages as read
router.post('/:matchId/messages/read',
  matchController.markMessagesAsRead.bind(matchController)
);

export default router;
