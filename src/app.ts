import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import collabRoutes from './routes/collab.routes';
import pingRoutes from './routes/ping.routes';
import matchRoutes from './routes/match.routes';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/collabs', collabRoutes);
app.use('/api/wallets', pingRoutes);
app.use('/api/wallets', matchRoutes);
app.use('/api/pings', pingRoutes);
app.use('/api/matches', matchRoutes);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// 404 handler for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
});

// Error handler
app.use(errorHandler);

export default app;
