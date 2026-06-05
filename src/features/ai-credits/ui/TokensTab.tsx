/**
 * TokensTab — AI token usage dashboard
 *
 * Sections:
 * 1. 3 stat cards  (balance, api calls, tokens generated)
 * 2. Bar chart     (daily credits consumed — last 7 real calendar days)
 *    + Credits donut (credit_balance overview)
 * 3. Feature breakdown (by_feature from useAiCreditUsage)
 * 4. Transaction history — rendered by <TxList /> (owns its own state)
 *
 * Performance notes:
 * - TxList owns txPage/txType state → filter/pagination never re-renders this tree
 * - allLoading unifies the above-the-fold skeleton into one coordinated reveal
 * - dailyData is memoized; fromDate/toDate are stable → chart hook never re-fires
 * - StatCard split into StatCardLoading / StatCard prevents per-card diff churn
 */

import { useMemo, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, Clock, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  useAiCreditBalance,
  useAiCreditTransactions,
  useAiCreditUsage,
  invalidateCreditsCache,
} from '../api/useAiCredits';
import { TransactionList } from './TransactionList';
import { Button } from '@/shared/ui';
import Modal from '@/shared/ui/Modal';
import {
  initiateCreditPurchase,
  type CreditPackage,
  type CreditPurchaseResult,
} from '../api/creditPurchaseService';
import { useUser } from '@/shared/model/authStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const TEAL = '#64b2ffff';
const NAVY = '#1E1B4B';

const FEATURE_LABELS: Record<string, string> = {
  ai_tutor:            'AI Tutor',
  career_ai:           'Career AI',
  educator_ai:         'Educator AI',
  question_generation: 'Question Generation',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('en-IN');
}

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

// ─── Stat card — loading shell ────────────────────────────────────────────────

function StatCardLoading() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

// ─── Stat card — data shell ───────────────────────────────────────────────────

interface StatCardDataProps {
  label: string;
  value: string;
  sub?: string;
  change: number | null;
}

