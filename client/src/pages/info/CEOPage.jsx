import { motion } from 'framer-motion';
import { FaFacebook, FaInstagram } from 'react-icons/fa';

import fimpyGargImage from '../../assets/image/fimpygarg.webp';

const CEOPage = () => {
  return (
    <div className="min-h-screen bg-primary pt-[120px] pb-24 text-secondary">
      <div className="max-w-4xl mx-auto px-6">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-secondary mb-6 tracking-wide">CEO's Message</h1>
          <div className="w-24 h-1 bg-accent mx-auto rounded-full"></div>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.2 }}
            className="w-full md:w-1/3 flex flex-col items-center"
          >
            <div className="w-64 h-64 bg-secondary/10 rounded-full border-4 border-accent shadow-xl overflow-hidden mb-6 flex items-center justify-center">
               <img src={fimpyGargImage} alt="Fimpy Garg" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-secondary">Fimpy Garg</h2>
            <p className="text-accent font-semibold text-lg mt-1">CEO & Founder</p>
            <p className="text-secondary/60 text-sm">Radhe Radhe GPS Pvt. Ltd.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.3 }}
            className="w-full md:w-2/3 prose prose-lg font-body text-secondary/80"
          >
            <p className="text-2xl font-medium leading-relaxed italic text-secondary mb-8">
              "To be a soldier in a garden,<br />
              And a gardener in a war."
            </p>

            <p className="leading-relaxed mb-6">
              Hello, I'm Fimpy Garg. I grew up in a business family and have known nothing but how a businessman can make it big! Not only by achieving his personal goals but by creating an aura of growth and opportunity all around, in ways one cannot even begin to comprehend.
            </p>

            <p className="leading-relaxed mb-10">
              GPS will be my life's work and I love being able to do it, be a part of it and you will love it even more!
            </p>

            <div className="bg-cream-dark p-8 rounded-2xl border border-secondary/10 shadow-sm mt-8">
              <h3 className="text-xl font-heading font-bold text-secondary mb-6 flex items-center gap-3">
                <span className="w-8 h-1 bg-accent rounded-full inline-block"></span> 
                Get in Touch
              </h3>
              
              <div className="space-y-4">
                <p className="flex items-center gap-4">
                  <span className="font-bold text-accent w-24">Email:</span>
                  <a href="mailto:fimpygarg2@gmail.com" className="hover:underline">fimpygarg2@gmail.com</a>
                </p>
                <p className="flex items-center gap-4">
                  <span className="font-bold text-accent w-24">Mobile:</span>
                  <a href="tel:+919646646063" className="hover:underline">+91 96466-46063</a>
                </p>
                <div className="flex items-start gap-4">
                  <span className="font-bold text-accent w-24 shrink-0">Office:</span>
                  <span>GPS, Circular Road, Near More Store, Faridkot, Punjab 151203</span>
                </div>
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-secondary/10">
                  <span className="font-bold text-accent w-24">Socials:</span>
                  <div className="flex gap-4 text-2xl">
                    <a href="https://www.facebook.com/darsh.garg.39" target="_blank" rel="noreferrer" className="text-secondary hover:text-accent transition-colors">
                      <FaFacebook />
                    </a>
                    <a href="https://www.instagram.com/fimpygarg" target="_blank" rel="noreferrer" className="text-secondary hover:text-accent transition-colors">
                      <FaInstagram />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default CEOPage;
