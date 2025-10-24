import { CollaborationPost } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';

export interface ScoredPost {
  post: CollaborationPost;
  score: number;
}

export class RankingService {
  constructor(private userRepository: UserRepository) {}

  async rankFeedByInterests(
    posts: CollaborationPost[],
    userWallet: string
  ): Promise<CollaborationPost[]> {
    // Get user profile to extract interests
    const user = await this.userRepository.findByZoraWallet(userWallet);
    
    if (!user) {
      // If user not found, return posts in original order
      return posts;
    }

    const creativeDomains = user.creativeDomains as string[];
    const skills = user.skills as string[];

    // Calculate scores for each post
    const scoredPosts: ScoredPost[] = posts.map(post => ({
      post,
      score: this.calculateInterestScore(post, creativeDomains, skills)
    }));

    // Sort by score (descending), then by creation date (descending) for ties
    scoredPosts.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher scores first
      }
      return b.post.createdAt.getTime() - a.post.createdAt.getTime(); // Newer posts first for ties
    });

    return scoredPosts.map(scoredPost => scoredPost.post);
  }

  private calculateInterestScore(
    post: CollaborationPost,
    creativeDomains: string[],
    skills: string[]
  ): number {
    let score = 0;

    // Extract post metadata
    const metadata = post.metadata as any;
    const tags = metadata?.tags || [];
    const category = metadata?.category || '';
    const role = post.role || '';
    const collaborators = post.collaborators as any[] || [];

    // Helper function to normalize strings for comparison
    const normalize = (str: string) => str.toLowerCase().trim();

    // Score creative domains matches (3 points each)
    creativeDomains.forEach(domain => {
      const normalizedDomain = normalize(domain);
      
      // Match against category
      if (normalize(category).includes(normalizedDomain) || 
          normalizedDomain.includes(normalize(category))) {
        score += 3;
      }
      
      // Match against tags
      tags.forEach((tag: string) => {
        if (normalize(tag).includes(normalizedDomain) || 
            normalizedDomain.includes(normalize(tag))) {
          score += 3;
        }
      });
      
      // Match against role
      if (normalize(role).includes(normalizedDomain) || 
          normalizedDomain.includes(normalize(role))) {
        score += 3;
      }
    });

    // Score skills matches (2 points each)
    skills.forEach(skill => {
      const normalizedSkill = normalize(skill);
      
      // Match against tags
      tags.forEach((tag: string) => {
        if (normalize(tag).includes(normalizedSkill) || 
            normalizedSkill.includes(normalize(tag))) {
          score += 2;
        }
      });
      
      // Match against role
      if (normalize(role).includes(normalizedSkill) || 
          normalizedSkill.includes(normalize(role))) {
        score += 2;
      }
      
      // Match against collaborator roles
      collaborators.forEach((collaborator: any) => {
        const collaboratorRole = collaborator?.role || '';
        if (normalize(collaboratorRole).includes(normalizedSkill) || 
            normalizedSkill.includes(normalize(collaboratorRole))) {
          score += 2;
        }
      });
    });

    return score;
  }
}
