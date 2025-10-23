import { Request, Response } from 'express';
import { CollabPostRepository } from '../repositories/collabPost.repository';
import { PingRepository } from '../repositories/ping.repository';
import { mintCoin, getCachedCoinData } from '../services/zora.service';
import { CreateCollabInput, UpdateCollabStatusInput, PingCollabInput } from '../schemas/collab.schema';

export class CollabController {
  constructor(
    private collabPostRepo: CollabPostRepository,
    private pingRepo: PingRepository
  ) {}

  async getFeed(req: Request, res: Response): Promise<void> {
    try {
      const { filter, location, page = 1, limit = 20 } = req.query as any;
      const wallet = req.wallet!;

      // Build filters from query parameters
      const filters: any = {};
      if (filter) {
        switch (filter) {
          case 'paid':
            filters.paymentType = 'paid';
            break;
          case 'barter':
            filters.paymentType = 'barter';
            break;
          case 'credits':
            filters.credits = true;
            break;
          case 'contract':
            filters.workStyle = 'contract';
            break;
          case 'freestyle':
            filters.workStyle = 'freestyle';
            break;
          case 'remote':
            filters.location = 'Remote';
            break;
        }
      }
      if (location) {
        filters.location = location;
      }

      const result = await this.collabPostRepo.getFeed(
        filters,
        { page: Number(page), limit: Number(limit) },
        wallet
      );

      // Fetch coin data for each collaboration post
      const collabsWithCoinData = await Promise.all(
        result.posts.map(async (collab) => {
          const coinData = await getCachedCoinData(collab.coinAddress);
          return {
            ...collab,
            coinData
          };
        })
      );

      res.json({
        success: true,
        data: {
          collabs: collabsWithCoinData,
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
      console.error('Error getting feed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch collaboration feed'
        }
      });
    }
  }

  async createCollabPost(req: Request, res: Response): Promise<void> {
    try {
      const collabData: CreateCollabInput = req.body;
      const wallet = req.wallet!;

      // Mint Zora coin for the collaboration
      const coinMetadata = {
        name: collabData.role,
        symbol: collabData.role.substring(0, 5).toUpperCase(),
        description: `Collaboration opportunity: ${collabData.role}`
      };

      const mintResult = await mintCoin(coinMetadata);

      // Create collaboration post
      const createdPost = await this.collabPostRepo.createCollabPost(
        collabData,
        wallet,
        mintResult.coinAddress
      );

      res.status(201).json({
        success: true,
        data: {
          id: createdPost.id,
          coinAddress: mintResult.coinAddress,
          coinMinted: true,
          message: 'Collaboration post created and Zora coin minted successfully'
        }
      });
    } catch (error) {
      console.error('Error creating collaboration post:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create collaboration post'
        }
      });
    }
  }

  async updateCollabStatus(req: Request, res: Response): Promise<void> {
    try {
      const { collabId } = req.params;
      const { status }: UpdateCollabStatusInput = req.body;
      const wallet = req.wallet!;

      // Verify the user owns this collaboration post
      const existingPost = await this.collabPostRepo.findById(collabId);
      if (!existingPost) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Collaboration post not found'
          }
        });
        return;
      }

      if (existingPost.creatorWallet !== wallet) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own collaboration posts'
          }
        });
        return;
      }

      await this.collabPostRepo.updateStatus(collabId, status);

      res.json({
        success: true,
        data: {
          message: 'Collaboration post status updated'
        }
      });
    } catch (error) {
      console.error('Error updating collaboration status:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update collaboration post status'
        }
      });
    }
  }

  async pingCollabPost(req: Request, res: Response): Promise<void> {
    try {
      const { collabId } = req.params;
      const pingData: PingCollabInput = req.body;
      const wallet = req.wallet!;

      // Check if collaboration post exists
      const collabPost = await this.collabPostRepo.findById(collabId);
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

      // Prevent self-pinging
      if (collabPost.creatorWallet === wallet) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'You cannot ping your own collaboration post'
          }
        });
        return;
      }

      // Check for duplicate ping
      const isDuplicate = await this.pingRepo.checkDuplicatePing(collabId, wallet);
      if (isDuplicate) {
        res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'You have already pinged this collaboration post'
          }
        });
        return;
      }

      // Create ping
      const createdPing = await this.pingRepo.createPing({
        collabPostId: collabId,
        pingedWallet: wallet,
        interestedRole: pingData.interestedRole,
        bio: pingData.bio
      });

      res.status(201).json({
        success: true,
        data: {
          pingId: createdPing.id,
          message: 'Ping sent successfully'
        }
      });
    } catch (error) {
      console.error('Error pinging collaboration post:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to send ping'
        }
      });
    }
  }
}
