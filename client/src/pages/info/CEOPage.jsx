import { motion } from 'framer-motion';
import { FaFacebook, FaInstagram, FaQuoteLeft } from 'react-icons/fa';

import fimpyGargImage from '../../assets/image/fimpygarg.webp';

const CEOPage = () => {
  return (
    <div className="min-h-screen bg-primary pt-[100px] sm:pt-[120px] pb-16 sm:pb-24 text-secondary overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-12 sm:mb-16 md:mb-20 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-heading font-bold text-secondary mb-4 sm:mb-6 tracking-wide leading-tight">CEO's Message</h1>
          <div className="w-24 sm:w-32 h-1 sm:h-1.5 bg-accent mx-auto rounded-full shadow-lg shadow-accent/20"></div>
           <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-secondary/70 font-body max-w-2xl mx-auto px-2 sm:px-0">
             A vision of growth, opportunity, and building a legacy.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-10 sm:gap-12 lg:gap-24 items-center">
          
          {/* Left Side: Image Profile */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.2, duration: 0.6 }}
            className="w-full lg:w-5/12 flex flex-col items-center"
          >
            <div className="relative w-full max-w-[280px] sm:max-w-sm md:max-w-md aspect-square md:aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl group border-[3px] md:border-4 border-secondary/5">
               <div className="absolute inset-0 bg-accent/20 group-hover:bg-transparent transition-colors duration-500 z-10 mix-blend-overlay"></div>
               <img src={fimpyGargImage} alt="Fimpy Garg" className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700" />
               <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5 sm:p-6 md:p-8 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-white">Fimpy Garg</h2>
                  <p className="text-accent font-semibold text-sm sm:text-base md:text-lg mt-1">CEO & Founder</p>
               </div>
            </div>
            
            <div className="mt-6 sm:mt-8 flex gap-4 sm:gap-6 text-xl sm:text-2xl">
              <a href="https://www.facebook.com/darsh.garg.39" target="_blank" rel="noreferrer" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary/5 flex items-center justify-center text-secondary hover:bg-accent hover:text-primary transition-all duration-300 shadow-sm">
                <FaFacebook />
              </a>
              <a href="https://www.instagram.com/fimpygarg" target="_blank" rel="noreferrer" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary/5 flex items-center justify-center text-secondary hover:bg-accent hover:text-primary transition-all duration-300 shadow-sm">
                <FaInstagram />
              </a>
            </div>
          </motion.div>

          {/* Right Side: Message & Contact */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.3, duration: 0.6 }}
            className="w-full lg:w-7/12"
          >
            <div className="relative pt-6 sm:pt-0">
              <FaQuoteLeft className="hidden sm:block absolute -top-8 -left-8 text-6xl text-secondary/5 z-0" />
              <div className="relative z-10 prose prose-base sm:prose-lg prose-invert max-w-none font-body text-secondary/80">
                <p className="text-lg sm:text-xl md:text-2xl font-medium leading-relaxed italic text-secondary mb-8 sm:mb-10 border-l-4 border-accent pl-4 sm:pl-6">
                  "To be a soldier in a garden,<br />
                  And a gardener in a war."
                </p>

                <p className="leading-relaxed mb-5 sm:mb-6 text-base sm:text-lg">
                  Hello, I'm Fimpy Garg. I grew up in a business family and have known nothing but how a businessman can make it big! Not only by achieving his personal goals but by creating an aura of growth and opportunity all around, in ways one cannot even begin to comprehend.
                </p>

                <p className="leading-relaxed mb-8 sm:mb-12 text-base sm:text-lg font-medium text-secondary/90">
                  GPS will be my life's work and I love being able to do it, be a part of it and you will love it even more!
                </p>
              </div>
            </div>

            <div className="bg-primary/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-secondary/10 shadow-xl mt-4 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 sm:w-2 h-full bg-accent"></div>
              <h3 className="text-xl sm:text-2xl font-heading font-bold text-secondary mb-6 sm:mb-8">
                Get in Touch
              </h3>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 group/item">
                  <span className="font-bold text-accent sm:min-w-[80px] text-xs sm:text-sm uppercase tracking-wider">Email</span>
                  <a href="mailto:fimpygarg2@gmail.com" className="text-secondary/80 hover:text-accent transition-colors text-base sm:text-lg break-all">fimpygarg2@gmail.com</a>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 group/item">
                  <span className="font-bold text-accent sm:min-w-[80px] text-xs sm:text-sm uppercase tracking-wider">Mobile</span>
                  <a href="tel:+919646646063" className="text-secondary/80 hover:text-accent transition-colors text-base sm:text-lg">+91 96466-46063</a>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6 group/item pt-3 sm:pt-4 border-t border-secondary/5">
                  <span className="font-bold text-accent sm:min-w-[80px] text-xs sm:text-sm uppercase tracking-wider mt-1">Office</span>
                  <span className="text-secondary/80 text-base sm:text-lg leading-snug">GPS, Circular Road, Near More Store, Faridkot, Punjab 151203</span>
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
