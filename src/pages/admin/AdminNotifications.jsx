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
        <h1 className="font-display font-bold text-3xl text-[#30231F] mb-2 tracking-wider">Notification Center</h1>
        <p className="text-[#75665C] text-xs uppercase tracking-widest font-semibold">Send multi-channel alerts and review system dispatch logs</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Dispatch Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 shadow-sm">
            <h2 className="text-[#30231F] text-sm font-bold tracking-wider uppercase mb-6 flex items-center gap-2">
              <Send size={16} className="text-[#590907]" />
              Dispatch Notification
            </h2>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#75665C] font-semibold mb-2">Recipient Target</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setTargetType('all'); setSelectedUserUid(''); }}
                    className={`py-2 text-[10px] font-bold tracking-wider uppercase border text-center transition-all ${
                      targetType === 'all' 
                        ? 'bg-[#590907] border-[#590907] text-white' 
                        : 'border-[#D4BEA5] bg-white text-[#30231F] hover:bg-[#F3E7D8]'
                    }`}
                  >
                    Broadcast (All)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('user')}
                    className={`py-2 text-[10px] font-bold tracking-wider uppercase border text-center transition-all ${
                      targetType === 'user' 
                        ? 'bg-[#590907] border-[#590907] text-white' 
                        : 'border-[#D4BEA5] bg-white text-[#30231F] hover:bg-[#F3E7D8]'
                    }`}
                  >
                    Target Specific
                  </button>
                </div>
              </div>

              {targetType === 'user' && (
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-[#75665C] font-semibold">Select User</label>
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-3 text-[#75665C]" />
                    <input
                      value={userSearchTerm}
                      onChange={e => setUserSearchTerm(e.target.value)}
                      placeholder="Search recipient..."
                      className="w-full bg-white border border-[#D4BEA5] text-[#30231F] placeholder:text-[#75665C]/60 pl-8 py-2 text-[11px] focus:outline-none focus:border-[#590907]"
                    />
                  </div>
                  <select
                    value={selectedUserUid}
                    onChange={e => setSelectedUserUid(e.target.value)}
                    className="text-xs cursor-pointer w-full py-2 bg-white border border-[#D4BEA5] text-[#30231F] px-2"
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
                <label className="block text-[10px] uppercase tracking-widest text-[#75665C] font-semibold mb-2">Category Type</label>
                <select
                  value={notifType}
                  onChange={e => setNotifType(e.target.value)}
                  className="text-xs cursor-pointer w-full py-2 bg-white border border-[#D4BEA5] text-[#30231F] px-2"
                >
                  <option value="promo">Promo Alert (Special Offers)</option>
                  <option value="order">Order Notification (Status)</option>
                  <option value="welcome">Welcome Onboarding</option>
                  <option value="info">System Alert / Info</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#75665C] font-semibold mb-2">Notification Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Spin Wheel Reward Won!"
                  className="w-full bg-white border border-[#D4BEA5] text-[#30231F] placeholder:text-[#75665C]/60 px-3 py-2 text-xs focus:outline-none focus:border-[#590907]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#75665C] font-semibold mb-2">Message Body</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write message content details..."
                  rows={4}
                  className="w-full bg-white border border-[#D4BEA5] text-[#30231F] placeholder:text-[#75665C]/60 p-3 text-xs resize-none focus:outline-none focus:border-[#590907]"
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
          <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 shadow-sm">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <h2 className="text-[#30231F] text-sm font-bold tracking-wider uppercase flex items-center gap-2">
                <Bell size={16} className="text-[#590907]" />
                Dispatch & Delivery Audit Logs
              </h2>
              <button 
                onClick={fetchLogs}
                className="p-1.5 border border-[#D4BEA5] text-[#75665C] hover:text-[#590907] transition-colors"
                title="Refresh Logs"
              >
                <RotateCw size={13} className={logsLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="mb-4 relative">
              <Search size={14} className="absolute left-3 top-3.5 text-[#75665C]" />
              <input
                value={logsSearchTerm}
                onChange={e => setLogsSearchTerm(e.target.value)}
                placeholder="Search logs by recipient, title, message..."
                className="w-full bg-white border border-[#D4BEA5] text-[#30231F] placeholder:text-[#75665C]/60 pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-[#590907]"
              />
            </div>

            {logsLoading && logs.length === 0 ? (
              <div className="py-24 text-center flex flex-col justify-center items-center gap-3">
                <div className="spinner" />
                <span className="text-[#75665C] text-xs uppercase tracking-widest font-semibold">Fetching Dispatch History...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <p className="text-[#75665C] text-xs py-16 text-center border border-[#D4BEA5] bg-[#F3E7D8]/50">No notification logs match your query.</p>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map(log => (
                  <div key={log.id} className="border border-[#D4BEA5] bg-[#F3E7D8]/60 p-4 space-y-3 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[#30231F] text-xs font-bold font-display">{log.title}</span>
                        <p className="text-[11px] text-[#75665C] mt-0.5">To: <span className="text-[#30231F] font-semibold">{log.userName}</span> ({log.userEmail})</p>
                      </div>
                      <span className="text-[10px] text-[#75665C] font-mono">
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Recently'}
                      </span>
                    </div>

                    <p className="text-xs text-[#30231F] leading-relaxed bg-white p-3 font-sans border-l-4 border-[#590907]">{log.message}</p>

                    {/* Channel Indicators */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <span className="text-[10px] text-[#75665C] uppercase tracking-widest font-bold">Delivery Status:</span>
                      <div className="flex flex-wrap gap-2">
                        {/* Push badge */}
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded ${
                          log.channels?.push === 'Delivered' 
                            ? 'badge-confirmed' 
                            : 'bg-white text-[#75665C] border border-[#D4BEA5]'
                        }`}>
                          <Bell size={10} /> In-App: {log.channels?.push || 'Pending'}
                        </div>

                        {/* Email badge */}
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded ${
                          log.channels?.email?.startsWith('Sent') 
                            ? 'badge-processing' 
                            : 'bg-white text-[#75665C] border border-[#D4BEA5]'
                        }`}>
                          <Mail size={10} /> Email: {log.channels?.email?.startsWith('Sent') ? 'Dispatched' : (log.channels?.email || 'Disabled')}
                        </div>

                        {/* WhatsApp badge */}
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded ${
                          log.channels?.whatsapp?.startsWith('Sent') 
                            ? 'badge-confirmed' 
                            : 'bg-white text-[#75665C] border border-[#D4BEA5]'
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
