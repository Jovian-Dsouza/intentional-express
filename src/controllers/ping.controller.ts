import { Request, Response } from 'express';
import { PingRepository } from '../repositories/ping.repository';
import { MatchRepository } from '../repositories/match.repository';
import { CollabPostRepository } from '../repositories/collabPost.repository';
import { RespondToPingInput } from '../schemas/collab.schema';

export class PingController {
  constructor(
    private pingRepo: PingRepository,
    private matchRepo: MatchRepository,
    private collabPostRepo: CollabPostRepository
  ) {}

  async getReceivedPings(req: Request, res: Response): Promise<void> {
    try {
      const wallet = req.wallet!;
      const { page = 1, limit = 20, status } = req.query as any;

      const result = await this.pingRepo.getReceivedPings(
        wallet,
        { page: Number(page), limit: Number(limit) },
        status
      );

      res.json({
        success: true,
        data: {
          pings: result.pings,
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
      console.error('Error getting received pings:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch received pings'
        }
      });
    }
  }

  async respondToPing(req: Request, res: Response): Promise<void> {
    try {
      const { pingId } = req.params;
      const { action }: RespondToPingInput = req.body;
      const wallet = req.wallet!;

      // Get the ping and collaboration post separately
      const ping = await this.pingRepo.findById(pingId);
      if (!ping) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Ping not found'
          }
        });
        return;
      }

      const collabPost = await this.collabPostRepo.findById(ping.collabPostId);
      if (!collabPost) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Collaboration post not found'
          }
        });
        return;
      }

      // Verify the user owns the collaboration post
      if (collabPost.creatorWallet !== wallet) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only respond to pings on your own collaboration posts'
          }
        });
        return;
      }

      // Check if ping is already responded to
      if (ping.status !== 'pending') {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Ping has already been responded to'
          }
        });
        return;
      }

      // Update ping status
      const pingStatus = action === 'accept' ? 'accepted' : 'declined';
      await this.pingRepo.updatePingStatus(pingId, pingStatus);

      // If accepted, create a match
      if (action === 'accept') {
        await this.matchRepo.createMatch({
          collabPostId: ping.collabPostId,
          creatorWallet: collabPost.creatorWallet,
          collaboratorWallet: ping.pingedWallet,
          projectName: collabPost.role,
          role: ping.interestedRole
        });
      }

      res.json({
        success: true,
        data: {
          message: `Ping ${action} successfully`,
          matchCreated: action === 'accept'
        }
      });
    } catch (error) {
      console.error('Error responding to ping:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to respond to ping'
        }
      });
    }
  }
}
