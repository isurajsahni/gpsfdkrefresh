import { useMemo, useState } from 'react';
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
import useImageRatio from './useImageRatio';
import {
  BOX_CONTENTS, artworkSource, careFor, collectionOf, finishKey, getFinishes, headlineFor, isInchSize, labelFor,
  leadFor, marqueeFor, orient, parseSize, promisesFor, sizeLabel, specsFor, statsFor, storyKind,
} from './storyData';

/* ── The product story ────────────────────────────────────────────────────────
   Everything under the buy box that describes the product, in chapters:
   the piece (gallery hero and key figures), its finishes (or, for a nameplate,
   its anatomy), its size to scale, then the details. The finish and size
   pickers here drive the buy box's own selection through `onPick`, so the two
   never disagree. Keyed by product on the page, so local state (orientation)
   starts fresh on every product. */

export default function ProductStory({
  product, selectedVariation, isCustomSize, quantity, needsText, onPick, onCustomSize, onAddToCart, onShowBuyBox,
}) {
  const { formatPrice } = useCurrency();
  const kind = storyKind(product);
  const finishes = useMemo(() => getFinishes(product.variations), [product.variations]);
  const art = useMemo(() => artworkSource(product, kind), [product, kind]);
  const artRatio = useImageRatio(art.url);
  const [chosenOrientation, setOrientation] = useState(null);

  // Hung the way the artwork (or the plate) is shaped until the visitor turns it
  const orientation = chosenOrientation || (artRatio && artRatio < 0.95 ? 'portrait' : 'landscape');

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

  const showScale = isCustomSize || sizeOptions.some((option) => parseSize(option.size));

  return (
    <MotionConfig reducedMotion="user">
      <div className="mt-20 md:mt-28">
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

        {kind === 'nameplate' ? (
          <NameplateAnatomy design={design} ratio={design ? artRatio : null} name={product.name} />
        ) : (
          finishes.length > 1 && (
            <FinishExplorer
              finishes={finishes}
              activeKey={activeKey}
              onPick={onPick}
              art={art.url}
              ratio={mockupRatio}
              shownAt={sizeText}
              formatPrice={formatPrice}
            />
          )
        )}

        {showScale && (
          <ScaleScene
            kind={kind}
            finishKind={activeFinish?.kind}
            product={product}
            art={kind === 'nameplate' ? design : art.url}
            sizeOptions={sizeOptions}
            selectedSize={size}
            isCustomSize={isCustomSize}
            orientation={orientation}
            onOrientation={setOrientation}
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
