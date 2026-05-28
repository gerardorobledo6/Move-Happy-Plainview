import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { normalizeEmail } from '../utils/authUtils';

const prisma = new PrismaClient();

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatarColor: true,
                createdAt: true
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
    const { password, name, role, avatarColor } = req.body;
    const email = normalizeEmail(req.body.email);
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                role: role || 'USER',
                avatarColor: avatarColor || '#3b82f6'
            }
        });
        // @ts-ignore
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { name, password } = req.body;
    const email = req.body.email ? normalizeEmail(req.body.email) : undefined;
    const role = req.body.role as string | undefined;
    const avatarColor = req.body.avatarColor as string | undefined;

    try {
        const data: any = { email, name, role, avatarColor };
        if (password) {
            data.passwordHash = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data
        });

        // @ts-ignore
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    try {
        await prisma.user.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
