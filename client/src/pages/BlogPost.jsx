import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SEO from '../components/seo/SEO';
import blogs from '../content/blogs/index';
import { optimizeImage } from '../utils/imageOptimizer';
import API from '../utils/api';
import { useCurrency } from '../context/CurrencyContext';

const BlogPost = () => {
  const { slug } = useParams();
  const blog = blogs.find(b => b.slug === slug);
  const [products, setProducts] = useState([]);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const contentLower = ((blog?.title || '') + ' ' + (blog?.content || '')).toLowerCase();
        const isNameplate = contentLower.includes('nameplate') || 
                            contentLower.includes('ganesha') || 
                            contentLower.includes('naman') || 
                            contentLower.includes('naam') || 
                            contentLower.includes('trishula');
        const categorySlug = isNameplate ? 'house-nameplates' : 'wall-canvas';
        
        const { data } = await API.get('/products', {
          params: {
            limit: 3,
            categorySlug: categorySlug
          }
        });
        setProducts(data.products || []);
      } catch (err) {
        // silent fail
      }
    };
    if (blog) fetchProducts();
  }, [slug, blog]);

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

      {/* Hero Banner Redesigned */}
      <section className="bg-secondary pt-[120px] pb-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            {/* Breadcrumb */}
            <nav className="text-white/50 text-sm mb-8 flex flex-wrap gap-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-white/80">{blog.title.length > 40 ? blog.title.slice(0, 40) + '...' : blog.title}</span>
            </nav>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight mb-8">
              {blog.title}
            </h1>
            
            <div className="flex items-center gap-2 mb-6 text-white text-sm">
              <span className="font-semibold">{blog.author || 'Suraj'}</span>
              <span className="text-white/40">—</span>
              <span className="text-white/80">
                {new Date(blog.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <p className="text-white/80 leading-relaxed max-w-lg mb-8 text-sm md:text-base">
              {blog.excerpt}
            </p>

            <span className="inline-block bg-white/10 text-white border border-white/20 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full">
              {blog.category}
            </span>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="w-full aspect-square bg-white rounded-sm shadow-2xl flex items-center justify-center p-2 relative">
              <img
                src={optimizeImage(blog.image, 1000)}
                alt={blog.title}
                className="w-full h-full object-cover rounded-sm border border-gray-100"
              />
            </div>
          </motion.div>

        </div>
      </section>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          {/* Markdown Content */}
          <div className="prose prose-lg max-w-none
            prose-headings:font-heading prose-headings:text-secondary prose-headings:font-bold
            prose-h2:text-3xl prose-h2:md:text-4xl prose-h2:mt-8 prose-h2:mb-3
            prose-h3:text-2xl prose-h3:md:text-3xl prose-h3:mt-6 prose-h3:mb-2
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
            prose-li:text-gray-700 prose-li:mb-1
            prose-ul:my-4
            prose-ol:my-4
            prose-strong:text-secondary
            prose-a:text-accent prose-a:font-semibold hover:prose-a:underline
            prose-table:rounded-xl prose-table:overflow-hidden prose-table:my-6
            prose-th:bg-secondary prose-th:text-white prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:text-sm prose-th:font-semibold
            prose-td:px-4 prose-td:py-3 prose-td:text-sm prose-td:border-b prose-td:border-gray-200
          ">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children, ...props }) => {
                  const isInternal = href && (href.startsWith('/') || href.startsWith('https://www.gpsfdk.com') || href.startsWith('https://gpsfdk.com'));
                  const cleanHref = isInternal ? href.replace(/https?:\/\/(www\.)?gpsfdk\.com/, '') : href;
                  if (isInternal) {
                    return <Link to={cleanHref} className="text-accent font-semibold hover:underline" {...props}>{children}</Link>;
                  }
                  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent font-semibold hover:underline" {...props}>{children}</a>;
                }
              }}
            >
              {blog.content}
            </ReactMarkdown>
          </div>

          {/* Keywords / Tags */}
          {blog.keywords && blog.keywords.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Related Topics</h4>
              <div className="flex flex-wrap gap-2">
                {blog.keywords.map(keyword => (
                  <Link 
                    key={keyword} 
                    to={`/wall-canvas`} 
                    className="bg-secondary/5 hover:bg-secondary hover:text-white transition-colors text-secondary text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    {keyword}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Products (Shop This Look Section) */}
          {products && products.length > 0 && (
            <div className="mt-16 pt-12 border-t border-gray-200 text-left">
              <h3 className="text-2xl font-heading font-bold text-secondary text-center mb-2 uppercase tracking-wide">
                Shop This Look
              </h3>
              <p className="text-gray-500 text-center font-body text-sm sm:text-base mb-8">
                Transform your home with these premium, high-quality recommendations.
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map(product => {
                  const prices = [
                    product.basePrice,
                    ...(product.variations || []).map(v => v.price)
                  ].filter(p => typeof p === 'number');
                  const minPrice = prices.length > 0 ? Math.min(...prices) : (product.basePrice || 0);

                  return (
                    <Link 
                      key={product._id} 
                      to={`/product/${product.slug}`} 
                      className="group bg-white rounded-2xl overflow-hidden border border-cream-dark shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden bg-cream-dark">
                        <img
                          src={optimizeImage(product.images?.[0]?.url, 400) || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500'}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                        <span className="absolute top-3 left-3 bg-accent text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                          Shop
                        </span>
                      </div>
                      <div className="p-4 flex flex-col flex-grow justify-between">
                        <h4 className="font-heading font-bold text-secondary text-sm group-hover:text-accent transition-colors line-clamp-2 leading-tight">
                          {product.name}
                        </h4>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                          <span className="text-accent font-bold text-sm">
                            {formatPrice(minPrice)}
                          </span>
                          <span className="text-secondary font-heading font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 group-hover:underline">
                            View Details →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
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
                        src={optimizeImage(r.image, 500)}
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
