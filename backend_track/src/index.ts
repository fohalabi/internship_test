import express from 'express';
import dotenv from 'dotenv';
import pino from 'pino';
import reconcileRouter from './routes/reconcile';

dotenv.config();

const app = express();
const logger = pino({ transport: { target: 'pino-pretty'} });
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/reconcile', reconcileRouter);

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

export default app;