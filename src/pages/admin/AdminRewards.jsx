import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Search, Plus, Minus, Info } from 'lucide-react';
import { getRewardSettings, updateRewardSettings, manualPointAdjustment } from '../../firebase/rewards';
import { getAllUsers } from '../../firebase/users';
import toast from 'react-hot-toast';

const AdminRewards = () => {
  const [settings, setSettings] = useState({
    enabled: true,
    earningRate: 100,
    redemptionRate: 1,
    minPayable: 99
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Manual Point Adjustment State
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustmentPoints, setAdjustmentPoints] = useState('');
  const [adjustmentDesc, setAdjustmentDesc] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [sets, allUsers] = await Promise.all([
          getRewardSettings(),
          getAllUsers()
        ]);
        if (sets) setSettings(sets);
        if (allUsers) setUsers(allUsers);
      } catch (err) {
        toast.error('Failed to load data', { className: 'toast-vybera' });
      }
    };
    init();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateRewardSettings(settings);
      toast.success('Reward settings updated', { className: 'toast-vybera' });
    } catch (err) {
      toast.error('Failed to save settings', { className: 'toast-vybera' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAdjustment = async (type) => {
    if (!selectedUser) return toast.error('Select a user first');
    const pts = parseInt(adjustmentPoints);
    if (!pts || pts <= 0) return toast.error('Enter a valid point amount');
    if (!adjustmentDesc.trim()) return toast.error('Enter a description');

    setIsAdjusting(true);
    try {
      await manualPointAdjustment(selectedUser.id, pts, type, adjustmentDesc);
      toast.success(`Successfully ${type === 'MANUAL_ADD' ? 'added' : 'deducted'} ${pts} points`);
      
      // Update local state to reflect change immediately
      setUsers(prev => prev.map(u => {
        if (u.id === selectedUser.id) {
          let np = (u.rewardPoints || 0);
          if (type === 'MANUAL_ADD') np += pts;
          else np = Math.max(0, np - pts);
          return { ...u, rewardPoints: np };
        }
        return u;
      }));
      
      setAdjustmentPoints('');
      setAdjustmentDesc('');
      setSelectedUser(null);
    } catch (err) {
      toast.error(err.message || 'Failed to adjust points', { className: 'toast-vybera' });
    } finally {
      setIsAdjusting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 pb-32 max-w-5xl mx-auto space-y-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display font-bold text-3xl text-vy-white mb-2">Rewards Management</h1>
        <p className="text-vy-grey text-xs uppercase tracking-widest">Configure global loyalty rules and manage user points</p>
      </motion.div>

      {/* Global Settings */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-vy-card border border-vy-border p-6 rounded-md">
        <div className="flex items-center gap-3 mb-6 border-b border-vy-border pb-4">
          <Settings size={20} className="text-vy-accent" />
          <h2 className="font-bold text-lg text-vy-white uppercase tracking-widest">Global Configuration</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={settings.enabled}
                  onChange={(e) => setSettings({...settings, enabled: e.target.checked})}
                />
                <div className={`block w-14 h-8 rounded-full transition-colors ${settings.enabled ? 'bg-vy-accent' : 'bg-vy-border'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-vy-white w-6 h-6 rounded-full transition-transform ${settings.enabled ? 'transform translate-x-6' : ''}`}></div>
              </div>
              <div>
                <p className="text-vy-white font-bold text-sm tracking-wider uppercase">Enable Rewards System</p>
                <p className="text-vy-grey text-[10px]">Toggle earning and redemption globally.</p>
              </div>
            </label>
            
            <div>
              <label className="block text-xs uppercase tracking-widest text-vy-grey mb-2">Earning Rate (Points per Product)</label>
              <input 
                type="number" 
                value={settings.earningRate}
                onChange={e => setSettings({...settings, earningRate: parseInt(e.target.value) || 0})}
                className="w-full bg-vy-dark border border-vy-border px-4 py-3 text-vy-white text-sm focus:outline-none focus:border-vy-accent"
              />
              <p className="text-[10px] text-vy-grey mt-2 flex items-center gap-1"><Info size={12}/> Default: 100 points per item delivered.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-vy-grey mb-2">Redemption Rate (1 Point = ₹?)</label>
              <input 
                type="number" 
                value={settings.redemptionRate}
                onChange={e => setSettings({...settings, redemptionRate: parseFloat(e.target.value) || 0})}
                className="w-full bg-vy-dark border border-vy-border px-4 py-3 text-vy-white text-sm focus:outline-none focus:border-vy-accent"
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-widest text-vy-grey mb-2">Minimum Payable Amount (₹)</label>
              <input 
                type="number" 
                value={settings.minPayable}
                onChange={e => setSettings({...settings, minPayable: parseInt(e.target.value) || 0})}
                className="w-full bg-vy-dark border border-vy-border px-4 py-3 text-vy-white text-sm focus:outline-none focus:border-vy-accent"
              />
              <p className="text-[10px] text-vy-grey mt-2 flex items-center gap-1"><Info size={12}/> Users cannot use points to drop order total below this.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="btn-primary flex items-center gap-2"
          >
            {savingSettings ? <div className="spinner w-4 h-4" /> : <Save size={16} />}
            Save Configuration
          </button>
        </div>
      </motion.div>

      {/* Manual Adjustments */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-vy-card border border-vy-border p-6 rounded-md">
        <div className="flex items-center gap-3 mb-6 border-b border-vy-border pb-4">
          <Award size={20} className="text-vy-accent" />
          <h2 className="font-bold text-lg text-vy-white uppercase tracking-widest">Manual Adjustments</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Selection */}
          <div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 text-vy-grey" size={16} />
              <input 
                type="text" 
                placeholder="Search user by email or name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-vy-dark border border-vy-border pl-10 pr-4 py-3 text-vy-white text-sm focus:outline-none focus:border-vy-accent"
              />
            </div>
            
            <div className="h-64 overflow-y-auto border border-vy-border bg-vy-dark">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-vy-grey text-xs">No users found</div>
              ) : (
                filteredUsers.map(u => (
                  <div 
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`p-3 border-b border-vy-border cursor-pointer transition-colors hover:bg-vy-border/20 ${selectedUser?.id === u.id ? 'bg-vy-accent/10 border-l-2 border-l-vy-accent' : ''}`}
                  >
                    <p className="text-vy-white text-sm font-bold truncate">{u.name || 'No Name'}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-vy-grey text-[10px] truncate">{u.email}</p>
                      <p className="text-vy-accent font-mono text-xs">{u.rewardPoints || 0} PTS</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Form */}
          <div className="space-y-4">
            {selectedUser ? (
              <div className="p-4 bg-vy-dark border border-vy-border mb-6">
                <p className="text-[10px] uppercase tracking-widest text-vy-grey mb-1">Selected User</p>
                <p className="text-vy-white font-bold">{selectedUser.name || selectedUser.email}</p>
                <p className="text-vy-accent font-mono mt-2">Current Balance: {selectedUser.rewardPoints || 0} PTS</p>
              </div>
            ) : (
              <div className="p-4 bg-vy-dark border border-vy-border border-dashed text-center mb-6">
                <p className="text-vy-grey text-xs">Select a user from the list to adjust points</p>
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-widest text-vy-grey mb-2">Points</label>
              <input 
                type="number" 
                placeholder="E.g., 500"
                value={adjustmentPoints}
                onChange={e => setAdjustmentPoints(e.target.value)}
                className="w-full bg-vy-dark border border-vy-border px-4 py-3 text-vy-white text-sm focus:outline-none focus:border-vy-accent"
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-widest text-vy-grey mb-2">Description / Reason</label>
              <input 
                type="text" 
                placeholder="E.g., Apology for delay, Promo winner..."
                value={adjustmentDesc}
                onChange={e => setAdjustmentDesc(e.target.value)}
                className="w-full bg-vy-dark border border-vy-border px-4 py-3 text-vy-white text-sm focus:outline-none focus:border-vy-accent"
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-vy-border">
              <button 
                onClick={() => handleAdjustment('MANUAL_ADD')}
                disabled={isAdjusting || !selectedUser}
                className="flex-1 bg-green-500 hover:bg-green-400 text-vy-black font-bold uppercase tracking-widest text-xs py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Plus size={16} /> Add Points
              </button>
              <button 
                onClick={() => handleAdjustment('MANUAL_DEDUCT')}
                disabled={isAdjusting || !selectedUser}
                className="flex-1 bg-red-500 hover:bg-red-400 text-vy-white font-bold uppercase tracking-widest text-xs py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Minus size={16} /> Deduct Points
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminRewards;
