import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import laneRoutes from './routes/laneRoutes';
import cardRoutes from './routes/cardRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

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

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
