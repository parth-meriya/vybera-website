import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Gift, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const CampaignRewards = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [freeTees, setFreeTees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      if (!user) return;
      try {
        setLoading(true);

        // Fetch coupons won via campaigns
        const couponsQuery = query(
          collection(db, 'coupons'),
          where('uid', '==', user.uid)
        );
        const couponsSnap = await getDocs(couponsQuery);
        let couponsData = couponsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter out non-campaign coupons locally to avoid Firestore composite index requirement
        couponsData = couponsData.filter(c => c.campaignId != null);

        // Sort locally since we can't orderBy on a different field than the inequality filter without an index
        couponsData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setRewards(couponsData);

        // Fetch Free Tee transactions
        const teesQuery = query(
          collection(db, 'rewardTransactions'),
          where('userId', '==', user.uid),
          where('type', '==', 'FREE_TEE')
        );
        const teesSnap = await getDocs(teesQuery);
        const teesData = teesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        teesData.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
        setFreeTees(teesData);

      } catch (err) {
        console.error('Error fetching campaign rewards:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="text-vy-gold animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-vy-white font-display font-bold text-2xl tracking-widest uppercase mb-8">
        Campaign Rewards
      </h2>

      {rewards.length === 0 && freeTees.length === 0 ? (
        <div className="bg-vy-card border border-vy-border p-12 text-center rounded-sm">
          <Ticket size={48} className="text-vy-border mx-auto mb-4" />
          <p className="text-vy-white font-semibold tracking-wider text-lg">No rewards yet</p>
          <p className="text-vy-grey text-sm mt-2 max-w-sm mx-auto">
            Find our secret QR codes in the real world to spin the wheel and win exclusive discounts.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* FREE TEES Section */}
          {freeTees.length > 0 && (
            <div>
              <h3 className="text-vy-gold text-xs font-semibold tracking-widest uppercase mb-4 border-b border-vy-border pb-2">
                Physical Rewards (Free Tees)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {freeTees.map(tee => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={tee.id}
                    className="bg-vy-card border border-vy-gold/30 p-5 rounded-sm flex items-start gap-4"
                  >
                    <div className="bg-vy-gold/10 p-3 rounded-full text-vy-gold">
                      <Gift size={24} />
                    </div>
                    <div>
                      <h4 className="text-vy-white font-semibold text-sm tracking-wider uppercase">Free Exclusive Tee</h4>
                      <p className="text-vy-grey text-xs mt-1">Campaign: {tee.campaignId}</p>
                      
                      <div className="mt-4 flex items-center gap-2">
                        <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm border ${
                          tee.status === 'pending' ? 'bg-vy-yellow/10 text-vy-yellow border-vy-yellow/20' :
                          tee.status === 'approved' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          tee.status === 'shipped' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          Status: {tee.status}
                        </span>
                      </div>
                      
                      {tee.status === 'pending' && (
                        <p className="text-vy-grey text-[10px] mt-3 tracking-wide">
                          Our team will contact you soon on your registered mobile number.
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* COUPONS Section */}
          {rewards.length > 0 && (
            <div>
              <h3 className="text-vy-white text-xs font-semibold tracking-widest uppercase mb-4 border-b border-vy-border pb-2">
                Discount Codes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rewards.map(reward => {
                  const isExpired = reward.expiry && new Date(reward.expiry) < new Date();
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={reward.id}
                      className={`bg-vy-black border p-5 rounded-sm ${
                        reward.used || isExpired ? 'border-vy-border/50 opacity-50' : 'border-vy-border'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-vy-border/20 px-3 py-1 text-vy-white text-xs font-bold tracking-widest uppercase rounded-sm inline-flex items-center gap-1.5">
                          <Ticket size={12} className="text-vy-gold" />
                          {reward.code}
                        </div>
                        <span className="text-vy-grey text-[10px] uppercase tracking-widest">
                          {reward.campaignId}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-vy-gold font-display font-bold text-xl tracking-wider">
                          {reward.type === 'percentage' ? `${reward.value}% OFF` : `₹${reward.value} OFF`}
                        </p>
                        <p className="text-vy-grey text-xs">Single Use Code</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-vy-border/50">
                        <div className="text-[10px] tracking-widest uppercase">
                          {reward.used ? (
                            <span className="text-vy-grey line-through">Redeemed</span>
                          ) : isExpired ? (
                            <span className="text-red-400">Expired</span>
                          ) : (
                            <span className="text-green-400">Available</span>
                          )}
                        </div>
                        {!reward.used && !isExpired && (
                          <Link to="/shop" className="text-vy-white hover:text-vy-gold transition-colors text-xs flex items-center gap-1 font-semibold uppercase tracking-widest">
                            Shop <ExternalLink size={12} />
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CampaignRewards;
