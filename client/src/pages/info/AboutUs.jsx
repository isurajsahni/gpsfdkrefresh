import { motion } from 'framer-motion';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-primary pt-[120px] pb-24 text-secondary">
      <div className="max-w-4xl mx-auto px-6">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-secondary mb-6 tracking-wide">About Us</h1>
          <div className="w-24 h-1 bg-accent mx-auto rounded-full"></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="prose prose-lg max-w-none text-secondary/80 font-body space-y-12">
          
          <section>
            <h2 className="text-2xl font-heading font-bold text-accent mb-4">Who We Are</h2>
            <p className="leading-relaxed">
              At Radhe Radhe GPS Private Limited, we are more than just a business group — we are a dynamic entity with a strong commitment to learning, innovation, and excellence. Unlike companies that focus on a single niche, we operate across multiple industries, offering diverse, high-quality solutions that blend creativity with affordability.
            </p>
            <p className="leading-relaxed mt-4">
              Our mission is simple yet powerful: to make luxury accessible to all. We believe that premium services and products should not be limited to a select few but should be available to everyone. This belief drives us to create affordable luxury solutions across various sectors, ensuring our clients receive the best without compromise.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-bold text-accent mb-4">Our Journey</h2>
            <p className="leading-relaxed">
              We started as an advertisement technology and signage startup, earning recognition from the DPIIT, Government of India. Over time, we expanded our expertise, and today, We proudly operate billboards and LED Videowall screens across North India.
            </p>
            <p className="leading-relaxed mt-4">
              Our company also holds the Municipal contract for Billboards in Kotkapura, District Faridkot, Punjab helping businesses reach wider audiences through effective outdoor advertising.
            </p>
            <p className="leading-relaxed mt-4">
              As we grew, so did our vision. What began as a single venture in advertising has now evolved into a multi-industry business group, offering a wide range of professional services designed to enhance digital presence, branding, lifestyle and entertainment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-bold text-accent mb-4">What We Do</h2>
            <p className="mb-4">We specialize in various fields, providing top-tier services that cater to both businesses and individuals:</p>
            <ul className="list-none space-y-6">
              <li>
                <strong className="text-secondary block text-lg">1. Advertising & Marketing Solutions</strong>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-base">
                  <li>Out-of-Home (DOH) Advertising-Billboards & LED Videowalls for impactful brand visibility.</li>
                  <li>Social Media Management-Strategic content creation, audience engagement, and digital marketing solutions.</li>
                  <li>Commercial Content Production-High-quality advertisements, short films, product and portfolio shoots, and podcasts.</li>
                </ul>
              </li>
              <li>
                <strong className="text-secondary block text-lg">2. Digital Solutions & Technology</strong>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-base">
                  <li>Web Hosting & Development – Secure, scalable, and efficient online solutions.</li>
                  <li>Digital Media Creation – Professional video, audio, and graphics production to elevate brand presence.</li>
                </ul>
              </li>
              <li>
                <strong className="text-secondary block text-lg">3. Event Management & Creative Spaces</strong>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-base">
                  <li>Event Planning & Execution-Organising corporate, cultural, and promotional events with precision.</li>
                  <li>School of Creation-A dedicated space for learning and innovation in digital media, technology, and content creation.</li>
                </ul>
              </li>
              <li>
                <strong className="text-secondary block text-lg">4. Home & Lifestyle Enhancements</strong>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-base">
                  <li>House Nameplates-Customised, high-quality nameplates that reflect personal identity and style.</li>
                  <li>Wall Canvas Art-Elegant decorative solutions to enhance interior spaces.</li>
                </ul>
              </li>
            </ul>
          </section>

          <section className="bg-cream-dark p-8 rounded-2xl border border-secondary/10">
            <h2 className="text-2xl font-heading font-bold text-secondary mb-4">Our Core Values</h2>
            <p className="mb-4">At Radhe Radhe GPS Private Limited, we adhere to principles that define our work and relationships:</p>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong>Customer Satisfaction & Innovation</strong> - We prioritise our clients' needs and continuously adapt to provide better solutions.</li>
              <li><strong>Sustainable Development</strong> - Every action we take is aligned with ethical and sustainable business practices.</li>
              <li><strong>Community Growth & Unity</strong> - We believe in collective advancement, nurturing growth not only for ourselves but also for those around us.</li>
              <li><strong>Open Knowledge & Accessibility</strong> - We are dedicated to never holding patents, ensuring that innovation remains a communal asset rather than a limited privilege.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-bold text-accent mb-4">Our Vision</h2>
            <p className="leading-relaxed">
              We aim to bridge the divide between luxury and affordability, tradition and innovation, as well as creativity and practicality. Through advertising, digital media, home decor, and educational initiatives, our objective is to transform industries, uplift communities, and redefine standards of excellence.
            </p>
            <p className="leading-relaxed font-semibold text-secondary mt-4">
              At Radhe Radhe GPS Private Limited, we don't just provide services; we create experiences, cultivate opportunities, and empower individuals and businesses to flourish.
            </p>
          </section>

        </motion.div>
      </div>
    </div>
  );
};

export default AboutUs;
