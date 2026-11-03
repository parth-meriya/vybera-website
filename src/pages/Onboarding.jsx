import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validatePhone, sanitizePhone } from '../utils/validation';
import toast from 'react-hot-toast';
import BackButton from '../components/ui/BackButton';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const Onboarding = () => {
  const { user, userProfile, refreshAdminStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  // If user profile is already fully created with phone number, skip onboarding
  useEffect(() => {
    if (userProfile?.phoneNumber) {
      navigate(from, { replace: true });
    }
  }, [userProfile, navigate, from]);

  const [form, setForm] = useState({ phone: '', gender: '' });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const onChangePhone = e => {
    const val = sanitizePhone(e.target.value);
    setForm(f => ({ ...f, phone: val }));
    if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
  };

  const isPhoneValid = /^[6-9]\d{9}$/.test(form.phone);

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) {
      setFieldErrors({ phone: phoneErr });
      return;
    }

    setLoading(true);
    try {
      // Direct update to Firestore without OTP verification
      const referredBy = sessionStorage.getItem('referred_by');
      await setDoc(doc(db, 'users', user.uid), {
        phoneNumber: form.phone,
        gender: form.gender || null,
        ...(referredBy ? { referredBy } : {})
      }, { merge: true });

      toast.success('Profile saved successfully!', { className: 'toast-vybera' });
      
      // Refresh auth context so it fetches the new userProfile
      await refreshAdminStatus();
      
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error(err.message, { className: 'toast-vybera' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F3E7D8] flex items-center justify-center px-6 relative pt-24 pb-12">
      <BackButton className="absolute top-6 left-6 md:top-10 md:left-10" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-[#FAF5ED] border border-[#D4BEA5] rounded-2xl p-8 shadow-sm"
      >
        <div className="text-center mb-8">
          <Link to="/" className="font-display font-black text-2xl tracking-[0.4em] text-[#590907]">
            VYBERA
          </Link>
          <h1 className="font-display font-bold text-xl tracking-wider text-[#30231F] mt-6 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-[#75665C] text-sm">
            We need your mobile number to send order updates.
          </p>
        </div>

        <div>
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleSaveProfile}
            className="space-y-4"
          >
            <div>
              <label className="text-[#75665C] text-xs font-bold tracking-widest uppercase block mb-1.5">Name (from Google)</label>
              <input
                type="text"
                value={user.displayName || ''}
                disabled
                className="w-full bg-[#E8D2B5]/30 border border-[#D4BEA5] text-[#75665C] rounded-lg px-4 py-2.5 text-sm cursor-not-allowed font-medium"
              />
            </div>
            <div>
              <label className="text-[#75665C] text-xs font-bold tracking-widest uppercase block mb-1.5">Email (from Google)</label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full bg-[#E8D2B5]/30 border border-[#D4BEA5] text-[#75665C] rounded-lg px-4 py-2.5 text-sm cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="text-[#75665C] text-xs font-bold tracking-widest uppercase block mb-1.5">Mobile Number *</label>
              <div className="relative flex rounded-lg overflow-hidden border border-[#D4BEA5]">
                <div className="flex items-center gap-1.5 px-3 bg-[#E8D2B5]/30 text-[#30231F] text-sm select-none shrink-0 border-r border-[#D4BEA5]">
                  <Phone size={13} className="text-[#590907]" />
                  <span className="text-xs font-bold tracking-wider">+91</span>
                </div>
                <input
                  id="onboarding-phone"
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={onChangePhone}
                  required
                  autoComplete="tel"
                  maxLength={10}
                  className="w-full bg-white text-[#30231F] placeholder-[#75665C]/60 px-4 py-2.5 text-sm focus:outline-none"
                  placeholder="9876543210"
                />
              </div>
              <AnimatePresence>
                {fieldErrors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-red-600 text-xs mt-1.5 flex items-center gap-1 font-medium"
                  >
                    <XCircle size={11} className="shrink-0" /> {fieldErrors.phone}
                  </motion.p>
                )}
              </AnimatePresence>
              {form.phone && !fieldErrors.phone && isPhoneValid && (
                <p className="text-emerald-700 text-xs mt-1.5 flex items-center gap-1 font-medium">
                  <CheckCircle size={11} className="shrink-0" /> Valid mobile number
                </p>
              )}
            </div>

            <div>
              <label className="text-[#75665C] text-xs font-bold tracking-widest uppercase block mb-1.5">Gender (Optional)</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full bg-white border border-[#D4BEA5] text-[#30231F] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#590907]"
              >
                <option value="" disabled className="text-[#75665C]">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading || !isPhoneValid}
              className="btn-primary w-full flex items-center justify-center mt-6 disabled:opacity-60"
            >
              {loading ? <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Profile'}
            </motion.button>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
