import {
  CreateCollabSchema,
  PingCollabSchema,
  RespondToPingSchema,
  SendMessageSchema,
  UpdateCollabStatusSchema,
  FeedQuerySchema,
  WalletAddressSchema,
  PaginationSchema,
  CollaboratorRoleSchema
} from './collab.schema';

describe('Collab Schemas', () => {
  describe('CollaboratorRoleSchema', () => {
    it('should validate valid collaborator role', () => {
      const validRole = {
        role: 'VFX Artist',
        creatorType: 'indie' as const,
        credits: 30,
        compensationType: 'paid' as const,
        timeCommitment: 'one_time' as const,
        jobDescription: 'Must have experience with Blender'
      };

      const result = CollaboratorRoleSchema.safeParse(validRole);
      expect(result.success).toBe(true);
    });

    it('should reject invalid creator type', () => {
      const invalidRole = {
        role: 'VFX Artist',
        creatorType: 'invalid',
        credits: 30,
        compensationType: 'paid',
        timeCommitment: 'one_time'
      };

      const result = CollaboratorRoleSchema.safeParse(invalidRole);
      expect(result.success).toBe(false);
    });

    it('should reject credits outside range', () => {
      const invalidRole = {
        role: 'VFX Artist',
        creatorType: 'indie',
        credits: 150,
        compensationType: 'paid',
        timeCommitment: 'one_time'
      };

      const result = CollaboratorRoleSchema.safeParse(invalidRole);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateCollabSchema', () => {
    it('should validate valid collaboration post', () => {
      const validCollab = {
        role: 'Mix Engineer',
        paymentType: 'paid' as const,
        credits: false,
        workStyle: 'freestyle' as const,
        location: 'LA',
        collaborators: [{
          role: 'Mix Engineer',
          creatorType: 'indie' as const,
          credits: 25,
          compensationType: 'paid' as const,
          timeCommitment: 'one_time' as const,
          jobDescription: 'Must have experience with electronic music'
        }],
        expiresAt: '2024-03-15T23:59:59Z'
      };

      const result = CreateCollabSchema.safeParse(validCollab);
      expect(result.success).toBe(true);
    });

    it('should reject empty collaborators array', () => {
      const invalidCollab = {
        role: 'Mix Engineer',
        paymentType: 'paid',
        credits: false,
        workStyle: 'freestyle',
        location: 'LA',
        collaborators: []
      };

      const result = CreateCollabSchema.safeParse(invalidCollab);
      expect(result.success).toBe(false);
    });

    it('should reject too many collaborators', () => {
      const collaborators = Array(11).fill({
        role: 'Role',
        creatorType: 'indie',
        credits: 10,
        compensationType: 'paid',
        timeCommitment: 'one_time'
      });

      const invalidCollab = {
        role: 'Mix Engineer',
        paymentType: 'paid',
        credits: false,
        workStyle: 'freestyle',
        location: 'LA',
        collaborators
      };

      const result = CreateCollabSchema.safeParse(invalidCollab);
      expect(result.success).toBe(false);
    });
  });

  describe('PingCollabSchema', () => {
    it('should validate valid ping', () => {
      const validPing = {
        interestedRole: '3D Artist',
        bio: '5 years of experience in music video VFX'
      };

      const result = PingCollabSchema.safeParse(validPing);
      expect(result.success).toBe(true);
    });

    it('should reject bio that is too short', () => {
      const invalidPing = {
        interestedRole: '3D Artist',
        bio: 'Short'
      };

      const result = PingCollabSchema.safeParse(invalidPing);
      expect(result.success).toBe(false);
    });

    it('should reject bio that is too long', () => {
      const invalidPing = {
        interestedRole: '3D Artist',
        bio: 'A'.repeat(501)
      };

      const result = PingCollabSchema.safeParse(invalidPing);
      expect(result.success).toBe(false);
    });
  });

  describe('RespondToPingSchema', () => {
    it('should validate accept action', () => {
      const validResponse = { action: 'accept' as const };
      const result = RespondToPingSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should validate decline action', () => {
      const validResponse = { action: 'decline' as const };
      const result = RespondToPingSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should reject invalid action', () => {
      const invalidResponse = { action: 'invalid' };
      const result = RespondToPingSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('SendMessageSchema', () => {
    it('should validate text message', () => {
      const validMessage = {
        content: 'Looking forward to working together!',
        messageType: 'text' as const
      };

      const result = SendMessageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it('should validate message with attachments', () => {
      const validMessage = {
        content: 'Here are the files',
        messageType: 'file' as const,
        attachments: [{
          fileName: 'project.zip',
          fileUrl: 'https://example.com/file.zip',
          fileType: 'application/zip',
          fileSize: 1024000
        }]
      };

      const result = SendMessageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it('should reject empty content', () => {
      const invalidMessage = {
        content: '',
        messageType: 'text'
      };

      const result = SendMessageSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it('should reject content that is too long', () => {
      const invalidMessage = {
        content: 'A'.repeat(1001),
        messageType: 'text'
      };

      const result = SendMessageSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateCollabStatusSchema', () => {
    it('should validate all status values', () => {
      const statuses = ['open', 'shortlisted', 'signed', 'closed'];
      
      statuses.forEach(status => {
        const result = UpdateCollabStatusSchema.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status', () => {
      const invalidStatus = { status: 'invalid' };
      const result = UpdateCollabStatusSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });
  });

  describe('FeedQuerySchema', () => {
    it('should validate valid feed query', () => {
      const validQuery = {
        page: 1,
        limit: 20,
        filter: 'paid',
        location: 'remote'
      };

      const result = FeedQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('should coerce string numbers to numbers', () => {
      const queryWithStrings = {
        page: '2',
        limit: '10'
      };

      const result = FeedQuerySchema.safeParse(queryWithStrings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.page).toBe('number');
        expect(typeof result.data.limit).toBe('number');
      }
    });

    it('should apply default values', () => {
      const emptyQuery = {};
      const result = FeedQuerySchema.safeParse(emptyQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should reject limit that is too high', () => {
      const invalidQuery = {
        limit: 100
      };

      const result = FeedQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  describe('WalletAddressSchema', () => {
    it('should validate valid wallet address', () => {
      const validWallet = '0x1234567890123456789012345678901234567890';
      const result = WalletAddressSchema.safeParse(validWallet);
      expect(result.success).toBe(true);
    });

    it('should reject invalid wallet address format', () => {
      const invalidWallets = [
        '0x123', // Too short
        '1234567890123456789012345678901234567890', // Missing 0x
        '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // Invalid hex
        '0x12345678901234567890123456789012345678901' // Too long
      ];

      invalidWallets.forEach(wallet => {
        const result = WalletAddressSchema.safeParse(wallet);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('PaginationSchema', () => {
    it('should validate valid pagination', () => {
      const validPagination = {
        page: 2,
        limit: 15
      };

      const result = PaginationSchema.safeParse(validPagination);
      expect(result.success).toBe(true);
    });

    it('should coerce string numbers', () => {
      const paginationWithStrings = {
        page: '3',
        limit: '25'
      };

      const result = PaginationSchema.safeParse(paginationWithStrings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.page).toBe('number');
        expect(typeof result.data.limit).toBe('number');
      }
    });

    it('should apply default values', () => {
      const emptyPagination = {};
      const result = PaginationSchema.safeParse(emptyPagination);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });
  });
});
