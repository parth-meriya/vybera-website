import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Search, CheckCircle, Clock } from 'lucide-react';
import { submitContactQuery, trackSupportQuery } from '../firebase/contact';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';
import BackButton from '../components/ui/BackButton';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);

  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackId.trim()) return;
    setTrackLoading(true);
    setTrackResult(null);
    try {
      const data = await trackSupportQuery(trackId.trim());
      if (data) {
        setTrackResult(data.status);
      } else {
        toast.error('Ticket not found. Check your ID.', { className: 'toast-vybera' });
      }
    } catch {
      toast.error('Error tracking ticket.', { className: 'toast-vybera' });
    } finally {
      setTrackLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in required fields.', { className: 'toast-vybera' });
      return;
    }
    setLoading(true);
    try {
      const ticketId = await submitContactQuery(form);
      toast.success('Message sent! We will get back to you shortly.', { className: 'toast-vybera' });
      setSubmittedId(ticketId);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error('Failed to send message. Please try again.', { className: 'toast-vybera' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3E7D8] pt-24 pb-12">
      <SEO
        title="Contact Us"
        description="Get in touch with VYBERA for support, order inquiries, or custom design consultations. We're here to help."
        keywords="contact VYBERA, VYBERA customer support, streetwear brand contact, custom design consultation"
        path="/contact"
      />
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 pt-12">
        <div className="mb-6">
          <BackButton />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <p className="text-[#75665C] text-xs tracking-widest uppercase font-bold mb-2">Support</p>
          <h1 className="font-display font-bold text-4xl md:text-5xl tracking-wider text-[#30231F] mb-4">
            Contact Us
          </h1>
          <p className="text-[#75665C] text-sm max-w-lg mx-auto leading-relaxed font-medium">
            Have questions about an order, our products, or need custom streetwear consultation? We're here to help.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          {/* Contact Details */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-10"
          >
            <div>
              <h2 className="text-[#30231F] text-xl font-bold tracking-wider mb-6 pb-2 border-b border-[#D4BEA5] inline-block">Get In Touch</h2>
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-[#FAF5ED] border border-[#D4BEA5] text-[#590907] rounded-xl flex-shrink-0 shadow-sm">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="text-[#30231F] text-sm font-bold tracking-widest uppercase mb-1">Email</h3>
                    <p className="text-[#75665C] text-sm font-medium">vybera@gmail.com</p>
                    <p className="text-[#75665C]/80 text-xs mt-1">We aim to reply within 24 hours.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-[#FAF5ED] border border-[#D4BEA5] text-[#590907] rounded-xl flex-shrink-0 shadow-sm">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h3 className="text-[#30231F] text-sm font-bold tracking-widest uppercase mb-1">Phone</h3>
                    <p className="text-[#75665C] text-sm font-medium">+91 7574097366</p>
                    <p className="text-[#75665C]/80 text-xs mt-1">Mon-Fri, 10am - 6pm</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border border-[#D4BEA5] bg-[#FAF5ED] rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <MessageSquare className="text-[#590907]" size={18} />
                <h3 className="text-[#30231F] text-sm font-bold tracking-widest uppercase">FAQ & Returns</h3>
              </div>
              <p className="text-[#75665C] text-xs leading-relaxed font-medium">
                Check out our FAQ page for quick answers regarding shipping times, exchange policies, and custom design guidelines.
              </p>
            </div>

            {/* Track Ticket */}
            <div className="p-6 border border-[#D4BEA5] bg-[#FAF5ED] rounded-2xl shadow-sm">
              <h3 className="text-[#30231F] text-sm font-bold tracking-widest uppercase mb-4">Track Ticket Status</h3>
              <form onSubmit={handleTrack} className="flex gap-2">
                <input
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  placeholder="Enter Ticket ID"
                  className="flex-1 bg-white border border-[#D4BEA5] text-[#30231F] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#590907]"
                />
                <button type="submit" disabled={trackLoading} className="btn-primary px-4 py-2 text-xs">
                  {trackLoading ? '...' : <Search size={14} />}
                </button>
              </form>
              {trackResult && (
                <div className="mt-4 p-3 bg-white border border-[#D4BEA5] rounded-xl flex items-center justify-between">
                  <span className="text-[#75665C] text-xs font-semibold tracking-widest uppercase">Status:</span>
                  {trackResult === 'resolved' ? (
                    <span className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold uppercase tracking-widest">
                      <CheckCircle size={12} /> Resolved
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-800 text-xs font-bold uppercase tracking-widest">
                      <Clock size={12} /> Pending
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#FAF5ED] border border-[#D4BEA5] p-8 md:p-10 rounded-2xl shadow-sm"
          >
            <h2 className="text-[#30231F] text-xl font-bold tracking-wider mb-6">Send a Message</h2>
            
            {submittedId && (
              <div className="mb-6 p-4 border border-emerald-300 bg-emerald-50 rounded-xl text-center">
                <p className="text-emerald-800 text-sm font-bold mb-1">Message successfully sent!</p>
                <p className="text-[#75665C] text-xs">Your Tracking Ticket ID is:</p>
                <p className="text-[#590907] font-mono font-bold text-sm mt-1 p-2 bg-white border border-[#D4BEA5] rounded select-all">{submittedId}</p>
                <p className="text-[#75665C] text-[10px] mt-2">Save this ID to track your request status on the left.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[#75665C] text-xs font-bold tracking-widest uppercase block mb-2">Name *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    className="w-full bg-white border border-[#D4BEA5] text-[#30231F] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#590907]"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#75665C] text-xs font-bold tracking-widest uppercase block mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    className="w-full bg-white border border-[#D4BEA5] text-[#30231F] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#590907]"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[#75665C] text-xs font-bold tracking-widest uppercase block mb-2">Subject</label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={onChange}
                  className="w-full bg-white border border-[#D4BEA5] text-[#30231F] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#590907]"
                  placeholder="Order Issue / Custom Design"
                />
              </div>

              <div>
                <label className="text-[#75665C] text-xs font-bold tracking-widest uppercase block mb-2">Message *</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={onChange}
                  rows={5}
                  className="w-full bg-white border border-[#D4BEA5] text-[#30231F] rounded-lg p-4 text-sm focus:outline-none focus:border-[#590907] resize-none"
                  placeholder="How can we help you?"
                  required
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="btn-primary w-full flex items-center justify-center gap-3 py-3.5"
              >
                {loading ? 'Sending...' : (
                  <>
                    <Send size={16} />
                    Submit Request
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
