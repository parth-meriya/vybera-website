import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { resetPassword } from '../firebase/auth';
import toast from 'react-hot-toast';
import BackButton from '../components/ui/BackButton';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address.', { className: 'toast-vybera' });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      // Don't leak whether an email exists — show generic message
      const code = err.code || '';
      if (code === 'auth/invalid-email') {
        toast.error('Please enter a valid email address.', { className: 'toast-vybera' });
      } else if (code === 'auth/too-many-requests') {
        toast.error('Too many requests. Please wait a moment and try again.', { className: 'toast-vybera' });
      } else {
        // Even for user-not-found, show success to prevent email enumeration
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#F3E7D8] flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-[#FAF5ED] border border-[#D4BEA5] rounded-2xl p-8 shadow-sm text-center"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-emerald-700" />
          </div>
          <h1 className="font-display font-bold text-xl tracking-wider text-[#30231F] mb-3">
            Check Your Email
          </h1>
          <p className="text-[#75665C] text-sm leading-relaxed mb-8">
            If an account exists for <span className="text-[#30231F] font-semibold">{email}</span>, 
            you'll receive a password reset link shortly. Check your spam folder if you don't see it.
          </p>
          <Link
            to="/login"
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft size={15} />
            Back to Sign In
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3E7D8] flex items-center justify-center px-6 py-12">
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
          <div className="w-12 h-12 rounded-full bg-[#E8D2B5]/40 flex items-center justify-center mx-auto mt-6 mb-4">
            <Mail size={20} className="text-[#590907]" />
          </div>
          <h1 className="font-display font-bold text-xl tracking-wider text-[#30231F] mb-2">
            Forgot Password?
          </h1>
          <p className="text-[#75665C] text-sm">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[#75665C] text-xs font-bold tracking-widest uppercase block mb-2">
              Email Address
            </label>
            <input
              id="forgot-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-white border border-[#D4BEA5] text-[#30231F] placeholder-[#75665C]/60 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#590907] focus:ring-1 focus:ring-[#590907] transition-all"
              placeholder="you@gmail.com"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
          >
            {loading
              ? <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
              : 'Send Reset Link'
            }
          </motion.button>
        </form>

        <p className="text-center text-[#75665C] text-sm mt-8">
          Remembered your password?{' '}
          <Link to="/login" className="text-[#590907] font-bold hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={12} />
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
