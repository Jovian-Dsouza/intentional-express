import { Request, Response } from 'express';
import { CollabPostRepository } from '../repositories/collabPost.repository';
import { PingRepository } from '../repositories/ping.repository';
import { RankingService } from '../services/ranking.service';
import { mintCoin, getCachedCoinData } from '../services/zora.service';
import { UpdateCollabStatusInput, PingCollabInput, MintPostCoinInput } from '../schemas/collab.schema';

export class CollabController {
  constructor(
    private collabPostRepo: CollabPostRepository,
    private pingRepo: PingRepository,
    private rankingService: RankingService
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

      // Rank posts by user interests
      const rankedPosts = await this.rankingService.rankFeedByInterests(result.posts, wallet);

      // Fetch coin data for each collaboration post
      const collabsWithCoinData = await Promise.all(
        rankedPosts.map(async (collab) => {
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
      const collabData: MintPostCoinInput = req.body;
      const wallet = req.wallet!;

      // Generate coin name and symbol from title
      const coinName = collabData.title;
      const coinSymbol = collabData.title
        .replace(/[^a-zA-Z]/g, '')
        .substring(0, 5)
        .toUpperCase() || 'POST';

      // Mint Zora coin for the collaboration
      const coinMetadata = {
        name: coinName,
        symbol: coinSymbol,
        description: collabData.description,
        media: collabData.media
      };

      const mintResult = await mintCoin(coinMetadata);

      // Create collaboration post using the new method
      const createdPost = await this.collabPostRepo.createMintPostCoin(
        collabData,
        wallet,
        mintResult.coinAddress,
        mintResult.coinName,
        mintResult.coinSymbol
      );

      res.status(201).json({
        success: true,
        data: {
          collabPostId: createdPost.id,
          coinAddress: mintResult.coinAddress,
          coinName: mintResult.coinName,
          coinSymbol: mintResult.coinSymbol,
          transactionHash: mintResult.txHash,
          zoraUrl: mintResult.zoraUrl
        },
        message: 'PostCoin minted successfully! Your collaboration is now live.'
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
