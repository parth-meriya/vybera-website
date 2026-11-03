import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, PlusCircle, MinusCircle, Check } from 'lucide-react';
import { getSizeGuides, saveSizeGuide, deleteSizeGuide } from '../../firebase/sizeGuides';
import toast from 'react-hot-toast';

const AdminSizeGuides = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [headers, setHeaders] = useState(['Size', 'Chest (in)', 'Length (in)']);
  const [rows, setRows] = useState([
    ['S', '38', '27'],
    ['M', '40', '28'],
    ['L', '42', '29']
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    setLoading(true);
    const data = await getSizeGuides();
    setGuides(data);
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setEditingGuide(null);
    setName('');
    setDescription('');
    setHeaders(['Size', 'Chest (in)', 'Length (in)']);
    setRows([
      ['S', '38', '27'],
      ['M', '40', '28'],
      ['L', '42', '29']
    ]);
    setModalOpen(true);
  };

  const handleOpenEdit = (guide) => {
    setEditingGuide(guide);
    setName(guide.name || '');
    setDescription(guide.description || '');
    setHeaders(guide.headers || ['Size', 'Chest (in)', 'Length (in)']);
    setRows(guide.rows || [
      ['S', '38', '27'],
      ['M', '40', '28']
    ]);
    setModalOpen(true);
  };

  const handleAddColumn = () => {
    setHeaders([...headers, 'New Col']);
    setRows(rows.map(r => [...r, '']));
  };

  const handleRemoveColumn = (colIdx) => {
    if (headers.length <= 1) return;
    setHeaders(headers.filter((_, i) => i !== colIdx));
    setRows(rows.map(r => r.filter((_, i) => i !== colIdx)));
  };

  const handleAddRow = () => {
    setRows([...rows, Array(headers.length).fill('')]);
  };

  const handleRemoveRow = (rowIdx) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== rowIdx));
  };

  const handleCellChange = (rIdx, cIdx, val) => {
    const newRows = [...rows];
    newRows[rIdx][cIdx] = val;
    setRows(newRows);
  };

  const handleHeaderChange = (cIdx, val) => {
    const newHeaders = [...headers];
    newHeaders[cIdx] = val;
    setHeaders(newHeaders);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a size guide name.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        headers,
        rows
      };
      if (editingGuide) {
        payload.createdAt = editingGuide.createdAt;
      }
      await saveSizeGuide(editingGuide?.id || null, payload);
      toast.success(editingGuide ? 'Size guide updated!' : 'Size guide created!');
      setModalOpen(false);
      fetchGuides();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save size guide.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this size guide?')) return;
    try {
      await deleteSizeGuide(id);
      toast.success('Size guide deleted.');
      fetchGuides();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete size guide.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-wider text-[#30231F] uppercase">Size Guides</h1>
          <p className="text-[#75665C] text-xs mt-1 font-semibold">Manage reusable size charts linked to your catalog products.</p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Create Size Guide
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><div className="spinner" /></div>
      ) : guides.length === 0 ? (
        <div className="border border-[#D4BEA5] bg-[#FAF5ED] p-12 text-center shadow-sm">
          <p className="text-[#75665C] text-sm">No size guides created yet. Click "Create Size Guide" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map(g => (
            <div key={g.id} className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 flex flex-col justify-between group hover:border-[#590907] transition-all duration-300 shadow-sm">
              <div>
                <h3 className="text-[#30231F] font-bold text-lg tracking-wider mb-2">{g.name}</h3>
                {g.description && <p className="text-[#75665C] text-xs mb-4 line-clamp-2 leading-relaxed">{g.description}</p>}
                
                {/* Visual Preview */}
                <div className="overflow-x-auto border border-[#D4BEA5] bg-white p-2 mb-4">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="border-b border-[#D4BEA5] text-[#75665C] uppercase font-bold tracking-widest">
                        {g.headers?.slice(0, 3).map((h, i) => (
                          <th key={i} className="pb-1 px-1">{h}</th>
                        ))}
                        {g.headers?.length > 3 && <th className="pb-1 px-1">...</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows?.slice(0, 3).map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-[#D4BEA5]/40 text-[#30231F] last:border-0">
                          {row.slice(0, 3).map((cell, cIdx) => (
                            <td key={cIdx} className="py-1 px-1 font-medium">{cell}</td>
                          ))}
                          {g.headers?.length > 3 && <td className="py-1 px-1 text-[#75665C]">...</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#D4BEA5] pt-4 mt-2">
                <span className="text-[10px] text-[#75665C] uppercase tracking-widest font-bold">
                  {g.headers?.length} cols x {g.rows?.length} rows
                </span>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEdit(g)} className="p-2 border border-[#D4BEA5] text-[#75665C] hover:text-[#590907] hover:bg-[#F3E7D8] transition-all bg-white">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => handleDelete(g.id)} className="p-2 border border-[#D4BEA5] text-[#75665C] hover:text-rose-700 hover:border-rose-400 hover:bg-rose-50 transition-all bg-white">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FAF5ED] border border-[#D4BEA5] w-full max-w-4xl p-6 relative shadow-xl"
            >
              <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-[#75665C] hover:text-[#590907]">
                <X size={20} />
              </button>

              <h2 className="font-display font-bold text-xl tracking-wider text-[#30231F] uppercase mb-6">
                {editingGuide ? 'Edit Size Guide' : 'Create Size Guide'}
              </h2>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[#75665C] text-[10px] uppercase tracking-widest font-bold block mb-2">Guide Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="E.g. Oversized Tee Guide"
                      className="vy-input text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[#75665C] text-[10px] uppercase tracking-widest font-bold block mb-2">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="E.g. Measurements in inches for loose fits"
                      className="vy-input text-sm"
                    />
                  </div>
                </div>

                {/* Grid Editor */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[#75665C] text-[10px] uppercase tracking-widest font-bold block">Interactive Size Chart Grid</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleAddColumn} className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold border border-[#D4BEA5] px-2 py-1 text-[#30231F] bg-white hover:bg-[#F3E7D8]">
                        <PlusCircle size={12} /> Add Column
                      </button>
                      <button type="button" onClick={handleAddRow} className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold border border-[#D4BEA5] px-2 py-1 text-[#30231F] bg-white hover:bg-[#F3E7D8]">
                        <PlusCircle size={12} /> Add Row
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-[#D4BEA5] bg-white">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#D4BEA5] bg-[#F3E7D8]/60">
                          {headers.map((h, cIdx) => (
                            <th key={cIdx} className="p-3 border-r border-[#D4BEA5] text-center last:border-r-0 min-w-[120px]">
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  value={h}
                                  onChange={e => handleHeaderChange(cIdx, e.target.value)}
                                  className="bg-transparent border-0 text-[#30231F] font-bold text-center uppercase text-xs tracking-wider w-full focus:outline-none"
                                />
                                {headers.length > 1 && (
                                  <button type="button" onClick={() => handleRemoveColumn(cIdx)} className="text-[#75665C] hover:text-rose-700">
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            </th>
                          ))}
                          <th className="w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-[#D4BEA5] last:border-b-0">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2 border-r border-[#D4BEA5] last:border-r-0">
                                <input
                                  type="text"
                                  value={cell}
                                  onChange={e => handleCellChange(rIdx, cIdx, e.target.value)}
                                  className="bg-transparent border-0 text-[#30231F] text-center text-xs w-full focus:outline-none font-medium"
                                  placeholder="—"
                                />
                              </td>
                            ))}
                            <td className="p-2 text-center w-12">
                              {rows.length > 1 && (
                                <button type="button" onClick={() => handleRemoveRow(rIdx)} className="text-[#75665C] hover:text-rose-700">
                                  <X size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#D4BEA5] flex justify-end gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-2.5 border border-[#D4BEA5] text-[#30231F] text-xs uppercase tracking-widest font-bold hover:bg-[#F3E7D8]">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60 flex items-center gap-2">
                    {saving ? 'Saving...' : <><Check size={16} /> Save Size Guide</>}
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

export default AdminSizeGuides;
