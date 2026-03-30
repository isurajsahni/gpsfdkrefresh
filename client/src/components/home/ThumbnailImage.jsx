import { Link } from 'react-router-dom';

const ThumbnailImage = ({ src, alt, slug, isEven }) => {
  return (
    <Link
      to={`/product/${slug}`}
      className="block relative group cursor-pointer"
    >
      <div
        className={`relative overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(11,93,59,0.13)] transition-all duration-500 ease-out group-hover:shadow-[0_25px_70px_rgba(11,93,59,0.22)] ${
          isEven ? 'zigzag-image-even' : 'zigzag-image-odd'
        }`}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full h-full object-cover aspect-[4/5] transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </Link>
  );
};

export default ThumbnailImage;
