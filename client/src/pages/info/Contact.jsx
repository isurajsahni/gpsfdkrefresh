import { useState } from 'react';
import { motion } from 'framer-motion';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setStatus('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setStatus(''), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-white text-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-primary">Contact Us</h1>
          <p className="text-xl text-primary/70 max-w-2xl mx-auto">
            Have a question or just want to say hi? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto bg-primary/5 p-8 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-primary mb-2">Name</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-primary/20 rounded-xl focus:outline-none focus:border-accent"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">Email</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-primary/20 rounded-xl focus:outline-none focus:border-accent"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-primary mb-2">Message</label>
              <textarea
                id="message"
                rows="5"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-primary/20 rounded-xl focus:outline-none focus:border-accent resize-none"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-4 rounded-xl transition-colors duration-300"
            >
              Send Message
            </button>
            {status && (
              <p className="text-center text-green-600 font-medium mt-4">{status}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
