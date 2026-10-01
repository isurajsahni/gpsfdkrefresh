import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

const button = (disabled) =>
  `flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all shadow-sm border ${
    disabled
      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
      : 'bg-white text-secondary border-gray-200 hover:border-accent hover:text-accent'
  }`;

/* Previous / Next under a product listing, with "page / pages" between */
const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4 mt-16 pb-8">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className={button(page === 1)}>
        <HiChevronLeft className="w-5 h-5" /> Previous
      </button>
      <div className="hidden sm:flex text-sm font-semibold text-gray-500 items-center justify-center min-w-[80px]">
        {page} <span className="mx-1 text-gray-300">/</span> {pages}
      </div>
      <button onClick={() => onChange(page + 1)} disabled={page === pages} className={button(page === pages)}>
        Next <HiChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Pagination;
