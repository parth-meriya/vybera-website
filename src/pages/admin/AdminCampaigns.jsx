import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Link as LinkIcon, Download, RefreshCw, X, Save, Gift, Copy, Check, Eye } from 'lucide-react';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [rewardTxs, setRewardTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'free_tees'

  useEffect(() => {
    fetchCampaigns();
    
    // Realtime listener for Free Tee approvals
    const q = query(collection(db, 'rewardTransactions'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(tx => tx.type === 'FREE_TEE');
      setRewardTxs(txs);
    });

    return () => unsubscribe();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'campaigns'));
      setCampaigns(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      toast.error('Failed to load campaigns');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentCampaign.id || currentCampaign.id.length < 3) {
      toast.error('Campaign ID must be at least 3 characters long (e.g., street-challenge)');
      return;
    }
    
    // Auto-generate token if not present
    const campaignToSave = {
      ...currentCampaign,
      token: currentCampaign.token || Math.random().toString(36).substring(2, 15),
      usageLimit: parseInt(currentCampaign.usageLimit) || 0
    };

    try {
      await setDoc(doc(db, 'campaigns', campaignToSave.id), campaignToSave);
      toast.success('Campaign saved!');
      setIsEditing(false);
      fetchCampaigns();
    } catch (err) {
      toast.error('Failed to save campaign');
    }
  };

  const deleteCampaign = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'campaigns', id));
      toast.success('Campaign deleted');
      fetchCampaigns();
    } catch (err) {
      toast.error('Failed to delete campaign');
    }
  };

  const toggleActive = async (campaign) => {
    try {
      await updateDoc(doc(db, 'campaigns', campaign.id), { active: !campaign.active });
      fetchCampaigns();
      toast.success(campaign.active ? 'Campaign paused' : 'Campaign activated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const updateTeeStatus = async (txId, newStatus) => {
    try {
      await updateDoc(doc(db, 'rewardTransactions', txId), { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const copyLink = (id, token) => {
    const url = `${window.location.origin}/campaign/${id}?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Campaign link copied!');
  };

  const downloadQR = (id) => {
    const svg = document.getElementById(`qr-${id}`);
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `vybera-campaign-${id}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (loading) return <div className="p-8 text-vy-grey flex items-center gap-2"><RefreshCw className="animate-spin" /> Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display font-bold text-2xl text-vy-white tracking-widest uppercase">Secret Campaigns</h1>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('campaigns')}
            className={`btn-primary px-4 py-2 text-xs ${activeTab === 'campaigns' ? '' : 'bg-vy-card text-vy-grey'}`}
          >
            Campaigns
          </button>
          <button 
            onClick={() => setActiveTab('free_tees')}
            className={`btn-primary px-4 py-2 text-xs flex items-center gap-2 ${activeTab === 'free_tees' ? '' : 'bg-vy-card text-vy-grey'}`}
          >
            <Gift size={14} /> Free Tees
            {rewardTxs.filter(t => t.status === 'pending').length > 0 && (
              <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                {rewardTxs.filter(t => t.status === 'pending').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'campaigns' ? (
        <>
          <div className="mb-6 flex justify-end">
            <button 
              onClick={() => {
                setCurrentCampaign({ id: '', active: true, bannerUrl: '', token: '', isNew: true });
                setIsEditing(true);
              }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> New Campaign
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map(c => (
              <div key={c.id} className="bg-vy-card border border-vy-border p-5 relative group">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => { setCurrentCampaign(c); setIsEditing(true); }} className="text-vy-grey hover:text-vy-white"><Edit2 size={16} /></button>
                  <button onClick={() => deleteCampaign(c.id)} className="text-vy-grey hover:text-red-400"><Trash2 size={16} /></button>
                </div>
                
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-vy-white p-2 rounded-sm hidden">
                    {/* Hidden SVG for download */}
                    <QRCodeSVG 
                      id={`qr-${c.id}`}
                      value={`${window.location.origin}/campaign/${c.id}?token=${c.token}`} 
                      size={512}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  
                  <div className="bg-vy-white p-1">
                     <QRCodeSVG 
                      value={`${window.location.origin}/campaign/${c.id}?token=${c.token}`} 
                      size={64}
                      level="L"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-vy-white font-bold tracking-widest uppercase">{c.id}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`w-2 h-2 rounded-full ${c.active ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-[10px] text-vy-grey uppercase">{c.active ? 'Active' : 'Paused'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-vy-grey mb-4 bg-vy-black p-3 rounded-sm">
                  <div>
                    <p className="uppercase text-[10px] opacity-70">Total Spins</p>
                    <p className="text-vy-white font-bold text-lg">{c.totalSpins || 0}</p>
                  </div>
                  <div>
                    <p className="uppercase text-[10px] opacity-70">Limit</p>
                    <p className="text-vy-white font-bold text-lg">{c.usageLimit > 0 ? c.usageLimit : '∞'}</p>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-vy-border pt-4">
                  <button onClick={() => toggleActive(c)} className="flex-1 border border-vy-border py-2 text-xs uppercase hover:bg-vy-border/20 transition-colors">
                    {c.active ? 'Pause' : 'Activate'}
                  </button>
                  <button onClick={() => downloadQR(c.id)} className="flex-1 bg-vy-white text-vy-black font-bold py-2 text-xs flex items-center justify-center gap-2 hover:bg-vy-accent transition-colors">
                    <Download size={14} /> QR
                  </button>
                  <button onClick={() => copyLink(c.id, c.token)} className="flex-1 border border-vy-border py-2 text-xs flex items-center justify-center gap-2 hover:bg-vy-border/20 transition-colors">
                    <LinkIcon size={14} /> Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-vy-card border border-vy-border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-vy-black border-b border-vy-border text-xs uppercase tracking-widest text-vy-grey">
              <tr>
                <th className="p-4 font-normal">Date</th>
                <th className="p-4 font-normal">User</th>
                <th className="p-4 font-normal">Campaign</th>
                <th className="p-4 font-normal">Status</th>
                <th className="p-4 font-normal">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {rewardTxs.map(tx => (
                <tr key={tx.id} className="border-b border-vy-border/50 hover:bg-vy-black/50">
                  <td className="p-4 text-vy-grey">{tx.timestamp?.toDate().toLocaleString()}</td>
                  <td className="p-4">
                    <p className="text-vy-white">{tx.email}</p>
                    <p className="text-vy-grey text-xs">{tx.phone}</p>
                  </td>
                  <td className="p-4 text-vy-white uppercase text-xs">{tx.campaignId}</td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2 py-1 uppercase tracking-widest border ${
                      tx.status === 'pending' ? 'bg-vy-yellow/10 text-vy-yellow border-vy-yellow/20' :
                      tx.status === 'approved' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      tx.status === 'shipped' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <select 
                      value={tx.status}
                      onChange={(e) => updateTeeStatus(tx.id, e.target.value)}
                      className="bg-vy-black border border-vy-border text-vy-white text-xs px-2 py-1 uppercase"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approve</option>
                      <option value="shipped">Mark Shipped</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </td>
                </tr>
              ))}
              {rewardTxs.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-vy-grey">No free tee rewards found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              key="campaign-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vy-card border border-vy-border w-full max-w-lg overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-vy-border">
                <h3 className="font-display font-bold tracking-widest uppercase text-vy-white text-lg">
                  {currentCampaign.id ? 'Edit Campaign' : 'New Campaign'}
                </h3>
                <button onClick={() => setIsEditing(false)} className="text-vy-grey hover:text-vy-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-vy-grey mb-2 block">Campaign ID (URL Slug)</label>
                  <input
                    required
                    disabled={!currentCampaign.isNew}
                    value={currentCampaign.id || ''}
                    onChange={e => setCurrentCampaign({ ...currentCampaign, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="vy-input disabled:opacity-50"
                    placeholder="e.g. summer-spin-2026"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-vy-grey mb-2 block">Secret Token</label>
                  <input
                    value={currentCampaign.token || ''}
                    onChange={e => setCurrentCampaign({ ...currentCampaign, token: e.target.value })}
                    className="vy-input"
                    placeholder="Auto-generated if empty"
                  />
                  <p className="text-[10px] text-vy-grey mt-1">Users need this token in the URL to access the page.</p>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-vy-grey mb-2 block">Banner Image URL (Optional)</label>
                  <input
                    value={currentCampaign.bannerUrl || ''}
                    onChange={e => setCurrentCampaign({ ...currentCampaign, bannerUrl: e.target.value })}
                    className="vy-input"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-vy-grey mb-2 block">Total Spin Limit (Optional)</label>
                  <input
                    type="number"
                    value={currentCampaign.usageLimit || ''}
                    onChange={e => setCurrentCampaign({ ...currentCampaign, usageLimit: e.target.value })}
                    className="vy-input"
                    placeholder="e.g. 100 (0 for unlimited)"
                  />
                  <p className="text-[10px] text-vy-grey mt-1">Once this many spins are reached, the campaign will stop accepting spins.</p>
                </div>

                <div className="pt-4 border-t border-vy-border flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border border-vy-border text-xs uppercase tracking-widest hover:bg-vy-border/20 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary px-6 py-2 text-xs flex items-center gap-2">
                    <Save size={16} /> Save Campaign
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCampaigns;
