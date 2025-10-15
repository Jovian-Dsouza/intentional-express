import { Match, Swipe, SwipeAction } from '@prisma/client';
import { SwipeRepository } from '../repositories/swipe.repository';
import { MatchRepository } from '../repositories/match.repository';
import { IntentRepository } from '../repositories/intent.repository';

interface SwipeInput {
  userId: string;
  intentId: string;
  targetIntentId: string;
  action: SwipeAction;
  viewDuration?: number;
  mediaViewed?: string[];
}

interface SwipeResult {
  swipe: Swipe;
  isMatch: boolean;
  match?: Match;
}

export class MatchingService {
  constructor(
    private swipeRepository: SwipeRepository,
    private matchRepository: MatchRepository,
    private intentRepository: IntentRepository
  ) {}

  /**
   * Process a swipe action and check for mutual match
   */
  async processSwipe(input: SwipeInput): Promise<SwipeResult> {
    // 1. Validate user has active intent
    const userIntent = await this.intentRepository.findById(input.intentId);
    
    if (!userIntent || userIntent.status !== 'active') {
      throw new Error('User has no active intent');
    }

    // 2. Check if already swiped on this target
    const existingSwipe = await this.swipeRepository.hasSwipedOnIntent(
      input.intentId,
      input.targetIntentId
    );

    if (existingSwipe) {
      throw new Error('Already swiped on this intent');
    }

    // 3. Create swipe record
    const swipe = await this.swipeRepository.createSwipe({
      userId: input.userId,
      intentId: input.intentId,
      targetIntentId: input.targetIntentId,
      action: input.action,
      viewDuration: input.viewDuration,
      mediaViewed: input.mediaViewed,
    });

    // 4. If left swipe, return early (no match possible)
    if (input.action === 'left') {
      return {
        swipe,
        isMatch: false,
      };
    }

    // 5. Check for reciprocal right swipe
    const hasReciprocal = await this.swipeRepository.checkReciprocalSwipe(
      input.intentId,
      input.targetIntentId
    );

    // 6. If reciprocal swipe exists, create match
    if (hasReciprocal) {
      const match = await this.createMatch(input.intentId, input.targetIntentId);

      return {
        swipe,
        isMatch: true,
        match,
      };
    }

    // 7. No match (yet)
    return {
      swipe,
      isMatch: false,
    };
  }

  /**
   * Check if two intents have mutual right swipes
   */
  async checkMutualMatch(intent1Id: string, intent2Id: string): Promise<boolean> {
    // Check swipe from intent1 to intent2
    const swipe1to2 = await this.swipeRepository.findSwipe(intent1Id, intent2Id);
    
    // Check swipe from intent2 to intent1
    const swipe2to1 = await this.swipeRepository.findSwipe(intent2Id, intent1Id);

    // Both must exist and both must be right swipes
    return (
      swipe1to2 !== null &&
      swipe2to1 !== null &&
      swipe1to2.action === 'right' &&
      swipe2to1.action === 'right'
    );
  }

  /**
   * Create a match between two intents
   */
  async createMatch(intent1Id: string, intent2Id: string): Promise<Match> {
    // Validate both intents are active
    const intent1 = await this.intentRepository.findById(intent1Id);
    const intent2 = await this.intentRepository.findById(intent2Id);

    if (!intent1 || intent1.status !== 'active') {
      throw new Error('Both intents must be active to create match');
    }

    if (!intent2 || intent2.status !== 'active') {
      throw new Error('Both intents must be active to create match');
    }

    // Check if match already exists
    const existingMatch = await this.matchRepository.checkMatchExists(
      intent1Id,
      intent2Id
    );

    if (existingMatch) {
      throw new Error('Match already exists');
    }

    // Create match
    const match = await this.matchRepository.createMatch({
      user1Id: intent1.userId,
      user2Id: intent2.userId,
      intent1Id,
      intent2Id,
    });

    return match;
  }

  /**
   * Finalize a match - burns intents on-chain and updates status
   */
  async finalizeMatch(matchId: string, txHash: string): Promise<Match> {
    // Get match
    const match = await this.matchRepository.findById(matchId);

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status === 'finalized') {
      throw new Error('Match already finalized');
    }

    // Update match status to finalizing
    await this.matchRepository.updateStatus(matchId, 'finalizing');

    // Set transaction hash and mark as finalized
    const finalizedMatch = await this.matchRepository.updateStatus(
      matchId,
      'finalized',
      txHash
    );

    // Update both intents to matched status
    await this.intentRepository.updateStatus(match.intent1Id, 'matched');
    await this.intentRepository.updateStatus(match.intent2Id, 'matched');

    return finalizedMatch;
  }

  /**
   * Get all matches for a user
   */
  async getMatchesForUser(userId: string): Promise<Match[]> {
    return this.matchRepository.getMatchesByUserId(userId);
  }

  /**
   * Get match by ID
   */
  async getMatchById(matchId: string): Promise<Match | null> {
    return this.matchRepository.findById(matchId);
  }

  /**
   * Get matches by status
   */
  async getMatchesByStatus(status: any): Promise<Match[]> {
    return this.matchRepository.getMatchesByStatus(status);
  }
}
