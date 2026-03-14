import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiPaperAirplane } from 'react-icons/hi';
import API from '../../utils/api';

const LeadForm = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/leads', form);
      setStatus('success');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setStatus('error');
    }
    setLoading(false);
    setTimeout(() => setStatus(''), 4000);
  };

  return (
    <section id="contact" className="section-padding section-spacing bg-cream-dark">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="text-accent font-body text-sm tracking-[0.3em] uppercase">Get In Touch</span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-secondary mt-3">We'd Love To Hear From You</h2>
          <div className="w-20 h-1 bg-accent mt-4 rounded-full mx-auto" />
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="glass-card p-8 md:p-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">Name *</label>
              <input
                type="text" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-5 py-3.5 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">Email *</label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-5 py-3.5 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                placeholder="your@email.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-secondary mb-2">Phone</label>
              <input
                type="tel" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-5 py-3.5 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-secondary mb-2">Message *</label>
              <textarea
                required value={form.message} rows={4}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-5 py-3.5 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
                placeholder="Tell us about your requirements..."
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              type="submit" disabled={loading}
              className="btn-primary flex items-center gap-2 text-lg disabled:opacity-50"
            >
              {loading ? 'Sending...' : <><HiPaperAirplane className="w-5 h-5" /> Send Message</>}
            </button>
            {status === 'success' && <p className="text-green-600 font-semibold">✓ Thank you! We'll get back to you soon.</p>}
            {status === 'error' && <p className="text-red-500 font-semibold">Something went wrong. Please try again.</p>}
          </div>
        </motion.form>
      </div>
    </section>
  );
};

export default LeadForm;
