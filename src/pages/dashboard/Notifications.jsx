import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Package, Tag, Info, CheckCircle2, Settings, Mail, MessageCircle, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../../firebase/users';
import toast from 'react-hot-toast';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inbox'); // inbox | preferences

  // Notification Preferences State
  const [preferences, setPreferences] = useState({
    push: { order: true, spin: true, promo: true },
    email: { order: true, spin: true, promo: true },
    whatsapp: { order: true, spin: true, promo: true }
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const prof = await getUserProfile(user.uid);
        if (prof?.notifications) {
          const sorted = [...prof.notifications].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          setNotifications(sorted);
        } else {
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

        // Set loaded preferences
        if (prof?.notificationPreferences) {
          setPreferences(prof.notificationPreferences);
        }
      } catch (err) {
        console.error('Failed to fetch notifications profile:', err);
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

  const handlePreferenceToggle = (channel, category) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [category]: !prev[channel][category]
      }
    }));
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await updateUserProfile(user.uid, { notificationPreferences: preferences });
      toast.success('Notification preferences updated successfully!', { className: 'toast-vybera' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to update notification settings.', { className: 'toast-vybera' });
    } finally {
      setSavingPrefs(false);
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-3xl tracking-wider mb-2">Notification Center</h2>
          <p className="text-vy-grey text-xs tracking-[0.2em] uppercase">Updates on your orders, wheel spins and channel settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-vy-border/40">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-6 py-3 text-xs uppercase tracking-widest font-bold border-b-2 transition-all ${
            activeTab === 'inbox' 
              ? 'border-vy-accent text-vy-accent bg-vy-accent/5' 
              : 'border-transparent text-vy-grey hover:text-vy-white'
          }`}
        >
          Inbox Messages {unreadCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-vy-accent text-vy-black text-[9px] font-black">{unreadCount}</span>}
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-6 py-3 text-xs uppercase tracking-widest font-bold border-b-2 transition-all ${
            activeTab === 'preferences' 
              ? 'border-vy-accent text-vy-accent bg-vy-accent/5' 
              : 'border-transparent text-vy-grey hover:text-vy-white'
          }`}
        >
          Channel Preferences
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'inbox' ? (
          <motion.div
            key="inbox"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            {unreadCount > 0 && (
              <div className="flex justify-end mb-2">
                <button 
                  onClick={markAllAsRead}
                  className="text-vy-grey hover:text-vy-white text-[10px] tracking-widest uppercase underline decoration-vy-border hover:decoration-vy-white transition-all"
                >
                  Mark all as read
                </button>
              </div>
            )}

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
                    className={`bg-vy-card border p-6 flex gap-4 transition-colors cursor-pointer ${
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
        ) : (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="bg-vy-card border border-vy-border p-6 space-y-6"
          >
            <div>
              <h3 className="text-vy-white text-sm font-bold uppercase tracking-wider mb-2">Multi-Channel Alerts settings</h3>
              <p className="text-vy-grey text-xs">Choose which updates you wish to receive on each delivery channel.</p>
            </div>

            <div className="space-y-6 border-t border-vy-border/40 pt-6">
              {/* Push Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-b border-vy-border/30 pb-6">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-vy-white" />
                  <span className="text-xs uppercase tracking-widest font-bold text-vy-white">In-App Push</span>
                </div>
                {['order', 'spin', 'promo'].map(cat => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={preferences.push[cat]}
                      onChange={() => handlePreferenceToggle('push', cat)}
                      className="w-4 h-4 rounded-none border border-vy-border bg-vy-black checked:bg-vy-white transition-all cursor-pointer"
                    />
                    <span className="text-xs text-vy-light capitalize group-hover:text-vy-white">
                      {cat === 'promo' ? 'Promos & Offers' : cat === 'spin' ? 'Rewards & Spins' : 'Order Updates'}
                    </span>
                  </label>
                ))}
              </div>

              {/* Email Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-b border-vy-border/30 pb-6">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-vy-accent" />
                  <span className="text-xs uppercase tracking-widest font-bold text-vy-white">Email alerts</span>
                </div>
                {['order', 'spin', 'promo'].map(cat => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={preferences.email[cat]}
                      onChange={() => handlePreferenceToggle('email', cat)}
                      className="w-4 h-4 rounded-none border border-vy-border bg-vy-black checked:bg-vy-white transition-all cursor-pointer"
                    />
                    <span className="text-xs text-vy-light capitalize group-hover:text-vy-white">
                      {cat === 'promo' ? 'Promos & Offers' : cat === 'spin' ? 'Rewards & Spins' : 'Order Updates'}
                    </span>
                  </label>
                ))}
              </div>

              {/* WhatsApp Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start pb-2">
                <div className="flex items-center gap-3">
                  <MessageCircle size={18} className="text-green-400" />
                  <span className="text-xs uppercase tracking-widest font-bold text-vy-white">WhatsApp</span>
                </div>
                {['order', 'spin', 'promo'].map(cat => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={preferences.whatsapp[cat]}
                      onChange={() => handlePreferenceToggle('whatsapp', cat)}
                      className="w-4 h-4 rounded-none border border-vy-border bg-vy-black checked:bg-vy-white transition-all cursor-pointer"
                    />
                    <span className="text-xs text-vy-light capitalize group-hover:text-vy-white">
                      {cat === 'promo' ? 'Promos & Offers' : cat === 'spin' ? 'Rewards & Spins' : 'Order Updates'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-vy-border/40">
              <button
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="btn-primary flex items-center gap-2 text-xs py-2 px-5"
              >
                {savingPrefs ? <div className="spinner w-4 h-4" /> : <Save size={14} />}
                Save Preferences
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Notifications;
