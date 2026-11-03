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
          <p className="text-[#75665C] text-xs tracking-widest uppercase mb-1">Admin</p>
          <h1 className="font-display font-bold text-2xl tracking-wider text-[#30231F]">Support Messages</h1>
        </div>
        <div className="text-[#75665C] text-xs">
          <span className="text-[#30231F] font-semibold">Total:</span> <span className="font-bold text-[#590907]">{queries.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : queries.length === 0 ? (
        <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-12 text-center text-[#75665C] shadow-sm">
          <MessageSquare size={32} className="mx-auto mb-4 opacity-50 text-[#75665C]" />
          <p className="tracking-widest uppercase text-sm font-semibold">No support messages yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {queries.map((q) => (
            <motion.div
              layout
              key={q.id}
              className={`bg-[#FAF5ED] border p-6 transition-colors shadow-sm ${
                q.status === 'resolved' ? 'border-[#D4BEA5]/60 opacity-80' : 'border-[#D4BEA5]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                
                {/* Left: Info */}
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {q.status === 'resolved' ? (
                      <span className="badge-confirmed flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-widest font-bold rounded">
                        <CheckCircle size={11} /> Resolved
                      </span>
                    ) : (
                      <span className="badge-pending flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-widest font-bold rounded">
                        <Clock size={11} /> Pending
                      </span>
                    )}
                    <span className="text-[#75665C] text-xs">
                      {q.createdAt?.toDate ? q.createdAt.toDate().toLocaleString() : 'Just now'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-[#30231F] font-bold text-base">{q.subject || 'No Subject'}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#75665C] mt-1">
                      <p><span className="text-[#30231F] font-semibold">From:</span> {q.name}</p>
                      <p><span className="text-[#30231F] font-semibold">Email:</span> <a href={`mailto:${q.email}`} className="text-[#590907] font-semibold hover:underline">{q.email}</a></p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#F3E7D8]/60 border border-[#D4BEA5] rounded-none">
                    <p className="text-[#30231F] text-sm whitespace-pre-wrap leading-relaxed">{q.message}</p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex-shrink-0 flex md:flex-col gap-3">
                  <button
                    onClick={() => handleStatusChange(q.id, q.status)}
                    className="border border-[#D4BEA5] text-[#30231F] bg-white hover:bg-[#F3E7D8] font-bold text-xs px-4 py-2 transition-colors"
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
