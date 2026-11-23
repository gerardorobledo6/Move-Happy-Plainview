
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    userId?: string;
}

const checkAdmin = async (req: Request, res: Response): Promise<boolean> => {
    const userId = (req as AuthRequest).userId;

    if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return false;
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Administrator access required' });
        return false;
    }

    return true;
};

export const getLanes = async (req: Request, res: Response): Promise<void> => {
    try {
        const lanes = await prisma.lane.findMany({
            orderBy: { order: 'asc' },
            include: {
                cards: {
                    orderBy: { priority: 'desc' },
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
        console.error('Failed to fetch lanes:', error);
        res.status(500).json({ error: 'Failed to fetch lanes' });
    }
};

export const createLane = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!(await checkAdmin(req, res))) return;

        const title = typeof req.body.title === 'string'
            ? req.body.title.trim()
            : '';

        if (!title) {
            res.status(400).json({ error: 'Column name is required' });
            return;
        }

        const lastLane = await prisma.lane.findFirst({
            orderBy: { order: 'desc' },
            select: { order: true }
        });

        const lane = await prisma.lane.create({
            data: {
                title,
                order: (lastLane?.order ?? -1) + 1,
                type: 'DEFAULT'
            },
            include: { cards: true }
        });

        res.status(201).json(lane);
    } catch (error) {
        console.error('Failed to create lane:', error);
        res.status(500).json({ error: 'Failed to create column' });
    }
};

export const updateLane = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!(await checkAdmin(req, res))) return;

        const laneId = String(req.params.id);

        const title = typeof req.body.title === 'string'
            ? req.body.title.trim()
            : '';

        if (!title) {
            res.status(400).json({ error: 'Column name is required' });
            return;
        }

        const existingLane = await prisma.lane.findUnique({
            where: { id: laneId }
        });

        if (!existingLane) {
            res.status(404).json({ error: 'Column not found' });
            return;
        }

        const lane = await prisma.lane.update({
            where: { id: laneId },
            data: { title }
        });

        res.json(lane);
    } catch (error) {
        console.error('Failed to update lane:', error);
        res.status(500).json({ error: 'Failed to update column' });
    }
};

export const deleteLane = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!(await checkAdmin(req, res))) return;

        const laneId = String(req.params.id);

        const lane = await prisma.lane.findUnique({
            where: { id: laneId }
        });

        if (!lane) {
            res.status(404).json({ error: 'Column not found' });
            return;
        }

        const cardCount = await prisma.card.count({
            where: { laneId }
        });

        if (cardCount > 0) {
            res.status(400).json({
                error: 'Move or remove all cards before deleting this column'
            });
            return;
        }

        await prisma.lane.delete({
            where: { id: laneId }
        });

        res.json({ message: 'Column deleted successfully' });
    } catch (error) {
        console.error('Failed to delete lane:', error);
        res.status(500).json({ error: 'Failed to delete column' });
    }
};
