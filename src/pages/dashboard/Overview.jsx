import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../firebase/users';
import { getOrdersByUser } from '../../firebase/orders';

const Overview = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [prof, orders] = await Promise.all([
          getUserProfile(user.uid),
          getOrdersByUser(user.uid)
        ]);
        setProfile(prof);
        setOrderCount(orders?.length || 0);
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

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h2 className="font-display font-bold text-3xl tracking-wider mb-2">Dashboard Overview</h2>
        <p className="text-vy-grey text-xs tracking-[0.2em] uppercase">Manage your premium VYBERA experience</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="bg-vy-card border border-vy-border p-6 col-span-1 lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-vy-accent/5 rounded-bl-full pointer-events-none" />
          <h3 className="text-vy-grey text-[10px] uppercase tracking-widest mb-4">Profile Details</h3>
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-vy-border uppercase tracking-widest">Name</span>
              <span className="text-lg font-bold">{profile?.name || user?.displayName || 'N/A'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-vy-border uppercase tracking-widest">Email</span>
              <span className="text-sm">{user?.email}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-vy-border uppercase tracking-widest">Mobile</span>
              <span className="text-sm">{profile?.phone || 'Not added'}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-vy-card border border-vy-border p-6 flex-1 flex flex-col justify-center">
             <span className="text-[10px] text-vy-grey uppercase tracking-widest mb-2">Total Orders</span>
             <span className="font-display text-4xl font-bold">{orderCount}</span>
          </div>
          <div className="bg-vy-card border border-vy-border p-6 flex-1 flex flex-col justify-center">
             <span className="text-[10px] text-vy-grey uppercase tracking-widest mb-2">Member Since</span>
             <span className="font-bold">
               {profile?.createdAt?.toDate?.()?.getFullYear() || new Date(user?.metadata?.creationTime).getFullYear() || '2025'}
             </span>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default Overview;
