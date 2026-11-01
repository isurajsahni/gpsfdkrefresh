import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../components/seo/SEO';
import { HiOutlineSparkles, HiOutlineColorSwatch, HiOutlineHome, HiOutlineCheckCircle } from 'react-icons/hi';

const SEO_PremiumWallCanvasIndia = () => {
  return (
    <div className="min-h-screen bg-[#fffdf9] pt-28 pb-16">
      <SEO 
        title="Canvas Wall Art India: Abstract, Floral & Custom | GPSFDK"
        description="Buy canvas wall art in India: abstract art, floral art and custom canvas prints from your photos. 350 GSM canvas, ready to hang, delivered across India."
      />
      
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 md:px-8 text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-heading font-extrabold text-secondary mb-6 leading-tight"
        >
          Canvas Wall Art <span className="text-accent">for Indian Homes</span> 
          <br/> Abstract, Floral & Custom
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
        >
          Find canvas wall art that makes a room feel finished. Choose from <strong>abstract art</strong>, <strong>floral art</strong> and modern designs, or turn your own photo into a <strong>custom canvas</strong>. Printed on 350 GSM canvas, ready to hang and delivered across India.
        </motion.p>
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="mt-8 flex flex-wrap justify-center gap-4"
        >
          <Link to="/canvas" className="btn-primary text-lg px-8 py-3 shadow-lg">Shop Premium Collection</Link>
          <Link to="/customize-canvas" className="bg-white border-2 border-accent text-accent hover:bg-accent hover:text-white transition-all px-8 py-3 rounded-full font-bold text-lg shadow-sm">Create Custom Art</Link>
        </motion.div>
      </section>

      {/* Main Content Sections */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 space-y-16">
        
        {/* Section 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100"
        >
          <h2 className="text-3xl font-heading font-bold text-secondary mb-6">Why Choose an Art Canvas for Your Walls</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              Blank walls make a room feel unfinished. The right <strong>art canvas</strong> is the finishing touch that pulls the furniture, colours and light together. Unlike paper posters that curl, or glass-framed prints that throw back glare, canvas has the texture of a real painting and a matte surface you can enjoy from any angle.
            </p>
            <p>
              Large-scale art also gives a room a focal point. It anchors the sofa or bed below it, sets the mood, and gives guests something to talk about. That is why so many Indian homes now choose one statement <strong>canvas wall art</strong> piece over a cluster of small frames.
            </p>
            <p>
              Every GPSFDK canvas is printed on 350 GSM canvas with eco-solvent inks for rich, lasting colour. Order it stretched over a wooden frame, ready to hang the day it arrives, or rolled if you want to frame it locally. Sizes run from 12x18 to 36x60 inches.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 p-6 bg-gray-50 rounded-2xl">
            <div className="flex items-start gap-4">
              <HiOutlineColorSwatch className="w-10 h-10 text-accent flex-shrink-0" />
              <div>
                <h4 className="font-bold text-secondary text-xl">Vivid, Lasting Colour</h4>
                <p className="text-sm text-gray-600 mt-2">Printed with eco-solvent inks on 350 GSM canvas for deep, vivid colour that holds up indoors for years.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <HiOutlineSparkles className="w-10 h-10 text-accent flex-shrink-0" />
              <div>
                <h4 className="font-bold text-secondary text-xl">Ready-to-Hang Canvas</h4>
                <p className="text-sm text-gray-600 mt-2">Heavy canvas stretched tight over a wooden frame. Ready to hang out of the box, with no glass and no glare.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        >
          <h2 className="text-3xl font-heading font-bold text-secondary mb-6">Canvas Wall Art for the Living Room</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              The living room is where guests gather and families unwind, so it is where <strong>canvas wall art for the living room</strong> makes the biggest difference.
            </p>
            <p>
              <strong>Get the size right:</strong> The most common mistake is art that is too small for the wall. Aim for art about two-thirds the width of the furniture below it, such as a sofa, TV unit or console. Above a standard 3-seater, that means a 30x48 inch canvas or two 24x36 inch canvases side by side.
            </p>
            <p>
              <strong>Coordinate colours:</strong> Choose art that repeats an accent colour from your cushions, rug or curtains. When the canvas echoes the room, it ties everything together.
            </p>
            <p>
              <strong>Choose a style:</strong> Abstract art is the most versatile choice for living rooms, from earthy, layered abstracts to bold geometric designs. Floral art adds softness and colour to rooms full of hard surfaces.
            </p>
          </div>
        </motion.div>

        {/* Section 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-secondary text-white p-8 md:p-12 rounded-3xl shadow-xl relative overflow-hidden"
        >
          {/* Background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6 text-accent relative z-10">Custom Canvas: Your Photo, Your Design</h2>
          <div className="prose prose-lg prose-invert max-w-none text-gray-300 relative z-10">
            <p className="mb-6">
              Sometimes the most meaningful art is your own story. A <strong>custom canvas</strong> turns a family photo, a wedding portrait or a favourite place into wall art that nobody else has. It is a bigger, glare-free alternative to a <strong>personal photo frame</strong>.
            </p>
            <p className="mb-8">
              Upload your photo, pick a size and add your instructions. Want people combined from different photos, a painterly style, a name or a date added? That is <strong>custom art design</strong>: we build the canvas around your idea, not just your file.
            </p>
          </div>

          <ul className="space-y-5 mb-10 relative z-10">
            <li className="flex items-start gap-4">
              <HiOutlineCheckCircle className="w-8 h-8 text-accent flex-shrink-0" />
              <span className="text-gray-200 text-lg"><strong>Wedding & Anniversary Portraits:</strong> Turn your favourite wedding moment into a romantic centrepiece above the bed or in the living room.</span>
            </li>
            <li className="flex items-start gap-4">
              <HiOutlineCheckCircle className="w-8 h-8 text-accent flex-shrink-0" />
              <span className="text-gray-200 text-lg"><strong>Travel Photography:</strong> Bring a sunset, a mountain view or a holiday by the sea home to your wall.</span>
            </li>
            <li className="flex items-start gap-4">
              <HiOutlineCheckCircle className="w-8 h-8 text-accent flex-shrink-0" />
              <span className="text-gray-200 text-lg"><strong>Family & Pet Portraits:</strong> A daily reminder of the people (and pets) who matter most, printed large on stretched canvas.</span>
            </li>
          </ul>
          
          <div className="relative z-10">
            <Link to="/customize-canvas" className="bg-white text-secondary font-bold px-10 py-4 rounded-full hover:bg-gray-100 transition-colors shadow-lg inline-block tracking-wide text-lg">
              Start Customizing Your Art Today
            </Link>
          </div>
        </motion.div>

        {/* Section 4 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100"
        >
          <h2 className="text-3xl font-heading font-bold text-secondary mb-6">Canvas Painting for the Bedroom</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              Your bedroom should help you relax, so the art you see from the bed matters. One canvas centred above the headboard is the simplest way to make a bedroom feel calm and complete.
            </p>
            <p>
              Choose soothing colours: soft blush, navy, deep green or warm earthy neutrals. Avoid loud, jagged or neon designs on the wall you face from the bed.
            </p>
            <p>
              <strong>Floral art</strong> is a natural fit for bedrooms, from soft pastel blooms to dark, gold-accented florals for a moody, hotel-suite feel. Calm abstracts, night skies and seascapes work beautifully too. Above a queen bed, a 24x36 inch canvas is the right size; above a king bed, go for 30x48 inches.
            </p>
            <p>
              With the right <strong>wall decor India</strong>, your master bedroom transitions from a mere place to sleep into a luxury hotel-tier suite experience every single night.
            </p>
          </div>
        </motion.div>

        {/* Conclusion */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="border-t-2 border-gray-100 pt-16 pb-8 text-center"
        >
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <HiOutlineHome className="w-10 h-10 text-accent" />
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-secondary mb-6 leading-snug">Find Your Canvas Today</h2>
          <p className="text-gray-600 mb-10 max-w-3xl mx-auto text-lg leading-relaxed">
            Browse abstract, floral and modern canvas wall art, or create a custom canvas from your own photo. Every piece is printed on 350 GSM canvas, available stretched and ready to hang or rolled, and delivered across India in 5 to 7 business days.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/canvas" className="btn-primary w-full sm:w-auto px-12 py-4 text-xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
              Browse Full Collection
            </Link>
            <span className="text-gray-400 font-medium">or</span>
            <Link to="/search" className="text-accent font-bold hover:underline text-lg">
              Search by Style
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default SEO_PremiumWallCanvasIndia;
