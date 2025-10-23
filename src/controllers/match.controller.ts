import { Request, Response } from 'express';
import { MatchRepository } from '../repositories/match.repository';
import { MessageRepository } from '../repositories/message.repository';
import { SendMessageInput } from '../schemas/collab.schema';

export class MatchController {
  constructor(
    private matchRepo: MatchRepository,
    private messageRepo: MessageRepository
  ) {}

  async getMatches(req: Request, res: Response): Promise<void> {
    try {
      const wallet = req.wallet!;
      const { page = 1, limit = 20, status } = req.query as any;

      const result = await this.matchRepo.getMatchesByWallet(
        wallet,
        { page: Number(page), limit: Number(limit) },
        status
      );

      res.json({
        success: true,
        data: {
          matches: result.matches,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: result.hasNext,
            hasPrev: result.hasPrev
          }
        }
      });
    } catch (error) {
      console.error('Error getting matches:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch matches'
        }
      });
    }
  }

  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { matchId } = req.params;
      const { page = 1, limit = 50 } = req.query as any;
      const wallet = req.wallet!;

      // Verify user has access to this match
      const match = await this.matchRepo.findById(matchId);
      if (!match) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Match not found'
          }
        });
        return;
      }

      if (match.creatorWallet !== wallet && match.collaboratorWallet !== wallet) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this match'
          }
        });
        return;
      }

      const result = await this.messageRepo.getMessagesByMatch(
        matchId,
        { page: Number(page), limit: Number(limit) }
      );

      res.json({
        success: true,
        data: {
          messages: result.messages,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: result.hasNext,
            hasPrev: result.hasPrev
          }
        }
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch messages'
        }
      });
    }
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { matchId } = req.params;
      const messageData: SendMessageInput = req.body;
      const wallet = req.wallet!;

      // Verify user has access to this match
      const match = await this.matchRepo.findById(matchId);
      if (!match) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Match not found'
          }
        });
        return;
      }

      if (match.creatorWallet !== wallet && match.collaboratorWallet !== wallet) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this match'
          }
        });
        return;
      }

      // Create message
      const createdMessage = await this.messageRepo.createMessage({
        matchId,
        senderWallet: wallet,
        content: messageData.content,
        messageType: messageData.messageType,
        attachments: messageData.attachments
      });

      // Update match last message timestamp
      await this.matchRepo.updateLastMessageAt(matchId, new Date());

      // Update unread count for the other user
      const unreadCount = await this.messageRepo.getUnreadCount(matchId, wallet);
      await this.matchRepo.updateUnreadCount(matchId, unreadCount);

      res.status(201).json({
        success: true,
        data: {
          messageId: createdMessage.id,
          message: 'Message sent successfully'
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to send message'
        }
      });
    }
  }

  async markMessagesAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { matchId } = req.params;
      const wallet = req.wallet!;

      // Verify user has access to this match
      const match = await this.matchRepo.findById(matchId);
      if (!match) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Match not found'
          }
        });
        return;
      }

      if (match.creatorWallet !== wallet && match.collaboratorWallet !== wallet) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this match'
          }
        });
        return;
      }

      // Mark messages as read
      const markedCount = await this.messageRepo.markAsRead(matchId, wallet);

      // Update unread count to 0
      await this.matchRepo.updateUnreadCount(matchId, 0);

      res.json({
        success: true,
        data: {
          markedCount,
          message: 'Messages marked as read'
        }
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to mark messages as read'
        }
      });
    }
  }
}
