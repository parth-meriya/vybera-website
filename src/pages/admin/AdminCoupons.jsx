import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';
import {
  getAllCoupons,
  addCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCoupon,
} from '../../firebase/coupons';
import toast from 'react-hot-toast';

const emptyForm = {
  code: '',
  type: 'percentage',
  value: '',
  minOrder: '',
  maxDiscount: '',
  active: true,
  showToUser: false,
  usageLimit: '',
};

const CouponModal = ({ coupon, onClose, onSaved }) => {
  const [form, setForm] = useState(coupon || emptyForm);
  const [loading, setLoading] = useState(false);

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value) {
      toast.error('Code and value are required.', { className: 'toast-vybera' });
      return;
    }
    setLoading(true);
    try {
      const data = {
        ...form,
        value: Number(form.value),
        minOrder: form.minOrder ? Number(form.minOrder) : 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : 0,
      };
      if (coupon?.id) {
        await updateCoupon(coupon.id, data);
        toast.success('Coupon updated.', { className: 'toast-vybera' });
      } else {
        await addCoupon(data);
        toast.success('Coupon created.', { className: 'toast-vybera' });
      }
      onSaved();
    } catch {
      toast.error('Failed to save coupon.', { className: 'toast-vybera' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#FAF5ED] border border-[#D4BEA5] w-full max-w-lg shadow-2xl rounded-sm"
      >
        <div className="flex items-center justify-between p-6 border-b border-[#D4BEA5]">
          <h2 className="text-[#30231F] font-bold text-lg tracking-wider">
            {coupon?.id ? 'Edit Coupon' : 'Create Coupon'}
          </h2>
          <button onClick={onClose} className="text-[#75665C] hover:text-[#30231F]"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[#75665C] text-xs font-semibold tracking-widest uppercase block mb-2">Coupon Code</label>
              <input name="code" value={form.code} onChange={onChange} className="vy-input font-mono uppercase text-xs" placeholder="VYBERA20" required />
            </div>
            <div>
              <label className="text-[#75665C] text-xs font-semibold tracking-widest uppercase block mb-2">Type</label>
              <select name="type" value={form.type} onChange={onChange} className="vy-input text-xs">
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-[#75665C] text-xs font-semibold tracking-widest uppercase block mb-2">
                Value ({form.type === 'percentage' ? '%' : '₹'})
              </label>
              <input name="value" type="number" value={form.value} onChange={onChange} className="vy-input text-xs" placeholder="20" required />
            </div>
            <div>
              <label className="text-[#75665C] text-xs font-semibold tracking-widest uppercase block mb-2">Min Order (₹)</label>
              <input name="minOrder" type="number" value={form.minOrder} onChange={onChange} className="vy-input text-xs" placeholder="Optional" />
            </div>
            <div>
              <label className="text-[#75665C] text-xs font-semibold tracking-widest uppercase block mb-2">Max Discount (₹)</label>
              <input name="maxDiscount" type="number" value={form.maxDiscount} onChange={onChange} className="vy-input text-xs" placeholder="Optional" />
            </div>
            <div>
              <label className="text-[#75665C] text-xs font-semibold tracking-widest uppercase block mb-2">Usage Limit (0=∞)</label>
              <input name="usageLimit" type="number" value={form.usageLimit} onChange={onChange} className="vy-input text-xs" placeholder="0" />
            </div>
            <div>
              <label className="text-[#75665C] text-xs font-semibold tracking-widest uppercase block mb-2">Expiry Date</label>
              <input name="expiry" type="date" value={form.expiry} onChange={onChange} className="vy-input text-xs" />
            </div>
          </div>
          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                className="w-4 h-4 accent-[#590907] cursor-pointer"
              />
              <span className="text-[#30231F] text-xs font-bold tracking-widest uppercase">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.showToUser}
                onChange={e => setForm(f => ({ ...f, showToUser: e.target.checked }))}
                className="w-4 h-4 accent-[#590907] cursor-pointer"
              />
              <span className="text-[#30231F] text-xs font-bold tracking-widest uppercase">Show in Cart</span>
            </label>
          </div>
          <div className="flex gap-3 pt-3 border-t border-[#D4BEA5]">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 text-xs">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 text-xs disabled:opacity-60">
              {loading ? 'Saving...' : coupon?.id ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetch = () => {
    setLoading(true);
    getAllCoupons().then(c => { setCoupons(c); setLoading(false); });
  };

  useEffect(() => { fetch(); }, []);

  const handleToggle = async (coupon) => {
    await toggleCoupon(coupon.id, !coupon.active);
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, active: !c.active } : c));
  };

  const handleDelete = async (coupon) => {
    await deleteCoupon(coupon.id);
    toast.success('Coupon deleted.', { className: 'toast-vybera' });
    setDeleteConfirm(null);
    fetch();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#D4BEA5]">
        <div>
          <p className="text-[#75665C] text-xs font-semibold tracking-widest uppercase mb-1">Admin Panel</p>
          <h1 className="font-display font-bold text-2xl md:text-3xl tracking-wider text-[#30231F]">Coupons</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetch}
            disabled={loading}
            title="Synchronize live coupons from database"
            className="flex items-center gap-2 px-3.5 py-2 border text-xs font-semibold tracking-widest uppercase bg-[#FAF5ED] border-[#D4BEA5] text-[#30231F] hover:bg-[#E8D2B5] transition-all rounded-sm shadow-xs disabled:opacity-60"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-[#590907]' : 'text-[#75665C]'} />
            <span>{loading ? 'Syncing...' : 'Refresh'}</span>
          </button>
          <button onClick={() => setModal({})} className="btn-primary flex items-center gap-2 text-xs font-bold">
            <Plus size={14} /> Create Coupon
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : (
        <div className="bg-[#FAF5ED] border border-[#D4BEA5] shadow-sm overflow-hidden rounded-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#D4BEA5] bg-[#FAF5ED]">
                {['Code', 'Type', 'Value', 'Min Order', 'Limit', 'Used', 'Expiry', 'Visible', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-[#75665C] text-xs tracking-widest uppercase text-left px-4 py-3.5 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => (
                <tr key={coupon.id} className="border-b border-[#D4BEA5] hover:bg-[#E8D2B5]/30 transition-colors">
                  <td className="px-4 py-3 text-[#590907] font-mono font-bold text-xs tracking-wider">{coupon.code}</td>
                  <td className="px-4 py-3 text-[#30231F] text-xs font-medium capitalize">{coupon.type}</td>
                  <td className="px-4 py-3 text-[#590907] text-xs font-bold">
                    {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                  </td>
                  <td className="px-4 py-3 text-[#75665C] text-xs font-medium">{coupon.minOrder ? `₹${coupon.minOrder}` : '—'}</td>
                  <td className="px-4 py-3 text-[#75665C] text-xs font-medium">{coupon.usageLimit > 0 ? coupon.usageLimit : '∞'}</td>
                  <td className="px-4 py-3 text-[#30231F] text-xs font-bold">{coupon.timesUsed || 0}</td>
                  <td className="px-4 py-3 text-[#75665C] text-xs font-medium">{coupon.expiry || '—'}</td>
                  <td className="px-4 py-3 text-xs font-semibold">
                    <span className={`px-2 py-0.5 rounded-xs ${coupon.showToUser ? 'text-emerald-900 bg-emerald-100 border border-emerald-300' : 'text-[#75665C] bg-[#E8D2B5] border border-[#D4BEA5]'}`}>
                      {coupon.showToUser ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(coupon)}
                      className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${coupon.active ? 'bg-emerald-600' : 'bg-[#D4BEA5]'}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${coupon.active ? 'translate-x-4' : ''}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal(coupon)} className="p-1.5 text-[#590907] hover:bg-[#E8D2B5] rounded-xs transition-colors" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm(coupon)} className="p-1.5 text-rose-700 hover:bg-rose-100 rounded-xs transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && (
            <div className="text-center py-16 text-[#75665C]">
              <p className="text-sm tracking-widest uppercase">No coupons yet</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {modal !== null && (
          <CouponModal
            coupon={modal?.id ? modal : null}
            onClose={() => setModal(null)}
            onSaved={() => { setModal(null); fetch(); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-vy-dark border border-vy-border p-8 max-w-sm w-full text-center"
            >
              <h3 className="text-vy-white font-semibold mb-2">Delete Coupon?</h3>
              <p className="text-vy-grey text-sm mb-6">Coupon <span className="font-mono font-bold text-vy-white">{deleteConfirm.code}</span> will be removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="btn-ghost flex-1">Cancel</button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium tracking-widest uppercase hover:bg-red-500/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCoupons;
