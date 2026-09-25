import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { DollarSign, ShieldCheck } from 'lucide-react';

interface PayoutItem {
  id: string;
  trader: string;
  country: string;
  flag: string;
  amount: string;
  method: string;
  timeAgo: string;
  accountSize: string;
}

const GLOBAL_PAYOUTS_POOL: PayoutItem[] = [
  { id: '1', trader: 'Rajesh S.', country: 'India', flag: '🇮🇳', amount: '$7,250.00', method: 'Bank Transfer', timeAgo: '2m ago', accountSize: '$200,000' },
  { id: '2', trader: 'Marcus Vance', country: 'United Kingdom', flag: '🇬🇧', amount: '$18,450.00', method: 'Crypto (USDC)', timeAgo: '4m ago', accountSize: '$200,000' },
  { id: '3', trader: 'Aarav P.', country: 'India', flag: '🇮🇳', amount: '$380.00', method: 'UPI', timeAgo: '7m ago', accountSize: '$5,000' },
  { id: '4', trader: 'Alexandre Dubois', country: 'France', flag: '🇫🇷', amount: '$8,940.50', method: 'Crypto (USDT)', timeAgo: '11m ago', accountSize: '$100,000' },
  { id: '5', trader: 'Vikram M.', country: 'India', flag: '🇮🇳', amount: '$1,850.00', method: 'Crypto (USDT)', timeAgo: '15m ago', accountSize: '$25,000' },
  { id: '6', trader: 'Lucas Schneider', country: 'Germany', flag: '🇩🇪', amount: '$9,350.00', method: 'Bank Transfer', timeAgo: '19m ago', accountSize: '$100,000' },
  { id: '7', trader: 'Ananya R.', country: 'India', flag: '🇮🇳', amount: '$3,420.00', method: 'Bank Transfer', timeAgo: '23m ago', accountSize: '$50,000' },
  { id: '8', trader: 'Sofia Martinez', country: 'Spain', flag: '🇪🇸', amount: '$11,200.00', method: 'Crypto (USDT)', timeAgo: '27m ago', accountSize: '$100,000' },
  { id: '9', trader: 'Rohan V.', country: 'India', flag: '🇮🇳', amount: '$5,890.00', method: 'Razorpay', timeAgo: '32m ago', accountSize: '$100,000' },
  { id: '10', trader: 'Liam O\'Connor', country: 'Australia', flag: '🇦🇺', amount: '$22,400.00', method: 'Wire Transfer', timeAgo: '36m ago', accountSize: '$200,000' },
  { id: '11', trader: 'Sneha K.', country: 'India', flag: '🇮🇳', amount: '$7,360.00', method: 'Crypto (USDC)', timeAgo: '41m ago', accountSize: '$200,000' },
  { id: '12', trader: 'David Miller', country: 'United States', flag: '🇺🇸', amount: '$16,800.00', method: 'Crypto (USDT)', timeAgo: '45m ago', accountSize: '$200,000' },
  { id: '13', trader: 'Priya N.', country: 'India', flag: '🇮🇳', amount: '$820.00', method: 'UPI', timeAgo: '49m ago', accountSize: '$10,000' },
  { id: '14', trader: 'Elena Rostova', country: 'Estonia', flag: '🇪🇪', amount: '$12,300.00', method: 'Wise Transfer', timeAgo: '53m ago', accountSize: '$100,000' },
  { id: '15', trader: 'Suresh M.', country: 'India', flag: '🇮🇳', amount: '$2,940.00', method: 'Bank Transfer', timeAgo: '58m ago', accountSize: '$50,000' },
  { id: '16', trader: 'Kenji Takahashi', country: 'Japan', flag: '🇯🇵', amount: '$34,100.00', method: 'Crypto (USDC)', timeAgo: '1h ago', accountSize: '$400,000' },
  { id: '17', trader: 'Arjun D.', country: 'India', flag: '🇮🇳', amount: '$1,420.00', method: 'Crypto (USDT)', timeAgo: '1h ago', accountSize: '$25,000' },
  { id: '18', trader: 'Oliver Smith', country: 'Canada', flag: '🇨🇦', amount: '$14,600.00', method: 'Bank Transfer', timeAgo: '1h ago', accountSize: '$100,000' },
  { id: '19', trader: 'Amit J.', country: 'India', flag: '🇮🇳', amount: '$4,980.00', method: 'Razorpay', timeAgo: '2h ago', accountSize: '$100,000' },
  { id: '20', trader: 'Sophia Müller', country: 'Switzerland', flag: '🇨🇭', amount: '$19,250.00', method: 'Bank Wire', timeAgo: '2h ago', accountSize: '$200,000' },
  { id: '21', trader: 'Deepak K.', country: 'India', flag: '🇮🇳', amount: '$7,150.00', method: 'Crypto (USDC)', timeAgo: '2h ago', accountSize: '$200,000' },
  { id: '22', trader: 'Matteo Rossi', country: 'Italy', flag: '🇮🇹', amount: '$13,400.00', method: 'Revolut Pay', timeAgo: '2h ago', accountSize: '$100,000' },
  { id: '23', trader: 'Aditya G.', country: 'India', flag: '🇮🇳', amount: '$3,150.00', method: 'Bank Transfer', timeAgo: '3h ago', accountSize: '$50,000' },
  { id: '24', trader: 'Lars Lindqvist', country: 'Sweden', flag: '🇸🇪', amount: '$7,850.00', method: 'Crypto (USDT)', timeAgo: '3h ago', accountSize: '$50,000' },
  { id: '25', trader: 'Pooja I.', country: 'India', flag: '🇮🇳', amount: '$1,920.00', method: 'UPI', timeAgo: '3h ago', accountSize: '$25,000' },
  { id: '26', trader: 'Tariq Al-Mansoor', country: 'UAE', flag: '🇦🇪', amount: '$28,900.00', method: 'Bank Wire', timeAgo: '3h ago', accountSize: '$300,000' },
  { id: '27', trader: 'Rahul D.', country: 'India', flag: '🇮🇳', amount: '$750.00', method: 'Razorpay', timeAgo: '4h ago', accountSize: '$10,000' },
  { id: '28', trader: 'Chloe Lefebvre', country: 'France', flag: '🇫🇷', amount: '$15,100.00', method: 'Bank Transfer', timeAgo: '4h ago', accountSize: '$200,000' },
  { id: '29', trader: 'Vivek M.', country: 'India', flag: '🇮🇳', amount: '$6,120.00', method: 'Crypto (USDT)', timeAgo: '4h ago', accountSize: '$100,000' },
  { id: '30', trader: 'Sunita P.', country: 'India', flag: '🇮🇳', amount: '$410.00', method: 'UPI', timeAgo: '5h ago', accountSize: '$5,000' },
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
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="flex gap-4 whitespace-nowrap pt-1"
        >
          {[...items, ...items].map((p, i) => (
            <div
              key={`${p.id}-${i}`}
              className="inline-flex items-center gap-3 rounded-xl bg-brand-900/80 border border-brand-800/80 px-3.5 py-1.5 text-xs text-brand-100 shadow-sm"
            >
              <span className="text-base">{p.flag}</span>
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

