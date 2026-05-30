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
      await setDoc(doc(db, 'users', user.uid), {
        phoneNumber: form.phone,
        gender: form.gender || null
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
    <div className="min-h-screen bg-vy-black flex items-center justify-center px-6 relative pt-24 pb-12">
      <BackButton className="absolute top-6 left-6 md:top-10 md:left-10" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link to="/" className="font-display font-bold text-2xl tracking-[0.4em] text-vy-white">
            VYBERA
          </Link>
          <h1 className="font-display font-bold text-xl tracking-wider text-vy-white mt-6 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-vy-grey text-sm">
            We need your mobile number to send order updates.
          </p>
        </div>

        <div className="bg-vy-dark border border-vy-border/40 p-6 sm:p-8">
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleSaveProfile}
            className="space-y-5"
          >
            <div>
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Name (from Google)</label>
              <input
                type="text"
                value={user.displayName || ''}
                disabled
                className="vy-input opacity-60 cursor-not-allowed bg-vy-black"
              />
            </div>
            <div>
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Email (from Google)</label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="vy-input opacity-60 cursor-not-allowed bg-vy-black"
              />
            </div>

            <div>
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Mobile Number *</label>
              <div className="relative flex">
                <div className="flex items-center gap-1.5 px-3 border border-vy-border border-r-0 bg-vy-border/10 text-vy-grey text-sm select-none shrink-0">
                  <Phone size={13} className="text-vy-grey" />
                  <span className="text-xs font-medium tracking-wider">+91</span>
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
                  className={`vy-input flex-1 ${fieldErrors.phone ? 'border-red-500/60' : ''}`}
                  placeholder="9876543210"
                />
              </div>
              <AnimatePresence>
                {fieldErrors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-red-400 text-xs mt-1.5 flex items-center gap-1"
                  >
                    <XCircle size={11} className="shrink-0" /> {fieldErrors.phone}
                  </motion.p>
                )}
              </AnimatePresence>
              {form.phone && !fieldErrors.phone && isPhoneValid && (
                <p className="text-green-400 text-xs mt-1.5 flex items-center gap-1">
                  <CheckCircle size={11} className="shrink-0" /> Valid mobile number
                </p>
              )}
            </div>

            <div>
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Gender (Optional)</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="vy-input w-full appearance-none bg-vy-black text-vy-white outline-none"
              >
                <option value="" disabled className="text-vy-grey">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !isPhoneValid}
              className="btn-primary w-full flex items-center justify-center mt-6 disabled:opacity-60"
            >
              {loading ? <div className="w-4 h-4 border border-vy-black/30 border-t-vy-black rounded-full animate-spin" /> : 'Save Profile'}
            </motion.button>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
