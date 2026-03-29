import { useState } from 'react';
import { motion } from 'framer-motion';
import { validators, formatters, sanitize } from '../../utils/validation';
import toast from 'react-hot-toast';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBlur = (field, value) => {
    const error = validators[field] ? validators[field](value) : '';
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, value) => {
    let formattedValue = value;
    if (formatters[field]) formattedValue = formatters[field](value);
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {
      name: validators.fullName(formData.name),
      email: validators.email(formData.email),
      message: validators.message(formData.message),
    };

    const hasErrors = Object.values(newErrors).some(err => err !== '');
    if (hasErrors) {
      setErrors(newErrors);
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    // Simulate API call with sanitization
    setTimeout(() => {
      console.log('Sanitized Data:', {
        name: sanitize(formData.name),
        email: sanitize(formData.email),
        message: sanitize(formData.message)
      });
      setStatus('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
      setLoading(false);
      setTimeout(() => setStatus(''), 5000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-primary text-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-secondary">Contact Us</h1>
          <p className="text-xl text-secondary/70 max-w-2xl mx-auto">
            Have a question or just want to say hi? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col justify-center space-y-10"
          >
            <div>
              <h3 className="text-xl font-heading font-bold text-secondary mb-2 text-accent">Email</h3>
              <a href="mailto:customer@gpsfdk.com" className="text-secondary/80 text-lg hover:text-accent transition-colors">customer@gpsfdk.com</a>
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold text-secondary mb-2 text-accent">Phone Number</h3>
              <a href="tel:+916280310103" className="text-secondary/80 text-lg hover:text-accent transition-colors">+91 62803-10103</a>
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold text-secondary mb-2 text-accent">Address</h3>
              <p className="text-secondary/80 text-lg leading-relaxed">
                GPS, Circular Road, Near More Store,<br />
                Faridkot, Punjab 151203
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-secondary/5 p-8 rounded-2xl w-full"
          >
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-secondary mb-2">Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={(e) => handleBlur('name', e.target.value)}
                  className={`w-full px-4 py-3 bg-white border ${errors.name ? 'border-red-500' : 'border-secondary/20'} rounded-xl focus:outline-none focus:border-accent transition-colors`}
                  placeholder="Your full name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={(e) => handleBlur('email', e.target.value)}
                  className={`w-full px-4 py-3 bg-white border ${errors.email ? 'border-red-500' : 'border-secondary/20'} rounded-xl focus:outline-none focus:border-accent transition-colors`}
                  placeholder="your@email.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-secondary mb-2">Message</label>
                <textarea
                  id="message"
                  rows="5"
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  onBlur={(e) => handleBlur('message', e.target.value)}
                  className={`w-full px-4 py-3 bg-white border ${errors.message ? 'border-red-500' : 'border-secondary/20'} rounded-xl focus:outline-none focus:border-accent resize-none transition-colors`}
                  placeholder="How can we help?"
                ></textarea>
                {errors.message && <p className="text-red-500 text-xs mt-1 font-medium">{errors.message}</p>}
              </div>
              <button
                type="submit"
                disabled={loading || Object.values(errors).some(e => e !== '')}
                className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-4 rounded-xl transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
              {status && (
                <p className="text-center text-green-600 font-medium mt-4">{status}</p>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
