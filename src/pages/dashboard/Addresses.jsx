import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, Edit2, Star, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../../firebase/users';
import toast from 'react-hot-toast';

const Addresses = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    id: '',
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const prof = await getUserProfile(user.uid);
        if (prof?.addresses) {
          setAddresses(prof.addresses);
        }
      } catch (err) {
        console.error('Failed to fetch addresses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address || !form.city || !form.state || !form.pincode) {
      toast.error('Please fill all fields', { className: 'toast-vybera' });
      return;
    }

    try {
      let newAddresses = [...addresses];
      const addressToSave = { ...form };

      if (addressToSave.isDefault) {
        newAddresses = newAddresses.map(a => ({ ...a, isDefault: false }));
      }

      if (editingId) {
        const index = newAddresses.findIndex(a => a.id === editingId);
        if (index > -1) newAddresses[index] = addressToSave;
      } else {
        addressToSave.id = Date.now().toString();
        if (newAddresses.length === 0) addressToSave.isDefault = true;
        newAddresses.push(addressToSave);
      }

      await updateUserProfile(user.uid, { addresses: newAddresses });
      setAddresses(newAddresses);
      setShowForm(false);
      setEditingId(null);
      setForm({ id: '', name: '', phone: '', address: '', city: '', state: '', pincode: '', isDefault: false });
      toast.success(editingId ? 'Address updated' : 'Address added', { className: 'toast-vybera' });
    } catch (err) {
      toast.error('Failed to save address', { className: 'toast-vybera' });
    }
  };

  const handleDelete = async (id) => {
    try {
      let newAddresses = addresses.filter(a => a.id !== id);
      
      // If deleted address was default, make the first remaining one default
      const wasDefault = addresses.find(a => a.id === id)?.isDefault;
      if (wasDefault && newAddresses.length > 0) {
        newAddresses[0].isDefault = true;
      }

      await updateUserProfile(user.uid, { addresses: newAddresses });
      setAddresses(newAddresses);
      toast.success('Address deleted', { className: 'toast-vybera' });
    } catch (err) {
      toast.error('Failed to delete address', { className: 'toast-vybera' });
    }
  };

  const setAsDefault = async (id) => {
    try {
      const newAddresses = addresses.map(a => ({
        ...a,
        isDefault: a.id === id
      }));
      await updateUserProfile(user.uid, { addresses: newAddresses });
      setAddresses(newAddresses);
      toast.success('Default address updated', { className: 'toast-vybera' });
    } catch (err) {
      toast.error('Failed to set default', { className: 'toast-vybera' });
    }
  };

  const startEdit = (addr) => {
    setForm({ ...addr });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner mb-6" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-3xl tracking-wider text-[#30231F] mb-2">Address Book</h2>
          <p className="text-[#75665C] text-xs tracking-[0.2em] uppercase font-semibold">Manage your delivery addresses</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => {
              setForm({ id: '', name: '', phone: '', address: '', city: '', state: '', pincode: '', isDefault: false });
              setEditingId(null);
              setShowForm(true);
            }}
            className="btn-primary text-xs py-3 px-6 uppercase tracking-widest flex items-center gap-2"
          >
            <Plus size={14} /> Add New Address
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#FAF5ED] border border-[#D4BEA5] rounded-2xl p-6 md:p-8 shadow-sm"
          >
            <h3 className="text-[#30231F] text-base tracking-widest uppercase font-bold mb-6">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#75665C] uppercase tracking-widest font-bold mb-1.5">Full Name</label>
                  <input name="name" value={form.name} onChange={handleChange} className="w-full bg-white border border-[#D4BEA5] text-[#30231F] rounded-lg px-4 py-2.5 text-sm focus:border-[#590907] focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs text-[#75665C] uppercase tracking-widest font-bold mb-1.5">Phone Number</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="w-full bg-white border border-[#D4BEA5] text-[#30231F] rounded-lg px-4 py-2.5 text-sm focus:border-[#590907] focus:outline-none" required />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#75665C] uppercase tracking-widest font-bold mb-1.5">Street Address</label>
                <input name="address" value={form.address} onChange={handleChange} className="w-full bg-white border border-[#D4BEA5] text-[#30231F] rounded-lg px-4 py-2.5 text-sm focus:border-[#590907] focus:outline-none" placeholder="House/Flat No., Street Name, Landmark" required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs text-[#75665C] uppercase tracking-widest font-bold mb-1.5">City</label>
                  <input name="city" value={form.city} onChange={handleChange} className="w-full bg-white border border-[#D4BEA5] text-[#30231F] rounded-lg px-4 py-2.5 text-sm focus:border-[#590907] focus:outline-none" required />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-[#75665C] uppercase tracking-widest font-bold mb-1.5">State</label>
                  <input name="state" value={form.state} onChange={handleChange} className="w-full bg-white border border-[#D4BEA5] text-[#30231F] rounded-lg px-4 py-2.5 text-sm focus:border-[#590907] focus:outline-none" required />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-[#75665C] uppercase tracking-widest font-bold mb-1.5">Pincode</label>
                  <input name="pincode" value={form.pincode} onChange={handleChange} className="w-full bg-white border border-[#D4BEA5] text-[#30231F] rounded-lg px-4 py-2.5 text-sm focus:border-[#590907] focus:outline-none" required />
                </div>
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${form.isDefault ? 'bg-[#590907] border-[#590907]' : 'border-[#D4BEA5] bg-white group-hover:border-[#75665C]'}`}>
                    {form.isDefault && <CheckCircle size={14} className="text-white" />}
                  </div>
                  <span className="text-xs text-[#30231F] font-medium tracking-wider">Set as default address</span>
                  <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={handleChange} className="hidden" />
                </label>
              </div>
              <div className="pt-6 flex gap-4">
                <button type="submit" className="btn-primary text-xs py-3 px-8 uppercase tracking-widest">
                  Save Address
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="border border-[#D4BEA5] bg-white text-[#30231F] rounded-lg py-3 px-8 text-xs font-bold uppercase tracking-widest hover:bg-[#F3E7D8]/40 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.length === 0 ? (
              <div className="col-span-1 md:col-span-2 bg-[#FAF5ED] border border-[#D4BEA5] rounded-2xl p-12 text-center flex flex-col items-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#E8D2B5]/40 flex items-center justify-center mb-4">
                  <MapPin size={32} className="text-[#590907]" />
                </div>
                <p className="text-[#30231F] text-lg font-bold mb-2">No addresses saved</p>
                <p className="text-[#75665C] text-xs">Add your address for faster checkout.</p>
              </div>
            ) : (
              addresses.map((addr) => (
                <div key={addr.id} className={`bg-[#FAF5ED] border rounded-xl p-6 relative overflow-hidden transition-all shadow-sm ${addr.isDefault ? 'border-[#590907] ring-1 ring-[#590907]/20' : 'border-[#D4BEA5]'}`}>
                  {addr.isDefault && (
                    <div className="absolute top-0 right-0 bg-[#590907] text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-bl">
                      Default
                    </div>
                  )}
                  <h3 className="text-[#30231F] font-bold text-sm tracking-widest mb-1">{addr.name}</h3>
                  <p className="text-[#75665C] text-xs mb-4 font-medium">{addr.phone}</p>
                  
                  <div className="space-y-1 mb-6 text-sm text-[#30231F]">
                    <p>{addr.address}</p>
                    <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-[#D4BEA5]">
                    <button onClick={() => startEdit(addr)} className="text-[#75665C] hover:text-[#590907] text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 transition-colors">
                      <Edit2 size={12} /> Edit
                    </button>
                    <button onClick={() => handleDelete(addr.id)} className="text-[#75665C] hover:text-[#590907] text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 transition-colors">
                      <Trash2 size={12} /> Delete
                    </button>
                    {!addr.isDefault && (
                      <button onClick={() => setAsDefault(addr.id)} className="ml-auto text-[#590907] hover:underline text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                        <Star size={12} /> Set Default
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Addresses;
