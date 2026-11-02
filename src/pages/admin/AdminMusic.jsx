import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Music,
  Upload,
  Play,
  Pause,
  Volume2,
  Save,
  Check,
  AlertCircle,
  Sparkles,
  FileAudio,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getMusicConfig,
  updateMusicConfig,
  uploadMusic,
  DEFAULT_MUSIC_CONFIG,
} from '../../firebase/content';
import BackButton from '../../components/ui/BackButton';

const PRESET_TRACKS = [
  {
    name: 'Diwali Festive Instrumental (Flute, Sitar & Bells)',
    path: '/sounds/diwali_ambient.mp3',
    description: 'Soft traditional flute & sitar melody engineered for festive storefronts.',
  },
  {
    name: 'Classical Sitar & Ambient Mood',
    path: '/sounds/background.mp3',
    description: 'Atmospheric sitar chords with subtle rhythmic texture.',
  },
  {
    name: 'Anniversary Acoustic Piano',
    path: '/sounds/all_of_me.mp3',
    description: 'Minimalist soothing instrumental.',
  },
];

const AdminMusic = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [config, setConfig] = useState(DEFAULT_MUSIC_CONFIG);

  // Preview player state
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getMusicConfig()
      .then((cfg) => {
        setConfig(cfg || DEFAULT_MUSIC_CONFIG);
        setLoading(false);
      })
      .catch(() => {
        setConfig(DEFAULT_MUSIC_CONFIG);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMusicConfig(config);
      toast.success('Background music settings saved & published!', {
        className: 'toast-vybera',
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save music settings.', { className: 'toast-vybera' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/ogg'];
    if (!validTypes.some((t) => file.type.includes(t)) && !file.name.match(/\.(mp3|wav|m4a|aac|ogg)$/i)) {
      toast.error('Please upload a valid audio file (.mp3, .wav, .m4a, .aac).', {
        className: 'toast-vybera',
      });
      return;
    }

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Audio file size exceeds 20MB limit. Please compress first.', {
        className: 'toast-vybera',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const downloadUrl = await uploadMusic(file, (progress) => {
        setUploadProgress(progress);
      });

      setConfig((prev) => ({
        ...prev,
        musicUrl: downloadUrl,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
      }));

      toast.success('Audio file uploaded to Firebase Storage!', { className: 'toast-vybera' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload audio file.', { className: 'toast-vybera' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const togglePreview = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    if (isPreviewPlaying) {
      audio.pause();
      setIsPreviewPlaying(false);
    } else {
      audio.volume = config.defaultVolume || 0.25;
      audio.play().then(() => setIsPreviewPlaying(true)).catch((e) => {
        toast.error('Could not preview track: ' + e.message, { className: 'toast-vybera' });
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-vy-burgundy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-vy-border-light">
        <div>
          <BackButton />
          <div className="flex items-center gap-3 mt-4">
            <span className="p-2.5 bg-vy-burgundy text-[#FAF5ED]">
              <Music size={22} />
            </span>
            <div>
              <h1 className="font-display font-bold text-2xl md:text-3xl tracking-wide text-vy-text uppercase">
                Background Music Manager
              </h1>
              <p className="text-xs text-vy-text-muted mt-0.5 tracking-wider">
                DIWALI FESTIVE SOUNDTRACK & AUDIO CONTROLLER
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploading}
          className="btn-primary !py-2.5 !px-6"
        >
          <Save size={15} />
          {saving ? 'Saving...' : 'Save & Publish'}
        </button>
      </div>

      {/* Main Switch Bar */}
      <div className="mb-8 p-5 bg-[#FAF5ED] border border-vy-border-light flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`w-3 h-3 rounded-full ${
              config.enabled ? 'bg-emerald-600 animate-pulse' : 'bg-stone-400'
            }`}
          />
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-vy-text">
              Status: {config.enabled ? 'Background Music Enabled' : 'Background Music Disabled'}
            </div>
            <div className="text-[11px] text-vy-text-muted">
              {config.enabled
                ? 'Plays softly across customer browsing with bottom control button.'
                : 'Music player is hidden completely from visitors.'}
            </div>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig((c) => ({ ...c, enabled: e.target.checked }))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-vy-sage/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vy-burgundy" />
          <span className="ml-3 text-xs font-bold tracking-wider uppercase text-vy-text">
            {config.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Track Details & Upload (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Track Metadata */}
          <div className="bg-[#FAF5ED] border border-vy-border-light p-6">
            <h2 className="text-xs font-bold tracking-[0.2em] text-vy-burgundy uppercase mb-4 flex items-center gap-2">
              <Sparkles size={14} /> Soundtrack Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-vy-text mb-1.5">
                  Track Title (Shown to Customer)
                </label>
                <input
                  type="text"
                  value={config.title || ''}
                  onChange={(e) => setConfig((c) => ({ ...c, title: e.target.value }))}
                  placeholder="Diwali Festive Instrumental — Flute, Sitar & Bells"
                  className="vy-input font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider uppercase text-vy-text mb-1.5">
                  Audio Stream URL (.mp3 / Storage URL)
                </label>
                <input
                  type="text"
                  value={config.musicUrl || ''}
                  onChange={(e) => setConfig((c) => ({ ...c, musicUrl: e.target.value }))}
                  placeholder="/sounds/diwali_ambient.mp3 or https://..."
                  className="vy-input text-xs"
                />
              </div>

              {/* Upload Music File */}
              <div className="pt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="audio/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary w-full !py-3 flex items-center justify-center gap-2"
                >
                  <Upload size={14} />
                  {uploading ? `Uploading... (${uploadProgress}%)` : 'Upload New Audio Track (MP3/WAV)'}
                </button>

                {uploading && (
                  <div className="mt-2 w-full bg-vy-border-light h-2 overflow-hidden">
                    <div
                      className="bg-vy-burgundy h-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preset Audio Selections */}
          <div className="bg-[#FAF5ED] border border-vy-border-light p-6">
            <h2 className="text-xs font-bold tracking-[0.2em] text-vy-burgundy uppercase mb-3 flex items-center gap-2">
              <FileAudio size={14} /> Built-in Presets
            </h2>
            <p className="text-[11px] text-vy-text-muted mb-4">
              Select one of the optimized local tracks for zero network buffering:
            </p>

            <div className="space-y-3">
              {PRESET_TRACKS.map((t) => {
                const isSelected = config.musicUrl === t.path;
                return (
                  <button
                    key={t.path}
                    type="button"
                    onClick={() =>
                      setConfig((c) => ({
                        ...c,
                        musicUrl: t.path,
                        title: t.name,
                      }))
                    }
                    className={`w-full p-3.5 border text-left transition-all flex items-start justify-between gap-4 ${
                      isSelected
                        ? 'border-vy-burgundy bg-vy-burgundy/5'
                        : 'border-vy-border-light bg-white hover:border-vy-sage'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-vy-text">{t.name}</p>
                      <p className="text-[10px] text-vy-text-muted mt-0.5">{t.description}</p>
                      <p className="text-[9px] font-mono text-vy-sage mt-1">{t.path}</p>
                    </div>
                    {isSelected && (
                      <span className="p-1 bg-vy-burgundy text-white rounded-full">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Audio Preview & Behavior Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Preview Card */}
          <div className="bg-[#FAF5ED] border border-vy-border-light p-6">
            <h2 className="text-xs font-bold tracking-[0.2em] text-vy-burgundy uppercase mb-4 flex items-center gap-2">
              <Volume2 size={14} /> Live Track Preview
            </h2>

            <div className="p-4 bg-white border border-vy-border-light text-center space-y-4">
              <audio
                ref={previewAudioRef}
                src={config.musicUrl}
                onEnded={() => setIsPreviewPlaying(false)}
                onError={() => setIsPreviewPlaying(false)}
              />

              <div className="w-16 h-16 mx-auto rounded-full bg-[#590907] text-[#FAF5ED] flex items-center justify-center shadow-lg">
                <Music size={26} className={isPreviewPlaying ? 'animate-bounce' : ''} />
              </div>

              <div>
                <p className="font-bold text-sm text-vy-text truncate">
                  {config.title || 'No Title Set'}
                </p>
                <p className="text-[10px] text-vy-text-muted mt-0.5">
                  Preview volume: {Math.round((config.defaultVolume || 0.25) * 100)}%
                </p>
              </div>

              <button
                type="button"
                onClick={togglePreview}
                className="btn-primary w-full !py-3 flex items-center justify-center gap-2"
              >
                {isPreviewPlaying ? (
                  <>
                    <Pause size={14} /> Stop Preview
                  </>
                ) : (
                  <>
                    <Play size={14} className="fill-current" /> Play Preview
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Volume & Welcome Prompt Setting */}
          <div className="bg-[#FAF5ED] border border-vy-border-light p-6 space-y-5">
            <h2 className="text-xs font-bold tracking-[0.2em] text-vy-burgundy uppercase">
              Audio Volume & Permissions
            </h2>

            <div>
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-vy-text mb-2">
                <span>Default Visitor Volume</span>
                <span className="text-vy-burgundy">
                  {Math.round((config.defaultVolume || 0.25) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={config.defaultVolume ?? 0.25}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    defaultVolume: parseFloat(e.target.value),
                  }))
                }
                className="w-full h-2 bg-[#E8D2B5] rounded appearance-none cursor-pointer accent-vy-burgundy"
              />
              <p className="text-[10px] text-vy-text-muted mt-1.5">
                Recommended 20% - 30% for gentle, non-intrusive festive ambiance.
              </p>
            </div>

            <div className="pt-4 border-t border-vy-border-light">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showWelcomePrompt !== false}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, showWelcomePrompt: e.target.checked }))
                  }
                  className="w-4 h-4 mt-0.5 text-vy-burgundy accent-vy-burgundy"
                />
                <div>
                  <span className="text-xs font-bold tracking-wider uppercase text-vy-text">
                    Enable Autoplay Welcome Prompt
                  </span>
                  <p className="text-[10px] text-vy-text-muted mt-0.5 leading-relaxed">
                    If browser blocks initial autoplay with sound, displays a discreet prompt:
                    <em> "Celebrate the VYBERA Diwali vibes ✨ Turn on festive music?"</em>
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Guidelines Note */}
          <div className="p-4 bg-vy-cream/60 border border-vy-border-light text-[11px] text-vy-text-muted leading-relaxed space-y-1">
            <p className="font-bold uppercase text-vy-burgundy flex items-center gap-1">
              <AlertCircle size={12} /> Browser Policy Note
            </p>
            <p>
              Mobile & desktop web browsers (Chrome, Safari, iOS) automatically mute unprompted
              audio until first user click. The welcome prompt guarantees compliance while giving
              customers one-tap control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMusic;
