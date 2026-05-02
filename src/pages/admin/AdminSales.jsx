import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Edit3, Power, Upload, Image as ImageIcon } from 'lucide-react';
import { getAllSales, createSale, updateSale, deleteSale, toggleSaleActive, uploadSaleBanner } from '../../firebase/sales';
import { getProducts } from '../../firebase/products';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '',
  discountType: 'percentage',
  discountValue: '',
  applyType: 'all',
  productIds: [],
  bannerMedia: '',
  isActive: false,
  startDate: '',
  endDate: '',
};

const AdminSales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getAllSales(), getProducts()]).then(([s, p]) => {
      setSales(s);
      setProducts(p);
      setLoading(false);
    });
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (sale) => {
    setEditing(sale.id);
    setForm({
      name: sale.name || '',
      discountType: sale.discountType || 'percentage',
      discountValue: sale.discountValue || '',
      applyType: sale.applyType || 'all',
      productIds: sale.productIds || [],
      bannerMedia: sale.bannerMedia || '',
      isActive: sale.isActive || false,
      startDate: sale.startDate?.toDate?.()?.toISOString?.().split('T')[0] || '',
      endDate: sale.endDate?.toDate?.()?.toISOString?.().split('T')[0] || '',
    });
    setShowForm(true);
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadSaleBanner(file, setUploadPct);
      setForm(f => ({ ...f, bannerMedia: url }));
      toast.success('Banner uploaded.', { className: 'toast-vybera' });
    } catch {
      toast.error('Upload failed.', { className: 'toast-vybera' });
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };

  const toggleProduct = (pid) => {
    setForm(f => ({
      ...f,
      productIds: f.productIds.includes(pid)
        ? f.productIds.filter(id => id !== pid)
        : [...f.productIds, pid],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Sale name is required.', { className: 'toast-vybera' });
    if (!form.discountValue || Number(form.discountValue) <= 0) return toast.error('Discount value is required.', { className: 'toast-vybera' });
    if (form.applyType === 'selected' && form.productIds.length === 0) return toast.error('Select at least one product.', { className: 'toast-vybera' });

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      applyType: form.applyType,
      productIds: form.applyType === 'all' ? [] : form.productIds,
      bannerMedia: form.bannerMedia,
      isActive: form.isActive,
      startDate: form.startDate ? Timestamp.fromDate(new Date(form.startDate)) : null,
      endDate: form.endDate ? Timestamp.fromDate(new Date(form.endDate + 'T23:59:59')) : null,
    };

    try {
      if (editing) {
        await updateSale(editing, payload);
        setSales(prev => prev.map(s => s.id === editing ? { ...s, ...payload, id: editing } : s));
        toast.success('Sale updated.', { className: 'toast-vybera' });
      } else {
        const ref = await createSale(payload);
        setSales(prev => [{ id: ref.id, ...payload }, ...prev]);
        toast.success('Sale created.', { className: 'toast-vybera' });
      }
      resetForm();
    } catch {
      toast.error('Failed to save.', { className: 'toast-vybera' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (saleId) => {
    if (!confirm('Delete this sale campaign?')) return;
    await deleteSale(saleId);
    setSales(prev => prev.filter(s => s.id !== saleId));
    toast.success('Sale deleted.', { className: 'toast-vybera' });
  };

  const handleToggle = async (sale) => {
    const newState = !sale.isActive;
    await toggleSaleActive(sale.id, newState);
    setSales(prev => prev.map(s => s.id === sale.id ? { ...s, isActive: newState } : s));
    toast.success(newState ? 'Sale activated.' : 'Sale deactivated.', { className: 'toast-vybera' });
  };

  const fmtDate = (ts) => {
    if (!ts) return '—';
    const d = ts?.toDate?.() ? ts.toDate() : new Date(ts.seconds * 1000);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-vy-grey text-xs tracking-widest uppercase mb-1">Admin</p>
          <h1 className="font-display font-bold text-2xl tracking-wider text-vy-white">Sales & Campaigns</h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary flex items-center gap-2 text-xs"
        >
          <Plus size={13} /> New Campaign
        </button>
      </div>

      {/* Campaign Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center pt-12 px-4 overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && resetForm()}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="w-full max-w-2xl bg-vy-card border border-vy-border p-8 mb-12"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-vy-white font-semibold text-lg tracking-wider">
                  {editing ? 'Edit Campaign' : 'New Campaign'}
                </h2>
                <button onClick={resetForm} className="text-vy-grey hover:text-vy-white"><X size={18} /></button>
              </div>

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Campaign Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="vy-input" placeholder='e.g. "Summer Drop Sale"' />
                </div>

                {/* Discount Type & Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Discount Type</label>
                    <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))} className="vy-input">
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">
                      Discount Value {form.discountType === 'percentage' ? '(%)' : '(₹)'}
                    </label>
                    <input type="number" min="0" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} className="vy-input" placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 200'} />
                  </div>
                </div>

                {/* Apply Type */}
                <div>
                  <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Apply To</label>
                  <div className="flex gap-4">
                    {['all', 'selected'].map(t => (
                      <button
                        key={t}
                        onClick={() => setForm(f => ({ ...f, applyType: t }))}
                        className={`px-5 py-2.5 text-xs uppercase tracking-widest font-medium border transition-all ${
                          form.applyType === t
                            ? 'bg-vy-accent text-vy-black border-vy-accent'
                            : 'bg-transparent text-vy-grey border-vy-border hover:border-vy-light'
                        }`}
                      >
                        {t === 'all' ? 'All Products' : 'Selected Products'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Selector */}
                {form.applyType === 'selected' && (
                  <div>
                    <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Select Products ({form.productIds.length} selected)</label>
                    <div className="max-h-48 overflow-y-auto border border-vy-border p-3 space-y-2">
                      {products.map(p => (
                        <label key={p.id} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={form.productIds.includes(p.id)}
                            onChange={() => toggleProduct(p.id)}
                            className="accent-[#B78E5C] w-4 h-4"
                          />
                          <img src={p.images?.[0] || p.image || ''} alt="" className="w-8 h-10 object-cover bg-vy-dark" />
                          <span className="text-vy-white text-xs group-hover:text-vy-accent transition-colors">{p.name}</span>
                          <span className="ml-auto text-vy-grey text-xs">₹{p.price}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Start Date</label>
                    <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="vy-input" />
                  </div>
                  <div>
                    <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">End Date</label>
                    <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="vy-input" />
                  </div>
                </div>

                {/* Banner Upload */}
                <div>
                  <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Banner Image / Video</label>
                  {form.bannerMedia ? (
                    <div className="relative">
                      {form.bannerMedia.includes('.mp4') || form.bannerMedia.includes('video') ? (
                        <video src={form.bannerMedia} className="w-full h-40 object-cover bg-vy-dark" muted autoPlay loop />
                      ) : (
                        <img src={form.bannerMedia} alt="Banner" className="w-full h-40 object-cover bg-vy-dark" />
                      )}
                      <button
                        onClick={() => setForm(f => ({ ...f, bannerMedia: '' }))}
                        className="absolute top-2 right-2 p-1 bg-vy-black/80 text-vy-white hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-32 border border-dashed border-vy-border cursor-pointer hover:border-vy-accent transition-colors">
                      <Upload size={20} className="text-vy-grey mb-2" />
                      <span className="text-vy-grey text-xs tracking-widest uppercase">
                        {uploading ? `Uploading ${uploadPct}%` : 'Click to Upload'}
                      </span>
                      <input type="file" accept="image/*,video/*" className="hidden" onChange={handleBannerUpload} disabled={uploading} />
                    </label>
                  )}
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-vy-grey text-xs tracking-widest uppercase">Activate Immediately</span>
                  <button
                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${form.isActive ? 'bg-green-500' : 'bg-vy-border'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${form.isActive ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary w-full text-xs disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editing ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sales List */}
      {sales.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-vy-grey text-sm tracking-widest uppercase">No campaigns yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sales.map(sale => (
            <motion.div
              key={sale.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-vy-card border border-vy-border p-5 flex flex-col md:flex-row gap-5"
            >
              {/* Thumbnail */}
              {sale.bannerMedia && (
                <div className="w-full md:w-40 h-24 flex-shrink-0 overflow-hidden">
                  {sale.bannerMedia.includes('.mp4') || sale.bannerMedia.includes('video') ? (
                    <video src={sale.bannerMedia} className="w-full h-full object-cover" muted autoPlay loop />
                  ) : (
                    <img src={sale.bannerMedia} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-vy-white font-semibold text-sm tracking-wider truncate">{sale.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 tracking-widest uppercase font-bold ${
                    sale.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-vy-border/20 text-vy-grey border border-vy-border'
                  }`}>
                    {sale.isActive ? 'LIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-vy-grey">
                  <span>
                    <span className="text-vy-accent font-semibold">
                      {sale.discountType === 'percentage' ? `${sale.discountValue}%` : `₹${sale.discountValue}`}
                    </span> off
                  </span>
                  <span>{sale.applyType === 'all' ? 'All products' : `${sale.productIds?.length || 0} products`}</span>
                  <span>{fmtDate(sale.startDate)} — {fmtDate(sale.endDate)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(sale)}
                  className={`p-2 transition-colors ${sale.isActive ? 'text-green-400 hover:text-green-300' : 'text-vy-grey hover:text-vy-white'}`}
                  title={sale.isActive ? 'Deactivate' : 'Activate'}
                >
                  <Power size={16} />
                </button>
                <button onClick={() => openEdit(sale)} className="p-2 text-vy-grey hover:text-vy-accent transition-colors" title="Edit">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDelete(sale.id)} className="p-2 text-vy-grey hover:text-red-400 transition-colors" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSales;
