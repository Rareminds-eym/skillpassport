/**
 * TxList — Transaction History section
 *
 * Receives the full transaction list from TokensTab (shared fetch).
 * All filtering and pagination happen in memory — zero extra network calls.
 */

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Zap, Clock } from 'lucide-react';
import type { CreditTransaction } from '../api/useAiCredits';

// ─── Constants (duplicated here so TxList has no upward dep on TokensTab) ────

const FEATURE_LABELS: Record<string, string> = {
  ai_tutor:            'AI Tutor',
  career_ai:           'Career AI',
  educator_ai:         'Educator AI',
  question_generation: 'Question Generation',
};

const TX_LABELS: Record<string, { label: string; color: string }> = {
  welcome_bonus:      { label: 'Welcome Bonus',      color: 'text-emerald-600' },
  subscription_grant: { label: 'Subscription Grant', color: 'text-blue-600'    },
  purchase:           { label: 'Purchase',           color: 'text-indigo-600'  },
  refill:             { label: 'Refill',             color: 'text-cyan-600'    },
  deduction:          { label: 'Usage',              color: 'text-rose-600'    },
  refund:             { label: 'Refund',             color: 'text-emerald-600' },
  admin_adjustment:   { label: 'Adjustment',         color: 'text-gray-600'    },
  expiry:             { label: 'Expired',            color: 'text-gray-400'    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('en-IN');
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

// ─── Filter options ───────────────────────────────────────────────────────────

const TX_TYPE_OPTIONS = [
  { value: '',                   label: 'All'      },
  { value: 'deduction',          label: 'Usage'    },
  { value: 'subscription_grant', label: 'Grants'   },
  { value: 'welcome_bonus',      label: 'Bonus'    },
  { value: 'purchase',           label: 'Purchase' },
  { value: 'refund',             label: 'Refund'   },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface TxListProps {
  transactions: CreditTransaction[];
  loading: boolean;
}

// ─── TxList ───────────────────────────────────────────────────────────────────

const LIMIT = 10;

export function TransactionList({ transactions, loading }: TxListProps) {
  const [txPage, setTxPage] = useState(1);
  const [txType, setTxType] = useState('');

  // Filter in memory — instant, no network call
  const filtered = useMemo(
    () => txType
      ? transactions.filter(tx => tx.transaction_type === txType)
      : transactions,
    [transactions, txType],
  );

  // Paginate in memory
  const totalPages = Math.ceil(filtered.length / LIMIT);
  const pageRows   = useMemo(
    () => filtered.slice((txPage - 1) * LIMIT, txPage * LIMIT),
    [filtered, txPage],
  );

  const pagination = filtered.length > 0 ? {
    page:        txPage,
    total:       filtered.length,
    total_pages: totalPages,
    has_prev:    txPage > 1,
    has_next:    txPage < totalPages,
  } : null;

  // Debounce filter changes by one frame to batch React state updates
  function handleTypeChange(value: string) {
    setTxType(value);
    setTimeout(() => setTxPage(1), 0);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header + filter pills */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-900">Transaction History</h3>
        <div className="flex gap-1 flex-wrap">
          {TX_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleTypeChange(opt.value)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                txType === opt.value
                  ? 'bg-teal-100 text-teal-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeletons — only shown on initial load */}
      {loading && (
        <div className="px-6 py-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[52px] w-full" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-10">No transactions found.</p>
      )}

      {/* Transaction rows */}
      {pageRows.length > 0 && (
        <div className="divide-y divide-gray-50">
          {pageRows.map((tx) => {
            const isDebit = tx.amount < 0;
            const info = TX_LABELS[tx.transaction_type] ?? { label: tx.transaction_type, color: 'text-gray-600' };
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between px-6 py-3 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDebit ? 'bg-rose-50' : 'bg-emerald-50'}`}>
                    <Zap className={`w-3.5 h-3.5 ${isDebit ? 'text-rose-500' : 'text-emerald-500'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${info.color}`}>
                      {info.label}
                      {tx.feature && (
                        <span className="ml-1.5 text-xs text-gray-400 font-normal">
                          · {FEATURE_LABELS[tx.feature] ?? tx.feature}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />{fmtDateTime(tx.created_at)}
                      {tx.notes && (
                        <span className="ml-2 truncate max-w-[160px]">· {tx.notes}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className={`text-sm font-semibold ${isDebit ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {isDebit ? '' : '+'}{fmt(Math.abs(tx.amount))}
                  </p>
                  <p className="text-xs text-gray-400">
                    {fmt(tx.balance_before)} → {fmt(tx.balance_after)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {pagination.total} transactions · page {pagination.page} of {pagination.total_pages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setTxPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.has_prev}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setTxPage((p) => p + 1)}
              disabled={!pagination.has_next}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
