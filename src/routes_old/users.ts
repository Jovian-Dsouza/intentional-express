import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
});

// GET /api/users - Get all users
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        posts: true,
      },
    });

    res.json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        posts: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Create a new user
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createUserSchema.parse(req.body);

    const user = await prisma.user.create({
      data: validatedData,
    });

    res.status(201).json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: error.errors,
      });
    }
    next(error);
  }
});

// PATCH /api/users/:id - Update a user
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updateUserSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: error.errors,
      });
    }
    next(error);
  }
});

// DELETE /api/users/:id - Delete a user
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
