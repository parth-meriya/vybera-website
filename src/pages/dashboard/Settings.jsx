import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../../firebase/users';
import { resetPassword } from '../../firebase/auth';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const prof = await getUserProfile(user.uid);
        setProfile(prof);
        setForm({
          name: prof?.name || user.displayName || '',
          phone: prof?.phone || prof?.phoneNumber || ''
        });
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name cannot be empty', { className: 'toast-vybera' });
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        name: form.name.trim(),
        phone: form.phone.trim()
      });
      toast.success('Profile updated successfully', { className: 'toast-vybera' });
    } catch (err) {
      toast.error('Failed to update profile', { className: 'toast-vybera' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await resetPassword(user.email);
      setResetSent(true);
      toast.success('Password reset email sent!', { className: 'toast-vybera' });
    } catch (err) {
      toast.error('Failed to send reset email', { className: 'toast-vybera' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner mb-6" />
      </div>
    );
  }

  const isGoogleLinked = user?.providerData?.some(p => p.providerId === 'google.com');

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-3xl">
      <div>
        <h2 className="font-display font-bold text-3xl tracking-wider mb-2">Account Settings</h2>
        <p className="text-vy-grey text-xs tracking-[0.2em] uppercase">Update your personal information</p>
      </div>

      <div className="bg-vy-card border border-vy-border p-6 md:p-10">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-vy-white text-xs font-bold tracking-widest uppercase mb-4 border-b border-vy-border pb-2">Profile Details</h3>
            
            <div>
              <label className="flex items-center gap-2 text-[10px] text-vy-grey uppercase tracking-widest mb-2">
                <User size={12} /> Full Name
              </label>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                className="vy-input w-full" 
                placeholder="Enter your full name"
                required 
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] text-vy-grey uppercase tracking-widest mb-2">
                <Mail size={12} /> Email Address
              </label>
              <input 
                value={user.email} 
                className="vy-input w-full bg-vy-black text-vy-grey cursor-not-allowed" 
                disabled 
              />
              <p className="text-[10px] text-vy-border mt-1">Email address cannot be changed.</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] text-vy-grey uppercase tracking-widest mb-2">
                <Phone size={12} /> Mobile Number
              </label>
              <input 
                name="phone" 
                value={form.phone} 
                onChange={handleChange} 
                className="vy-input w-full" 
                placeholder="10-digit mobile number"
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={saving}
              className="btn-primary text-xs py-3 px-8 uppercase tracking-widest flex items-center gap-2"
            >
              {saving ? 'Saving...' : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-vy-card border border-vy-border p-6 md:p-10">
        <h3 className="text-vy-white text-xs font-bold tracking-widest uppercase mb-4 border-b border-vy-border pb-2 flex items-center gap-2">
          <Lock size={14} /> Authentication
        </h3>
        
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <p className="text-vy-white text-sm font-bold mb-1">Change Password</p>
            <p className="text-vy-grey text-xs">Receive an email to reset your account password.</p>
          </div>
          
          <button 
            onClick={handlePasswordReset}
            disabled={resetSent || isGoogleLinked}
            className={`btn-outline text-xs py-2 px-6 uppercase tracking-widest ${isGoogleLinked ? 'opacity-50 cursor-not-allowed border-vy-border text-vy-grey hover:bg-transparent' : ''}`}
          >
            {resetSent ? 'Email Sent' : 'Reset Password'}
          </button>
        </div>
        {isGoogleLinked && (
          <p className="text-[10px] text-vy-accent uppercase tracking-widest mt-4">
            You are signed in with Google. Password resets are handled by Google.
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default Settings;
