import { useEffect, useState } from 'react';
import { getArCatalog, findArArtwork, resolveArSelection, AR_MODEL_BASE } from '../../utils/arCatalog';

/**
 * AR "View on your wall" preview for GPSFDK product pages.
 *
 * Usage:
 *   <ArViewer productId={product.slug} material={v.material} size={v.size} />
 *
 * - Matches the product by slug against catalog.json "id"
 * - Opens on the format/size the shopper selected on the product page
 * - Requires the model-viewer script in client/index.html:
 *   <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"></script>
 *   (client/vercel.json's CSP must allow that origin and the AR model host)
 */
// `size`/`material` are renamed on destructure — `size` and `product` are used
// below for the currently displayed AR model.
export default function ArViewer({ productId, material: selectedMaterial, size: selectedSize }) {
  const [artwork, setArtwork] = useState(null);
  const [failed, setFailed] = useState(false);
  const [pi, setPi] = useState(0);
  const [si, setSi] = useState(0);

  useEffect(() => {
    if (!productId) return;
    let alive = true;
    getArCatalog().then((catalog) => {
      if (!alive) return;
      const found = findArArtwork(catalog, productId);
      if (!found) { setFailed(true); return; }
      // Open on whatever the shopper picked on the page, not always canvas 12x18
      const { productIndex, sizeIndex } = resolveArSelection(found, selectedMaterial, selectedSize);
      setPi(productIndex);
      setSi(sizeIndex);
      setArtwork(found);
      setFailed(false);
    });
    return () => { alive = false; };
  }, [productId, selectedMaterial, selectedSize]);

  // The catalog is unreachable or has no models for this product. The modal is
  // already open at this point, so say so rather than showing an empty box.
  if (failed) {
    return (
      <p style={{ padding: '32px 8px', textAlign: 'center', color: '#777', fontSize: 14, lineHeight: 1.6 }}>
        The wall preview isn’t available for this product right now.
        <br />Please try again in a moment.
      </p>
    );
  }

  if (!artwork) {
    return (
      <p style={{ padding: '32px 8px', textAlign: 'center', color: '#999', fontSize: 14 }}>
        Loading preview…
      </p>
    );
  }

  const baseUrl = AR_MODEL_BASE;
  const product = artwork.products[pi];
  const size = product.sizes[si];
  const specLabel =
    size.unit === 'in' ? `${size.w}" × ${size.h}"` : `${size.w} × ${size.h}mm`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
      <div style={{ position: 'relative', width: '100%', paddingBottom: '75%', background: '#f5f4f2', borderRadius: 10, overflow: 'hidden' }}>
        <model-viewer
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          src={baseUrl + size.glb}
          ios-src={baseUrl + size.usdz}
          alt={`${artwork.name} — ${product.name} ${size.label}`}
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-placement="wall"
          ar-scale="fixed"
          camera-controls
          touch-action="pan-y"
          shadow-intensity="1"
          exposure="1.05"
          environment-image="neutral"
        >
          <button
            slot="ar-button"
            style={{
              position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 22px', background: '#C8A871', color: '#1a1813',
              border: 'none', borderRadius: 99, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,.35)',
            }}
          >
            View on your wall
          </button>
        </model-viewer>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
        <span style={{ fontSize: 20, fontWeight: 600 }}>{artwork.name}</span>
        <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#8a6d3b' }}>
          {product.name} · {specLabel}
        </span>
      </div>

      {artwork.products.length > 1 && (
        <div>
          <div style={{ fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>Format</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {artwork.products.map((p, i) => (
              <button
                key={p.id}
                onClick={() => { setPi(i); setSi(0); }}
                style={{
                  padding: '8px 16px', borderRadius: 99, cursor: 'pointer', fontSize: 13,
                  border: i === pi ? '2px solid #C8A871' : '1px solid #ddd',
                  background: i === pi ? '#faf7f0' : 'transparent',
                  fontWeight: i === pi ? 600 : 400,
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>Size</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {product.sizes.map((s, i) => (
            <button
              key={i}
              onClick={() => setSi(i)}
              style={{
                padding: '10px 14px', textAlign: 'left', borderRadius: 8, cursor: 'pointer',
                border: i === si ? '2px solid #C8A871' : '1px solid #ddd',
                background: i === si ? '#faf7f0' : 'transparent',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: i === si ? 600 : 400 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#999', fontFamily: 'monospace' }}>
                {s.unit === 'in' ? `${s.w}" × ${s.h}"` : `${s.w} × ${s.h}mm`}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
