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
      case 'order': return <Package size={20} className="text-[#590907]" />;
      case 'promo': return <Tag size={20} className="text-[#590907]" />;
      case 'welcome': return <CheckCircle2 size={20} className="text-emerald-700" />;
      default: return <Info size={20} className="text-blue-700" />;
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
          <h2 className="font-display font-bold text-3xl tracking-wider text-[#30231F] mb-2">Notification Center</h2>
          <p className="text-[#75665C] text-xs tracking-[0.2em] uppercase font-semibold">Updates on your orders, wheel spins and channel settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#D4BEA5]">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-6 py-3 text-xs uppercase tracking-widest font-bold border-b-2 transition-all ${
            activeTab === 'inbox' 
              ? 'border-[#590907] text-[#590907] bg-[#590907]/10' 
              : 'border-transparent text-[#75665C] hover:text-[#30231F]'
          }`}
        >
          Inbox Messages {unreadCount > 0 && <span className="ml-1.5 px-2 py-0.5 bg-[#590907] text-white text-[10px] font-bold rounded-full">{unreadCount}</span>}
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-6 py-3 text-xs uppercase tracking-widest font-bold border-b-2 transition-all ${
            activeTab === 'preferences' 
              ? 'border-[#590907] text-[#590907] bg-[#590907]/10' 
              : 'border-transparent text-[#75665C] hover:text-[#30231F]'
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
                  className="text-[#75665C] hover:text-[#590907] text-[10px] tracking-widest uppercase font-bold underline decoration-[#D4BEA5] hover:decoration-[#590907] transition-all"
                >
                  Mark all as read
                </button>
              </div>
            )}

            {notifications.length === 0 ? (
              <div className="bg-[#FAF5ED] border border-[#D4BEA5] rounded-2xl p-12 text-center flex flex-col items-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#E8D2B5]/40 flex items-center justify-center mb-4">
                  <Bell size={32} className="text-[#590907]" />
                </div>
                <p className="text-[#30231F] text-lg font-bold mb-2">No new notifications</p>
                <p className="text-[#75665C] text-xs">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`bg-[#FAF5ED] border p-6 rounded-xl flex gap-4 transition-all cursor-pointer shadow-sm ${
                      notif.read ? 'border-[#D4BEA5] opacity-75' : 'border-[#590907] ring-1 ring-[#590907]/20'
                    }`}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    <div className="shrink-0 pt-1">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-1 mb-2">
                        <h4 className={`text-sm tracking-wide ${notif.read ? 'text-[#75665C] font-semibold' : 'text-[#30231F] font-bold'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-[#75665C] uppercase tracking-widest font-semibold">
                          {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-[#75665C] text-xs leading-relaxed font-medium">{notif.message}</p>
                    </div>
                    {!notif.read && (
                      <div className="shrink-0 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#590907]" />
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
            className="bg-[#FAF5ED] border border-[#D4BEA5] rounded-2xl p-8 space-y-6 shadow-sm"
          >
            <div>
              <h3 className="text-[#30231F] text-base font-bold uppercase tracking-wider mb-2">Multi-Channel Alerts Settings</h3>
              <p className="text-[#75665C] text-xs">Choose which updates you wish to receive on each delivery channel.</p>
            </div>

            <div className="space-y-6 border-t border-[#D4BEA5] pt-6">
              {/* Push Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-b border-[#D4BEA5]/60 pb-6">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-[#590907]" />
                  <span className="text-xs uppercase tracking-widest font-bold text-[#30231F]">In-App Push</span>
                </div>
                {['order', 'spin', 'promo'].map(cat => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={preferences.push[cat]}
                      onChange={() => handlePreferenceToggle('push', cat)}
                      className="w-4 h-4 rounded border-[#D4BEA5] accent-[#590907] cursor-pointer"
                    />
                    <span className="text-xs text-[#75665C] capitalize font-medium group-hover:text-[#30231F]">
                      {cat === 'promo' ? 'Promos & Offers' : cat === 'spin' ? 'Rewards & Spins' : 'Order Updates'}
                    </span>
                  </label>
                ))}
              </div>

              {/* Email Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-b border-[#D4BEA5]/60 pb-6">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-[#590907]" />
                  <span className="text-xs uppercase tracking-widest font-bold text-[#30231F]">Email Alerts</span>
                </div>
                {['order', 'spin', 'promo'].map(cat => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={preferences.email[cat]}
                      onChange={() => handlePreferenceToggle('email', cat)}
                      className="w-4 h-4 rounded border-[#D4BEA5] accent-[#590907] cursor-pointer"
                    />
                    <span className="text-xs text-[#75665C] capitalize font-medium group-hover:text-[#30231F]">
                      {cat === 'promo' ? 'Promos & Offers' : cat === 'spin' ? 'Rewards & Spins' : 'Order Updates'}
                    </span>
                  </label>
                ))}
              </div>

              {/* WhatsApp Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start pb-2">
                <div className="flex items-center gap-3">
                  <MessageCircle size={18} className="text-emerald-700" />
                  <span className="text-xs uppercase tracking-widest font-bold text-[#30231F]">WhatsApp</span>
                </div>
                {['order', 'spin', 'promo'].map(cat => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={preferences.whatsapp[cat]}
                      onChange={() => handlePreferenceToggle('whatsapp', cat)}
                      className="w-4 h-4 rounded border-[#D4BEA5] accent-[#590907] cursor-pointer"
                    />
                    <span className="text-xs text-[#75665C] capitalize font-medium group-hover:text-[#30231F]">
                      {cat === 'promo' ? 'Promos & Offers' : cat === 'spin' ? 'Rewards & Spins' : 'Order Updates'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#D4BEA5]">
              <button
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="btn-primary flex items-center gap-2 text-xs py-2.5 px-6"
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
