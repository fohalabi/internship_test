import { ReconcileRequest, ReconcileResponse } from '../types/index';
import { reconcileTransactions } from '../utils/matcher';

export function reconcile(data: ReconcileRequest): ReconcileResponse {
    const { matched, near_matched, unmatched_internal, unmatched_external } = 
        reconcileTransactions(data.internal, data.external);

    return {
        matched,
        near_matched,
        unmatched_internal,
        unmatched_external,
        summary: {
            total_internal: data.internal.length,
            total_external: data.external.length,
            matched: matched.length,
            near_matched: near_matched.length,
            unmatched_internal: unmatched_internal.length,
            unmatched_external: unmatched_external.length,
        },
    };
}