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

      {/* Blog Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        {/* Featured / Latest Post */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <Link to={`/blog/${blogs[0].slug}`} className="group block">
            <div className="grid md:grid-cols-2 gap-8 bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-500">
              <div className="relative aspect-[4/3] md:aspect-auto overflow-hidden">
                <img
                  src={blogs[0].image}
                  alt={blogs[0].title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                  Featured
                </div>
              </div>
              <div className="flex flex-col justify-center p-8 md:p-10">
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                  <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full font-semibold text-xs uppercase">{blogs[0].category}</span>
                  <span>•</span>
                  <span>{blogs[0].readTime}</span>
                  <span>•</span>
                  <span>{new Date(blogs[0].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-secondary group-hover:text-accent transition-colors leading-snug mb-4">
                  {blogs[0].title}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">{blogs[0].excerpt}</p>
                <span className="inline-flex items-center font-heading font-bold text-accent group-hover:gap-3 gap-2 transition-all text-sm uppercase tracking-wider">
                  Read Article
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Grid of Remaining Blogs */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.slice(1).map((blog, i) => (
            <motion.div
              key={blog.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
            >
              <Link to={`/blog/${blog.slug}`} className="group block h-full">
                <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 h-full flex flex-col hover:-translate-y-1">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={blog.image}
                      alt={blog.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-secondary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {blog.category}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                      <span>{blog.readTime}</span>
                      <span>•</span>
                      <span>{new Date(blog.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <h3 className="font-heading font-bold text-secondary text-lg mb-3 leading-snug group-hover:text-accent transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed flex-grow line-clamp-3 mb-4">
                      {blog.excerpt}
                    </p>
                    <span className="inline-flex items-center font-heading font-bold text-accent text-xs uppercase tracking-wider gap-1.5 group-hover:gap-2.5 transition-all mt-auto">
                      Read More
                      <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
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
            <Link to="/category/wall-canvas" className="btn-primary relative z-10 inline-block px-8 py-3.5 text-lg">
              Shop Wall Canvas
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default BlogList;
