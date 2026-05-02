import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

const AdminContent = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'content', 'about')).then(snap => {
      if (snap.exists()) setText(snap.data().text || '');
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'content', 'about'), { text, updatedAt: serverTimestamp() });
      toast.success('About content saved.', { className: 'toast-vybera' });
    } catch {
      toast.error('Failed to save.', { className: 'toast-vybera' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-vy-grey text-xs tracking-widest uppercase mb-1">Admin</p>
        <h1 className="font-display font-bold text-2xl tracking-wider text-vy-white">Content Management</h1>
      </div>

      <div className="bg-vy-card border border-vy-border p-6 max-w-3xl">
        <h2 className="text-vy-white font-semibold text-sm tracking-wider uppercase mb-4">About Page</h2>
        <p className="text-vy-grey text-xs mb-6 tracking-wide">
          Edit the content that appears on the About page. Plain text, line breaks supported.
        </p>

        {loading ? (
          <div className="h-64 flex items-center justify-center"><div className="spinner" /></div>
        ) : (
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={14}
            className="vy-input resize-none w-full text-sm leading-relaxed font-light mb-4"
            placeholder="Write your brand story here..."
          />
        )}

        <div className="flex items-center justify-between">
          <span className="text-vy-grey text-xs">{text.length} characters</span>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="btn-primary disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Content'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminContent;
