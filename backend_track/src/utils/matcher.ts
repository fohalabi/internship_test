import { Transaction, MatchedPair, NearMatchedPair } from "../types/index";


const TOLERANCE = parseInt(process.env.TOLERANCE_AMOUNT || '500', 10);

export interface MatchResult {
    matched: MatchedPair[];
    near_matched: NearMatchedPair[];
    unmatched_internal: Transaction[];
    unmatched_external: Transaction[];
}

export function reconcileTransactions(
    internal: Transaction[],
    external: Transaction[]
): MatchResult {
    const matched: MatchedPair[] = [];
    const near_matched: NearMatchedPair[] = [];
    const unmatched_internal: Transaction[] = [];

    const usedExternal = new Set<string>();

    for (const int of internal) {
        const ext = external.find(
            (e) => e.reference === int.reference && !usedExternal.has(e.id)
        );

        if (!ext) {
            unmatched_internal.push(int);
            continue;
        }

        const diff = Math.abs(int.amount - ext.amount);

        if (diff === 0) {
            matched.push({
                internal_id: int.id,
                external_id: ext.id,
                amount: int.amount,
                status: 'exact',
            });
            usedExternal.add(ext.id);
        } else if (diff <= TOLERANCE) {
            near_matched.push({
                internal_id: int.id,
                external_id: ext.id,
                internal_amount: int.amount,
                external_amount: ext.amount,
                difference: diff,
                status: 'tolerance_match',
            });
            usedExternal.add(ext.id);
        } else {
            unmatched_internal.push(int);
        }
    }

    const unmatched_external = external.filter((e) => !usedExternal.has(e.id));

    return {
        matched,
        near_matched,
        unmatched_internal,
        unmatched_external
    };
}