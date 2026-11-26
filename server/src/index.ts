
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/authRoutes';
import laneRoutes from './routes/laneRoutes';
import cardRoutes from './routes/cardRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';
import taskRoutes from './routes/taskRoutes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const prisma = new PrismaClient();

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/lanes', laneRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// AUTOMATIC FOLLOW-UP COMPLETION
const moveCompletedFollowUps = async () => {
    try {
        // Get today's date in Guadalajara/Mexico City time
        const today = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Mexico_City',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date());

        const endOfToday = new Date(`${today}T23:59:59.999Z`);

        // Find the exact destination lane
        const delLiveLane = await prisma.lane.findFirst({
            where: {
                title: 'Del Live'
            }
        });

        if (!delLiveLane) {
            console.error('[FOLLOW-UP AUTOMATION] Lane "Del Live" was not found.');
            return;
        }

        // Find active accounts whose Loading Confirmation Finish date has arrived
        const result = await prisma.card.updateMany({
           where: {
    pickupDate: { not: null },
    loadingFinish: {
        not: null,
        lte: endOfToday
    },
    laneId: { not: delLiveLane.id }
},
            data: {
                laneId: delLiveLane.id
            }
        });

        if (result.count > 0) {
            console.log(
                `[FOLLOW-UP AUTOMATION] ${result.count} account(s) moved to Del Live.`
            );
        }
    } catch (error) {
        console.error('[FOLLOW-UP AUTOMATION] Error:', error);
    }
};

// Run once when the server starts
moveCompletedFollowUps();

// Check every minute
setInterval(moveCompletedFollowUps, 60 * 1000);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
