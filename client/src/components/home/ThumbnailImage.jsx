import { Link } from 'react-router-dom';

const ThumbnailImage = ({ src, alt, slug, isEven }) => {
  return (
    <Link
      to={`/product/${slug}`}
      className="block relative group cursor-pointer w-full h-full min-h-[350px]"
    >
      <div
        className={`relative overflow-hidden rounded-2xl w-full h-full transition-all duration-500 ease-out ${
          isEven ? 'zigzag-image-even' : 'zigzag-image-odd'
        }`}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full h-full object-cover absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </Link>
  );
};

export default ThumbnailImage;
