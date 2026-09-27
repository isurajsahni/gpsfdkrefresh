/* The story's sign-off: the brand's promises running past in large type,
   alternately bright and faded, on the hero's museum green. (Not outlined:
   text-stroke shows SF Pro's overlapping glyph contours.) Two copies of the
   row make the shared marquee keyframes (translateX 0 → -50%) loop
   seamlessly. */
export default function BrandMarquee({ phrases }) {
  const row = (copy) => (
    <div key={copy} className="flex shrink-0 items-center">
      {phrases.map((phrase, index) => (
        <span key={phrase} className="flex items-center">
          <span
            className={`whitespace-nowrap px-6 text-[34px] font-semibold tracking-[-0.03em] sm:px-10 sm:text-[56px] ${
              index % 2 ? 'text-white/30' : 'text-white'
            }`}
          >
            {phrase}
          </span>
          <span className="text-[22px] text-[#f3c98b] sm:text-[30px]">✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden bg-[#0f3a27] py-7 sm:py-9">
      <p className="sr-only">{phrases.join(', ')}</p>
      <div aria-hidden="true" className="flex w-max animate-marquee motion-reduce:animate-none" style={{ animationDuration: '45s' }}>
        {row(0)}
        {row(1)}
      </div>
    </div>
  );
}
