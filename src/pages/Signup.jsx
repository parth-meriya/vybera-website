import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { signUp, signInWithGoogle, validatePassword } from '../firebase/auth';
import toast from 'react-hot-toast';

// Password strength requirement display
const requirements = [
  { label: '8+ characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Number', test: (p) => /[0-9]/.test(p) },
  { label: 'Special character (!@#$…)', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const passwordScore = requirements.filter(r => r.test(form.password)).length;
  const isPasswordValid = passwordScore === requirements.length;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side password policy enforcement
    const policyErrors = validatePassword(form.password);
    if (policyErrors.length > 0) {
      toast.error(`Password must contain ${policyErrors[0]}.`, { className: 'toast-vybera' });
      return;
    }

    if (!form.name.trim()) {
      toast.error('Please enter your full name.', { className: 'toast-vybera' });
      return;
    }

    setLoading(true);
    try {
      await signUp(form.email.trim(), form.password, form.name.trim());
      setDone(true); // Show verification prompt instead of navigating away
    } catch (err) {
      console.error('Signup error:', err);
      let msg = 'Account creation failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please sign in instead.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address provided.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak.';
      } else if (err.code === 'permission-denied') {
        msg = 'Database permission denied. (Check Firestore rules)';
      } else if (err.message) {
        msg = err.message.replace('Firebase:', '').replace(/\(auth\/[^)]+\)\.?/, '').trim();
      }
      toast.error(msg, { className: 'toast-vybera' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Signed up with Google.', { className: 'toast-vybera' });
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        toast.error('An account already exists with this email. Please sign in instead.', { className: 'toast-vybera' });
      } else {
        toast.error('Google sign-in failed. Please try again.', { className: 'toast-vybera' });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Post-signup: show email verification notice ──────────
  if (done) {
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
            Verify Your Email
          </h1>
          <p className="text-vy-grey text-sm leading-relaxed mb-2">
            Welcome to VYBERA, <span className="text-vy-white font-medium">{form.name}</span>!
          </p>
          <p className="text-vy-grey text-sm leading-relaxed mb-8">
            We've sent a verification link to{' '}
            <span className="text-vy-white font-medium">{form.email}</span>.
            Please check your inbox (and spam folder) and verify your email before signing in.
          </p>
          <Link to="/login" className="btn-primary inline-block">
            Go to Sign In
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
          <h1 className="font-display font-bold text-xl tracking-wider text-vy-white mt-6 mb-2">
            Create Account
          </h1>
          <p className="text-vy-grey text-sm">Join the next generation of streetwear</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Full Name</label>
            <input
              id="signup-name"
              name="name"
              type="text"
              value={form.name}
              onChange={onChange}
              required
              autoComplete="name"
              className="vy-input"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Email</label>
            <input
              id="signup-email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              required
              autoComplete="email"
              className="vy-input"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Password</label>
            <div className="relative">
              <input
                id="signup-password"
                name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={onChange}
                onFocus={() => setShowRequirements(true)}
                required
                autoComplete="new-password"
                className="vy-input pr-12"
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-vy-grey hover:text-vy-white transition-colors"
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Password strength bar */}
            {form.password.length > 0 && (
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      passwordScore >= i
                        ? passwordScore <= 2 ? 'bg-red-500'
                        : passwordScore <= 3 ? 'bg-yellow-500'
                        : passwordScore <= 4 ? 'bg-blue-400'
                        : 'bg-green-500'
                        : 'bg-vy-border'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Requirements checklist */}
            <AnimatePresence>
              {showRequirements && form.password.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-1 overflow-hidden"
                >
                  {requirements.map((req) => {
                    const passed = req.test(form.password);
                    return (
                      <li key={req.label} className={`flex items-center gap-2 text-xs transition-colors ${passed ? 'text-green-400' : 'text-vy-grey'}`}>
                        {passed
                          ? <CheckCircle size={12} className="shrink-0" />
                          : <XCircle size={12} className="shrink-0 text-vy-border" />
                        }
                        {req.label}
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !isPasswordValid}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
          >
            {loading
              ? <div className="w-4 h-4 border border-vy-black/30 border-t-vy-black rounded-full animate-spin" />
              : 'Create Account'
            }
          </motion.button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-vy-border" />
          <span className="text-vy-grey text-xs">or</span>
          <div className="flex-1 h-px bg-vy-border" />
        </div>

        <button
          id="google-signup-btn"
          onClick={handleGoogle}
          disabled={loading}
          className="btn-outline w-full flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-vy-grey text-sm mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-vy-white hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
