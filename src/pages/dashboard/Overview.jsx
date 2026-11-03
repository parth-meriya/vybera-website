import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../firebase/users';
import { getOrdersByUser } from '../../firebase/orders';
import { getUserRewardTransactions } from '../../firebase/rewards';
import { getUserCoupons } from '../../firebase/coupons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Wallet, Users, Gift, Clock, Copy, Check, Calendar, ArrowUpRight, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const Overview = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Expanded Dashboard States
  const [referralCount, setReferralCount] = useState(0);
  const [coupons, setCoupons] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  const referralLink = `${window.location.origin}/signup?ref=${user?.uid || ''}`;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Sync expired points on mount
        await fetch('/api/sync-rewards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid })
        }).catch(err => console.error('Rewards sync failed:', err));

        const [prof, orders, txs, cps] = await Promise.all([
          getUserProfile(user.uid),
          getOrdersByUser(user.uid),
          getUserRewardTransactions(user.uid),
          getUserCoupons(user.uid)
        ]);

        setProfile(prof);
        setOrderCount(orders?.length || 0);
        setCoupons(cps);

        // 1. Fetch Referral Count dynamically from DB
        const refQuery = query(collection(db, 'users'), where('referredBy', '==', user.uid));
        const refSnap = await getDocs(refQuery);
        setReferralCount(refSnap.size);

        // 2. Build Chronological Activity Timeline
        const events = [
          ...orders.map(o => ({
            id: o.id,
            type: 'order',
            date: o.createdAt?.toDate?.() || new Date(o.createdAt),
            title: 'Order Placed',
            desc: `Order #${o.id.slice(0, 8)} worth ₹${o.total.toLocaleString()} confirmed.`,
            icon: ArrowUpRight,
            color: 'text-vy-gold border-vy-gold/20 bg-vy-gold/5'
          })),
          ...txs.map(t => ({
            id: t.id,
            type: 'reward',
            date: t.timestamp?.toDate?.() || new Date(t.timestamp),
            title: t.type === 'FREE_TEE' ? 'Free Tee Winner!' : (t.type === 'EARN' ? 'Points Credited' : 'Points Redeemed'),
            desc: t.description || `Points transaction processed.`,
            icon: Award,
            color: t.type === 'REDEEM' ? 'text-red-400 border-red-500/20 bg-red-500/5' : 'text-green-400 border-green-500/20 bg-green-500/5'
          }))
        ].sort((a, b) => b.date - a.date);

        setTimelineEvents(events.slice(0, 5)); // Keep top 5 latest events

      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success('Referral link copied to clipboard!', { className: 'toast-vybera' });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code ${code} copied!`, { className: 'toast-vybera' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <div>
        <h2 className="font-display font-bold text-3xl tracking-wider mb-2 text-[#30231F]">My Profile</h2>
        <p className="text-[#75665C] text-xs tracking-[0.2em] uppercase font-semibold">Manage your premium VYBERA experience</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Wallet */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 relative overflow-hidden shadow-sm">
            <h3 className="text-[#75665C] text-[10px] uppercase tracking-widest mb-4 font-bold">Profile Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#75665C] uppercase tracking-widest font-semibold">Name</span>
                <span className="text-base font-bold text-[#30231F] mt-1">{profile?.name || user?.displayName || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#75665C] uppercase tracking-widest font-semibold">Email</span>
                <span className="text-sm font-medium text-[#30231F] mt-1 truncate">{user?.email}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#75665C] uppercase tracking-widest font-semibold">Mobile</span>
                <span className="text-sm font-medium text-[#30231F] mt-1">{profile?.phone || 'Not added'}</span>
              </div>
            </div>
          </div>

          {/* Wallet & Referral Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wallet Balance */}
            <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 relative overflow-hidden flex flex-col justify-between shadow-sm">
              <div className="absolute top-4 right-4 text-[#D4BEA5]/40"><Wallet size={40} /></div>
              <div>
                <span className="text-[10px] text-[#75665C] uppercase tracking-widest mb-1 block font-bold">VYBERA Wallet</span>
                <h4 className="font-display text-3xl font-bold text-[#590907]">{profile?.rewardPoints || 0} Points</h4>
                <p className="text-[#75665C] text-xs mt-1 font-medium">Equivalent to ₹{(profile?.rewardPoints || 0).toLocaleString()} cashback</p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#D4BEA5] text-[10px] text-[#75665C] uppercase tracking-wider font-semibold">
                Points auto-applied at checkout payment.
              </div>
            </div>

            {/* Referrals & Invites */}
            <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 flex flex-col justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-[#75665C] uppercase tracking-widest mb-1 block font-bold">Referrals program</span>
                <h4 className="font-display text-3xl font-bold text-[#30231F]">{referralCount} Friends Joined</h4>
                <p className="text-[#75665C] text-xs mt-1 font-medium">Earn points for every friend who registers and shops.</p>
              </div>
              <div className="mt-4">
                <span className="text-[9px] text-[#75665C] uppercase tracking-widest block mb-2 font-bold">Share Invite Link</span>
                <div className="flex items-center gap-2 bg-white border border-[#D4BEA5] px-3 py-2">
                  <span className="text-[10px] font-mono text-[#30231F] font-semibold truncate flex-1">{referralLink}</span>
                  <button onClick={handleCopyLink} className="text-[#590907] hover:underline transition-colors p-1" title="Copy Link">
                    {copiedLink ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 shadow-sm">
            <h3 className="text-[#75665C] text-[10px] uppercase tracking-widest mb-6 font-bold flex items-center gap-2">
              <Clock size={12} className="text-[#590907]" /> Recent Activity Timeline
            </h3>
            {timelineEvents.length === 0 ? (
              <p className="text-[#75665C] text-xs py-4 text-center">No recent activities recorded.</p>
            ) : (
              <div className="relative border-l border-[#D4BEA5] pl-6 space-y-6">
                {timelineEvents.map((evt) => {
                  const Icon = evt.icon;
                  return (
                    <div key={evt.id} className="relative">
                      {/* Dot icon */}
                      <span className={`absolute -left-[35px] top-0.5 rounded-full border p-1 bg-white ${
                        evt.type === 'order' ? 'text-[#590907] border-[#590907]' : 'text-emerald-700 border-emerald-500'
                      }`}>
                        <Icon size={12} />
                      </span>
                      <div>
                        <span className="text-[10px] text-[#75665C] font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                          <Calendar size={10} /> {new Date(evt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <h4 className="text-sm font-bold text-[#30231F] uppercase tracking-wider">{evt.title}</h4>
                        <p className="text-xs text-[#75665C] mt-0.5 leading-relaxed font-medium">{evt.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Quick Stats & Coupons */}
        <div className="space-y-6">
          {/* Quick Stats Summary */}
          <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 space-y-4 shadow-sm">
            <h3 className="text-[#75665C] text-[10px] uppercase tracking-widest font-bold">Account Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-[#D4BEA5] p-4 bg-white text-center">
                <span className="text-[9px] text-[#75665C] uppercase tracking-widest block font-bold">Total Orders</span>
                <span className="text-2xl font-bold text-[#590907] font-display mt-1 block font-mono">{orderCount}</span>
              </div>
              <div className="border border-[#D4BEA5] p-4 bg-white text-center">
                <span className="text-[9px] text-[#75665C] uppercase tracking-widest block font-bold">Member Since</span>
                <span className="text-2xl font-bold text-[#30231F] font-display mt-1 block font-mono">
                  {profile?.createdAt?.toDate?.()?.getFullYear() || new Date(user?.metadata?.creationTime).getFullYear() || '2025'}
                </span>
              </div>
            </div>
          </div>

          {/* Active Coupons panel */}
          <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-[#75665C] text-[10px] uppercase tracking-widest mb-4 font-bold flex items-center gap-2">
                <Gift size={12} className="text-[#590907]" /> Active Coupons
              </h3>
              {coupons.length === 0 ? (
                <div className="border border-[#D4BEA5] bg-[#F3E7D8]/60 p-6 text-center text-[#75665C] text-xs font-medium">
                  No active reward coupons. Spin the wheel to unlock!
                </div>
              ) : (
                <div className="space-y-3">
                  {coupons.map(cp => (
                    <div key={cp.id} className="p-3 border border-[#D4BEA5] bg-white flex items-center justify-between group hover:border-[#590907] transition-all">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[#590907] text-xs font-bold select-all">{cp.code}</span>
                          <span className="text-[9px] px-1 bg-[#590907]/10 text-[#590907] uppercase tracking-wider font-bold">
                            {cp.value}{cp.type === 'percentage' ? '%' : ' OFF'}
                          </span>
                        </div>
                        {cp.expiry && (
                          <span className="text-[10px] text-[#75665C] block mt-1 font-medium">
                            Expires {new Date(cp.expiry).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => handleCopyCoupon(cp.code)}
                        className="p-1.5 border border-[#D4BEA5] text-[#75665C] hover:text-[#590907] hover:border-[#590907] transition-all"
                        title="Copy Code"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Overview;
