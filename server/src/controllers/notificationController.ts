import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).userId as string;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        
        res.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

export const createNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const creatorId = (req as any).userId as string;
        const { userId, cardId, cardTitle } = req.body;

        if (!userId || !cardId || !cardTitle) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Prevent self-notification
        if (creatorId === userId) {
            res.json({ message: 'Self-notification skipped' });
            return;
        }

        let senderName = 'System';
        if (creatorId) {
            const sender = await prisma.user.findUnique({ where: { id: creatorId } });
            if (sender) senderName = sender.name;
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                senderName,
                cardId,
                cardTitle
            }
        });

        res.status(201).json(notification);
    } catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    try {
        const notification = await prisma.notification.update({
            where: { id },
            data: { read: true }
        });
        res.json(notification);
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).userId as string;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const result = await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });
        
        res.json({ success: true, count: result.count });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
};
