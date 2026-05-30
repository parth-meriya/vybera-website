import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
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
        className="bg-vy-dark border border-vy-border w-full max-w-lg"
      >
        <div className="flex items-center justify-between p-6 border-b border-vy-border">
          <h2 className="text-vy-white font-semibold tracking-wider">
            {coupon?.id ? 'Edit Coupon' : 'Create Coupon'}
          </h2>
          <button onClick={onClose} className="text-vy-grey hover:text-vy-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Coupon Code</label>
              <input name="code" value={form.code} onChange={onChange} className="vy-input font-mono uppercase" placeholder="VYBERA20" required />
            </div>
            <div>
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Type</label>
              <select name="type" value={form.type} onChange={onChange} className="vy-input">
                <option value="percentage" className="bg-vy-dark">Percentage (%)</option>
                <option value="flat" className="bg-vy-dark">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">
                Value ({form.type === 'percentage' ? '%' : '₹'})
              </label>
              <input name="value" type="number" value={form.value} onChange={onChange} className="vy-input" placeholder="20" required />
            </div>
            <div>
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Min Order (₹)</label>
              <input name="minOrder" type="number" value={form.minOrder} onChange={onChange} className="vy-input" placeholder="Optional" />
            </div>
            <div>
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Max Discount (₹)</label>
              <input name="maxDiscount" type="number" value={form.maxDiscount} onChange={onChange} className="vy-input" placeholder="Optional" />
            </div>
            <div>
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Usage Limit (0=∞)</label>
              <input name="usageLimit" type="number" value={form.usageLimit} onChange={onChange} className="vy-input" placeholder="0" />
            </div>
            <div>
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Expiry Date</label>
              <input name="expiry" type="date" value={form.expiry} onChange={onChange} className="vy-input" />
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                className="w-4 h-4 accent-white"
              />
              <span className="text-vy-grey text-xs tracking-widest uppercase">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.showToUser}
                onChange={e => setForm(f => ({ ...f, showToUser: e.target.checked }))}
                className="w-4 h-4 accent-white"
              />
              <span className="text-vy-grey text-xs tracking-widest uppercase">Show in Cart</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-vy-grey text-xs tracking-widest uppercase mb-1">Admin</p>
          <h1 className="font-display font-bold text-2xl tracking-wider text-vy-white">Coupons</h1>
        </div>
        <button onClick={() => setModal({})} className="btn-primary flex items-center gap-2 text-xs">
          <Plus size={13} /> Create Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : (
        <div className="bg-vy-card border border-vy-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-vy-border">
                {['Code', 'Type', 'Value', 'Min Order', 'Limit', 'Used', 'Expiry', 'Visible', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-vy-grey text-xs tracking-widest uppercase text-left px-4 py-3 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => (
                <tr key={coupon.id} className="border-b border-vy-border/50 hover:bg-vy-border/20 transition-colors">
                  <td className="px-4 py-3 text-vy-white font-mono font-bold text-xs">{coupon.code}</td>
                  <td className="px-4 py-3 text-vy-grey text-xs capitalize">{coupon.type}</td>
                  <td className="px-4 py-3 text-vy-white text-xs font-semibold">
                    {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                  </td>
                  <td className="px-4 py-3 text-vy-grey text-xs">{coupon.minOrder ? `₹${coupon.minOrder}` : '—'}</td>
                  <td className="px-4 py-3 text-vy-grey text-xs">{coupon.usageLimit > 0 ? coupon.usageLimit : '∞'}</td>
                  <td className="px-4 py-3 text-vy-grey text-xs">{coupon.timesUsed || 0}</td>
                  <td className="px-4 py-3 text-vy-grey text-xs">{coupon.expiry || '—'}</td>
                  <td className="px-4 py-3 text-vy-grey text-xs font-semibold">{coupon.showToUser ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(coupon)}
                      className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${coupon.active ? 'bg-green-500' : 'bg-vy-border'}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${coupon.active ? 'translate-x-4' : ''}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal(coupon)} className="p-1.5 text-vy-grey hover:text-vy-white transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDeleteConfirm(coupon)} className="p-1.5 text-vy-grey hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && (
            <div className="text-center py-16">
              <p className="text-vy-grey text-sm tracking-widest uppercase">No coupons yet</p>
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
