import { Link } from 'react-router-dom';

/* One art style: an 80px thumbnail circle (68px on phones) over its two-line
   label. Labels are wider than the circle, so each one is centred on it and
   overhangs both sides equally. `active` rings the circle for the listing
   that's open; `mosaic` (four thumbnails) stands in for `image`. */
export default function StyleCircle({ to, lines, image, mosaic, rotated, active }) {
  const name = lines.join(' ');
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className="group flex flex-col items-center focus-visible:outline-none"
    >
      {/* The PNGs are already round; the clip keeps the hover zoom inside the
          circle (isolate stops Safari dropping the clip mid-transition). */}
      <span
        className={`isolate block size-[68px] overflow-hidden rounded-full group-focus-visible:ring-2 group-focus-visible:ring-accent group-focus-visible:ring-offset-2 sm:size-20 ${active ? 'ring-2 ring-accent ring-offset-2' : ''}`}
      >
        {mosaic ? (
          // Each round thumbnail is scaled √2 so its quarter is all artwork.
          <span
            role="img"
            aria-label={name}
            className="grid size-full grid-cols-2 gap-[2px] bg-white transition-transform duration-500 group-hover:scale-[1.06]"
          >
            {mosaic.map((src) => (
              <span key={src} className="overflow-hidden">
                <img src={src} alt="" width="40" height="40" loading="lazy" className="block size-full scale-[1.42]" />
              </span>
            ))}
          </span>
        ) : (
          <img
            src={image}
            alt={name}
            width="80"
            height="80"
            loading="lazy"
            className={`block size-full transition-transform duration-500 group-hover:scale-[1.06] ${rotated ? '-rotate-90' : ''}`}
          />
        )}
      </span>
      {/* The image's alt already names the link, so the visible label is
          hidden from screen readers to avoid reading the name twice. */}
      <span
        aria-hidden="true"
        className={`mt-[11.5px] text-center text-[12px] leading-[1.19] text-black sm:text-[14px] ${active ? 'font-semibold' : 'font-normal'}`}
      >
        {lines.map((line) => (
          <span key={line} className="block whitespace-nowrap">
            {line}
          </span>
        ))}
      </span>
    </Link>
  );
}
