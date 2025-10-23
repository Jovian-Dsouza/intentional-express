import { Request, Response, NextFunction } from 'express';
import { WalletAddressSchema } from '../schemas/collab.schema';

// Extend Request interface to include wallet
declare global {
  namespace Express {
    interface Request {
      wallet?: string;
    }
  }
}

export const walletAuth = (req: Request, res: Response, next: NextFunction) => {
  const wallet = req.headers['x-zora-wallet'] as string;
  
  if (!wallet) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing X-Zora-Wallet header'
      }
    });
    return;
  }

  // Validate wallet address format
  const validation = WalletAddressSchema.safeParse(wallet);
  if (!validation.success) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid wallet address format'
      }
    });
    return;
  }

  req.wallet = wallet;
  next();
};
