import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Send, Search, Users, ShieldAlert, Mail, MessageCircle, RotateCw, Info, Check, AlertCircle } from 'lucide-react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers } from '../../firebase/users';
import toast from 'react-hot-toast';

const AdminNotifications = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);

  // Form State
  const [targetType, setTargetType] = useState('all'); // all | user
  const [selectedUserUid, setSelectedUserUid] = useState('');
  const [notifType, setNotifType] = useState('promo'); // order | promo | welcome | info
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Search & Filtering State
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [logsSearchTerm, setLogsSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const q = query(
        collection(db, 'notificationLogs'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Failed to fetch notification logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
        setLoading(false);
        await fetchLogs();
      } catch (err) {
        toast.error('Failed to load admin notification data');
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      return toast.error('Please enter a title and message.');
    }
    if (targetType === 'user' && !selectedUserUid) {
      return toast.error('Please select a recipient user.');
    }

    setSending(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUid: targetType === 'all' ? 'all' : selectedUserUid,
          type: notifType,
          title: title.trim(),
          message: message.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to dispatch notification.');
      }

      toast.success(targetType === 'all' ? 'Broadcast notification sent successfully!' : 'Targeted notification sent successfully!');
      setTitle('');
      setMessage('');
      setSelectedUserUid('');
      await fetchLogs();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const filteredLogs = logs.filter(log => 
    (log.userEmail || '').toLowerCase().includes(logsSearchTerm.toLowerCase()) ||
    (log.userName || '').toLowerCase().includes(logsSearchTerm.toLowerCase()) ||
    (log.title || '').toLowerCase().includes(logsSearchTerm.toLowerCase()) ||
    (log.message || '').toLowerCase().includes(logsSearchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="p-8 pb-32 max-w-5xl mx-auto space-y-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display font-bold text-3xl text-vy-white mb-2">Notification Center</h1>
        <p className="text-vy-grey text-xs uppercase tracking-widest">Send multi-channel alerts and review system dispatch logs</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Dispatch Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-vy-card border border-vy-border p-6 rounded-md">
            <h2 className="text-vy-white text-sm font-semibold tracking-wider uppercase mb-6 flex items-center gap-2">
              <Send size={16} className="text-vy-accent" />
              Dispatch Notification
            </h2>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vy-grey mb-2">Recipient Target</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setTargetType('all'); setSelectedUserUid(''); }}
                    className={`py-2 text-[10px] font-bold tracking-wider uppercase border text-center transition-all ${
                      targetType === 'all' 
                        ? 'bg-vy-accent/15 border-vy-accent text-vy-accent' 
                        : 'border-vy-border text-vy-grey hover:text-vy-white'
                    }`}
                  >
                    Broadcast (All)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('user')}
                    className={`py-2 text-[10px] font-bold tracking-wider uppercase border text-center transition-all ${
                      targetType === 'user' 
                        ? 'bg-vy-accent/15 border-vy-accent text-vy-accent' 
                        : 'border-vy-border text-vy-grey hover:text-vy-white'
                    }`}
                  >
                    Target Specific
                  </button>
                </div>
              </div>

              {targetType === 'user' && (
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-vy-grey">Select User</label>
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-3 text-vy-grey" />
                    <input
                      value={userSearchTerm}
                      onChange={e => setUserSearchTerm(e.target.value)}
                      placeholder="Search recipient..."
                      className="vy-input pl-8 py-2 text-[11px]"
                    />
                  </div>
                  <select
                    value={selectedUserUid}
                    onChange={e => setSelectedUserUid(e.target.value)}
                    className="vy-input text-xs cursor-pointer w-full py-2 bg-vy-dark border border-vy-border"
                  >
                    <option value="">-- Choose User --</option>
                    {filteredUsers.slice(0, 15).map(u => (
                      <option key={u.id} value={u.uid || u.id}>
                        {u.name || 'No Name'} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vy-grey mb-2">Category Type</label>
                <select
                  value={notifType}
                  onChange={e => setNotifType(e.target.value)}
                  className="vy-input text-xs cursor-pointer w-full"
                >
                  <option value="promo">Promo Alert (Special Offers)</option>
                  <option value="order">Order Notification (Status)</option>
                  <option value="welcome">Welcome Onboarding</option>
                  <option value="info">System Alert / Info</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vy-grey mb-2">Notification Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Spin Wheel Reward Won!"
                  className="vy-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vy-grey mb-2">Message Body</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write message content details..."
                  rows={4}
                  className="vy-input text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="btn-primary w-full py-3 text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 mt-4"
              >
                {sending ? <div className="spinner w-4 h-4" /> : <Bell size={13} />}
                Send Notification
              </button>
            </form>
          </div>
        </div>

        {/* Right Columns: Multi-channel Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-vy-card border border-vy-border p-6 rounded-md">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <h2 className="text-vy-white text-sm font-semibold tracking-wider uppercase flex items-center gap-2">
                <Bell size={16} className="text-vy-gold" />
                Dispatch & Delivery Audit Logs
              </h2>
              <button 
                onClick={fetchLogs}
                className="p-1 border border-vy-border text-vy-grey hover:text-vy-white transition-colors"
                title="Refresh Logs"
              >
                <RotateCw size={13} className={logsLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="mb-4 relative">
              <Search size={14} className="absolute left-3 top-3.5 text-vy-grey" />
              <input
                value={logsSearchTerm}
                onChange={e => setLogsSearchTerm(e.target.value)}
                placeholder="Search logs by recipient, title, message..."
                className="vy-input pl-9 w-full text-xs"
              />
            </div>

            {logsLoading && logs.length === 0 ? (
              <div className="py-24 text-center flex flex-col justify-center items-center gap-3">
                <div className="spinner" />
                <span className="text-vy-grey text-xs uppercase tracking-widest">Fetching Dispatch History...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <p className="text-vy-grey text-xs py-16 text-center border border-vy-border bg-vy-black/10">No notification logs match your query.</p>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map(log => (
                  <div key={log.id} className="border border-vy-border bg-vy-black/25 p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-vy-white text-xs font-bold font-display">{log.title}</span>
                        <p className="text-[10px] text-vy-grey mt-0.5">To: <span className="text-vy-light">{log.userName}</span> ({log.userEmail})</p>
                      </div>
                      <span className="text-[9px] text-vy-grey font-mono">
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Recently'}
                      </span>
                    </div>

                    <p className="text-xs text-vy-light/95 leading-relaxed bg-vy-black/40 p-2.5 font-sans border-l-2 border-vy-accent/40">{log.message}</p>

                    {/* Channel Indicators */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <span className="text-[9px] text-vy-border uppercase tracking-widest font-bold">Delivery Status:</span>
                      <div className="flex flex-wrap gap-2">
                        {/* Push badge */}
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 border text-[9px] uppercase tracking-wider font-semibold ${
                          log.channels?.push === 'Delivered' 
                            ? 'text-green-400 border-green-500/20 bg-green-500/5' 
                            : 'text-vy-grey border-vy-border bg-vy-black/20'
                        }`}>
                          <Bell size={10} /> In-App: {log.channels?.push || 'Pending'}
                        </div>

                        {/* Email badge */}
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 border text-[9px] uppercase tracking-wider font-semibold ${
                          log.channels?.email?.startsWith('Sent') 
                            ? 'text-blue-400 border-blue-500/20 bg-blue-500/5' 
                            : 'text-vy-grey border-vy-border bg-vy-black/20'
                        }`}>
                          <Mail size={10} /> Email: {log.channels?.email?.startsWith('Sent') ? 'Dispatched' : (log.channels?.email || 'Disabled')}
                        </div>

                        {/* WhatsApp badge */}
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 border text-[9px] uppercase tracking-wider font-semibold ${
                          log.channels?.whatsapp?.startsWith('Sent') 
                            ? 'text-green-400 border-green-500/20 bg-green-500/5' 
                            : 'text-vy-grey border-vy-border bg-vy-black/20'
                        }`}>
                          <MessageCircle size={10} /> WhatsApp: {log.channels?.whatsapp?.startsWith('Sent') ? 'Dispatched' : (log.channels?.whatsapp || 'Disabled')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminNotifications;
