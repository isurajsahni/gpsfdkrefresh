import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiPaperAirplane } from 'react-icons/hi';
import API from '../../utils/api';

const LeadForm = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/leads', form);
      setStatus('success');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setStatus('error');
    }
    setLoading(false);
    setTimeout(() => setStatus(''), 4000);
  };

  const inputClasses = "w-full bg-transparent border-b border-gray-300 py-3 focus:outline-none focus:border-accent transition-all placeholder:text-gray-400 font-body";
  const labelClasses = "block text-sm font-semibold text-secondary mb-1";

  return (
    <section id="contact" className="section-padding section-spacing bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <span className="text-accent font-body text-sm tracking-[0.3em] uppercase">Connect With Us</span>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-secondary mt-3">Ready to Start Your Story?</h2>
          <div className="w-20 h-1 bg-accent mt-4 rounded-full" />
        </motion.div>

        <form onSubmit={handleSubmit} className="mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
            {/* Left Column: Form Fields */}
            <div className="space-y-8">
              <div>
                <input
                  type="text" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClasses}
                  placeholder="Your Name"
                />
              </div>
              <div>
                <input
                  type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClasses}
                  placeholder="Email Address"
                />
              </div>
              <div>
                <input
                  type="tel" required value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClasses}
                  placeholder="Phone Number"
                />
              </div>
              <div>
                <input
                  type="text" required value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className={inputClasses}
                  placeholder="Subject"
                />
              </div>
            </div>

            {/* Right Column: Message & Submit */}
            <div className="flex flex-col h-full">
              <textarea
                required value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full h-full min-h-[220px] bg-secondary/5 rounded-2xl p-6 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all resize-none font-body"
                placeholder="Write Your enquiry here....."
              />
              
              <div className="mt-8 flex flex-col gap-4">
                <button
                  type="submit" disabled={loading}
                  className="w-full bg-accent text-white font-heading font-bold py-3.5 rounded-2xl shadow-xl hover:bg-accent-dark hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 uppercase tracking-widest text-lg"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
                
                {status === 'success' && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-secondary font-semibold text-center italic">
                    ✓ Thank you! We'll get back to you soon.
                  </motion.p>
                )}
                {status === 'error' && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 font-semibold text-center italic">
                    ⚠ Something went wrong. Please try again.
                  </motion.p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default LeadForm;
