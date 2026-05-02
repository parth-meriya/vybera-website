import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { signUp, signInWithGoogle } from '../firebase/auth';
import toast from 'react-hot-toast';

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.', { className: 'toast-vybera' });
      return;
    }
    setLoading(true);
    try {
      await signUp(form.email, form.password, form.name);
      toast.success('Account created! Welcome to VYBERA.', { className: 'toast-vybera' });
      navigate('/');
    } catch (err) {
      toast.error(err.message.replace('Firebase: ', '').replace(/\(auth.*\)/, ''), { className: 'toast-vybera' });
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
      toast.error('Google sign-in failed.', { className: 'toast-vybera' });
    } finally {
      setLoading(false);
    }
  };

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
            <input name="name" type="text" value={form.name} onChange={onChange} required className="vy-input" placeholder="Your name" />
          </div>
          <div>
            <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Email</label>
            <input name="email" type="email" value={form.email} onChange={onChange} required className="vy-input" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={onChange}
                required
                className="vy-input pr-12"
                placeholder="Min. 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-vy-grey hover:text-vy-white transition-colors"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
          >
            {loading ? <div className="w-4 h-4 border border-vy-black/30 border-t-vy-black rounded-full animate-spin" /> : 'Create Account'}
          </motion.button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-vy-border" />
          <span className="text-vy-grey text-xs">or</span>
          <div className="flex-1 h-px bg-vy-border" />
        </div>

        <button onClick={handleGoogle} disabled={loading} className="btn-outline w-full flex items-center justify-center gap-2">
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
