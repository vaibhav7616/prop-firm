import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap, Globe, ShieldCheck } from 'lucide-react';
import { SectionHeading } from '@/components/shared/section-heading';

interface Instrument {
  symbol: string;
  name: string;
  bid: string;
  ask: string;
  spread: string;
  change: string;
  positive: boolean;
  leverage: string;
}

const INSTRUMENT_CATEGORIES: { [key: string]: Instrument[] } = {
  Forex: [
    { symbol: 'EUR/USD', name: 'Euro / US Dollar Spot CFD', bid: '1.08942', ask: '1.08943', spread: '0.1', change: '+0.24%', positive: true, leverage: '1:100' },
    { symbol: 'GBP/USD', name: 'British Pound / USD Spot CFD', bid: '1.27410', ask: '1.27412', spread: '0.2', change: '+0.15%', positive: true, leverage: '1:100' },
    { symbol: 'USD/JPY', name: 'US Dollar / Yen Spot CFD', bid: '154.220', ask: '154.223', spread: '0.3', change: '-0.38%', positive: false, leverage: '1:100' },
    { symbol: 'AUD/USD', name: 'Australian Dollar / USD Spot CFD', bid: '0.65820', ask: '0.65821', spread: '0.1', change: '+0.42%', positive: true, leverage: '1:100' },
    { symbol: 'USD/CAD', name: 'US Dollar / CAD Spot CFD', bid: '1.36950', ask: '1.36953', spread: '0.3', change: '-0.12%', positive: false, leverage: '1:100' },
  ],
  Indices: [
    { symbol: 'NAS100', name: 'US Tech 100 Cash CFD', bid: '18,450.2', ask: '18,451.0', spread: '0.8 pts', change: '+1.42%', positive: true, leverage: '1:50' },
    { symbol: 'US30', name: 'Wall Street 30 Cash CFD', bid: '39,120.5', ask: '39,121.5', spread: '1.0 pts', change: '+0.85%', positive: true, leverage: '1:50' },
    { symbol: 'SPX500', name: 'S&P 500 Cash CFD', bid: '5,210.8', ask: '5,211.2', spread: '0.4 pts', change: '+0.92%', positive: true, leverage: '1:50' },
    { symbol: 'GER40', name: 'DAX 40 Cash CFD', bid: '18,180.0', ask: '18,181.2', spread: '1.2 pts', change: '-0.20%', positive: false, leverage: '1:50' },
  ],
  Commodities: [
    { symbol: 'XAU/USD', name: 'Gold Spot CFD', bid: '2,384.50', ask: '2,384.62', spread: '0.12', change: '+0.68%', positive: true, leverage: '1:30' },
    { symbol: 'XAG/USD', name: 'Silver Spot CFD', bid: '28.450', ask: '28.462', spread: '0.012', change: '+1.10%', positive: true, leverage: '1:30' },
    { symbol: 'USOIL', name: 'WTI Crude Oil Spot CFD', bid: '78.20', ask: '78.23', spread: '0.03', change: '-1.45%', positive: false, leverage: '1:30' },
  ],
  Crypto: [
    { symbol: 'BTC/USD', name: 'Bitcoin Spot CFD', bid: '64,280.0', ask: '64,295.0', spread: '15.0', change: '+3.82%', positive: true, leverage: '1:10' },
    { symbol: 'ETH/USD', name: 'Ethereum Spot CFD', bid: '3,480.2', ask: '3,481.5', spread: '1.3', change: '+2.45%', positive: true, leverage: '1:10' },
    { symbol: 'SOL/USD', name: 'Solana Spot CFD', bid: '152.40', ask: '152.65', spread: '0.25', change: '+5.12%', positive: true, leverage: '1:10' },
  ],
};

export function InstrumentsPreview() {
  const [category, setCategory] = useState<string>('Forex');

  const activeInstruments = INSTRUMENT_CATEGORIES[category] || INSTRUMENT_CATEGORIES.Forex;

  return (
    <section className="section-pad bg-card border-b border-border">
      <div className="container-page">
        <SectionHeading
          badge="100% CFD & Spot Execution"
          title="Trade Spot Forex & Cash CFD Markets"
          subtitle="Enjoy continuous cash CFD pricing with no futures expirations, zero rollover fees, and raw institutional spreads."
        />

        {/* Category Filter Tabs */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex p-1 rounded-2xl bg-secondary border border-border gap-1">
            {Object.keys(INSTRUMENT_CATEGORIES).map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                    active
                      ? 'bg-brand-600 text-white shadow-soft-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Instruments Table */}
        <div className="mt-8 overflow-x-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
            >
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-xs font-semibold text-muted-foreground">
                    <th className="py-3.5 px-6">Instrument</th>
                    <th className="py-3.5 px-4">Bid</th>
                    <th className="py-3.5 px-4">Ask</th>
                    <th className="py-3.5 px-4">Raw Spread</th>
                    <th className="py-3.5 px-4">24h Change</th>
                    <th className="py-3.5 px-6 text-right">Max Leverage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm">
                  {activeInstruments.map((inst) => (
                    <tr key={inst.symbol} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-display font-bold text-foreground">{inst.symbol}</div>
                        <div className="text-xs text-muted-foreground">{inst.name}</div>
                      </td>
                      <td className="py-4 px-4 font-mono font-medium">{inst.bid}</td>
                      <td className="py-4 px-4 font-mono font-medium">{inst.ask}</td>
                      <td className="py-4 px-4">
                        <span className="badge-brand text-xs font-mono font-bold bg-brand-50 text-brand-700">
                          {inst.spread} pips
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold font-mono ${inst.positive ? 'text-success' : 'text-destructive'}`}>
                          {inst.positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                          {inst.change}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-xs font-semibold bg-secondary px-2.5 py-1 rounded-md text-foreground">
                          {inst.leverage}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Speed & Liquidity Badges */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-secondary/20 p-4 flex items-center gap-3">
            <Zap className="h-5 w-5 text-brand-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">&lt;10ms Execution Speed</p>
              <p className="text-[11px] text-muted-foreground">Ultra-low latency server connectivity.</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-secondary/20 p-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-brand-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">Zero Slippage Guarantee</p>
              <p className="text-[11px] text-muted-foreground">Direct Tier-1 institutional order routing.</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-secondary/20 p-4 flex items-center gap-3">
            <Globe className="h-5 w-5 text-brand-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">Weekend & News Holding</p>
              <p className="text-[11px] text-muted-foreground">Trade freely without restrictive time traps.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
