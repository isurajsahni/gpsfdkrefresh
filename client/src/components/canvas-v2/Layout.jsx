/* Layout primitives shared by the Canvas Page v2 sections.

   The Figma frame is 1440 wide with a 1200 content column (120px gutters), so
   sections sit in <Shell>. Sections own their horizontal padding but no outer
   vertical margin — CanvasLandingV2 sets the gaps between them. */

export const Shell = ({ className = '', children }) => (
  <div className={`mx-auto w-full max-w-[1200px] ${className}`}>{children}</div>
);

/* Figma section heading: SF Pro Medium 38px, #1D1D1F, line-height "auto"
   (1.19 — SF Pro's ascent + descent). */
export const SectionHeading = ({ className = '', children }) => (
  <h2 className={`text-[28px] font-medium leading-[1.19] text-[#1d1d1f] sm:text-[32px] lg:text-[38px] ${className}`}>
    {children}
  </h2>
);
