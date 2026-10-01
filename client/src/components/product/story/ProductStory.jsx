import { useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MotionConfig } from 'framer-motion';
import { useCurrency } from '../../../context/CurrencyContext';
import { optimizeImage } from '../../../utils/imageOptimizer';
import { toPlainText } from '../../../utils/productSeo';
import BrandMarquee from './BrandMarquee';
import FinishExplorer from './FinishExplorer';
import GalleryHero from './GalleryHero';
import NameplateAnatomy from './NameplateAnatomy';
import ScaleScene from './ScaleScene';
import StoryDetails from './StoryDetails';
import StoryShortcuts from './StoryShortcuts';
import useImageRatio from './useImageRatio';
import {
  BOX_CONTENTS, artworkSource, careFor, collectionOf, finishKey, getFinishes, headlineFor, isInchSize, labelFor,
  leadFor, marqueeFor, orient, parseSize, promisesFor, sizeLabel, specsFor, statsFor, storyKind,
} from './storyData';

/* ── The product story ────────────────────────────────────────────────────────
   Everything under the buy box that describes the product, in chapters: its
   finishes first, straight under the buy box, then the piece (gallery hero and
   key figures), a nameplate's anatomy, its size to scale, then the details.
   The finish and size pickers here drive the buy box's own selection through
   `onPick`, so the two never disagree. Keyed by product on the page, so local
   state (the units, the turntable) starts fresh on every product. The buy
   box's "which size?" and "which finish?" shortcuts are rendered from here,
   into `shortcutsSlot`, because only the story knows which chapters it shows. */

export default function ProductStory({
  product, selectedVariation, isCustomSize, quantity, needsText, onPick, onCustomSize, onAddToCart, onShowBuyBox,
  shortcutsSlot,
}) {
  const { formatPrice } = useCurrency();
  const kind = storyKind(product);
  const finishes = useMemo(() => getFinishes(product.variations), [product.variations]);
  const art = useMemo(() => artworkSource(product, kind), [product, kind]);
  const artRatio = useImageRatio(art.url);
  const finishRef = useRef(null);
  const scaleRef = useRef(null);

  // Hung the way the artwork (or the plate) is shaped: it can only be printed
  // that way, so there's no turning it round
  const orientation = artRatio && artRatio < 0.95 ? 'portrait' : 'landscape';

  const activeKey = finishKey(selectedVariation);
  const activeFinish = finishes.find((finish) => finish.key === activeKey);
  const dims = parseSize(selectedVariation?.size);
  const shape = dims ? orient(dims, orientation) : null;
  // Finish mockups take the selected size's proportions
  const mockupRatio = shape ? shape.w / shape.h : artRatio || 1.5;

  // Sizes of the selected finish, in the admin's order, with their prices
  const sizeOptions = useMemo(() => {
    const bySize = new Map();
    for (const variation of product.variations || []) {
      if (finishKey(variation) === activeKey && !bySize.has(variation.size)) {
        bySize.set(variation.size, { size: variation.size, price: variation.price });
      }
    }
    return [...bySize.values()];
  }, [product.variations, activeKey]);

  const collection = collectionOf(product);
  const leadHtml = toPlainText(product.description) ? product.description : '';
  const photo = optimizeImage(product.images?.[0]?.url || product.thumbnailImage?.url, 1200);
  // The plate on its own, for the anatomy and the door scene. A crop of a
  // lifestyle shot won't do there: it has the wall and lamp in it.
  const design = art.cropped ? '' : art.url;

  const size = selectedVariation?.size;
  const sizeText = size ? `${sizeLabel(size)}${isInchSize(size) ? ' in' : ''}` : '';
  const pickLabel = kind === 'nameplate'
    ? `${product.name} · ${isCustomSize ? 'Custom size' : sizeText}`
    : [activeFinish?.name, sizeText].filter(Boolean).join(' · ');
  const price = selectedVariation?.price || 0;
  const priceText = !isCustomSize && price > 0 ? `${formatPrice(price * quantity)}${quantity > 1 ? ` for ${quantity}` : ''}` : '';
  const cta = isCustomSize
    ? { label: 'Request a price above', up: true, onClick: onShowBuyBox }
    : needsText
      ? { label: 'Add your name above', up: true, onClick: onAddToCart }
      : { label: 'Add to cart', up: false, onClick: onAddToCart };

  // Sizes the scale scene can draw; with none, it only shows for a custom size
  const drawable = sizeOptions.some((option) => parseSize(option.size));
  const showScale = isCustomSize || drawable;
  const showFinishes = kind !== 'nameplate' && finishes.length > 1;

  // A shortcut takes you down to its chapter, and keyboard and screen reader
  // users with it
  const goTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    ref.current?.focus({ preventScroll: true });
  };

  return (
    <MotionConfig reducedMotion="user">
      {shortcutsSlot && (drawable || showFinishes) && createPortal(
        <StoryShortcuts
          finishes={finishes}
          onSize={drawable ? () => goTo(scaleRef) : null}
          onFinish={showFinishes ? () => goTo(finishRef) : null}
        />,
        shortcutsSlot,
      )}

      {showFinishes && (
        <FinishExplorer
          ref={finishRef}
          finishes={finishes}
          activeKey={activeKey}
          onPick={onPick}
          art={art.url}
          ratio={mockupRatio}
          shownAt={sizeText}
          formatPrice={formatPrice}
        />
      )}

      {/* With no finishes above it, the hero needs its own gap from the buy box */}
      <div className={showFinishes ? '' : 'mt-20 md:mt-28'}>
        <GalleryHero
          product={product}
          kind={kind}
          art={art}
          artRatio={artRatio}
          photo={photo}
          headline={headlineFor(kind)}
          lead={leadFor(product, kind, finishes)}
          leadHtml={leadHtml}
          label={labelFor(product, kind, finishes)}
          stats={statsFor(product, kind, finishes)}
          collection={collection}
        />

        {kind === 'nameplate' && (
          <NameplateAnatomy design={design} ratio={design ? artRatio : null} name={product.name} />
        )}

        {showScale && (
          <ScaleScene
            ref={scaleRef}
            kind={kind}
            finishKind={activeFinish?.kind}
            product={product}
            art={kind === 'nameplate' ? design : art.url}
            sizeOptions={sizeOptions}
            selectedSize={size}
            isCustomSize={isCustomSize}
            orientation={orientation}
            onPick={onPick}
            onCustomSize={onCustomSize}
            priceText={priceText}
            pickLabel={pickLabel}
            cta={cta}
            formatPrice={formatPrice}
          />
        )}

        <StoryDetails
          specs={specsFor(product, kind, finishes)}
          collection={collection}
          box={kind === 'nameplate' ? BOX_CONTENTS : null}
          care={careFor(kind)}
          promises={promisesFor(kind)}
        />

        <BrandMarquee phrases={marqueeFor(kind)} />
      </div>
    </MotionConfig>
  );
}
