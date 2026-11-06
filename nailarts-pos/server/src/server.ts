import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

const app: Application = express();

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'Nail Art POS API Server',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', apiRoutes);

// 404 & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = ENV.PORT;
if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(PORT, () => {
    console.log(`🌸 Nail Art POS Server berjalan aktif di http://localhost:${PORT}`);
    console.log(`💅 Environment: ${ENV.NODE_ENV}`);
  });
}

export default app;
