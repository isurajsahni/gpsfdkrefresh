import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../components/seo/SEO';
import blogs from '../content/blogs/index';

const BlogList = () => {
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "GPSFDK Blog — Wall Canvas & Home Decor Tips",
    "description": "Expert guides, trends, and inspiration for wall canvas prints, custom nameplates, and home decor in India.",
    "url": "https://www.gpsfdk.com/blog",
    "blogPost": blogs.map(blog => ({
      "@type": "BlogPosting",
      "headline": blog.title,
      "description": blog.excerpt,
      "datePublished": blog.date,
      "url": `https://www.gpsfdk.com/blog/${blog.slug}`,
    }))
  };

  return (
    <div className="min-h-screen bg-primary">
      <SEO
        title="Wall Canvas & Home Decor Blog | GPSFDK India"
        description="Expert guides, trends, and inspiration for wall canvas prints, custom nameplates, and home decor in India. Learn about gallery-wrapped canvas, split prints, and more."
        schema={blogSchema}
      />

      {/* Hero Section */}
      <section className="relative pt-[140px] pb-20 bg-secondary overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2000')] bg-cover bg-center opacity-15"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/60 to-secondary"></div>

        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block bg-accent/20 text-accent px-4 py-1.5 rounded-full text-sm font-semibold tracking-wider uppercase mb-6">
              Our Blog
            </span>
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
              Canvas Art Inspiration <br className="hidden md:block" />
              & Expert <span className="text-accent">Guides</span>
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Discover expert tips on choosing, hanging, and styling wall canvas prints. From gallery-wrapped guides to sustainable decor trends — become a wall art pro.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Grid matching the clean aesthetic */}
      <section className="max-w-7xl mx-auto px-6 py-16">

        {/* Simple Page Title (reminiscent of the reference image header) */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-medium text-secondary">
            The Art of Canvas Decoration
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-8">
          {blogs.map((blog, i) => (
            <motion.div
              key={blog.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
            >
              <Link to={`/blog/${blog.slug}`} className="group block h-full">
                <div className="bg-[#fcfaf6] border border-gray-100/50 p-4 transition-all duration-300 h-full flex flex-col hover:shadow-xl hover:-translate-y-1">

                  {/* Padded Image Container */}
                  <div className="relative aspect-[4/3] overflow-hidden mb-5">
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Meta Information */}
                  <div className="flex justify-between items-center text-[12px] md:text-sm text-gray-500 font-medium tracking-wide">
                    <span>{blog.author || 'Suraj'}</span>
                    <span className="uppercase">{new Date(blog.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>

                  {/* Divider Line */}
                  <div className="w-full h-px bg-gray-300 my-3 group-hover:bg-accent/40 transition-colors"></div>

                  {/* Title */}
                  <h3 className="font-heading text-secondary text-lg md:text-xl font-medium leading-snug line-clamp-3">
                    {blog.title}
                  </h3>

                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-20 text-center"
        >
          <div className="bg-secondary rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-accent/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4 relative z-10">
              Ready to Transform Your Walls?
            </h2>
            <p className="text-white/70 max-w-xl mx-auto mb-8 relative z-10">
              Explore our premium collection of custom wall canvas prints and house nameplates. Fast delivery across India.
            </p>
            <Link to="/wall-canvas" className="btn-primary relative z-10 inline-block px-8 py-3.5 text-lg">
              Shop Wall Canvas
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default BlogList;
