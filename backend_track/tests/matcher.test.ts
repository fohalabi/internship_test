import { reconcileTransactions } from '../src/utils/matcher';

describe('reconcileTransactions', () => {
  test('happy path — exact matches only', async () => {
    const result = await reconcileTransactions(
      [
        { id: 'TXN-001', amount: 10000, currency: 'NGN', reference: 'PAY-A' },
        { id: 'TXN-002', amount: 20000, currency: 'NGN', reference: 'PAY-B' },
      ],
      [
        { id: 'EXT-A', amount: 10000, currency: 'NGN', reference: 'PAY-A' },
        { id: 'EXT-B', amount: 20000, currency: 'NGN', reference: 'PAY-B' },
      ]
    );
    expect(result.matched).toHaveLength(2);
    expect(result.near_matched).toHaveLength(0);
    expect(result.unmatched_internal).toHaveLength(0);
    expect(result.unmatched_external).toHaveLength(0);
  });

  test('mixed — exact, tolerance, and unmatched', async () => {
    const result = await reconcileTransactions(
      [
        { id: 'TXN-001', amount: 10000, currency: 'NGN', reference: 'PAY-A' },
        { id: 'TXN-002', amount: 20000, currency: 'NGN', reference: 'PAY-B' },
        { id: 'TXN-003', amount: 5000, currency: 'NGN', reference: 'PAY-C' },
      ],
      [
        { id: 'EXT-A', amount: 10000, currency: 'NGN', reference: 'PAY-A' },
        { id: 'EXT-B', amount: 20300, currency: 'NGN', reference: 'PAY-B' },
        { id: 'EXT-D', amount: 7500, currency: 'NGN', reference: 'PAY-D' },
      ]
    );
    expect(result.matched).toHaveLength(1);
    expect(result.near_matched).toHaveLength(1);
    expect(result.unmatched_internal).toHaveLength(1);
    expect(result.unmatched_external).toHaveLength(1);
  });

  test('edge case — empty arrays', async () => {
    const result = await reconcileTransactions([], []);
    expect(result.matched).toHaveLength(0);
    expect(result.near_matched).toHaveLength(0);
    expect(result.unmatched_internal).toHaveLength(0);
    expect(result.unmatched_external).toHaveLength(0);
  });

  test('edge case — all unmatched', async () => {
    const result = await reconcileTransactions(
      [{ id: 'TXN-001', amount: 10000, currency: 'NGN', reference: 'PAY-X' }],
      [{ id: 'EXT-001', amount: 10000, currency: 'NGN', reference: 'PAY-Z' }]
    );
    expect(result.matched).toHaveLength(0);
    expect(result.near_matched).toHaveLength(0);
    expect(result.unmatched_internal).toHaveLength(1);
    expect(result.unmatched_external).toHaveLength(1);
  });
});