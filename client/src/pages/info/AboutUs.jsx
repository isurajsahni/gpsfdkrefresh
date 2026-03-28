import { motion } from 'framer-motion';
import aboutUsImage from '../../assets/image/about_us_demo.png';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-primary pt-[100px] sm:pt-[120px] pb-16 sm:pb-24 text-secondary overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-16 md:mb-20 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-heading font-bold text-secondary mb-4 sm:mb-6 tracking-wide dropdown-shadow leading-tight">About Us</h1>
          <div className="w-24 sm:w-32 h-1 sm:h-1.5 bg-accent mx-auto rounded-full shadow-lg shadow-accent/20"></div>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-secondary/70 font-body max-w-2xl mx-auto px-2 sm:px-0">
             Discover our journey, mission, and the passion that drives us forward.
          </p>
        </motion.div>

        {/* Zig Zag Section 1 */}
        <div className="flex flex-col md:flex-row items-center gap-8 sm:gap-12 mb-20 md:mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -40 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full md:w-1/2"
          >
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl group border border-secondary/10">
              <div className="absolute inset-0 bg-accent/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src={aboutUsImage} alt="About Us Creative Workspace" className="w-full h-56 sm:h-80 md:h-[500px] object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 40 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full md:w-1/2 prose prose-base sm:prose-lg prose-invert max-w-none font-body"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-accent mb-4 sm:mb-6 leading-tight">Who We Are</h2>
            <div className="space-y-4 sm:space-y-6 text-secondary/80">
              <p className="leading-relaxed text-base sm:text-lg">
                At Radhe Radhe GPS Private Limited, we are more than just a business group — we are a dynamic entity with a strong commitment to learning, innovation, and excellence. Unlike companies that focus on a single niche, we operate across multiple industries, offering diverse, high-quality solutions that blend creativity with affordability.
              </p>
              <p className="leading-relaxed text-base sm:text-lg pb-4 border-b border-secondary/10">
                Our mission is simple yet powerful: to make luxury accessible to all. We believe that premium services and products should not be limited to a select few but should be available to everyone.
              </p>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-secondary mb-2 sm:mb-3 mt-4 sm:mt-6">Our Journey</h3>
                <p className="leading-relaxed text-sm sm:text-base">
                  We started as an advertisement technology and signage startup, earning recognition from the DPIIT, Government of India. Over time, we expanded our expertise, and today, We proudly operate billboards and LED Videowall screens across North India.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* What We Do Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20 md:mb-24 bg-secondary/5 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 border border-secondary/10"
        >
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-secondary mb-3 sm:mb-4">What We Do</h2>
            <div className="w-12 sm:w-16 h-1 bg-accent mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
            <div className="bg-primary/50 p-5 sm:p-8 rounded-2xl hover:shadow-lg transition-all duration-300 border border-transparent hover:border-accent/30 group">
              <h3 className="text-lg sm:text-xl font-bold text-accent mb-3 sm:mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm shrink-0">1</span> 
                <span>Advertising & Marketing</span>
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-secondary/70 group-hover:text-secondary/90 transition-colors">
                <li>• Out-of-Home (DOH) Advertising</li>
                <li>• Social Media Management</li>
                <li>• Commercial Content Production</li>
              </ul>
            </div>
            
            <div className="bg-primary/50 p-5 sm:p-8 rounded-2xl hover:shadow-lg transition-all duration-300 border border-transparent hover:border-accent/30 group">
              <h3 className="text-lg sm:text-xl font-bold text-accent mb-3 sm:mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm shrink-0">2</span> 
                <span>Digital Solutions & Tech</span>
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-secondary/70 group-hover:text-secondary/90 transition-colors">
                <li>• Web Hosting & Development</li>
                <li>• Digital Media Creation</li>
              </ul>
            </div>
            
            <div className="bg-primary/50 p-5 sm:p-8 rounded-2xl hover:shadow-lg transition-all duration-300 border border-transparent hover:border-accent/30 group">
              <h3 className="text-lg sm:text-xl font-bold text-accent mb-3 sm:mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm shrink-0">3</span> 
                <span>Event Management</span>
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-secondary/70 group-hover:text-secondary/90 transition-colors">
                <li>• Corporate & Cultural Events</li>
                <li>• School of Creation - Innovation Hub</li>
              </ul>
            </div>
            
            <div className="bg-primary/50 p-5 sm:p-8 rounded-2xl hover:shadow-lg transition-all duration-300 border border-transparent hover:border-accent/30 group">
              <h3 className="text-lg sm:text-xl font-bold text-accent mb-3 sm:mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm shrink-0">4</span> 
                <span>Home & Lifestyle</span>
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-secondary/70 group-hover:text-secondary/90 transition-colors">
                <li>• Customised House Nameplates</li>
                <li>• Elegant Wall Canvas Art</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Core Values & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12">
          <motion.section 
            initial={{ opacity: 0, x: -30 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-accent/10 p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-accent/20"
          >
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-secondary mb-6">Our Core Values</h2>
            <ul className="space-y-5 text-sm sm:text-base text-secondary/80">
              <li className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                 <strong className="text-accent sm:min-w-[120px]">Innovation</strong> 
                 <p>We prioritise our clients' needs and continuously adapt.</p>
              </li>
              <li className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                 <strong className="text-accent sm:min-w-[120px]">Sustainability</strong> 
                 <p>Ethical and sustainable business practices matter to us.</p>
              </li>
              <li className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                 <strong className="text-accent sm:min-w-[120px]">Community</strong> 
                 <p>Nurturing collective advancement and growth for all.</p>
              </li>
              <li className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                 <strong className="text-accent sm:min-w-[120px]">Open Knowledge</strong> 
                 <p>No holding patents, ensuring innovation is a communal asset.</p>
              </li>
            </ul>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, x: 30 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col justify-center"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-accent mb-4 sm:mb-6">Our Vision</h2>
            <p className="leading-relaxed text-base sm:text-lg text-secondary/80 mb-5 sm:mb-6">
              We aim to bridge the divide between luxury and affordability, tradition and innovation, as well as creativity and practicality. Through advertising, digital media, home decor, and educational initiatives, our objective is to transform industries.
            </p>
            <div className="p-4 sm:p-6 border-l-4 border-accent bg-secondary/5 rounded-r-xl sm:rounded-r-2xl italic text-secondary/90 font-medium text-base sm:text-lg shadow-sm">
              "We don't just provide services; we create experiences, cultivate opportunities, and empower individuals and businesses to flourish."
            </div>
          </motion.section>
        </div>

      </div>
    </div>
  );
};

export default AboutUs;

