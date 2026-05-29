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
      case 'Platinum': return 'text-slate-300 border-slate-300';
      case 'Gold': return 'text-yellow-400 border-yellow-400';
      case 'Silver': return 'text-gray-300 border-gray-300';
      default: return 'text-vy-accent border-vy-accent';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h2 className="font-display font-bold text-3xl tracking-wider mb-2">VYBERA Rewards</h2>
        <p className="text-vy-grey text-xs tracking-[0.2em] uppercase">Your loyalty, recognized.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Balance Card */}
        <div className="bg-vy-card border border-vy-border p-6 col-span-1 md:col-span-2 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-vy-accent/5 rounded-full pointer-events-none" />
          <Award size={120} className="absolute -bottom-10 -right-4 text-vy-border/20 pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-6">
             <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest border ${getTierColor(getTier())}`}>
               {getTier()} Tier
             </span>
             <span className="text-[10px] text-vy-grey tracking-widest uppercase flex items-center gap-1">
                <Info size={12}/> 1 Point = ₹1
             </span>
          </div>

          <p className="text-vy-grey text-xs uppercase tracking-widest mb-1">Available Balance</p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-display text-5xl font-bold">{currentPoints}</span>
            <span className="text-vy-accent font-bold tracking-widest uppercase">PTS</span>
          </div>
          <p className="text-sm text-vy-white">Equivalent Value: <span className="font-bold">₹{currentPoints}</span></p>
        </div>

        {/* Lifetime Stats */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-vy-card border border-vy-border p-6 flex-1 flex flex-col justify-center">
             <span className="text-[10px] text-vy-grey uppercase tracking-widest mb-2 flex items-center gap-2">
               <ArrowUpRight size={14} className="text-green-400" /> Total Earned
             </span>
             <span className="font-display text-3xl font-bold">{totalEarned}</span>
          </div>
          <div className="bg-vy-card border border-vy-border p-6 flex-1 flex flex-col justify-center">
             <span className="text-[10px] text-vy-grey uppercase tracking-widest mb-2 flex items-center gap-2">
               <ArrowDownLeft size={14} className="text-vy-accent" /> Total Redeemed
             </span>
             <span className="font-display text-3xl font-bold">{totalRedeemed}</span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="text-sm font-bold tracking-widest uppercase text-vy-white mb-6 border-b border-vy-border pb-4">Reward History</h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-vy-card border border-vy-border border-dashed">
            <Award size={32} className="text-vy-border mx-auto mb-4 opacity-50" />
            <p className="text-vy-grey tracking-widest text-xs uppercase">No reward transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => {
              const isEarn = tx.type === 'EARN' || tx.type === 'REFUND_RESTORE' || tx.type === 'MANUAL_ADD';
              return (
                <div key={tx.id} className="bg-vy-card border border-vy-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-vy-black border ${isEarn ? 'border-green-500/30 text-green-400' : 'border-vy-accent/30 text-vy-accent'}`}>
                      {isEarn ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                    </div>
                    <div>
                      <p className="text-sm text-vy-white font-medium">{tx.description}</p>
                      <p className="text-[10px] text-vy-grey tracking-widest uppercase mt-1">
                        {tx.timestamp?.toDate?.().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <p className={`font-bold ${isEarn ? 'text-green-400' : 'text-vy-accent'}`}>
                      {isEarn ? '+' : '-'}{tx.points} PTS
                    </p>
                    <p className="text-[9px] text-vy-border uppercase tracking-widest mt-1">
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
