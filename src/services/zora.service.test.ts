import { mintCoin, getCoinData, getCachedCoinData } from '../services/zora.service';

// Mock crypto for consistent testing
jest.mock('crypto', () => ({
  randomBytes: jest.fn((size: number) => Buffer.alloc(size, 0x42))
}));

describe('ZoraService', () => {
  describe('mintCoin', () => {
    it('should mint a coin with valid metadata', async () => {
      const metadata = {
        name: 'Test Coin',
        symbol: 'TEST',
        description: 'A test coin for collaboration'
      };

      const result = await mintCoin(metadata);

      expect(result).toHaveProperty('coinAddress');
      expect(result).toHaveProperty('txHash');
      expect(result.coinAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should return different addresses for different metadata', async () => {
      const metadata1 = { name: 'Coin 1', symbol: 'C1', description: 'First coin' };
      const metadata2 = { name: 'Coin 2', symbol: 'C2', description: 'Second coin' };

      const result1 = await mintCoin(metadata1);
      const result2 = await mintCoin(metadata2);

      expect(result1.coinAddress).not.toBe(result2.coinAddress);
      expect(result1.txHash).not.toBe(result2.txHash);
    });

    it('should handle empty metadata gracefully', async () => {
      const metadata = { name: '', symbol: '', description: '' };

      const result = await mintCoin(metadata);

      expect(result).toHaveProperty('coinAddress');
      expect(result).toHaveProperty('txHash');
    });
  });

  describe('getCoinData', () => {
    it('should return mock coin data for valid address', async () => {
      const coinAddress = '0x1234567890123456789012345678901234567890';

      const result = await getCoinData(coinAddress);

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('symbol');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('totalSupply');
      expect(result).toHaveProperty('marketCap');
      expect(result).toHaveProperty('volume24h');
      expect(result).toHaveProperty('creatorAddress');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('uniqueHolders');
      expect(result).toHaveProperty('mediaContent');
    });

    it('should return consistent data for same address', async () => {
      const coinAddress = '0x1234567890123456789012345678901234567890';

      const result1 = await getCoinData(coinAddress);
      const result2 = await getCoinData(coinAddress);

      expect(result1).toEqual(result2);
    });

    it('should return different data for different addresses', async () => {
      const address1 = '0x1111111111111111111111111111111111111111';
      const address2 = '0x2222222222222222222222222222222222222222';

      const result1 = await getCoinData(address1);
      const result2 = await getCoinData(address2);

      expect(result1.name).not.toBe(result2.name);
      expect(result1.symbol).not.toBe(result2.symbol);
    });
  });

  describe('getCachedCoinData', () => {
    it('should return cached coin data', async () => {
      const coinAddress = '0x1234567890123456789012345678901234567890';

      const result = await getCachedCoinData(coinAddress);

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('symbol');
      expect(result).toHaveProperty('description');
    });

    it('should return same data as getCoinData', async () => {
      const coinAddress = '0x1234567890123456789012345678901234567890';

      const directResult = await getCoinData(coinAddress);
      const cachedResult = await getCachedCoinData(coinAddress);

      expect(cachedResult).toEqual(directResult);
    });
  });
});
