import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createCard = async (req: Request, res: Response): Promise<void> => {
    const { title, laneId, description, orderNumber, priority, status, plannedStart, plannedFinish, pickupDate, tags } = req.body;
    const assignedUserIds = req.body.assignedUserIds as string[] | undefined;
    try {
        // Generate a simple headerId if not provided (e.g. valid approach for MVP)
        const count = await prisma.card.count();
        const headerId = `CL-${100 + count + 1}`;

        const card = await prisma.card.create({
            data: {
                title,
                laneId,
                headerId,
                description,
                priority: priority || 'Normal',
                status: status || 'Unblocked',
                plannedStart: plannedStart ? new Date(plannedStart) : null,
                plannedFinish: plannedFinish ? new Date(plannedFinish) : null,
                pickupDate: pickupDate ? new Date(pickupDate) : null,
                orderNumber,
                assignedUsers: assignedUserIds ? {
                    connect: assignedUserIds.map((id: string) => ({ id }))
                } : undefined,
            },
            include: {
                assignedUsers: true,
                tags: true,
                comments: true
            }
        });



        res.json(card);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create card' });
    }
};

export const updateCard = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { title, laneId, description, orderNumber, priority, status, plannedStart, plannedFinish, pickupDate } = req.body;
    const assignedUserIds = req.body.assignedUserIds as string[] | undefined;

    try {
        // Build the data object dynamically to avoid overwriting with undefined
        const data: any = {};
        
        if (title !== undefined) data.title = title;
        if (laneId !== undefined) {
            data.laneId = laneId;
            const targetLane = await prisma.lane.findUnique({ where: { id: laneId } });
            if (targetLane && targetLane.title.toLowerCase().includes('done')) {
                data.resolvedAt = new Date();
            } else {
                data.resolvedAt = null;
            }
        }
        if (description !== undefined) data.description = description;
        if (orderNumber !== undefined) data.orderNumber = orderNumber;
        if (priority !== undefined) data.priority = priority;
        if (status !== undefined) data.status = status;
        
        // Explicitly handle dates to allow clearing (null) or updating
        if (plannedStart !== undefined) {
            data.plannedStart = plannedStart ? new Date(plannedStart) : null;
        }
        if (plannedFinish !== undefined) {
            data.plannedFinish = plannedFinish ? new Date(plannedFinish) : null;
        }
        if (pickupDate !== undefined) {
            data.pickupDate = pickupDate ? new Date(pickupDate) : null;
        }

        if (assignedUserIds !== undefined) {
            data.assignedUsers = {
                set: assignedUserIds.map((uid: string) => ({ id: uid }))
            };
        }

        const card = await prisma.card.update({
            where: { id },
            data,
            include: {
                assignedUsers: true,
                tags: true,
                comments: { include: { user: true } }
            }
        });


        
        res.json(card);
    } catch (error) {
        console.error("Error updating card:", error);
        res.status(500).json({ error: 'Failed to update card' });
    }
};

export const deleteCard = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    try {
        await prisma.card.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete card' });
    }
};

export const addComment = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { content } = req.body;
    const assignedUserIds = req.body.assignedUserIds as string[] | undefined;

    // Validate if necessary or just expect array
    // ...

   try {
    const userId = (req as any).user?.id as string;

    const comment = await prisma.comment.create({
        data: {
            content,
            card: { connect: { id } },
            user: { connect: { id: userId } }
        },
        include: {
            user: true
            }
        });
        res.json(comment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

export const updateFollowUp = async (req: Request, res: Response): Promise<void> => {
    const cardId = req.params.id as string;
    const { lastFollowUpDate, nextFollowUpDate } = req.body;

    try {
        const followUp = await prisma.followUp.upsert({
            where: { cardId },
            update: {
                lastFollowUpDate: new Date(lastFollowUpDate),
                nextFollowUpDate: new Date(nextFollowUpDate)
            },
            create: {
                cardId,
                lastFollowUpDate: new Date(lastFollowUpDate),
                nextFollowUpDate: new Date(nextFollowUpDate)
            }
        });
        res.json(followUp);
    } catch (error) {
        console.error("Error upserting follow up:", error);
        res.status(500).json({ error: 'Failed to update follow up' });
    }
};

