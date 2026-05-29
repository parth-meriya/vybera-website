import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Package, Tag, Info, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../../firebase/users';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const prof = await getUserProfile(user.uid);
        if (prof?.notifications) {
          // Sort by date descending
          const sorted = [...prof.notifications].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          setNotifications(sorted);
        } else {
          // Mock data for display if none exists
          setNotifications([
            {
              id: '1',
              type: 'welcome',
              title: 'Welcome to VYBERA',
              message: 'Thank you for joining the era of vibes. Start exploring our premium collections.',
              createdAt: new Date().toISOString(),
              read: false
            }
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const markAsRead = async (id) => {
    try {
      const updated = notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      setNotifications(updated);
      
      // Update in Firestore
      await updateUserProfile(user.uid, { notifications: updated });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
      
      await updateUserProfile(user.uid, { notifications: updated });
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order': return <Package size={20} className="text-vy-white" />;
      case 'promo': return <Tag size={20} className="text-vy-accent" />;
      case 'welcome': return <CheckCircle2 size={20} className="text-green-400" />;
      default: return <Info size={20} className="text-blue-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner mb-6" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-3xl tracking-wider mb-2">Notifications</h2>
          <p className="text-vy-grey text-xs tracking-[0.2em] uppercase">Updates on your orders and exclusive offers</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-vy-grey hover:text-vy-white text-[10px] tracking-widest uppercase underline decoration-vy-border hover:decoration-vy-white transition-all"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-vy-card border border-vy-border p-12 text-center flex flex-col items-center">
          <Bell size={48} className="text-vy-border mb-4" />
          <p className="text-vy-white text-lg font-bold mb-2">No new notifications</p>
          <p className="text-vy-grey text-xs">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`bg-vy-card border p-6 flex gap-4 transition-colors ${
                notif.read ? 'border-vy-border/50 opacity-70' : 'border-vy-border'
              }`}
              onClick={() => !notif.read && markAsRead(notif.id)}
            >
              <div className="shrink-0 pt-1">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-1 mb-2">
                  <h4 className={`text-sm tracking-wide ${notif.read ? 'text-vy-grey' : 'text-vy-white font-bold'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-vy-grey uppercase tracking-widest">
                    {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-vy-light text-xs leading-relaxed">{notif.message}</p>
              </div>
              {!notif.read && (
                <div className="shrink-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-vy-accent" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Notifications;
