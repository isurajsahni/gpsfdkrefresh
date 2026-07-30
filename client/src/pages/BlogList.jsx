import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineArrowRight } from 'react-icons/hi';
import SEO from '../components/seo/SEO';
import blogs from '../content/blogs/index';
import { optimizeImage } from '../utils/imageOptimizer';
import { KindCTA, KindHero, KindSectionHead } from '../components/kindact/KindUI';

const BlogList = () => {
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "GPSFDK Blog — Canvas & Home Decor Tips",
    "description": "Expert guides, trends, and inspiration for canvas prints, custom nameplates, and home decor in India.",
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
    <div className="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
      <SEO
        title="Canvas & Home Decor Blog | GPSFDK India"
        description="Expert guides, trends, and inspiration for canvas prints, custom nameplates, and home decor in India. Learn about gallery-wrapped canvas, split prints, and more."
        schema={blogSchema}
      />

      {/* ─── Hero ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <KindHero
          crumb="Home / Blog"
          title={
            <>
              Learn, explore, and <span className="text-kind-lime">stay inspired.</span>
            </>
          }
          description="Discover expert tips on choosing, hanging, and styling canvas prints. From gallery-wrapped guides to sustainable decor trends — become a wall art pro."
        />
      </motion.div>

      <div className="max-w-7xl mx-auto px-3 sm:px-5">
        {/* ─── Blog grid ─── */}
        <div className="mt-14 sm:mt-20">
          <KindSectionHead eyebrow="Insights & stories" title="The Art of Canvas Decoration" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-5 sm:gap-6 mt-8 sm:mt-12">
            {blogs.map((blog, i) => (
              <motion.div
                key={blog.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="h-full"
              >
                <Link
                  to={`/blog/${blog.slug}`}
                  className="group flex flex-col h-full bg-white rounded-[20px] border border-kind-forest/10 overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={optimizeImage(blog.image, 600)}
                      alt={blog.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col flex-1 gap-3">
                    {/* Meta row */}
                    <div className="flex justify-between items-center text-kind-ink/50 text-xs uppercase tracking-wide font-medium">
                      <span>{blog.author || 'Suraj'}</span>
                      <span>{new Date(blog.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>

                    {/* Title */}
                    <h3 className="apple-tile-title font-heading text-kind-ink line-clamp-3">
                      {blog.title}
                    </h3>

                    {/* Read more */}
                    <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-kind-forest">Read More</span>
                      <span className="w-8 h-8 rounded-full bg-kind-forest text-kind-lime flex items-center justify-center shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CTA ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <KindCTA
          title="Ready to Transform Your Walls?"
          text="Explore our premium collection of custom canvas prints and house nameplates. Fast delivery across India."
          to="/wall-canvas"
          cta="Shop Canvas"
        />
      </motion.div>
    </div>
  );
};

export default BlogList;
