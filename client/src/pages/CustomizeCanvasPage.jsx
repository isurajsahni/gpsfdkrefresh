import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HiCheck, HiOutlineUpload, HiOutlineShoppingBag, HiOutlineChevronLeft, HiStar,
  HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineRefresh, HiOutlinePhotograph,
  HiOutlineAdjustments, HiOutlineTruck,
} from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import toast from 'react-hot-toast';
import SEO from '../components/seo/SEO';
import IdeaSearch from '../components/customize/IdeaSearch';
import {
  readImageSize, prepareForUpload, uploadCanvasPhoto,
} from '../utils/canvasUpload';
import { CANVAS_SIZES } from '../utils/canvasSizes';
import workFamily from '../assets/image/custom-work/family-portrait.jpg';
import workPeacock from '../assets/image/custom-work/peacock-lotus.jpg';
import workLifeGoals from '../assets/image/custom-work/life-goals.webp';
import workAutumn from '../assets/image/custom-work/autumn-city.webp';
import workBts from '../assets/image/custom-work/bts-poster.webp';
import workKohli from '../assets/image/custom-work/kohli-poster.webp';
import workHanuman from '../assets/image/custom-work/bal-hanuman.jpg';
import workFarmer from '../assets/image/custom-work/farmer-bulls.jpg';

// The "Have an idea?" design search is built but paused until products have
// search keywords; flip this to show it
const SHOW_IDEA_SEARCH = false;

// Pieces we've made from customers' photos, shown under the upload box
const OUR_WORK = [
  { src: workFamily, alt: 'Family photo by the pool, printed on canvas' },
  { src: workHanuman, alt: 'Bal Hanuman in prayer, ringed by Ram naam' },
  { src: workKohli, alt: 'Cricket poster: King Kohli, Run Machine' },
  { src: workAutumn, alt: 'Abstract city with an autumn tree' },
  { src: workFarmer, alt: 'Textured relief of a farmer riding two bulls' },
  { src: workPeacock, alt: 'Peacock feather rising from a glowing lotus' },
  { src: workBts, alt: 'BTS fan poster under a purple galaxy' },
  { src: workLifeGoals, alt: 'Life goals mood board collage' },
];

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

