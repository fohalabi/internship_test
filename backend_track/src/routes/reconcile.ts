import { Router, Request, Response } from 'express';
import { reconcile } from '../services/reconciliationService';
import { ReconcileRequest, Transaction } from '../types';

const router = Router();

function isValidTransaction(t: unknown): t is Transaction {
  if (typeof t !== 'object' || t === null) return false;
  const tx = t as Record<string, unknown>;
  return (
    typeof tx.id === 'string' &&
    typeof tx.amount === 'number' &&
    typeof tx.currency === 'string' &&
    typeof tx.reference === 'string'
  );
}

function isValidRequest(body: unknown): body is ReconcileRequest {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    Array.isArray(b.internal) &&
    Array.isArray(b.external) &&
    b.internal.every(isValidTransaction) &&
    b.external.every(isValidTransaction)
  );
}

router.post('/', async (req: Request, res: Response) => {
  try {
    if (!isValidRequest(req.body)) {
      res.status(400).json({
        error: 'Invalid request body. Both internal and external must be arrays of valid transactions.',
      });
      return;
    }

    const result = await reconcile(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;