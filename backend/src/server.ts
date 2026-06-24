import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import focusBlockRoutes from './routes/focusBlocks';
import interventionRoutes from './routes/interventions';

// Import middleware
import { errorHandler } from './middleware/error';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/focus-blocks', focusBlockRoutes);
app.use('/api/interventions', interventionRoutes);

// Basic health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    message: 'The Last-Minute Life Saver backend service is running.'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});

export default app;
