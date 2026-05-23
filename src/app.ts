import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger';
import { errorMiddleware } from './middlewares/error.middleware';

import authRoutes from './modules/auth/auth.routes';
import chatRoutes from './modules/chat/chat.routes';
import historyRoutes from './modules/history/history.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/history', historyRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorMiddleware);

export default app;