function StatCard({ label, value, sub, change }: StatCardDataProps) {
  const isUp = change !== null && change >= 0;
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-1">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
      {change !== null && (
        <>
          <div className="flex items-center gap-1 mt-1">
            {isUp
              ? <TrendingUp  className="w-3.5 h-3.5 text-emerald-500" />
              : <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
            <span className={`text-xs font-semibold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
              {Math.abs(change)}%
            </span>
          </div>
          <p className="text-xs text-gray-400">{isUp ? 'increase' : 'decrease'} vs last week</p>
        </>
      )}
    </div>
  );
}

// ─── Stat cards skeleton row (3 cards, matches real card height ~108px) ───────

function StatCardSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <StatCardLoading key={i} />
      ))}
    </>
  );
}

// ─── Donut ────────────────────────────────────────────────────────────────────

function TokensDonut({ used, total }: { used: number; total: number | null }) {
  const r = 56;
  const stroke = 14;
  const rr = r - stroke / 2;
  const circ = 2 * Math.PI * rr;
  const pct = total && total > 0 ? Math.min(1, used / total) : 0;
  const offset = circ * (1 - pct);
  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      <svg width={160} height={160} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={80} cy={80} r={rr} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
        <circle cx={80} cy={80} r={rr} fill="none" stroke={TEAL} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-2xl font-bold text-gray-900">{fmt(used)}</p>
        <p className="text-xs text-gray-400">{total !== null ? `of ${fmt(total)} granted` : 'credits'}</p>
      </div>
    </div>
  );
}

// ─── Bar chart builder ────────────────────────────────────────────────────────

function buildLast7Days(
  transactions: ReturnType<typeof useAiCreditTransactions>['transactions'],
) {
  const slots: { key: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    slots.push({
      key:   d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
    });
  }
  const buckets: Record<string, number> = {};
  slots.forEach(({ key }) => { buckets[key] = 0; });
  transactions.forEach((tx) => {
    if (tx.amount >= 0) return;
    const key = tx.created_at.slice(0, 10);
    if (key in buckets) buckets[key] += Math.abs(tx.amount);
  });
  return slots.map(({ key, label }, i) => ({
    day: label, value: Math.round(buckets[key]), color: i % 2 === 0 ? TEAL : NAVY,
  }));
}

// ─── Top-up modal ─────────────────────────────────────────────────────────────

const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'credits_100',  credits: 100,  price_inr: 49,  label: '100 Credits' },
  { id: 'credits_500',  credits: 500,  price_inr: 199, label: '500 Credits' },
  { id: 'credits_1000', credits: 1000, price_inr: 349, label: '1000 Credits' },
  { id: 'credits_5000', credits: 5000, price_inr: 999, label: '5000 Credits' },
];

type PurchaseState =
  | { status: 'idle' }
  | { status: 'loading'; packageId: string }
  | { status: 'success'; result: CreditPurchaseResult }
  | { status: 'error'; message: string };

interface TopUpModalProps {
  isOpen:        boolean;
  onClose:       () => void;
  onPurchased:   () => void; // called after successful purchase to refresh balance
  userName:      string;
  userEmail:     string;
}

function TopUpModal({ isOpen, onClose, onPurchased, userName, userEmail }: TopUpModalProps) {
  const [state, setState] = useState<PurchaseState>({ status: 'idle' });

  // Reset to idle whenever the modal opens
  const handleClose = useCallback(() => {
    setState({ status: 'idle' });
    onClose();
  }, [onClose]);

  const handleSelect = useCallback((pkg: CreditPackage) => {
    if (state.status === 'loading') return;

    setState({ status: 'loading', packageId: pkg.id });

    initiateCreditPurchase({
      pkg,
      userName,
      userEmail,
      onSuccess: (result) => {
        setState({ status: 'success', result });
        // Bust the balance cache so the donut/stat card refresh immediately
        invalidateCreditsCache();
        onPurchased();
      },
      onFailure: (err) => {
        // User cancelled — silently return to idle; any other error shows message
        if (err.message === 'Payment was cancelled.') {
          setState({ status: 'idle' });
        } else {
          setState({ status: 'error', message: err.message });
        }
      },
    });
  }, [state.status, userName, userEmail, onPurchased]);

  const isLoading = state.status === 'loading';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Top up credits" size="md">
      {/* ── Success state ── */}
      {state.status === 'success' && (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">Credits added!</p>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-medium text-gray-800">{fmt(state.result.credits_added)}</span> credits
              have been added to your account.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              New balance: <span className="font-medium text-gray-700">{fmt(state.result.balance_after)}</span>
            </p>
          </div>
          <Button size="sm" onClick={handleClose} className="mt-2">
            Done
          </Button>
        </div>
      )}

      {/* ── Package selection state ── */}
      {state.status !== 'success' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Choose a package. Credits are added instantly after payment — no expiry.
          </p>

          {/* Error banner */}
          {state.status === 'error' && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 p-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{state.message}</p>
            </div>
          )}

          {/* Package grid */}
          <div className="grid grid-cols-2 gap-3">
            {CREDIT_PACKAGES.map((pkg) => {
              const isThisLoading = isLoading && state.status === 'loading' && state.packageId === pkg.id;
              return (
                <button
                  key={pkg.id}
                  onClick={() => handleSelect(pkg)}
                  disabled={isLoading}
                  className={[
                    'flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                    isLoading
                      ? 'opacity-60 cursor-not-allowed border-gray-200 bg-gray-50'
                      : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 cursor-pointer',
                  ].join(' ')}
                >
                  {isThisLoading ? (
                    <div className="flex items-center gap-2 w-full justify-center py-2">
                      <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-xs text-blue-600">Opening checkout…</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-base font-bold text-gray-900">{fmt(pkg.credits)}</span>
                      <span className="text-xs text-gray-500">credits</span>
                      <span className="mt-1 text-sm font-semibold text-blue-600">₹{pkg.price_inr}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-gray-400">
            Payments are processed securely via Razorpay. Cards, UPI, Net Banking &amp; Wallets accepted.
          </p>

          <div className="flex justify-end pt-1">
            <Button variant="outline" size="sm" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Main TokensTab ───────────────────────────────────────────────────────────

export function TokensTab() {
  // Stable date strings — computed once on mount, never recomputed.
  // Prevents the chart transactions hook from re-firing on every render.
  const fromDate = useMemo(() => daysAgoISO(7), []);
  const toDate   = useMemo(() => new Date().toISOString(), []);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [topUpOpen, setTopUpOpen] = useState(false);

  // ── User context (for Razorpay prefill) ──────────────────────────────────
  const user = useUser();
  const userName  = (user as { name?: string; firstName?: string; lastName?: string } | null)?.name
    ?? [(user as { firstName?: string } | null)?.firstName, (user as { lastName?: string } | null)?.lastName].filter(Boolean).join(' ')
    ?? '';
  const userEmail = (user as { email?: string } | null)?.email ?? '';

  // ── Data ──────────────────────────────────────────────────────────────────
  const { balance, loading: balLoading, refetch: refetchBalance } = useAiCreditBalance();
  const { usage: usage7, loading: u7Loading } = useAiCreditUsage(7);

  // Bar chart + TxList: all transactions last 7 days (stable date refs → hook never re-fires)
  // Fetching all types so TxList can filter in memory — one network call instead of two.
  const { transactions: allTx, loading: txLoading } = useAiCreditTransactions({
    from: fromDate, to: toDate, limit: 200,
  });

  // ── Single coordinated above-the-fold loading flag ────────────────────────
  const allLoading = balLoading || u7Loading || txLoading;

  // ── Derived ───────────────────────────────────────────────────────────────
  const thisRequests = usage7?.total_requests ?? 0;
  const thisTokens   = usage7?.total_tokens   ?? 0;

  // Donut: shows credit_balance (remaining) vs total_credits_granted (total pool)
  // This gives a clear "how much you have left" view.
  const balanceCredits = balance?.credit_balance ?? 0;
  const grantedCredits: number | null = balance?.total_credits_granted
    ? balance.total_credits_granted
    : null;

  // Chart uses deductions only; filtered in memory from the shared fetch
  const chartTx = useMemo(() => allTx.filter(tx => tx.amount < 0), [allTx]);

  // Memoized — only recomputes when chartTx reference changes
  const dailyData = useMemo(() => buildLast7Days(chartTx), [chartTx]);

  return (
    <div className="space-y-5 p-1">

      {/* ── Section header: title left, Top up button right ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Token usage</h2>
          <p className="text-sm text-gray-400">Monitor your AI credit consumption</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTopUpOpen(true)}
          className="gap-1.5 shrink-0 bg-white"
        >
          <Zap className="w-3.5 h-3.5" />
          Top up credits
        </Button>
      </div>

      {/* ── 3 Stat cards — single skeleton reveal ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {allLoading ? (
          <StatCardSkeleton />
        ) : (
          <>
            <StatCard
              label="Credit Balance"
              value={fmt(balance?.credit_balance ?? 0)}
              sub={balance?.total_credits_granted
                ? `${fmt(balance.total_credits_granted)} total granted`
                : undefined}
              change={null}
            />
            <StatCard
              label="API Calls"
              value={fmt(thisRequests)}
              sub={usage7
                ? `${fmtDate(usage7.period_start)} – ${fmtDate(usage7.period_end)}`
                : undefined}
              change={null}
            />
            <StatCard
              label="Tokens Used"
              value={fmt(thisTokens)}
              sub="last 7 days"
              change={null}
            />
          </>
        )}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Daily usage (Credits)</h3>
          <p className="text-sm text-gray-400 mb-4">Last 7 days.</p>
          {allLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData} barSize={32} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#F3F4F6" strokeDasharray="4 4" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} tickCount={6} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', fontSize: 12 }}
                  formatter={(v: number) => [fmt(v), 'Credits']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {dailyData.map((_, i) => <Cell key={i} fill={dailyData[i].color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-gray-900">Credits</h3>
            <button
              onClick={refetchBalance}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <p className="text-sm text-gray-400 mb-2">Your available credit balance.</p>
          {balance && (
            <p className="text-xs text-gray-400 mb-3">
              Next grant: <span className="font-medium text-gray-600">{fmtDate(balance.next_monthly_reset_at)}</span>
            </p>
          )}
          <div className="flex-1 flex items-center justify-center">
            {allLoading
              ? <Skeleton className="w-40 h-40 rounded-full" />
              : <TokensDonut used={balanceCredits} total={grantedCredits} />
            }
          </div>
          {balance?.last_transaction_at && (
            <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> Last activity: {fmtDateTime(balance.last_transaction_at)}
            </p>
          )}
        </div>

      </div>

      {/* ── Feature breakdown (by_feature from useAiCreditUsage) ── */}
      {!allLoading && usage7 && Object.keys(usage7.by_feature).length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">Usage by feature — last 7 days</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(usage7.by_feature).map(([code, stats]) => (
              <div key={code} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  {FEATURE_LABELS[code] ?? code}
                </p>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Requests</span>
                    <span className="font-medium text-gray-800">{fmt(stats.requests)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tokens</span>
                    <span className="font-medium text-gray-800">{fmt(stats.tokens)}</span>
                  </div>
                </div>
                {/* Mini progress bar: this feature's tokens vs total */}
                <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-400"
                    style={{
                      width: `${usage7.total_tokens > 0
                        ? Math.round((stats.tokens / usage7.total_tokens) * 100)
                        : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Transaction history (isolated component — state changes here never
           cause the charts above to re-render) ── */}
      <TransactionList transactions={allTx} loading={txLoading} />

      {/* ── Top-up modal ── */}
      <TopUpModal
        isOpen={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        onPurchased={refetchBalance}
        userName={userName}
        userEmail={userEmail}
      />

    </div>
  );
}

export default TokensTab;