// Posters come on soft board only: sticker (and paper) posters aren't sold
// any more. The server prices a custom order from The Dapper Predator's
// variations, so these must match that product's.
const POSTER_SIZES = [
  { label: 'A4', softBoardPrice: 599 },
  { label: 'A3', softBoardPrice: 999 },
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

// Canvases start on Stretched (ready to hang); Rolled is the cheaper option
const DEFAULT_CANVAS_FRAME = CANVAS_FRAMES.find((f) => f.id === 'stretched');

const POSTER_FRAMES = [
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

// One-line descriptions shown under each choice
const BLURBS = {
  canvas: 'Textured canvas, our signature finish',
  poster: 'Smooth print mounted on soft board',
  rolled: 'Shipped rolled in a tube, ready to frame your way',
  stretched: 'Wrapped on a wooden frame, ready to hang',
  softboard: 'Light, rigid board, ready to hang',
};

// The price of a material in a size and finish
const priceFor = (material, size, frame) => {
  if (!size || !frame) return 0;
  if (material.id === 'canvas') {
    if (size.rolledPrice === undefined) return 0;
    return frame.id === 'rolled' ? size.rolledPrice : size.stretchedPrice;
  }
  if (material.id === 'poster') return size.softBoardPrice ?? 0;
  return 0;
};

const formatRupees = (amount) => `₹${amount.toLocaleString('en-IN')}`;

const STEPS = ['Upload', 'Customize'];

// "1 Upload — 2 Customize", the current step filled in
const StepIndicator = ({ step }) => (
  <ol className="flex items-center justify-center gap-3" aria-label="Progress">
    {STEPS.map((label, i) => {
      const n = i + 1;
      const done = step > n;
      const current = step === n;
      return (
        <li key={label} className="flex items-center gap-3">
          {i > 0 && <span className={`h-px w-8 sm:w-12 ${step >= n ? 'bg-accent' : 'bg-black/10'}`} aria-hidden="true" />}
          <span className="flex items-center gap-2" aria-current={current ? 'step' : undefined}>
            <span
              className={`flex size-6 items-center justify-center rounded-full text-[12px] font-semibold transition-colors ${
                current || done ? 'bg-accent text-white' : 'bg-black/[0.06] text-[#686868]'
              }`}
            >
              {done ? <HiCheck className="size-3.5" /> : n}
            </span>
            <span className={`apple-caption font-semibold ${current ? 'text-[#1D1D1F]' : 'text-[#686868]'}`}>{label}</span>
          </span>
        </li>
      );
    })}
  </ol>
);

// A heading over a group of choices, with the current pick on the right
const OptionGroup = ({ title, value, children }) => (
  <section className="border-t border-black/[0.08] pt-6">
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="apple-body font-semibold text-[#1D1D1F]">{title}</h2>
      {value && <span className="apple-caption text-[#686868]">{value}</span>}
    </div>
    {children}
  </section>
);

// A selectable card: label, optional blurb and price
const OptionCard = ({ active, onClick, icon: Icon, label, blurb, price, className = '' }) => (
  <button
    type="button"
    role="radio"
    aria-checked={active}
    onClick={onClick}
    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all ${
      active
        ? 'border-accent bg-white shadow-[0_4px_16px_rgba(241,90,41,0.16)] ring-1 ring-accent'
        : 'border-black/[0.1] bg-white hover:border-black/25'
    } ${className}`}
  >
    {Icon && <Icon className={`mt-0.5 size-6 shrink-0 ${active ? 'text-accent' : 'text-[#686868]'}`} />}
    <span className="min-w-0 flex-1">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[15px] font-semibold text-[#1D1D1F]">{label}</span>
        {price != null && <span className="text-[14px] text-[#1D1D1F]">{price}</span>}
      </span>
      {blurb && <span className="apple-caption mt-0.5 block text-[#686868]">{blurb}</span>}
    </span>
  </button>
);

// The photo hung on a softly lit wall, in the chosen finish
const WallPreview = ({ src, shadow, poster }) => (
  <div
    className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-3xl px-[14%] pb-[22%] pt-[12%] sm:aspect-square"
    style={{ background: 'linear-gradient(180deg, #EFE8DC 0%, #E7DECF 100%)' }}
    aria-label="Preview on a wall"
  >
    <div
      className="pointer-events-none absolute inset-0"
      style={{ background: 'radial-gradient(ellipse 55% 45% at 50% 42%, rgba(255,250,240,0.9), transparent 70%)' }}
    />
    <div className="absolute inset-x-0 bottom-0 h-[9%] bg-gradient-to-b from-[#C9A27E] to-[#B48B66]" />
    <div className="absolute inset-x-0 bottom-[9%] h-[1.2%] bg-[#F7F3EC]" />
    <img
      src={src}
      alt="Your photo on the wall"
      decoding="async"
      className={`relative max-h-full max-w-full object-contain transition-shadow duration-300 ${shadow} ${poster ? 'rounded-[2px]' : 'rounded-[3px]'}`}
    />
  </div>
);

// How each finish sits on the wall in the preview
const mockupShadow = (materialId, frameId) => {
  if (materialId === 'canvas' && frameId === 'stretched') return 'shadow-[4px_6px_0_rgba(0,0,0,0.18),0_18px_30px_rgba(0,0,0,0.28)]';
  if (materialId === 'poster' && frameId === 'softboard') return 'shadow-[2px_3px_0_rgba(0,0,0,0.15),0_10px_20px_rgba(0,0,0,0.2)]';
  return 'shadow-[0_6px_16px_rgba(0,0,0,0.2)]';
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
  const [selectedFrame, setSelectedFrame] = useState(DEFAULT_CANVAS_FRAME);
  const [instructions, setInstructions] = useState('');

  // Handle Material Switching Robustly
  const handleMaterialChange = (material) => {
    setSelectedMaterial(material);
    if (material.id === 'canvas') {
      setSelectedSize(CANVAS_SIZES[0]);
      setSelectedFrame(DEFAULT_CANVAS_FRAME);
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
      const prepared = await prepareForUpload(selectedFile, size);
      setPhoto({ ...prepared, url: URL.createObjectURL(prepared.file) });
      return true;
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

  // A photo handed over by the Store page's "Make it yours" preview, with the
  // size and finish chosen there: open on the customize step.
  // The state is cleared at once so a reload or Back doesn't replay it.
  const location = useLocation();
  const navigate = useNavigate();
  const handoffRef = useRef(location.state?.photo instanceof File ? location.state : null);
  const [autoContinue, setAutoContinue] = useState(false);
  useEffect(() => {
    const handoff = handoffRef.current;
    if (!handoff) return;
    handoffRef.current = null;
    navigate(location.pathname, { replace: true, state: null });
    handleFile(handoff.photo).then((ok) => {
      if (!ok) return;
      const size = CANVAS_SIZES.find((s) => s.label === handoff.size);
      if (size) setSelectedSize(size);
      const frame = CANVAS_FRAMES.find((f) => f.id === handoff.frame);
      if (frame) setSelectedFrame(frame);
      setAutoContinue(true);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!autoContinue || !photo) return;
    setAutoContinue(false);
    handleContinue();
  }, [autoContinue, photo]); // eslint-disable-line react-hooks/exhaustive-deps

  const getPrice = () => priceFor(selectedMaterial, selectedSize, selectedFrame);

  // The photo is printed whole, as uploaded, and we set the exact print
  // dimensions for the chosen size ourselves
  const handleAddToCart = () => {
    if (upload.status !== 'done') return;
    const imageUrl = upload.url;

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

    addToCart(product, variation, 1, instructions, imageUrl, {
      originalImageUrl: upload.url,
    });
    setIsCartOpen(true);
    toast.success('Added to cart!');
  };

  const total = getPrice();
  const uploadPercent = Math.round(upload.progress * 100);
  const sizes = selectedMaterial.id === 'canvas' ? CANVAS_SIZES : POSTER_SIZES;
  const frames = selectedMaterial.id === 'canvas' ? CANVAS_FRAMES : POSTER_FRAMES;
  const fromPrice = {
    canvas: Math.min(...CANVAS_SIZES.map((s) => s.rolledPrice)),
    poster: Math.min(...POSTER_SIZES.map((s) => s.softBoardPrice)),
  };

  const addButtonLabel = {
    idle: 'Add to Cart',
    uploading: uploadPercent >= 100 ? 'Finishing upload…' : `Uploading ${uploadPercent}%`,
    error: 'Upload failed',
    done: 'Add to Cart',
  }[upload.status];

  const addButton = (className = '') => (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={upload.status !== 'done'}
      className={`flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-[17px] font-semibold text-white transition-all hover:bg-accent-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-[#686868] ${className}`}
    >
      {upload.status === 'done' && <HiOutlineShoppingBag className="size-5" />}
      {addButtonLabel}
    </button>
  );

  return (
    <div className="store-apple min-h-screen bg-white pb-24 pt-[100px] text-[#1D1D1F] lg:pb-20">
      <SEO
        title="Customize Your Canvas | Turn Photos Into Art"
        description="Upload your photo and customize your own museum-grade canvas portrait."
      />

      <div className="section-padding">
        <div className="mx-auto max-w-[1200px]">
          <StepIndicator step={step} />

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* ─── Upload: the pitch on the left, the drop zone on the right ─── */}
                <div className="mt-10 grid grid-cols-1 items-center gap-10 sm:mt-14 lg:grid-cols-[5fr_6fr] lg:gap-16">
                  <div className="text-center lg:text-left">
                    <p className="apple-eyebrow uppercase text-accent">Customize</p>
                    <h1 className="mt-3 font-heading text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[56px]">
                      Your photo,
                      <br />
                      <span className="text-accent">made into art.</span>
                    </h1>
                    <p className="apple-body mx-auto mt-5 max-w-md text-[#686868] lg:mx-0">
                      Upload a photo, pick a size and finish, and we'll print it on canvas or poster, sized exactly for your wall.
                    </p>
                    <p className="apple-body mt-5 font-semibold">
                      Canvas from {formatRupees(fromPrice.canvas)}
                      <span className="mx-2 text-black/20">·</span>
                      Posters from {formatRupees(fromPrice.poster)}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                      <span className="flex text-[#F5A623]" aria-hidden="true">
                        {[0, 1, 2, 3, 4].map((n) => <HiStar key={n} className="size-4" />)}
                      </span>
                      <span className="apple-caption font-semibold">4.8/5</span>
                      <span className="apple-caption text-[#686868]">from 1500+ happy customers</span>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-[#F5F5F7] p-4 sm:p-6">
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={photo ? 'Change photo' : 'Upload your photo'}
                      aria-describedby="upload-help"
                      className={`group relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-white p-6 text-center transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/30 sm:min-h-[400px] ${
                        isDragging ? 'border-accent bg-accent/5' : 'border-black/[0.12] hover:border-accent/60'
                      }`}
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
                        <div className="space-y-4" aria-live="polite">
                          <div className="mx-auto size-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                          <p className="apple-body font-semibold">Getting your photo ready…</p>
                        </div>
                      ) : photo ? (
                        <>
                          <img src={photo.url} alt="Your photo" className="max-h-[300px] max-w-full rounded-xl object-contain shadow-[0_12px_32px_rgba(0,0,0,0.18)] sm:max-h-[360px]" decoding="async" />
                          <span className="apple-caption absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-[#1D1D1F]/80 px-3 py-1.5 font-semibold text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                            Change photo
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="flex size-16 items-center justify-center rounded-2xl bg-accent/10">
                            <HiOutlineUpload className="size-8 text-accent" />
                          </span>
                          <p className="apple-tile-title mt-5 font-heading">Upload your photo</p>
                          <p className="apple-body mt-1 text-[#686868]">Click to choose, or drag and drop it here</p>
                          <p className="apple-caption mt-4 text-[#686868]">JPG, PNG or WEBP · big photos are resized automatically</p>
                        </>
                      )}
                    </div>

                    <div id="upload-help" className="mt-3 min-h-[1.25rem] px-1" aria-live="polite">
                      {photoError ? (
                        <p className="apple-caption flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                          <HiOutlineExclamationCircle className="mt-px size-4 shrink-0" /> {photoError}
                        </p>
                      ) : photo ? (
                        <p className="apple-caption flex items-center gap-1.5 text-green-700">
                          <HiOutlineCheckCircle className="size-4" /> Photo ready
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={handleContinue}
                      disabled={!photo || preparing}
                      className="mt-3 w-full rounded-full bg-accent px-6 py-3.5 text-[17px] font-semibold text-white transition-all hover:bg-accent-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-[#686868]"
                    >
                      {preparing ? 'Getting it ready…' : 'Continue to customize'}
                    </button>
                  </div>
                </div>

                {/* ─── Have an idea: search the catalogue instead of uploading ─── */}
                {SHOW_IDEA_SEARCH && (
                  <IdeaSearch
                    onUploadInstead={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      fileInputRef.current?.click();
                    }}
                  />
                )}

                {/* ─── Our work: canvases made from customers' photos ─── */}
                <div className="mt-20 sm:mt-24">
                  <h2 className="apple-headline font-heading">
                    Our work. <span className="text-[#686868]">Made from our customers' photos.</span>
                  </h2>
                  {/* An endless row: the list runs twice and slides by half its
                      width, so the second copy takes over seamlessly */}
                  <div className="mt-8 overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,white_6%,white_94%,transparent)] motion-reduce:overflow-x-auto">
                    <ul className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none" style={{ animationDuration: '45s' }}>
                      {[...OUR_WORK, ...OUR_WORK].map(({ src, alt }, i) => (
                        <li key={i} aria-hidden={i >= OUR_WORK.length || undefined} className="shrink-0 pr-4 sm:pr-5">
                          <img
                            src={src}
                            alt={i < OUR_WORK.length ? alt : ''}
                            decoding="async"
                            className="h-72 w-auto rounded-2xl bg-[#F5F5F7] shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:h-96"
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* ─── How it works ─── */}
                <div className="mt-20 sm:mt-24">
                  <h2 className="apple-headline font-heading">
                    How it works. <span className="text-[#686868]">Three simple steps.</span>
                  </h2>
                  <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
                    {[
                      { icon: HiOutlinePhotograph, title: 'Upload your photo', text: 'Any photo from your phone or camera.' },
                      { icon: HiOutlineAdjustments, title: 'Pick a size and finish', text: 'Canvas or poster, rolled or ready to hang.' },
                      { icon: HiOutlineTruck, title: 'We print and deliver', text: 'We size it exactly and ship it to your door.' },
                    ].map(({ icon: Icon, title, text }, i) => (
                      <li key={title} className="rounded-3xl bg-[#F5F5F7] p-6 sm:p-7">
                        <div className="flex items-center justify-between">
                          <Icon className="size-7 text-accent" />
                          <span className="apple-caption font-semibold text-[#686868]">0{i + 1}</span>
                        </div>
                        <p className="apple-tile-title mt-6 font-heading">{title}</p>
                        <p className="apple-body mt-1.5 text-[#686868]">{text}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="mt-10 grid grid-cols-1 items-start gap-8 sm:mt-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14"
              >
                {/* ─── Preview: stays in view while the options scroll on desktop ─── */}
                <div className="lg:sticky lg:top-24">
                  <WallPreview
                    src={photo.url}
                    shadow={mockupShadow(selectedMaterial.id, selectedFrame.id)}
                    poster={selectedMaterial.id === 'poster'}
                  />
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleChangePhoto}
                      className="apple-caption flex items-center gap-1 font-semibold text-[#1D1D1F] transition-colors hover:text-accent"
                    >
                      <HiOutlineChevronLeft className="size-4" /> Change photo
                    </button>

                    {/* Upload status */}
                    <div aria-live="polite" className="apple-caption">
                      {upload.status === 'uploading' && (
                        <div className="flex items-center gap-2 text-[#686868]">
                          <span>{uploadPercent >= 100 ? 'Finishing up…' : `Uploading ${uploadPercent}%`}</span>
                          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-black/[0.08]" role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadPercent}>
                            <span className="block h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${uploadPercent}%` }} />
                          </span>
                        </div>
                      )}
                      {upload.status === 'done' && (
                        <p className="flex items-center gap-1.5 font-semibold text-green-700">
                          <HiOutlineCheckCircle className="size-4" /> Photo uploaded
                        </p>
                      )}
                      {upload.status === 'error' && (
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="flex items-center gap-1.5 font-semibold text-red-700">
                            <HiOutlineExclamationCircle className="size-4 shrink-0" /> {upload.error}
                          </p>
                          <button type="button" onClick={() => startUpload(photo.file)} className="flex items-center gap-1 font-semibold text-accent hover:text-accent-dark">
                            <HiOutlineRefresh className="size-4" /> Retry
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {upload.status === 'uploading' && (
                    <p className="apple-caption mt-1 text-right text-[#686868]">You can keep choosing while this finishes.</p>
                  )}
                </div>

                {/* ─── Options ─── */}
                <div>
                  <p className="apple-eyebrow uppercase text-accent">Custom {selectedMaterial.label.toLowerCase()}</p>
                  <h1 className="mt-2 font-heading text-[32px] font-semibold leading-[1.1] tracking-[-0.01em] sm:text-[40px]">
                    Make it yours.
                  </h1>
                  <p className="mt-3 text-[28px] font-semibold tracking-tight">{formatRupees(total)}</p>
                  <p className="apple-caption mt-1 text-[#686868]">
                    {selectedMaterial.label} · {selectedFrame.label} · {selectedSize.label}
                  </p>

                  <div className="mt-6 space-y-6">
                    <OptionGroup title="Material">
                      <div role="radiogroup" aria-label="Material" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                        {MATERIALS.map((m) => (
                          <OptionCard
                            key={m.id}
                            active={selectedMaterial.id === m.id}
                            onClick={() => handleMaterialChange(m)}
                            icon={m.icon}
                            label={m.label}
                            blurb={BLURBS[m.id]}
                          />
                        ))}
                      </div>
                    </OptionGroup>

                    <OptionGroup title="Size" value="In inches">
                      <div role="radiogroup" aria-label="Size" className="grid grid-cols-3 gap-2.5">
                        {sizes.map((s) => {
                          const active = selectedSize?.label === s.label;
                          return (
                            <button
                              key={s.label}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setSelectedSize(s)}
                              className={`rounded-2xl border px-2 py-3 text-center transition-all ${
                                active
                                  ? 'border-accent bg-white shadow-[0_4px_16px_rgba(241,90,41,0.16)] ring-1 ring-accent'
                                  : 'border-black/[0.1] bg-white hover:border-black/25'
                              }`}
                            >
                              <span className={`block text-[15px] font-semibold ${active ? 'text-accent' : 'text-[#1D1D1F]'}`}>{s.label}</span>
                              <span className="apple-caption block text-[#686868]">{formatRupees(priceFor(selectedMaterial, s, selectedFrame))}</span>
                            </button>
                          );
                        })}
                      </div>
                    </OptionGroup>

                    <OptionGroup title="Finish">
                      <div role="radiogroup" aria-label="Finish" className="space-y-2.5">
                        {frames.map((f) => (
                          <OptionCard
                            key={f.id}
                            active={selectedFrame?.id === f.id}
                            onClick={() => setSelectedFrame(f)}
                            icon={f.icon}
                            label={f.label}
                            blurb={BLURBS[f.id]}
                            price={formatRupees(priceFor(selectedMaterial, selectedSize, f))}
                          />
                        ))}
                      </div>
                    </OptionGroup>

                    <OptionGroup title="Notes for our design team" value="Optional">
                      <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Colour preferences, text to add, anything we should know"
                        className="apple-body h-28 w-full resize-none rounded-2xl border border-black/[0.1] bg-white p-4 text-[#1D1D1F] placeholder:text-[#686868]/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </OptionGroup>

                    <div className="hidden border-t border-black/[0.08] pt-6 lg:block">
                      {addButton('w-full')}
                    </div>
                  </div>
                </div>

                {/* Phones and tablets: price and Add to Cart pinned to the bottom */}
                <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/[0.08] bg-white/90 px-4 py-3 backdrop-blur-xl lg:hidden">
                  <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
                    <div>
                      <p className="text-[22px] font-semibold leading-none tracking-tight">{formatRupees(total)}</p>
                      <p className="apple-caption mt-1 text-[#686868]">{selectedFrame.label} · {selectedSize.label}</p>
                    </div>
                    {addButton('min-w-[150px]')}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CustomizeCanvasPage;
