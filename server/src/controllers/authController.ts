import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { normalizeEmail } from '../utils/authUtils';

const prisma = new PrismaClient();

// 🔥 Forzamos que SIEMPRE haya secret válido
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_leankit_clone_key';

export const register = async (req: Request, res: Response): Promise<void> => {
    const email = normalizeEmail(req.body.email);
    const { password, name } = req.body;

    try {
        if (!email || !password) {
            res.status(400).json({ error: 'Missing fields' });
            return;
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.findUnique({ where: { email } });

console.log("LOGIN EMAIL:", email);
console.log("USER FOUND:", user);

if (!user) {
    res.status(400).json({ error: 'Invalid credentials' });
    return;
}

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarColor: user.avatarColor,
                role: user.role
            }
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error); // 🔥 esto nos muestra el error real
        res.status(500).json({ error: 'Something went wrong' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    try {
        // 🔥 VALIDACIÓN CLAVE (esto causa muchos 500)
        if (!email || !password) {
            res.status(400).json({ error: 'Missing email or password' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            res.status(400).json({ error: 'Invalid credentials' });
            return;
        }

        // 🔥 protección extra (por si passwordHash viene null)
        if (!user.passwordHash) {
            res.status(500).json({ error: 'User has no password set' });
            return;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);

        if (!valid) {
            res.status(400).json({ error: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarColor: user.avatarColor,
                role: user.role
            }
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error); // 🔥 esto nos dirá EXACTO si algo falla
        res.status(500).json({ error: 'Something went wrong' });
    }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        // @ts-ignore
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarColor: user.avatarColor,
                role: user.role
            }
        });

    } catch (error) {
        console.error("GETME ERROR:", error);
        res.status(500).json({ error: 'Something went wrong' });
    }
};

export const getPublicStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const [activeCustomers, activeUsers, activeTasks] = await Promise.all([
            prisma.card.count({
                where: {
                    lane: {
                        title: {
                            in: ['Welcome', 'Prep', 'Premove', 'PU live', 'fu1', 'fu2', 'fu3', 'LC', 'Del live']
                        }
                    }
                }
            }),
            prisma.user.count(),
            prisma.card.count({
                where: {
                    lane: {
                        title: {
                            not: 'Finished'
                        }
                    }
                }
            })
        ]);

        res.json({
            activeCustomers,
            activeUsers,
            activeTasks
        });
    } catch (error) {
        console.error("STATS ERROR:", error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};