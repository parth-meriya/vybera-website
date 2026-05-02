import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { getSupportQueries, updateSupportQueryStatus } from '../../firebase/contact';
import toast from 'react-hot-toast';

const AdminSupport = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const data = await getSupportQueries();
      setQueries(data);
    } catch (e) {
      toast.error('Failed to fetch messages.', { className: 'toast-vybera' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'resolved' : 'pending';
    try {
      await updateSupportQueryStatus(id, newStatus);
      toast.success(`Message marked as ${newStatus}.`, { className: 'toast-vybera' });
      setQueries(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q));
    } catch (e) {
      toast.error('Failed to update status.', { className: 'toast-vybera' });
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-vy-grey text-xs tracking-widest uppercase mb-1">Admin</p>
          <h1 className="font-display font-bold text-2xl tracking-wider text-vy-white">Support Messages</h1>
        </div>
        <div className="text-vy-grey text-xs">
          <span className="text-vy-white font-semibold">Total:</span> {queries.length}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : queries.length === 0 ? (
        <div className="bg-vy-card border border-vy-border p-12 text-center text-vy-grey">
          <MessageSquare size={32} className="mx-auto mb-4 opacity-50" />
          <p className="tracking-widest uppercase text-sm">No support messages yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {queries.map((q) => (
            <motion.div
              layout
              key={q.id}
              className={`bg-vy-card border p-6 transition-colors ${
                q.status === 'resolved' ? 'border-vy-border/40 opacity-75' : 'border-vy-border'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                
                {/* Left: Info */}
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {q.status === 'resolved' ? (
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] uppercase tracking-widest font-bold">
                        <CheckCircle size={10} /> Resolved
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] uppercase tracking-widest font-bold">
                        <Clock size={10} /> Pending
                      </span>
                    )}
                    <span className="text-vy-grey text-xs">
                      {q.createdAt?.toDate ? q.createdAt.toDate().toLocaleString() : 'Just now'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-vy-white font-semibold text-base">{q.subject || 'No Subject'}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-vy-grey mt-1">
                      <p><span className="text-vy-white/70">From:</span> {q.name}</p>
                      <p><span className="text-vy-white/70">Email:</span> <a href={`mailto:${q.email}`} className="text-blue-400 hover:underline">{q.email}</a></p>
                    </div>
                  </div>

                  <div className="p-4 bg-vy-dark border border-vy-border/50 rounded-sm">
                    <p className="text-vy-white text-sm whitespace-pre-wrap leading-relaxed">{q.message}</p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex-shrink-0 flex md:flex-col gap-3">
                  <button
                    onClick={() => handleStatusChange(q.id, q.status)}
                    className="btn-outline text-xs px-4 py-2"
                  >
                    Mark as {q.status === 'pending' ? 'Resolved' : 'Pending'}
                  </button>
                  <a
                    href={`mailto:${q.email}?subject=Re: ${q.subject || 'Your Support Request'}`}
                    className="btn-primary text-xs px-4 py-2 text-center"
                  >
                    Reply via Email
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSupport;
