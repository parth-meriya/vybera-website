import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { resetPassword } from '../firebase/auth';
import toast from 'react-hot-toast';

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
      <div className="min-h-screen bg-vy-black flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h1 className="font-display font-bold text-xl tracking-wider text-vy-white mb-3">
            Check Your Email
          </h1>
          <p className="text-vy-grey text-sm leading-relaxed mb-8">
            If an account exists for <span className="text-vy-white font-medium">{email}</span>, 
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
    <div className="min-h-screen bg-vy-black flex items-center justify-center px-6">
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
          <div className="w-12 h-12 rounded-full bg-vy-border flex items-center justify-center mx-auto mt-8 mb-4">
            <Mail size={20} className="text-vy-white" />
          </div>
          <h1 className="font-display font-bold text-xl tracking-wider text-vy-white mb-2">
            Forgot Password?
          </h1>
          <p className="text-vy-grey text-sm">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">
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
              className="vy-input"
              placeholder="you@example.com"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
          >
            {loading
              ? <div className="w-4 h-4 border border-vy-black/30 border-t-vy-black rounded-full animate-spin" />
              : 'Send Reset Link'
            }
          </motion.button>
        </form>

        <p className="text-center text-vy-grey text-sm mt-8">
          Remembered your password?{' '}
          <Link to="/login" className="text-vy-white hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={12} />
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
