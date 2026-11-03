import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { getSections, addSection, updateSection, deleteSection } from '../../firebase/sections';
import toast from 'react-hot-toast';

const AdminSections = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const data = await getSections();
      setSections(data);
    } catch (err) {
      toast.error('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentSection.label || !currentSection.slug) {
      toast.error('Label and Slug are required.');
      return;
    }

    try {
      if (currentSection.isNew) {
        // Prevent duplicate slugs
        if (sections.some(s => s.slug === currentSection.slug)) {
          toast.error('A section with this slug already exists.');
          return;
        }
        await addSection({
          ...currentSection,
          order: sections.length + 1,
        });
        toast.success('Section added!');
      } else {
        await updateSection(currentSection.id || currentSection.slug, {
          label: currentSection.label,
          slug: currentSection.slug,
          visible: currentSection.visible,
          order: Number(currentSection.order || 99)
        });
        toast.success('Section updated!');
      }
      setIsEditing(false);
      fetchSections();
    } catch (err) {
      toast.error('Failed to save section');
      console.error(err);
    }
  };

  const toggleVisibility = async (section) => {
    try {
      await updateSection(section.id, { visible: !section.visible });
      fetchSections();
      toast.success(section.visible ? 'Section hidden' : 'Section visible');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (slug) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    try {
      await deleteSection(slug);
      toast.success('Section deleted');
      fetchSections();
    } catch (err) {
      toast.error('Failed to delete section');
    }
  };

  const generateSlug = (label) => {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  if (loading) return <div className="p-8 text-vy-grey flex items-center gap-2"><RefreshCw className="animate-spin" /> Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-[#75665C] text-xs tracking-widest uppercase mb-1">Admin</p>
          <h1 className="font-display font-bold text-2xl text-[#30231F] tracking-widest uppercase">Sections & Categories</h1>
        </div>
        
        <button 
          onClick={() => {
            setCurrentSection({ label: '', slug: '', visible: true, isNew: true });
            setIsEditing(true);
          }}
          className="btn-primary flex items-center gap-2 text-xs"
        >
          <Plus size={16} /> New Section
        </button>
      </div>

      <div className="bg-[#FAF5ED] border border-[#D4BEA5] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#FAF5ED] border-b border-[#D4BEA5] text-xs uppercase tracking-widest text-[#75665C]">
            <tr>
              <th className="p-4 font-semibold w-16 text-center">Order</th>
              <th className="p-4 font-semibold">Label</th>
              <th className="p-4 font-semibold">Slug (URL)</th>
              <th className="p-4 font-semibold">Type</th>
              <th className="p-4 font-semibold">Visibility</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {sections.map((sec, i) => (
              <tr key={sec.id} className="border-b border-[#D4BEA5] hover:bg-[#F3E7D8]/60 transition-colors">
                <td className="p-4 text-center text-[#75665C] text-xs font-mono font-bold">{sec.order || i + 1}</td>
                <td className="p-4 text-[#30231F] font-bold">{sec.label}</td>
                <td className="p-4 text-[#75665C] text-xs font-mono">/{sec.isSystem ? sec.slug : `collections/${sec.slug}`}</td>
                <td className="p-4">
                  <span className={`text-[10px] px-2.5 py-1 uppercase tracking-widest font-bold border rounded ${
                    sec.isSystem ? 'bg-white text-[#75665C] border-[#D4BEA5]' : 'badge-processing'
                  }`}>
                    {sec.isSystem ? 'System' : 'Custom'}
                  </span>
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => toggleVisibility(sec)}
                    className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded transition-colors ${
                      sec.visible 
                        ? 'badge-confirmed' 
                        : 'badge-cancelled'
                    }`}
                  >
                    {sec.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                    {sec.visible ? 'Visible' : 'Hidden'}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => { setCurrentSection(sec); setIsEditing(true); }} className="text-[#75665C] hover:text-[#590907] p-1"><Edit2 size={16} /></button>
                    {!sec.isSystem && (
                      <button onClick={() => handleDelete(sec.id)} className="text-[#75665C] hover:text-rose-700 p-1"><Trash2 size={16} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {sections.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-[#75665C]">No sections found. Click "New Section" to add one.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              key="section-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FAF5ED] border border-[#D4BEA5] w-full max-w-md overflow-hidden shadow-xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-[#D4BEA5]">
                <h3 className="font-display font-bold tracking-widest uppercase text-[#30231F] text-lg">
                  {currentSection.isNew ? 'New Section' : 'Edit Section'}
                </h3>
                <button onClick={() => setIsEditing(false)} className="text-[#75665C] hover:text-[#590907] p-1">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-[#75665C] font-semibold mb-2 block">Display Label</label>
                  <input
                    required
                    value={currentSection.label || ''}
                    onChange={e => {
                      const label = e.target.value;
                      if (currentSection.isNew) {
                        setCurrentSection({ ...currentSection, label, slug: generateSlug(label) });
                      } else {
                        setCurrentSection({ ...currentSection, label });
                      }
                    }}
                    className="vy-input"
                    placeholder="e.g. Summer Collection"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-[#75665C] font-semibold mb-2 block">URL Slug</label>
                  <input
                    required
                    disabled={!currentSection.isNew}
                    value={currentSection.slug || ''}
                    onChange={e => setCurrentSection({ ...currentSection, slug: generateSlug(e.target.value) })}
                    className="vy-input disabled:opacity-50"
                    placeholder="e.g. summer-collection"
                  />
                  {!currentSection.isNew && <p className="text-[10px] text-[#75665C] mt-1">Slug cannot be changed after creation.</p>}
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-[#75665C] font-semibold mb-2 block">Sort Order</label>
                  <input
                    type="number"
                    value={currentSection.order || ''}
                    onChange={e => setCurrentSection({ ...currentSection, order: e.target.value })}
                    className="vy-input"
                    placeholder="e.g. 1"
                  />
                  <p className="text-[10px] text-[#75665C] mt-1">Lower numbers appear first in the navbar.</p>
                </div>

                <div className="pt-4 border-t border-[#D4BEA5] flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border border-[#D4BEA5] text-xs uppercase tracking-widest font-bold text-[#30231F] hover:bg-[#F3E7D8] transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary px-6 py-2 text-xs">
                    Save Section
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

export default AdminSections;
