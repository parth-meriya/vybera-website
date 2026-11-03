import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, ArrowUpRight, ArrowDownLeft, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../firebase/users';
import { getUserRewardTransactions } from '../../firebase/rewards';

const Rewards = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [prof, txs] = await Promise.all([
          getUserProfile(user.uid),
          getUserRewardTransactions(user.uid)
        ]);
        setProfile(prof || {});
        setTransactions(txs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner mb-6" />
      </div>
    );
  }

  const currentPoints = profile?.rewardPoints || 0;
  const totalEarned = profile?.totalEarnedPoints || 0;
  const totalRedeemed = profile?.totalRedeemedPoints || 0;

  // Simple tier logic for future-proofing
  const getTier = () => {
    if (totalEarned >= 10000) return 'Platinum';
    if (totalEarned >= 5000) return 'Gold';
    if (totalEarned >= 1000) return 'Silver';
    return 'Member';
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Platinum': return 'text-slate-700 border-slate-400 bg-slate-100';
      case 'Gold': return 'text-amber-800 border-amber-400 bg-amber-50';
      case 'Silver': return 'text-slate-600 border-slate-300 bg-slate-50';
      default: return 'text-[#590907] border-[#590907] bg-[#590907]/10';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h2 className="font-display font-bold text-3xl tracking-wider text-[#30231F] mb-2">VYBERA Rewards</h2>
        <p className="text-[#75665C] text-xs tracking-[0.2em] uppercase font-semibold">Your loyalty, recognized.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Balance Card */}
        <div className="bg-[#FAF5ED] border border-[#D4BEA5] rounded-2xl p-6 col-span-1 md:col-span-2 relative overflow-hidden flex flex-col justify-center shadow-sm">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#590907]/5 rounded-full pointer-events-none" />
          <Award size={120} className="absolute -bottom-10 -right-4 text-[#D4BEA5]/40 pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-6">
             <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest border rounded ${getTierColor(getTier())}`}>
               {getTier()} Tier
             </span>
             <span className="text-[10px] text-[#75665C] tracking-widest uppercase font-semibold flex items-center gap-1">
                <Info size={12}/> 1 Point = ₹1
             </span>
          </div>

          <p className="text-[#75665C] text-xs uppercase tracking-widest mb-1 font-bold">Available Balance</p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-display text-5xl font-black text-[#590907]">{currentPoints}</span>
            <span className="text-[#590907] font-bold tracking-widest uppercase text-sm">PTS</span>
          </div>
          <p className="text-sm text-[#75665C]">Equivalent Value: <span className="font-bold text-[#30231F]">₹{currentPoints}</span></p>
        </div>

        {/* Lifetime Stats */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-[#FAF5ED] border border-[#D4BEA5] rounded-xl p-6 flex-1 flex flex-col justify-center shadow-sm">
             <span className="text-[10px] text-[#75665C] uppercase tracking-widest mb-2 flex items-center gap-2 font-bold">
               <ArrowUpRight size={14} className="text-emerald-700" /> Total Earned
             </span>
             <span className="font-display text-3xl font-black text-[#30231F]">{totalEarned}</span>
          </div>
          <div className="bg-[#FAF5ED] border border-[#D4BEA5] rounded-xl p-6 flex-1 flex flex-col justify-center shadow-sm">
             <span className="text-[10px] text-[#75665C] uppercase tracking-widest mb-2 flex items-center gap-2 font-bold">
               <ArrowDownLeft size={14} className="text-[#590907]" /> Total Redeemed
             </span>
             <span className="font-display text-3xl font-black text-[#30231F]">{totalRedeemed}</span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="text-sm font-bold tracking-widest uppercase text-[#30231F] mb-6 border-b border-[#D4BEA5] pb-4">Reward History</h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-[#FAF5ED] border border-[#D4BEA5] border-dashed rounded-xl">
            <Award size={32} className="text-[#D4BEA5] mx-auto mb-4" />
            <p className="text-[#75665C] tracking-widest text-xs uppercase font-semibold">No reward transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => {
              const isEarn = tx.type === 'EARN' || tx.type === 'REFUND_RESTORE' || tx.type === 'MANUAL_ADD';
              return (
                <div key={tx.id} className="bg-[#FAF5ED] border border-[#D4BEA5] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full ${isEarn ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-[#590907]'}`}>
                      {isEarn ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                    </div>
                    <div>
                      <p className="text-sm text-[#30231F] font-bold">{tx.description}</p>
                      <p className="text-[10px] text-[#75665C] tracking-widest uppercase mt-1 font-medium">
                        {tx.timestamp?.toDate?.().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <p className={`font-black font-mono ${isEarn ? 'text-emerald-700' : 'text-[#590907]'}`}>
                      {isEarn ? '+' : '-'}{tx.points} PTS
                    </p>
                    <p className="text-[9px] text-[#75665C] uppercase tracking-widest mt-1 font-semibold">
                      {tx.type.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </motion.div>
  );
};

export default Rewards;
