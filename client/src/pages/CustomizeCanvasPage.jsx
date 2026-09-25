import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper from 'react-easy-crop';
import { HiOutlineUpload, HiOutlineShoppingBag, HiOutlineChevronLeft, HiStar, HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineRefresh } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import toast from 'react-hot-toast';
import SEO from '../components/seo/SEO';
import BeforeAfterSection from '../components/home/BeforeAfterSection';
import {
  MIN_LONG_EDGE, readImageSize, prepareForUpload, uploadCanvasPhoto,
  printDimensions, printQuality, largestCrop, croppedPhotoUrl,
} from '../utils/canvasUpload';

const MATERIALS = [
  { 
    id: 'canvas', 
    label: 'Canvas', 
    icon: (props) => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 .375 0 11-.75 0 .375 .375 0 01.75 0z" />
      </svg>
    )
  },
  { 
    id: 'poster', 
    label: 'Poster', 
    icon: (props) => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    )
  },
];

const CANVAS_SIZES = [
  { label: '12 x 18', rolledPrice: 999, stretchedPrice: 1499 },
  { label: '18 x 24', rolledPrice: 1499, stretchedPrice: 2499 },
  { label: '24 x 36', rolledPrice: 2899, stretchedPrice: 3699 },
  { label: '30 x 48', rolledPrice: 4199, stretchedPrice: 5999 },
  { label: '36 x 60', rolledPrice: 5999, stretchedPrice: 7999 },
];

const POSTER_SIZES = [
  { label: 'A4', paperPrice: 99, stickerPrice: 149, softBoardPrice: 599 },
  { label: 'A3', paperPrice: 199, stickerPrice: 299, softBoardPrice: 999 },
];

const CANVAS_FRAMES = [
  { 
    id: 'rolled', 
    label: 'Rolled', 
    icon: (props) => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18c0 1.657 2.686 3 6 3s6-1.343 6-3M6 18V6c0-1.657 2.686-3 6-3s6 1.343 6 3v12M6 18c0-1.657 2.686-3 6-3s6 1.343 6 3M6 6c0 1.657 2.686 3 6 3s6-1.343 6-3" />
      </svg>
    )
  },
  { 
    id: 'stretched', 
    label: 'Stretched', 
    icon: (props) => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.5} />
        <rect x="6" y="6" width="12" height="12" rx="1" strokeWidth={1} />
      </svg>
    )
  },
];

const POSTER_FRAMES = [
  { 
    id: 'sticker', 
    label: 'Sticker', 
    icon: (props) => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.125 1.125 0 001.591 0l4.318-4.318a1.125 1.125 0 000-1.591L9.568 3.659A2.25 2.25 0 008.97 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    )
  },
  { 
    id: 'softboard', 
    label: 'Soft Board', 
    icon: (props) => (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth={1.5} />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M8 5v14M16 5v14" />
      </svg>
    )
  },
];

const QUALITY_COPY = {
  great: { label: 'Great quality for this size', dot: 'bg-green-500', text: 'text-green-700', box: 'bg-green-50 border-green-200' },
  ok: { label: 'OK quality — may look slightly soft up close', dot: 'bg-amber-500', text: 'text-amber-800', box: 'bg-amber-50 border-amber-200' },
  low: { label: 'Low quality for this size — a smaller size will look sharper', dot: 'bg-red-500', text: 'text-red-700', box: 'bg-red-50 border-red-200' },
};

// How each finish sits on the wall in the preview
const mockupShadow = (materialId, frameId) => {
  if (materialId === 'canvas' && frameId === 'stretched') return 'shadow-[4px_6px_0_rgba(0,0,0,0.18),0_18px_30px_rgba(0,0,0,0.28)]';
  if (materialId === 'poster' && frameId === 'softboard') return 'shadow-[2px_3px_0_rgba(0,0,0,0.15),0_10px_20px_rgba(0,0,0,0.2)]';
  if (materialId === 'poster') return 'shadow-[0_2px_6px_rgba(0,0,0,0.15)]';
  return 'shadow-[0_6px_16px_rgba(0,0,0,0.2)]';
};

// CSS background that shows just the cropped part of the photo
const cropBackground = (url, area) => {
  if (!area) return { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  const pos = (offset, size) => (size >= 100 ? 0 : (offset / (100 - size)) * 100);
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: `${10000 / area.width}% ${10000 / area.height}%`,
    backgroundPosition: `${pos(area.x, area.width)}% ${pos(area.y, area.height)}%`,
  };
};

