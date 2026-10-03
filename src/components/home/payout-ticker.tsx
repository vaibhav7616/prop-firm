import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { DollarSign, ShieldCheck } from 'lucide-react';

interface PayoutItem {
  id: string;
  trader: string;
  country: string;
  countryCode: string;
  flag: string;
  amount: string;
  method: string;
  timeAgo: string;
  accountSize: string;
}

const GLOBAL_PAYOUTS_POOL: PayoutItem[] = [
  { id: '1', trader: 'Oliver S.', country: 'Canada', countryCode: 'CA', flag: '🇨🇦', amount: '$4,850.00', method: 'Bank Wire', timeAgo: '2m ago', accountSize: '$100,000' },
  { id: '2', trader: 'Rajesh S.', country: 'India', countryCode: 'IN', flag: '🇮🇳', amount: '$7,250.00', method: 'Bank Transfer', timeAgo: '4m ago', accountSize: '$200,000' },
  { id: '3', trader: 'Marcus V.', country: 'United States', countryCode: 'US', flag: '🇺🇸', amount: '$8,940.00', method: 'Crypto (USDT)', timeAgo: '7m ago', accountSize: '$200,000' },
  { id: '4', trader: 'Elena R.', country: 'Germany', countryCode: 'DE', flag: '🇩🇪', amount: '$3,420.00', method: 'SEPA Transfer', timeAgo: '11m ago', accountSize: '$50,000' },
  { id: '5', trader: 'Kenji T.', country: 'Japan', countryCode: 'JP', flag: '🇯🇵', amount: '$5,120.00', method: 'Crypto (USDC)', timeAgo: '15m ago', accountSize: '$100,000' },
  { id: '6', trader: 'Sneha K.', country: 'India', countryCode: 'IN', flag: '🇮🇳', amount: '$7,360.00', method: 'Crypto (USDC)', timeAgo: '19m ago', accountSize: '$200,000' },
  { id: '7', trader: 'Liam W.', country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', amount: '$6,280.00', method: 'Bank Wire', timeAgo: '24m ago', accountSize: '$100,000' },
  { id: '8', trader: 'Alexandre D.', country: 'France', countryCode: 'FR', flag: '🇫🇷', amount: '$4,150.00', method: 'SEPA Transfer', timeAgo: '29m ago', accountSize: '$50,000' },
  { id: '9', trader: 'Aarav P.', country: 'India', countryCode: 'IN', flag: '🇮🇳', amount: '$1,850.00', method: 'UPI', timeAgo: '33m ago', accountSize: '$25,000' },
  { id: '10', trader: 'Lucas S.', country: 'Brazil', countryCode: 'BR', flag: '🇧🇷', amount: '$2,940.00', method: 'Crypto (USDT)', timeAgo: '38m ago', accountSize: '$50,000' },
  { id: '11', trader: 'Sophia M.', country: 'Australia', countryCode: 'AU', flag: '🇦🇺', amount: '$5,450.00', method: 'Bank Wire', timeAgo: '42m ago', accountSize: '$100,000' },
  { id: '12', trader: 'Tariq A.', country: 'United Arab Emirates', countryCode: 'AE', flag: '🇦🇪', amount: '$9,200.00', method: 'Crypto (USDT)', timeAgo: '47m ago', accountSize: '$200,000' },
  { id: '13', trader: 'Mateo G.', country: 'Spain', countryCode: 'ES', flag: '🇪🇸', amount: '$3,180.00', method: 'SEPA Transfer', timeAgo: '52m ago', accountSize: '$50,000' },
  { id: '14', trader: 'Vikram M.', country: 'India', countryCode: 'IN', flag: '🇮🇳', amount: '$4,980.00', method: 'Razorpay', timeAgo: '58m ago', accountSize: '$100,000' },
  { id: '15', trader: 'Chloe B.', country: 'Canada', countryCode: 'CA', flag: '🇨🇦', amount: '$3,890.00', method: 'Bank Wire', timeAgo: '1h ago', accountSize: '$50,000' },
  { id: '16', trader: 'Jonas K.', country: 'Switzerland', countryCode: 'CH', flag: '🇨🇭', amount: '$7,850.00', method: 'Bank Wire', timeAgo: '1h ago', accountSize: '$200,000' },
  { id: '17', trader: 'Ananya R.', country: 'India', countryCode: 'IN', flag: '🇮🇳', amount: '$2,420.00', method: 'Bank Transfer', timeAgo: '2h ago', accountSize: '$25,000' },
  { id: '18', trader: 'David L.', country: 'Singapore', countryCode: 'SG', flag: '🇸🇬', amount: '$6,640.00', method: 'Crypto (USDC)', timeAgo: '2h ago', accountSize: '$100,000' },
];

export function LivePayoutTicker() {
  const [items, setItems] = useState<PayoutItem[]>(GLOBAL_PAYOUTS_POOL);

  // Periodically rotate payout items so names and values shift dynamically
  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) => {
        const next = [...prev];
        const first = next.shift();
        if (first) next.push(first);
        return next;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-brand-950 text-white border-y border-brand-800/60 py-3 overflow-hidden shadow-inner">
      <div className="container-page flex items-center gap-4 mb-1">
        <div className="flex items-center gap-2 shrink-0 text-xs font-semibold uppercase tracking-wider text-brand-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          <ShieldCheck className="h-3.5 w-3.5 text-brand-400" />
          Live Verified Payouts
        </div>
        <div className="h-3 w-px bg-brand-800" />
        <span className="text-xs text-brand-200/80 hidden sm:inline">
          Total Paid Out This Month: <strong className="text-white font-mono font-bold">$3,842,500+</strong>
        </span>
      </div>

      <div className="relative flex w-full overflow-hidden">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
          className="flex gap-4 whitespace-nowrap pt-1"
        >
          {[...items, ...items].map((p, i) => (
            <div
              key={`${p.id}-${i}`}
              className="inline-flex items-center gap-3 rounded-xl bg-brand-900/80 border border-brand-800/80 px-3.5 py-1.5 text-xs text-brand-100 shadow-sm"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-brand-300 bg-brand-800/90 border border-brand-700/60 px-1.5 py-0.5 rounded">
                  {p.countryCode}
                </span>
                <span className="text-sm">{p.flag}</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 font-medium text-white">
                  <span>{p.trader}</span>
                  <span className="text-[10px] text-brand-300/80 font-normal">({p.accountSize})</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-brand-300">
                  <span className="font-semibold font-mono text-emerald-400">{p.amount}</span>
                  <span>•</span>
                  <span>{p.method}</span>
                  <span>•</span>
                  <span className="text-brand-400/80">{p.timeAgo}</span>
                </div>
              </div>
              <DollarSign className="h-3.5 w-3.5 text-emerald-400 shrink-0 ml-1" />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
