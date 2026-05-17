/**
 * HTML sanitization for admin-supplied rich-text fields (product description, etc.).
 *
 * The product description is rendered on the client with `dangerouslySetInnerHTML`,
 * so any unfiltered HTML coming from an admin is a stored-XSS vector. We allow
 * the tags an editor commonly needs (formatting, links, lists, images, tables)
 * and strip everything else — including <script>, event handlers, and javascript:
 * URLs in href/src.
 */
const sanitizeHtml = require('sanitize-html');

const allowedTags = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr', 'span', 'div',
  'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
];

const allowedAttributes = {
  a: ['href', 'name', 'target', 'rel', 'title'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  '*': ['class', 'style'], // allow basic styling; tightly schema'd below
};

// Restrict CSS to safe subset (no expression(), no url() exfil).
const allowedStyles = {
  '*': {
    color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/, /^[a-z]+$/i],
    'background-color': [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/, /^[a-z]+$/i],
    'text-align': [/^(left|right|center|justify)$/],
    'font-weight': [/^(normal|bold|\d{3})$/],
    'font-style': [/^(normal|italic)$/],
    'text-decoration': [/^(none|underline|line-through)$/],
    'font-size': [/^\d{1,3}(px|em|rem|%)$/],
  },
};

const config = {
  allowedTags,
  allowedAttributes,
  allowedStyles,
  // Only http(s) / mailto / tel — blocks `javascript:` etc.
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
  allowProtocolRelative: false,
  // Force every <a> to open in a new tab AND get rel=noopener for safety.
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }, true),
  },
  // Drop script bodies entirely (not just the tag — important for inline JS).
  nonTextTags: ['style', 'script', 'textarea', 'noscript'],
};

/**
 * Sanitize HTML safely. Returns '' for non-string input so it never throws.
 */
function sanitizeRichText(html) {
  if (typeof html !== 'string' || !html) return '';
  return sanitizeHtml(html, config);
}

module.exports = { sanitizeRichText };
