import { Link } from 'react-router-dom';
import { blogImage, blogSrcSet, formatDate, readingMinutes } from '../../content/blogs/blogShared';

// Pieces shared by BlogList and BlogPost. Their markup is mirrored in
// content/blogs/blogStatic.js (the prerendered HTML), so keep the two in step.

export const ArrowRight = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const Eyebrow = ({ children, dark = false }) => (
  <span className={`inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] ${dark ? 'text-kind-lime' : 'text-kind-forest'}`}>
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dark ? 'bg-kind-lime' : 'bg-kind-forest'}`} />
    {children}
  </span>
);

export const PostMeta = ({ post, withAuthor = false, className = '' }) => (
  <p className={`text-[13px] text-kind-ink/50 ${className}`}>
    {withAuthor && <>By {post.author || 'Suraj'} · </>}
    <time dateTime={post.date}>{formatDate(post.date)}</time> · {readingMinutes(post.content)} min read
  </p>
);

export const BlogCard = ({ post }) => (
  <article className="h-full">
    <Link to={`/blog/${post.slug}`} className="group flex flex-col h-full">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] bg-kind-mist">
        <img
          src={blogImage(post.image, 640)}
          srcSet={blogSrcSet(post.image, [400, 640, 960])}
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          alt={post.title}
          width="640"
          height="400"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-kind-forest">
          {post.category}
        </span>
      </div>
      <div className="flex flex-col flex-1 pt-4">
        <PostMeta post={post} />
        <h3 className="mt-2 font-heading text-[19px] sm:text-[20px] leading-snug font-semibold text-kind-ink group-hover:text-kind-forest transition-colors">
          {post.title}
        </h3>
        <p className="mt-2 text-[15px] leading-relaxed text-kind-ink/60 line-clamp-2">{post.excerpt}</p>
        <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-kind-forest">
          Read article <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  </article>
);