const UPLOAD_IDLE = { status: 'idle', progress: 0, url: '', size: null, error: '' };

const CustomizeCanvasPage = () => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Customize
  // The photo as it will be uploaded: { file, url (local preview), width, height, resized }
  const [photo, setPhoto] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  // Runs in the background from "Continue" on; only Add to Cart waits for it
  const [upload, setUpload] = useState(UPLOAD_IDLE);
  const uploadAbortRef = useRef(null);

  const [selectedMaterial, setSelectedMaterial] = useState(MATERIALS[0]);
  const [selectedSize, setSelectedSize] = useState(CANVAS_SIZES[0]);
  const [selectedFrame, setSelectedFrame] = useState(CANVAS_FRAMES[0]);
  const [instructions, setInstructions] = useState('');

  const [orientation, setOrientation] = useState('portrait');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  // The chosen framing: { percent, pixels } (pixels of the photo as uploaded)
  const [cropArea, setCropArea] = useState(null);

  // Handle Material Switching Robustly
  const handleMaterialChange = (material) => {
    setSelectedMaterial(material);
    if (material.id === 'canvas') {
      setSelectedSize(CANVAS_SIZES[0]);
      setSelectedFrame(CANVAS_FRAMES[0]);
    } else {
      setSelectedSize(POSTER_SIZES[0]);
      setSelectedFrame(POSTER_FRAMES[0]);
    }
  };

  const { addToCart } = useCart();
  const { setIsCartOpen } = useUI();
  const fileInputRef = useRef(null);

  // Release the local preview when it's replaced or the page closes
  useEffect(() => () => { if (photo?.url) URL.revokeObjectURL(photo.url); }, [photo]);
  useEffect(() => () => uploadAbortRef.current?.abort(), []);

  const cancelUpload = () => {
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = null;
    setUpload(UPLOAD_IDLE);
  };

  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;
    setPhotoError('');
    if (!selectedFile.type.startsWith('image/')) {
      setPhotoError('Please choose a photo (JPG, PNG or WEBP).');
      return;
    }
    cancelUpload();
    setPreparing(true);
    try {
      const size = await readImageSize(selectedFile);
      if (Math.max(size.width, size.height) < MIN_LONG_EDGE) {
        setPhotoError(`This photo is too small to print (${size.width} × ${size.height} px). Please choose one at least ${MIN_LONG_EDGE} px on its longest side — the original from your phone or camera works best.`);
        return;
      }
      const prepared = await prepareForUpload(selectedFile, size);
      setPhoto({ ...prepared, url: URL.createObjectURL(prepared.file) });
      // Start in the photo's own orientation, framed in full
      setOrientation(prepared.width > prepared.height ? 'landscape' : 'portrait');
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCropArea(null);
    } catch {
      setPhotoError("We couldn't read this photo. Please upload a JPG, PNG or WEBP image.");
    } finally {
      setPreparing(false);
    }
  };

  const startUpload = (file) => {
    uploadAbortRef.current?.abort();
    const controller = new AbortController();
    uploadAbortRef.current = controller;
    setUpload({ ...UPLOAD_IDLE, status: 'uploading' });
    uploadCanvasPhoto(file, {
      signal: controller.signal,
      onProgress: (progress) => setUpload((u) => (u.status === 'uploading' ? { ...u, progress } : u)),
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        setUpload({ status: 'done', progress: 1, url: result.url, size: result.width ? { width: result.width, height: result.height } : null, error: '' });
      })
      .catch((err) => {
        if (err.cancelled || controller.signal.aborted) return;
        setUpload({ ...UPLOAD_IDLE, status: 'error', error: err.message || 'Upload failed' });
      });
  };

  const handleContinue = () => {
    if (!photo || preparing) return;
    // Upload in the background while the customer chooses their options
    if (upload.status === 'idle' || upload.status === 'error') startUpload(photo.file);
    setStep(2);
    window.scrollTo(0, 0);
  };

  // Going back keeps a running upload: it's only cancelled if a different
  // photo is chosen (handleFile)
  const handleChangePhoto = () => setStep(1);

  const onCropComplete = useCallback((percent, pixels) => setCropArea({ percent, pixels }), []);

  const getPrice = () => {
    if (!selectedSize || !selectedFrame) return 0;

    // Canvas Pricing
    if (selectedMaterial.id === 'canvas') {
      // Ensure we are looking at a canvas size object
      if (selectedSize.rolledPrice === undefined) return 0;
      return selectedFrame.id === 'rolled' ? selectedSize.rolledPrice : selectedSize.stretchedPrice;
    }

    // Poster Pricing
    if (selectedMaterial.id === 'poster') {
      // Ensure we are looking at a poster size object
      if (selectedSize.stickerPrice === undefined) return 0;
      if (selectedFrame.id === 'softboard') return selectedSize.softBoardPrice;
      return selectedSize.stickerPrice;
    }

    return 0;
  };

  const printSize = printDimensions(selectedSize.label, orientation);
  const aspect = printSize.width / printSize.height;

  // Quality if the whole photo were used at a size (for the size buttons)
  const qualityForSize = (size) => {
    if (!photo) return null;
    const inches = printDimensions(size.label, orientation);
    return printQuality(largestCrop(photo, inches.width / inches.height), inches).level;
  };
  // The selected size, judged on the part of the photo actually framed
  const selectedQuality = photo
    ? printQuality(cropArea?.pixels || largestCrop(photo, aspect), printSize).level
    : null;

  const handleAddToCart = () => {
    if (upload.status !== 'done') return;
    const imageUrl = croppedPhotoUrl(upload.url, cropArea?.pixels, photo, upload.size);

    const product = {
      _id: 'custom-canvas-id',
      name: `Custom ${selectedMaterial.label}`,
      slug: 'custom-canvas',
      images: [{ url: imageUrl }],
      category: { slug: 'wall-canvas', name: 'Canvas' }
    };

    const variation = {
      material: selectedMaterial.label,
      size: selectedSize.label,
      frame: selectedFrame.label,
      price: getPrice()
    };

    const pixels = cropArea?.pixels;
    addToCart(product, variation, 1, instructions, imageUrl, {
      originalImageUrl: upload.url,
      crop: pixels ? {
        x: Math.round(pixels.x), y: Math.round(pixels.y),
        width: Math.round(pixels.width), height: Math.round(pixels.height),
        orientation,
      } : null,
    });
    setIsCartOpen(true);
    toast.success('Added to cart!');
  };

  const total = getPrice();
  const uploadPercent = Math.round(upload.progress * 100);

  const addButtonLabel = {
    idle: 'Add to Cart',
    uploading: uploadPercent >= 100 ? 'Finishing upload…' : `Uploading ${uploadPercent}%`,
    error: 'Upload failed',
    done: 'Add to Cart',
  }[upload.status];

  return (
    <div className="min-h-screen bg-[#FFF7E7] text-secondary pt-24 sm:pt-28 pb-20 px-4">
      <SEO
        title="Customize Your Canvas | Turn Photos Into Art"
        description="Upload your photo and customize your own museum-grade canvas portrait."
      />

      <div className="max-w-5xl mx-auto">
        {/* Progress Header */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 text-xs sm:text-sm font-medium tracking-[0.2em] font-body uppercase">
          <span className={`${step >= 1 ? 'text-accent' : 'text-gray-400'} transition-colors`}>Step 1: Upload</span>
          <span className="text-gray-300">/</span>
          <span className={`${step >= 2 ? 'text-accent' : 'text-gray-400'} transition-colors`}>Step 2: Customize</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-heading font-bold mb-4 sm:mb-6 text-secondary leading-tight">
                Turn Your Photos Into <span className="text-accent underline decoration-[#adc140]">Timeless Art</span>
              </h1>
              <p className="text-gray-600 font-body text-base sm:text-lg mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
                Upload a photo. Choose your style. We'll create the masterpiece.
              </p>

              {/* Upload Box */}
              <div
                role="button"
                tabIndex={0}
                aria-label={photo ? 'Change photo' : 'Upload your photo'}
                aria-describedby="upload-help"
                className={`max-w-xl mx-auto bg-white border-2 border-dashed rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-12 mb-4 cursor-pointer shadow-sm transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/30 ${isDragging ? 'border-accent bg-accent/5' : 'border-[#0B5D3B]/20 hover:border-accent'}`}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }}
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
                  className="hidden"
                />

                {preparing ? (
                  <div className="py-10 space-y-4" aria-live="polite">
                    <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-secondary font-semibold">Optimizing your photo…</p>
                  </div>
                ) : photo ? (
                  <div className="relative group">
                    <img src={photo.url} alt="Your photo" className="max-h-64 sm:max-h-80 mx-auto rounded-2xl shadow-xl" decoding="async" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                      <p className="text-white text-xs sm:text-sm font-bold uppercase tracking-widest">Change Image</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent/10 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <HiOutlineUpload className="w-8 h-8 sm:w-10 sm:h-10 text-accent" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-heading font-bold text-secondary">Upload your photo</h2>
                    <p className="text-gray-500 text-sm sm:text-base font-body">or drag & drop here</p>
                  </div>
                )}
              </div>

              <div id="upload-help" className="max-w-xl mx-auto mb-6 sm:mb-8 min-h-[1.5rem] px-2" aria-live="polite">
                {photoError ? (
                  <p className="flex items-start gap-2 text-left text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <HiOutlineExclamationCircle className="w-5 h-5 shrink-0 mt-px" /> {photoError}
                  </p>
                ) : photo ? (
                  <p className="text-sm text-gray-600">
                    Photo ready · {photo.width.toLocaleString()} × {photo.height.toLocaleString()} px
                    {photo.resized && ' · resized for upload, still sharp enough to print'}
                  </p>
                ) : (
                  <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-widest">JPG, PNG or WEBP · at least {MIN_LONG_EDGE} px · big photos are resized automatically</p>
                )}
              </div>

              <button
                onClick={handleContinue}
                disabled={!photo || preparing}
                className={`w-full max-w-xl py-3.5 sm:py-5 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg md:text-xl transition-all font-heading ${
                  !photo || preparing
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-accent hover:bg-accent-dark text-white shadow-xl shadow-accent/20 active:scale-95'
                }`}
              >
                {preparing ? 'Optimizing…' : 'Continue to Customize →'}
              </button>

              {/* Before & After Inspiration Section */}
              <div className="mt-16 max-w-4xl mx-auto border-t border-[#0B5D3B]/5 pt-12 text-left">
                <h3 className="text-center text-xl sm:text-2xl font-heading font-bold mb-6 text-secondary uppercase tracking-wider">See the Transformation</h3>
                <BeforeAfterSection showCTA={false} showTitle={false} compact={true} />
              </div>

              <div className="mt-8 sm:mt-12 space-y-3 sm:space-y-4 px-2">
                <div className="flex flex-wrap items-center justify-center gap-1 text-[#adc140]">
                  <div className="flex">
                    <HiStar className="w-4 h-4 sm:w-5 h-5 fill-current" />
                    <HiStar className="w-4 h-4 sm:w-5 h-5 fill-current" />
                    <HiStar className="w-4 h-4 sm:w-5 h-5 fill-current" />
                    <HiStar className="w-4 h-4 sm:w-5 h-5 fill-current" />
                    <HiStar className="w-4 h-4 sm:w-5 h-5 fill-current" />
                  </div>
                  <span className="text-secondary text-xs sm:text-sm font-bold ml-1sm:ml-2">4.8/5</span>
                  <span className="text-gray-400 text-xs sm:text-sm ml-1 sm:ml-2">from 1500+ happy customers</span>
                </div>
                <p className="text-accent font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] font-body">Premium Quality Guaranteed</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8 sm:space-y-12"
            >
              <div className="text-center px-2">
                 <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold mb-3 sm:mb-4 text-secondary">
                  Customize Your <span className="text-accent">{selectedMaterial.label}</span>
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">Drag your photo to frame it, then pick a material and size — the preview updates as you go.</p>
              </div>

              <button
                onClick={handleChangePhoto}
                className="flex items-center gap-2 text-secondary font-bold hover:text-accent transition-colors uppercase text-[10px] sm:text-xs tracking-widest pl-2"
              >
                <HiOutlineChevronLeft className="w-4 h-4 sm:w-5 h-5" /> Change Photo
              </button>

              {/* Live preview: frame the photo, and see it on a wall */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
                <div className="space-y-3">
                  <div className="relative w-full aspect-square bg-[#0B5D3B]/5 rounded-2xl sm:rounded-[2rem] overflow-hidden">
                    <Cropper
                      image={photo.url}
                      crop={crop}
                      zoom={zoom}
                      aspect={aspect}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                      showGrid={false}
                      objectFit="contain"
                      style={{ cropAreaStyle: { border: '3px solid #fff', boxShadow: '0 0 0 9999em rgba(11, 93, 59, 0.55)' } }}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label htmlFor="crop-zoom" className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#0B5D3B]/60">Zoom</label>
                    <input
                      id="crop-zoom"
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 accent-accent"
                    />
                  </div>
                  <div role="radiogroup" aria-label="Orientation" className="grid grid-cols-2 gap-3">
                    {['portrait', 'landscape'].map((o) => (
                      <button
                        key={o}
                        role="radio"
                        aria-checked={orientation === o}
                        onClick={() => { setOrientation(o); setCrop({ x: 0, y: 0 }); setZoom(1); }}
                        className={`py-2.5 rounded-xl border-2 font-bold text-sm capitalize transition-all ${orientation === o ? 'border-accent bg-accent text-white' : 'border-white bg-white text-secondary hover:border-accent/30 shadow-sm'}`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Drag to reposition · pinch, scroll or use the slider to zoom</p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl sm:rounded-[2rem] bg-[#e9e2d6] aspect-[4/3] flex items-center justify-center p-8" aria-label="Preview on a wall">
                    <div
                      className={`${mockupShadow(selectedMaterial.id, selectedFrame.id)} ${selectedMaterial.id === 'poster' ? 'rounded-[2px]' : ''}`}
                      style={{
                        aspectRatio: `${printSize.width} / ${printSize.height}`,
                        ...(aspect >= 1 ? { width: '80%' } : { height: '100%' }),
                        ...cropBackground(photo.url, cropArea?.percent),
                      }}
                    />
                  </div>
                  <p className="text-center text-sm font-semibold text-secondary">
                    {selectedMaterial.label} · {selectedFrame.label} · {printSize.width} × {printSize.height} in
                  </p>

                  {selectedQuality && (
                    <p className={`flex items-center gap-2 text-sm font-medium border rounded-xl px-4 py-3 ${QUALITY_COPY[selectedQuality].box} ${QUALITY_COPY[selectedQuality].text}`} aria-live="polite">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${QUALITY_COPY[selectedQuality].dot}`} aria-hidden="true" />
                      {QUALITY_COPY[selectedQuality].label}
                    </p>
                  )}

                  {/* Upload status */}
                  <div className="bg-white rounded-xl px-4 py-3 shadow-sm" aria-live="polite">
                    {upload.status === 'uploading' && (
                      <>
                        <div className="flex justify-between text-sm font-semibold text-secondary mb-2">
                          <span>{uploadPercent >= 100 ? 'Finishing up…' : 'Uploading your photo…'}</span>
                          <span>{uploadPercent}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden" role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadPercent}>
                          <div className="h-full bg-accent rounded-full transition-[width] duration-200" style={{ width: `${uploadPercent}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">You can keep choosing your options while this finishes.</p>
                      </>
                    )}
                    {upload.status === 'done' && (
                      <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
                        <HiOutlineCheckCircle className="w-5 h-5" /> Photo uploaded
                      </p>
                    )}
                    {upload.status === 'error' && (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
                          <HiOutlineExclamationCircle className="w-5 h-5 shrink-0" /> {upload.error}
                        </p>
                        <button onClick={() => startUpload(photo.file)} className="flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent-dark">
                          <HiOutlineRefresh className="w-4 h-4" /> Retry upload
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Material Selection */}
              <div className="space-y-3 sm:space-y-4 px-2">
                <h3 className="uppercase text-[10px] sm:text-xs font-bold tracking-[0.2em] text-[#0B5D3B]/60">Select Material</h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {MATERIALS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleMaterialChange(m)}
                      className={`flex items-center justify-center gap-2 sm:gap-3 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border-2 font-bold text-sm sm:text-base transition-all ${
                        selectedMaterial.id === m.id
                        ? 'border-accent bg-accent text-white shadow-lg shadow-accent/20'
                        : 'border-white bg-white text-secondary hover:border-accent/30 shadow-sm'
                      }`}
                    >
                      <m.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${selectedMaterial.id === m.id ? 'text-white' : 'text-accent'}`} /> {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="space-y-3 sm:space-y-4 px-2">
                <h3 className="uppercase text-[10px] sm:text-xs font-bold tracking-[0.2em] text-[#0B5D3B]/60">Select Size (In Inches)</h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {(selectedMaterial.id === 'canvas' ? CANVAS_SIZES : POSTER_SIZES).map(s => {
                    const quality = qualityForSize(s);
                    return (
                      <button
                        key={s.label}
                        onClick={() => setSelectedSize(s)}
                        title={quality ? QUALITY_COPY[quality].label : undefined}
                        className={`relative px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl border-2 font-bold text-xs sm:text-sm md:text-base transition-all flex-1 sm:flex-initial text-center justify-center min-w-[70px] sm:min-w-[100px] ${
                          selectedSize?.label === s.label
                          ? 'border-accent bg-accent text-white shadow-lg shadow-accent/20'
                          : 'border-white bg-white text-secondary hover:border-accent/30 shadow-sm'
                        }`}
                      >
                        {s.label}
                        {quality && (
                          <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${QUALITY_COPY[quality].dot}`} aria-label={QUALITY_COPY[quality].label} />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                  {['great', 'ok', 'low'].map((level) => (
                    <span key={level} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${QUALITY_COPY[level].dot}`} aria-hidden="true" />
                      {{ great: 'Great', ok: 'OK', low: 'Low' }[level]} print quality
                    </span>
                  ))}
                </p>
              </div>

              {/* Frame Selection */}
              <div className="space-y-3 sm:space-y-4 px-2">
                <h3 className="uppercase text-[10px] sm:text-xs font-bold tracking-[0.2em] text-[#0B5D3B]/60">Choose Frame Style</h3>
                <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-3 sm:gap-4 justify-items-center">
                  {(selectedMaterial.id === 'canvas' ? CANVAS_FRAMES : POSTER_FRAMES).map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFrame(f)}
                      className="group flex flex-col items-center gap-2 sm:gap-3"
                    >
                      <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-[2rem] border-2 flex items-center justify-center transition-all ${
                        selectedFrame?.id === f.id
                        ? 'border-accent bg-accent text-white shadow-lg shadow-accent/20'
                        : 'border-white bg-white text-secondary group-hover:border-accent/30 shadow-sm'
                      }`}>
                        <f.icon className={`w-8 h-8 sm:w-10 sm:h-10 ${selectedFrame?.id === f.id ? 'text-white' : 'text-accent'}`} />
                      </div>
                      <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-center leading-tight transition-colors ${
                        selectedFrame?.id === f.id ? 'text-secondary font-extrabold' : 'text-gray-400'
                      }`}>
                        {f.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-3 sm:space-y-4 px-2">
                <h3 className="uppercase text-[10px] sm:text-xs font-bold tracking-[0.2em] text-[#0B5D3B]/60">
                  Notes for Design Team <span className="text-gray-400 lowercase font-normal italic">(optional)</span>
                </h3>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Tell us about color preferences, custom text placements, etc."
                  className="w-full h-28 sm:h-32 bg-white border-2 border-transparent rounded-xl sm:rounded-[2rem] p-4 sm:p-6 focus:outline-none focus:border-accent/30 shadow-sm transition-all text-secondary text-sm sm:text-base"
                />
              </div>

              {/* Enhanced Sticky Price Bar */}
              <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-[#FFF7E7]/80 backdrop-blur-xl border-t border-[#0B5D3B]/5 md:relative md:bg-transparent md:border-none md:p-0">
                <div className="max-w-5xl mx-auto bg-secondary rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 flex flex-row items-center justify-between gap-4 shadow-2xl">
                  <div className="text-left pl-2 sm:pl-4">
                    <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold tracking-[0.2em] sm:tracking-[0.3em]">Total Price</p>
                    <p className="text-2xl sm:text-4xl font-heading font-bold text-accent">₹{total.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={upload.status !== 'done'}
                    className="bg-accent hover:bg-accent-dark disabled:bg-white/15 disabled:text-white/70 disabled:shadow-none disabled:cursor-not-allowed text-white font-bold py-3.5 sm:py-5 px-5 sm:px-12 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-accent/20 font-heading text-sm sm:text-lg"
                  >
                    {upload.status === 'done' ? (
                      <>Add <span className="hidden sm:inline">to Cart</span> <HiOutlineShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" /></>
                    ) : addButtonLabel}
                  </button>
                </div>
              </div>
              <div className="h-24 md:hidden"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CustomizeCanvasPage;
