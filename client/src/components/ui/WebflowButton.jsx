import { Link } from 'react-router-dom';

const WebflowButton = ({
  children,
  to,
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  fullWidth = false,
  dark = false,
}) => {
  const bgClass = dark ? 'bg-secondary hover:bg-secondary-dark' : 'bg-accent hover:bg-accent-dark';
  const circleBg = dark 
    ? 'bg-white text-secondary group-hover:bg-transparent group-hover:text-white' 
    : 'bg-white text-accent group-hover:bg-transparent group-hover:text-white';

  const baseClasses = `group relative inline-flex items-center justify-center gap-4 ${bgClass} text-white font-semibold py-2.5 pl-7 pr-2.5 rounded-full overflow-hidden transition-all duration-300 ${fullWidth ? 'w-full' : 'w-fit'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'} shadow-md hover:shadow-xl ${className}`;

  const content = (
    <>
      <span className="relative z-10 tracking-wide">{children}</span>
      <div className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ${circleBg}`}>
        <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45" xmlns="http://www.w3.org/2000/svg">
          <line x1="7" y1="17" x2="17" y2="7"></line>
          <polyline points="7 7 17 7 17 17"></polyline>
        </svg>
      </div>
    </>
  );

  if (to) {
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

export default WebflowButton;
