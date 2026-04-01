import { Transaction, MatchedPair, NearMatchedPair } from '../types/index';

const TOLERANCE = parseInt(process.env.TOLERANCE_AMOUNT || '500', 10);

export interface MatchResult {
  matched: MatchedPair[];
  near_matched: NearMatchedPair[];
  unmatched_internal: Transaction[];
  unmatched_external: Transaction[];
}

export async function reconcileTransactions(
  internal: Transaction[],
  external: Transaction[]
): Promise<MatchResult> {
  const matched: MatchedPair[] = [];
  const near_matched: NearMatchedPair[] = [];
  const unmatched_internal: Transaction[] = [];
  const usedExternal = new Set<string>();

  // Build a map for O(1) external lookups by reference
  const externalMap = new Map<string, Transaction>();
  for (const ext of external) {
    externalMap.set(ext.reference, ext);
  }

  // Process each internal transaction in parallel
  const results = await Promise.all(
    internal.map(async (int) => {
      const ext = externalMap.get(int.reference);

      if (!ext || usedExternal.has(ext.id)) {
        return { type: 'unmatched_internal' as const, int };
      }

      const diff = Math.abs(int.amount - ext.amount);

      if (diff === 0) {
        usedExternal.add(ext.id);
        return {
          type: 'matched' as const,
          pair: {
            internal_id: int.id,
            external_id: ext.id,
            amount: int.amount,
            status: 'exact' as const,
          },
        };
      } else if (diff <= TOLERANCE) {
        usedExternal.add(ext.id);
        return {
          type: 'near_matched' as const,
          pair: {
            internal_id: int.id,
            external_id: ext.id,
            internal_amount: int.amount,
            external_amount: ext.amount,
            difference: diff,
            status: 'tolerance_match' as const,
          },
        };
      } else {
        return { type: 'unmatched_internal' as const, int };
      }
    })
  );

  for (const result of results) {
    if (result.type === 'matched') matched.push(result.pair);
    else if (result.type === 'near_matched') near_matched.push(result.pair);
    else unmatched_internal.push(result.int);
  }

  const unmatched_external = external.filter((e) => !usedExternal.has(e.id));

  return { matched, near_matched, unmatched_internal, unmatched_external };
}