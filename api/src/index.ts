/**
 * API Server entry point
 */
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler, requestLogger } from './middleware';
import { healthRouter, crawlRouter, analyzeRouter } from './routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// Routes
app.use('/health', healthRouter);
app.use('/crawl', crawlRouter);
app.use('/analyze', analyzeRouter);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
