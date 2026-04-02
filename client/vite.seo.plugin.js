export default function injectStaticSitemap() {
  return {
    name: 'inject-static-sitemap',
    enforce: 'post',
    async transformIndexHtml(html) {
      try {
        console.log('\n[SEO Injection] Fetching live sitemap for static HTML injection...');
        const res = await fetch('https://gpsfdkrefresh.onrender.com/sitemap.xml');
        
        if (!res.ok) {
          throw new Error(`Failed to fetch sitemap. Status: ${res.status}`);
        }
        
        const text = await res.text();
        
        // Extract all <loc> contents using regex
        const matches = [...text.matchAll(/<loc>(.*?)<\/loc>/g)];
        const urls = matches.map(m => m[1]);
        
        if (urls.length === 0) {
          console.log('[SEO Injection] No URLs found. Skipping injection.');
          return html;
        }

        console.log(`[SEO Injection] Successfully extracted ${urls.length} links for static SEO generation.`);

        // Wrap the links in an unstyled <footer> tag to safely deliver them to Dr. Link Checker
        const linksHtml = urls.map(url => {
          const path = url.split('/').pop() || 'Home';
          const title = decodeURIComponent(path.replace(/-/g, ' ')).toUpperCase();
          return `          <li><a href="${url}">${title}</a></li>`;
        }).join('\n');
        
        // We use <noscript> to perfectly bypass CSS display:none penalties while maintaining non-JS crawlability!
        const seoBlock = `
    <!-- SEO OVERRIDE: STATIC SITEMAP INJECTION FOR DR. LINK CHECKER AND NON-JS CRAWLERS -->
    <noscript>
      <footer id="seo-static-links" style="display:none;" aria-hidden="true">
        <h2>Site Map Links</h2>
        <ul>
${linksHtml}
        </ul>
      </footer>
    </noscript>
`;
        
        return html.replace('</body>', `${seoBlock}  </body>`);
      } catch (err) {
        console.error('\n[SEO Injection Error] Static Sitemap Injection failed:', err.message);
        console.log('Skipping static injection and continuing build...\n');
        return html; // Return unmodified string on failure without failing the entire build!
      }
    }
  };
}
