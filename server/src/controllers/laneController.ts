import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getLanes = async (req: Request, res: Response): Promise<void> => {
    try {
        const lanes = await prisma.lane.findMany({
            orderBy: { order: 'asc' },
            include: {
                cards: {
                    orderBy: { priority: 'desc' }, // or some other order
                    include: {
                        tags: true,
                        assignedUsers: true,
                        followUp: true,
                        comments: {
                            include: { user: true },
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            }
        });
        res.json(lanes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch lanes' });
    }
};
