import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  published: z.boolean().optional(),
  authorId: z.string(),
});

const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  published: z.boolean().optional(),
});

// GET /api/posts - Get all posts
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: true,
      },
    });

    res.json({
      status: 'success',
      data: posts,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/posts/:id - Get post by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
      },
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    res.json({
      status: 'success',
      data: post,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/posts - Create a new post
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createPostSchema.parse(req.body);

    const post = await prisma.post.create({
      data: validatedData,
      include: {
        author: true,
      },
    });

    res.status(201).json({
      status: 'success',
      data: post,
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

// PATCH /api/posts/:id - Update a post
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updatePostSchema.parse(req.body);

    const post = await prisma.post.update({
      where: { id },
      data: validatedData,
      include: {
        author: true,
      },
    });

    res.json({
      status: 'success',
      data: post,
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

// DELETE /api/posts/:id - Delete a post
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.post.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
