import { SourceLabel } from '../original/SourceLabel';
import { MoneyPolicyNotice } from '../components/MoneyPolicyNotice';
import { useMoneyPolicy } from '../hooks/useMoneyPolicy';
import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import type { RechargePackage } from '@shared/types';
import { CoinIcon } from '../components/ui/CoinIcon';

export function RechargeView({
  packages,
  onSelect,
  onBack
}: {
  packages: RechargePackage[],
  onSelect: (pkg: RechargePackage, method: 'GOOGLE_PAY' | 'APPLE_PAY') => void,
  onBack: () => void;
}) {
  const policy = useMoneyPolicy();
  const detectPaymentMethod = (): 'APPLE_PAY' | 'GOOGLE_PAY' => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod|macintosh/.test(ua)) {
      return 'APPLE_PAY';
    }
    return 'GOOGLE_PAY';
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0514]">
      <div className="p-4 flex items-center gap-4 border-b border-white/5">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h2 className="text-xl font-bold text-white"><SourceLabel text="Recharge Coins" /></h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        <div className="space-y-4">
          <MoneyPolicyNotice />
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest px-2"><SourceLabel text="Select a Package" /></p>
          {/* Packages Grid */}
          <div className="grid grid-cols-2 gap-4">
            {packages.map(pkg => (
              <button
                key={pkg.id}
                    disabled={policy?.rechargeMode !== 'sandbox'}
                    data-recharge-package={pkg.id}
                onClick={() => onSelect(pkg, detectPaymentMethod())}
                className="relative p-6 rounded-3xl border-2 bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all flex flex-col items-center gap-3 active:scale-95 group"
              >

                <div className="flex items-center gap-2 group-hover:scale-110 transition-transform">
                  <span className="text-3xl font-black text-white">{pkg.coins}</span>
                  <CoinIcon className="w-5 h-5" />
                </div>
                <div className="text-purple-400 font-black text-lg">${pkg.amount}</div>
                    {!!pkg.channelFeeUsd && <span className="text-xs text-gray-300">Channel fee: {pkg.channelFeeUsd} USD</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div className="space-y-4">
          <div className="p-5 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white font-bold text-sm"><SourceLabel text="Sandbox Preview" /></p>
              <p className="text-[10px] text-gray-500 font-medium"><SourceLabel text="No real Apple or Google payment is made" /></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
