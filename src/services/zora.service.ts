export interface CoinMetadata {
  name: string;
  symbol: string;
  description: string;
  media?: {
    ipfsUrl: string;
    gatewayUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  };
}

export interface MintResult {
  coinAddress: string;
  coinName: string;
  coinSymbol: string;
  txHash: string;
  zoraUrl: string;
}


export interface CoinData {
  name: string;
  symbol: string;
  description: string;
  totalSupply: string;
  marketCap: string;
  volume24h: string;
  creatorAddress: string;
  createdAt: string;
  uniqueHolders: number;
  mediaContent?: {
    previewImage?: string;
  };
}

// Mock coin data generator
const generateMockCoinData = (coinAddress: string): CoinData => {
  const hash = coinAddress.slice(2, 10); // Use first 8 chars as seed
  const seed = parseInt(hash, 16);
  
  const names = ['Creative Coin', 'Art Token', 'Collab Coin', 'Creator Token', 'Project Coin'];
  const symbols = ['CREAT', 'ART', 'COLLAB', 'CREATOR', 'PROJ'];
  const descriptions = [
    'A token for creative collaborations',
    'Supporting artists and creators',
    'Building creative communities',
    'Empowering digital creators',
    'Connecting talent worldwide'
  ];

  const nameIndex = seed % names.length;
  const symbolIndex = seed % symbols.length;
  const descIndex = seed % descriptions.length;

  // Use seed for consistent random values
  const mockRandom = (min: number, max: number) => {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  return {
    name: names[nameIndex],
    symbol: symbols[symbolIndex],
    description: descriptions[descIndex],
    totalSupply: '1000000',
    marketCap: (mockRandom(1000, 10000)).toString(),
    volume24h: (mockRandom(100, 1000)).toString(),
    creatorAddress: coinAddress,
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(), // Fixed date for consistency
    uniqueHolders: mockRandom(10, 100),
    mediaContent: {
      previewImage: `https://images.unsplash.com/photo-${1500000000000 + seed}?w=800`
    }
  };
};

// Mock cache for coin data
const coinDataCache = new Map<string, CoinData>();

/**
 * Mock coin minting function
 * In real implementation, this would interact with Zora SDK
 */
export const mintCoin = async (metadata: CoinMetadata): Promise<MintResult> => {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Generate mock coin address based on metadata hash
  const metadataHash = Buffer.from(JSON.stringify(metadata)).toString('hex').slice(0, 40);
  const coinAddress = `0x${metadataHash}`;
  
  // Generate mock transaction hash (64 chars total)
  const timestamp = Date.now().toString(16);
  const txHash = `0x${timestamp.padEnd(32, '0')}${metadataHash.slice(0, 32)}`;
  
  // Generate Zora URL
  const zoraUrl = `https://zora.co/collect/base:${coinAddress}`;
  
  return {
    coinAddress,
    coinName: metadata.name,
    coinSymbol: metadata.symbol,
    txHash,
    zoraUrl
  };
};

/**
 * Mock coin data fetching function
 * In real implementation, this would fetch from Zora API
 */
export const getCoinData = async (coinAddress: string): Promise<CoinData> => {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Validate address format
  if (!coinAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid coin address format');
  }
  
  return generateMockCoinData(coinAddress);
};

/**
 * Mock cached coin data function
 * In real implementation, this would use Redis cache
 */
export const getCachedCoinData = async (coinAddress: string): Promise<CoinData> => {
  // Check cache first
  if (coinDataCache.has(coinAddress)) {
    return coinDataCache.get(coinAddress)!;
  }
  
  // Fetch from "API" and cache
  const coinData = await getCoinData(coinAddress);
  coinDataCache.set(coinAddress, coinData);
  
  return coinData;
};
