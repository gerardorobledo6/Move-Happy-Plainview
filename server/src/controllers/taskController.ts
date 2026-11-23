
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const tasks = await prisma.task.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                assignee: {
                    select: { id: true, name: true, email: true }
                },
                createdBy: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.json(tasks);
    } catch (error) {
        console.error('Failed to fetch tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            cardId,
            orderNumber,
            assigneeId,
            taskName,
            priority
        } = req.body;

        const userId = (req as any).userId as string;

        if (!cardId || !taskName?.trim()) {
            res.status(400).json({ error: 'Card and task name are required' });
            return;
        }

        const task = await prisma.task.create({
            data: {
                cardId,
                orderNumber: orderNumber || null,
                assigneeId: assigneeId || null,
                createdById: userId || null,
                taskName: taskName.trim(),
                priority: priority || 'Normal',
                status: 'Pending'
            },
            include: {
                assignee: {
                    select: { id: true, name: true, email: true }
                },
                createdBy: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.status(201).json(task);
    } catch (error) {
        console.error('Failed to create task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const taskId = String(req.params.id);
        const { status } = req.body;

        if (status !== 'Pending' && status !== 'Done') {
            res.status(400).json({ error: 'Invalid task status' });
            return;
        }

        const task = await prisma.task.update({
            where: { id: taskId },
            data: { status },
            include: {
                assignee: {
                    select: { id: true, name: true, email: true }
                },
                createdBy: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.json(task);
    } catch (error) {
        console.error('Failed to update task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
};
