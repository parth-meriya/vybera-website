import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Mail, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { resendVerificationEmail, linkGoogleAccount } from '../../firebase/auth';
import { getUserProfile, updateUserProfile } from '../../firebase/users';
import toast from 'react-hot-toast';

const Security = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [linking, setLinking] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const prof = await getUserProfile(user.uid);
        setProfile(prof);
        if (prof?.deleteRequestPending) {
          setDeleteRequested(true);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await resendVerificationEmail();
      toast.success('Verification email sent!', { className: 'toast-vybera' });
    } catch (err) {
      toast.error(err.message || 'Failed to send email', { className: 'toast-vybera' });
    } finally {
      setResending(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLinking(true);
    try {
      await linkGoogleAccount();
      toast.success('Google account linked successfully!', { className: 'toast-vybera' });
      // Reload page to reflect changes in user object
      window.location.reload();
    } catch (err) {
      toast.error(err.message || 'Failed to link account', { className: 'toast-vybera' });
    } finally {
      setLinking(false);
    }
  };

  const requestAccountDeletion = async () => {
    if (window.confirm("Are you sure you want to request account deletion? This action is irreversible once processed.")) {
      try {
        await updateUserProfile(user.uid, { deleteRequestPending: true, deleteRequestedAt: new Date().toISOString() });
        setDeleteRequested(true);
        toast.success('Account deletion requested.', { className: 'toast-vybera' });
      } catch (err) {
        toast.error('Failed to submit request.', { className: 'toast-vybera' });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner mb-6" />
      </div>
    );
  }

  const isEmailVerified = user?.emailVerified;
  const isGoogleLinked = user?.providerData?.some(p => p.providerId === 'google.com');

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-3xl">
      <div>
        <h2 className="font-display font-bold text-3xl tracking-wider text-[#30231F] mb-2">Security</h2>
        <p className="text-[#75665C] text-xs tracking-[0.2em] uppercase font-semibold">Manage your account security</p>
      </div>

      {/* Email Verification */}
      <div className="bg-[#FAF5ED] border border-[#D4BEA5] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="mt-1">
            {isEmailVerified ? <ShieldCheck size={24} className="text-emerald-700" /> : <ShieldAlert size={24} className="text-amber-600" />}
          </div>
          <div>
            <h3 className="text-[#30231F] text-sm font-bold tracking-widest uppercase mb-1">Email Verification</h3>
            <p className="text-[#75665C] text-xs mb-2">
              Status: <span className={isEmailVerified ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                {isEmailVerified ? "Verified" : "Unverified"}
              </span>
            </p>
            <p className="text-[#75665C] text-xs font-medium">
              {isEmailVerified 
                ? "Your email address has been verified successfully." 
                : "Please verify your email address to secure your account."}
            </p>
          </div>
        </div>
        {!isEmailVerified && (
          <button 
            onClick={handleResendVerification}
            disabled={resending}
            className="border border-[#D4BEA5] bg-white text-[#30231F] hover:bg-[#F3E7D8]/40 rounded-lg text-xs py-2 px-6 uppercase tracking-widest font-semibold whitespace-nowrap shadow-sm"
          >
            {resending ? 'Sending...' : 'Resend Email'}
          </button>
        )}
      </div>

      {/* Linked Accounts */}
      <div className="bg-[#FAF5ED] border border-[#D4BEA5] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="mt-1 bg-white border border-[#D4BEA5] rounded-full p-1.5 flex items-center justify-center h-8 w-8 shadow-sm">
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
          <div>
            <h3 className="text-[#30231F] text-sm font-bold tracking-widest uppercase mb-1">Google Account</h3>
            <p className="text-[#75665C] text-xs mb-2">
              Status: <span className={isGoogleLinked ? "text-emerald-700 font-bold" : "text-[#75665C] font-semibold"}>
                {isGoogleLinked ? "Linked" : "Not Linked"}
              </span>
            </p>
            <p className="text-[#75665C] text-xs font-medium">
              {isGoogleLinked 
                ? "You can sign in quickly using your Google account." 
                : "Link your Google account for faster, secure sign-in."}
            </p>
          </div>
        </div>
        {!isGoogleLinked && (
          <button 
            onClick={handleLinkGoogle}
            disabled={linking}
            className="border border-[#D4BEA5] bg-white text-[#30231F] hover:bg-[#F3E7D8]/40 rounded-lg text-xs py-2 px-6 uppercase tracking-widest font-semibold whitespace-nowrap shadow-sm"
          >
            {linking ? 'Linking...' : 'Link Google'}
          </button>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <h3 className="text-rose-900 text-sm font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-600" /> Danger Zone
        </h3>
        
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div>
            <p className="text-[#30231F] text-sm font-bold mb-1">Delete Account</p>
            <p className="text-[#75665C] text-xs max-w-md leading-relaxed font-medium">
              Once you request account deletion, our admins will process it within 7 days. Your data, orders, and custom designs will be permanently removed.
            </p>
          </div>
          
          <button 
            onClick={requestAccountDeletion}
            disabled={deleteRequested}
            className={`text-xs py-2.5 px-6 uppercase tracking-widest font-bold rounded-lg border transition-colors whitespace-nowrap ${
              deleteRequested 
                ? 'bg-rose-100 border-rose-300 text-rose-500 cursor-not-allowed' 
                : 'bg-white border-rose-300 text-rose-700 hover:bg-rose-100 shadow-sm'
            }`}
          >
            {deleteRequested ? 'Request Pending' : 'Request Deletion'}
          </button>
        </div>
      </div>

    </motion.div>
  );
};

export default Security;
