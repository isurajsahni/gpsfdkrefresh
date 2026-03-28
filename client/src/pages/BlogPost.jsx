import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SEO from '../components/seo/SEO';
import blogs from '../content/blogs/index';

const BlogPost = () => {
  const { slug } = useParams();
  const blog = blogs.find(b => b.slug === slug);

  if (!blog) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center pt-20">
        <h2 className="text-2xl font-heading text-secondary">Blog post not found</h2>
        <Link to="/blog" className="btn-primary mt-4">Back to Blog</Link>
      </div>
    );
  }

  // Related blogs — same category or random picks, excluding current
  const related = blogs.filter(b => b.slug !== slug && b.category === blog.category).slice(0, 3);
  if (related.length < 3) {
    const extras = blogs.filter(b => b.slug !== slug && !related.find(r => r.slug === b.slug)).slice(0, 3 - related.length);
    related.push(...extras);
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "description": blog.excerpt,
    "image": blog.image,
    "datePublished": blog.date,
    "author": {
      "@type": "Organization",
      "name": "GPSFDK"
    },
    "publisher": {
      "@type": "Organization",
      "name": "GPSFDK",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.gpsfdk.com/logo.webp"
      }
    },
    "keywords": blog.keywords?.join(', '),
    "url": `https://www.gpsfdk.com/blog/${blog.slug}`
  };

  return (
    <div className="min-h-screen bg-primary">
      <SEO
        title={`${blog.title} | GPSFDK Blog`}
        description={blog.excerpt}
        image={blog.image}
        type="article"
        schema={articleSchema}
      />

      {/* Hero Banner */}
      <section className="relative pt-[120px] pb-16 bg-secondary overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${blog.image})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/70 to-secondary"></div>

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Breadcrumb */}
            <nav className="text-white/50 text-sm mb-6">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
              <span className="mx-2">/</span>
              <span className="text-white/80">{blog.title.length > 50 ? blog.title.slice(0, 50) + '...' : blog.title}</span>
            </nav>

            <div className="flex items-center gap-3 mb-5">
              <span className="bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">{blog.category}</span>
              <span className="text-white/50 text-sm">{blog.readTime}</span>
              <span className="text-white/50 text-sm">•</span>
              <span className="text-white/50 text-sm">
                {new Date(blog.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-heading font-bold text-white leading-tight">
              {blog.title}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {/* Feature Image */}
          <div className="rounded-2xl overflow-hidden mb-12 shadow-xl">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-auto object-cover max-h-[500px]"
            />
          </div>

          {/* Markdown Content */}
          <div className="prose prose-lg max-w-none
            prose-headings:font-heading prose-headings:text-secondary prose-headings:font-bold
            prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-3
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-5
            prose-li:text-gray-600
            prose-strong:text-secondary
            prose-a:text-accent prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
            prose-table:rounded-xl prose-table:overflow-hidden
            prose-th:bg-secondary prose-th:text-white prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:text-sm prose-th:font-semibold
            prose-td:px-4 prose-td:py-3 prose-td:text-sm prose-td:border-b prose-td:border-gray-100
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{blog.content}</ReactMarkdown>
          </div>

          {/* Keywords / Tags */}
          {blog.keywords && blog.keywords.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Related Topics</h4>
              <div className="flex flex-wrap gap-2">
                {blog.keywords.map(keyword => (
                  <span key={keyword} className="bg-secondary/5 text-secondary text-xs font-medium px-3 py-1.5 rounded-full">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </article>

      {/* Related Articles */}
      <section className="bg-secondary/5 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-secondary mb-10 text-center">
            You Might Also Like
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {related.map((r, i) => (
              <motion.div
                key={r.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/blog/${r.slug}`} className="group block h-full">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 h-full flex flex-col hover:-translate-y-1">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={r.image}
                        alt={r.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <span className="text-xs text-gray-400 mb-2">{r.readTime}</span>
                      <h3 className="font-heading font-bold text-secondary text-base mb-2 leading-snug group-hover:text-accent transition-colors line-clamp-2">
                        {r.title}
                      </h3>
                      <span className="inline-flex items-center font-heading font-bold text-accent text-xs uppercase tracking-wider gap-1.5 mt-auto">
                        Read →
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPost;
