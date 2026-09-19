import { Fragment } from 'react';

/* Renders copy stored as the Figma layer's lines.

   macOS browsers apply SF Pro's built-in tracking table, which sets 15–20px
   text about 5% tighter than Figma renders it (CSS has no switch for it), so
   left alone paragraphs re-wrap and card heights drift. From xl up — where the
   content column is the design's exact width — the copy breaks where the Figma
   layer breaks it. Below xl the <br>s are hidden and the lines rejoin with a
   space (none after a trailing hyphen), so text wraps naturally.

   `lines` may also be a plain string, which is rendered as-is. */
const Lines = ({ lines }) => {
  if (!Array.isArray(lines)) return lines;
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br className="hidden xl:inline" />}
      {i > 0 && !lines[i - 1].endsWith('-') && ' '}
      {line}
    </Fragment>
  ));
};

export default Lines;
