import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import reportRoutes from './routes/report.routes';
import swaggerDocument from './swagger/swagger.json';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so the React/Next.js frontend can communicate with this API
app.use(cors({
  origin: '*', // Allow all origins for development. Replace with specific frontend URL in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware to handle JSON payloads
app.use(express.json());

// Mount the Swagger UI interactive API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);

// Welcome Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Exc Dashboard Backend API Server!',
    documentation: `Go to http://localhost:${PORT}/api-docs to view the interactive API documentation and test endpoints.`,
    status: 'online'
  });
});

// 404 handler for unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    success: false, 
    message: 'API Endpoint not found.' 
  });
});

// Global error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error caught in global handler:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred.',
    error: err.message
  });
});

export default app;
