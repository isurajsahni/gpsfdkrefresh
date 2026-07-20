import { Link } from 'react-router-dom';
import ctaPoster from '../../assets/image/wallcanvas_poster_1.webp';

/**
 * Shared primitives for the kindact.webflow.io-inspired redesign of the
 * info/support pages. Deep forest panels, mint cards, lime pill buttons and
 * uppercase eyebrow labels — all namespaced under the `kind-*` Tailwind
 * colors so product/main pages stay untouched.
 */

export const Eyebrow = ({ children, dark = false, className = '' }) => (
  <span
    className={`inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] ${
      dark ? 'text-kind-lime' : 'text-kind-forest'
    } ${className}`}
  >
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dark ? 'bg-kind-lime' : 'bg-kind-forest'}`} />
    {children}
  </span>
);

const ArrowIcon = ({ className = '' }) => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`w-4 h-4 transition-transform duration-300 group-hover:rotate-45 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

const BUTTON_VARIANTS = {
  lime: {
    base: 'bg-kind-lime text-kind-ink hover:bg-kind-limedark',
    circle: 'bg-kind-ink text-kind-lime',
  },
  forest: {
    base: 'bg-kind-forest text-white hover:bg-kind-ink',
    circle: 'bg-kind-lime text-kind-ink',
  },
  outline: {
    base: 'bg-transparent text-kind-ink border border-kind-ink/30 hover:border-kind-ink',
    circle: 'bg-kind-ink/10 text-kind-ink',
  },
  outlineDark: {
    base: 'bg-transparent text-white border border-white/30 hover:border-white',
    circle: 'bg-white/15 text-white',
  },
};

export const KindButton = ({
  children,
  to,
  onClick,
  type = 'button',
  variant = 'lime',
  className = '',
  disabled = false,
  fullWidth = false,
}) => {
  const v = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.lime;
  const baseClasses = `group inline-flex items-center justify-center gap-3 ${v.base} font-semibold text-sm sm:text-base py-2 pl-6 pr-2 rounded-full transition-all duration-300 ${
    fullWidth ? 'w-full' : 'w-fit'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'} ${className}`;

  const content = (
    <>
      <span className="tracking-wide">{children}</span>
      <span className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300 shrink-0 ${v.circle}`}>
        <ArrowIcon />
      </span>
    </>
  );

  if (to) {
    const isSpecialProtocol = to.startsWith('tel:') || to.startsWith('mailto:') || to.startsWith('http');
    if (isSpecialProtocol) {
      return (
        <a href={to} className={baseClasses} onClick={onClick}>
          {content}
        </a>
      );
    }
    return (
      <Link to={to} className={baseClasses} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={baseClasses}>
      {content}
    </button>
  );
};

/** Deep-forest rounded hero panel with breadcrumb-style eyebrow.
 * Pass `image` to render a photo background under a forest overlay. */
export const KindHero = ({ crumb, title, description, center = false, image, children }) => (
  <section className="max-w-7xl mx-auto px-3 sm:px-5">
    <div
      className={`relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-kind-forest px-6 sm:px-10 lg:px-16 py-12 sm:py-16 lg:py-20 text-white ${
        center ? 'text-center' : ''
      }`}
    >
      {image && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <img src={image} alt="" className="w-full h-full object-cover" />
          <div
            className={`absolute inset-0 ${
              center
                ? 'bg-kind-forest/85'
                : 'bg-gradient-to-r from-kind-forest via-kind-forest/90 to-kind-forest/45'
            }`}
          />
        </div>
      )}

      {/* Decorative glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-kind-lime/10 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-kind-mint/10 blur-3xl" />
      </div>

      <div className={`relative ${center ? 'flex flex-col items-center' : ''}`}>
        {crumb && <Eyebrow dark>{crumb}</Eyebrow>}
        <h1 className={`mt-4 text-3xl sm:text-5xl lg:text-6xl font-heading font-bold leading-[1.08] max-w-3xl ${center ? 'mx-auto' : ''}`}>
          {title}
        </h1>
        {description && (
          <p className={`mt-5 text-base sm:text-lg text-kind-sage max-w-2xl leading-relaxed ${center ? 'mx-auto' : ''}`}>
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  </section>
);

/** Section heading: eyebrow + big title + optional sub copy. */
export const KindSectionHead = ({ eyebrow, title, sub, center = true, dark = false, className = '' }) => (
  <div className={`${center ? 'text-center flex flex-col items-center' : ''} ${className}`}>
    {eyebrow && <Eyebrow dark={dark}>{eyebrow}</Eyebrow>}
    <h2 className={`mt-3 text-2xl sm:text-3xl md:text-4xl font-heading font-bold leading-tight ${dark ? 'text-white' : 'text-kind-ink'}`}>
      {title}
    </h2>
    {sub && (
      <p className={`mt-3 text-sm sm:text-base max-w-2xl leading-relaxed ${dark ? 'text-kind-sage' : 'text-kind-ink/60'} ${center ? 'mx-auto' : ''}`}>
        {sub}
      </p>
    )}
  </div>
);

/** Closing call-to-action panel, kindact "Take Action" style. */
export const KindCTA = ({
  eyebrow = 'Take action',
  title = "Let's Create Something Beautiful",
  text = 'Explore our handcrafted canvas art and custom nameplates — made to order, delivered across India.',
  to = '/wall-canvas',
  cta = 'Explore Our Collection',
  image = ctaPoster,
}) => (
  <section className="max-w-7xl mx-auto px-3 sm:px-5 mt-14 sm:mt-20">
    <div className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-kind-forest px-6 sm:px-10 py-12 sm:py-16 text-center text-white">
      {image && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-kind-forest/85" />
        </div>
      )}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-kind-lime/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-kind-mint/10 blur-3xl" />
      </div>
      <div className="relative flex flex-col items-center">
        <Eyebrow dark>{eyebrow}</Eyebrow>
        <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-heading font-bold max-w-2xl leading-tight">{title}</h2>
        <p className="mt-4 text-sm sm:text-base text-kind-sage max-w-xl leading-relaxed">{text}</p>
        <div className="mt-7">
          <KindButton to={to} variant="lime">
            {cta}
          </KindButton>
        </div>
      </div>
    </div>
  </section>
);

/** Numbered content block for policy pages. */
export const PolicySection = ({ index, title, children }) => (
  <section className="bg-white/70 rounded-[20px] border border-kind-forest/10 p-6 sm:p-8">
    <h2 className="text-lg sm:text-xl font-heading font-bold text-kind-ink mb-3 sm:mb-4 flex items-center gap-3">
      {index != null && (
        <span className="w-8 h-8 rounded-full bg-kind-lime text-kind-ink text-sm font-bold flex items-center justify-center shrink-0">
          {index}
        </span>
      )}
      {title}
    </h2>
    <div className="text-sm sm:text-base text-kind-ink/70 leading-relaxed space-y-3">{children}</div>
  </section>
);
