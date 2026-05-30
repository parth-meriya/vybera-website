import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validatePhone, sanitizePhone } from '../utils/validation';
import toast from 'react-hot-toast';
import BackButton from '../components/ui/BackButton';
import { RecaptchaVerifier, linkWithPhoneNumber } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const Onboarding = () => {
  const { user, userProfile, getIdToken, refreshAdminStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  // If user profile is already fully created with phone number, skip onboarding
  useEffect(() => {
    if (userProfile?.phoneNumber) {
      navigate(from, { replace: true });
    }
  }, [userProfile, navigate, from]);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ phone: '', gender: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [countdown, setCountdown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Focus management for OTP
  useEffect(() => {
    if (step === 2) {
      const firstInput = document.getElementById('otp-0');
      if (firstInput) firstInput.focus();
    }
  }, [step]);

  // Setup reCAPTCHA
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          toast.error("reCAPTCHA expired. Please try again.", { className: 'toast-vybera' });
        }
      });
    }
  }, []);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const onChangePhone = e => {
    const val = sanitizePhone(e.target.value);
    setForm(f => ({ ...f, phone: val }));
    if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
  };

  const isPhoneValid = /^[6-9]\d{9}$/.test(form.phone);

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) {
      setFieldErrors({ phone: phoneErr });
      return;
    }

    setLoading(true);
    try {
      const phoneNumber = '+91' + form.phone;
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await linkWithPhoneNumber(user, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);

      toast.success('OTP sent via SMS', { className: 'toast-vybera' });
      setStep(2);
      setCountdown(30); // 30 second wait before allowing resend
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/credential-already-in-use') {
        toast.error('This phone number is already registered to another account.', { className: 'toast-vybera' });
      } else if (err.code === 'auth/too-many-requests') {
        toast.error('Too many requests. Please try again later.', { className: 'toast-vybera' });
      } else {
        toast.error(err.message, { className: 'toast-vybera' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;
    
    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    // Auto focus next
    if (index < 5 && val) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (!otp[index] && index > 0) {
        // Current is empty, delete previous and focus previous
        newOtp[index - 1] = '';
        setOtp(newOtp);
        const prevInput = document.getElementById(`otp-${index - 1}`);
        if (prevInput) prevInput.focus();
      } else {
        // Current has value, just clear it
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      toast.error('Please enter complete 6-digit OTP', { className: 'toast-vybera' });
      return;
    }

    if (!confirmationResult) {
      toast.error('Session expired. Please request a new OTP.', { className: 'toast-vybera' });
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP with Firebase
      await confirmationResult.confirm(fullOtp);

      // 2. Update Firestore with the phone number and gender
      await setDoc(doc(db, 'users', user.uid), {
        phoneNumber: form.phone,
        gender: form.gender || null
      }, { merge: true });

      toast.success('Account successfully verified!', { className: 'toast-vybera' });
      
      // Refresh auth context so it fetches the new userProfile
      await refreshAdminStatus();
      
      // ProtectedRoute will automatically redirect to dashboard once userProfile is loaded,
      // or we can manually push them
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-verification-code') {
        toast.error('Incorrect OTP. Please try again.', { className: 'toast-vybera' });
      } else if (err.code === 'auth/code-expired') {
        toast.error('OTP expired. Please request a new one.', { className: 'toast-vybera' });
        setStep(1);
        setOtp(['', '', '', '', '', '']);
      } else {
        toast.error(err.message, { className: 'toast-vybera' });
      }
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
            We need your mobile number to secure your account and send order updates.
          </p>
        </div>

        <div className="bg-vy-dark border border-vy-border/40 p-6 sm:p-8">
          {/* Step 1: Phone & Gender */}
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSendOTP}
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
                  {loading ? <div className="w-4 h-4 border border-vy-black/30 border-t-vy-black rounded-full animate-spin" /> : 'Send OTP'}
                </motion.button>
              </motion.form>
            ) : (
              /* Step 2: OTP Verification */
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyOTP}
                className="space-y-6 text-center"
              >
                <div className="w-14 h-14 bg-vy-border/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Phone size={24} className="text-vy-white" />
                </div>
                
                <div>
                  <h2 className="text-vy-white font-display text-lg mb-1">Verify Mobile Number</h2>
                  <p className="text-vy-grey text-sm">
                    Enter the 6-digit code sent to <span className="text-vy-white font-medium">+91 {form.phone}</span>
                  </p>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="text-vy-accent text-xs hover:underline mt-2"
                  >
                    Change Number
                  </button>
                </div>

                <div className="flex justify-center gap-2 sm:gap-3 py-4">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e, i)}
                      onKeyDown={(e) => handleOtpKeyDown(e, i)}
                      className="w-10 h-12 sm:w-12 sm:h-14 bg-vy-black border border-vy-border focus:border-vy-accent text-center text-xl text-vy-white outline-none transition-colors"
                      placeholder="-"
                    />
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || otp.some(d => !d)}
                  className="btn-primary w-full flex items-center justify-center disabled:opacity-60"
                >
                  {loading ? <div className="w-4 h-4 border border-vy-black/30 border-t-vy-black rounded-full animate-spin" /> : 'Verify & Complete'}
                </motion.button>

                <div className="pt-2">
                  {countdown > 0 ? (
                    <p className="text-vy-grey text-xs">Resend OTP in {countdown}s</p>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleSendOTP}
                      className="text-vy-white text-xs hover:text-vy-accent hover:underline transition-colors"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Onboarding;
