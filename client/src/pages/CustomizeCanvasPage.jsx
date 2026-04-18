import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineUpload, HiOutlineCheck, HiOutlineShoppingBag, HiOutlineChevronLeft, HiOutlinePencilAlt, HiStar } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import SEO from '../components/seo/SEO';

const MATERIALS = [
  { id: 'canvas', label: 'Canvas', icon: '🎨' },
  { id: 'poster', label: 'Poster', icon: '📄' },
];

const CANVAS_SIZES = [
  { label: '12 x 18', rolledPrice: 999, stretchedPrice: 1499 },
  { label: '18 x 24', rolledPrice: 1499, stretchedPrice: 2499 },
  { label: '24 x 36', rolledPrice: 2899, stretchedPrice: 3696 },
  { label: '30 x 48', rolledPrice: 4199, stretchedPrice: 5999 },
  { label: '36 x 60', rolledPrice: 5999, stretchedPrice: 7999 },
];

const POSTER_SIZES = [
  { label: 'A4', paperPrice: 99, stickerPrice: 149, softBoardPrice: 599 },
  { label: 'A3', paperPrice: 199, stickerPrice: 299, softBoardPrice: 999 },
];

const CANVAS_FRAMES = [
  { id: 'rolled', label: 'Rolled', icon: '🕳️' },
  { id: 'stretched', label: 'Stretched', icon: '⬜' },
  { id: 'black', label: 'Black Frame', icon: '🖼️', premium: 800 },
  { id: 'white', label: 'White Frame', icon: '🖼️', premium: 800 },
  { id: 'darkwood', label: 'Dark Wood Frame', icon: '🪵', premium: 1000 },
];

const POSTER_FRAMES = [
  { id: 'paper', label: 'Paper', icon: '📄' },
  { id: 'sticker', label: 'Sticker', icon: '🏷️' },
  { id: 'softboard', label: 'Soft Board', icon: '🧱' },
];

const CustomizeCanvasPage = () => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Customize
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  
  const [selectedMaterial, setSelectedMaterial] = useState(MATERIALS[0]);
  const [selectedSize, setSelectedSize] = useState(CANVAS_SIZES[0]);
  const [selectedFrame, setSelectedFrame] = useState(CANVAS_FRAMES[0]);
  const [instructions, setInstructions] = useState('');

  // Set defaults on material change
  useEffect(() => {
    if (selectedMaterial.id === 'canvas') {
      setSelectedSize(CANVAS_SIZES[0]);
      setSelectedFrame(CANVAS_FRAMES[0]);
    } else {
      setSelectedSize(POSTER_SIZES[0]);
      setSelectedFrame(POSTER_FRAMES[0]);
    }
  }, [selectedMaterial]);
  
  const { addToCart } = useCart();
  const { setIsCartOpen } = useUI();
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit');
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select an image first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await API.post('/upload/canvas', formData);
      setUploadedUrl(data.url);
      setStep(2);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getPrice = () => {
    if (!selectedSize || !selectedFrame) return 0;

    if (selectedMaterial.id === 'canvas') {
      let basePrice = selectedFrame.id === 'rolled' ? selectedSize.rolledPrice : selectedSize.stretchedPrice;
      if (['black', 'white', 'darkwood'].includes(selectedFrame.id)) {
        basePrice = selectedSize.stretchedPrice + (selectedFrame.premium || 0);
      }
      return basePrice;
    } else {
      if (selectedFrame.id === 'sticker') return selectedSize.stickerPrice;
      if (selectedFrame.id === 'softboard') return selectedSize.softBoardPrice;
      return selectedSize.paperPrice;
    }
  };

  const handleAddToCart = () => {
    const product = {
      _id: 'custom-canvas-id',
      name: `Custom ${selectedMaterial.label}`,
      slug: 'custom-canvas',
      images: [{ url: uploadedUrl }],
      category: { slug: 'wall-canvas', name: 'Wall Canvas' }
    };

    const variation = {
      material: selectedMaterial.label,
      size: selectedSize.label,
      frame: selectedFrame.label,
      price: getPrice()
    };

    addToCart(product, variation, 1, instructions, uploadedUrl);
    setIsCartOpen(true);
    toast.success('Added to cart!');
  };

  const total = getPrice();

  return (
    <div className="min-h-screen bg-[#FFF7E7] text-secondary pt-28 pb-20 px-4">
      <SEO 
        title="Customize Your Canvas | Turn Photos Into Art" 
        description="Upload your photo and customize your own museum-grade canvas portrait."
      />

      <div className="max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="flex items-center justify-center gap-4 mb-12 text-sm font-medium tracking-[0.2em] font-body uppercase">
          <span className={`${step >= 1 ? 'text-accent' : 'text-gray-400'} transition-colors`}>Step 1: Upload</span>
          <span className="text-gray-300">/</span>
          <span className={`${step >= 2 ? 'text-accent' : 'text-gray-400'} transition-colors`}>Step 2: Customize</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 text-secondary leading-tight">
                Turn Your Photos Into <br /> <span className="text-accent underline decoration-[#adc140]">Timeless Art</span>
              </h1>
              <p className="text-gray-600 font-body text-lg mb-12 max-w-2xl mx-auto">
                Upload a photo. Choose your style. We'll create the masterpiece.
              </p>

              {/* Upload Box */}
              <div 
                className="max-w-xl mx-auto bg-white border-2 border-dashed border-[#0B5D3B]/20 rounded-[2.5rem] p-12 mb-8 cursor-pointer hover:border-accent shadow-sm transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                {preview ? (
                  <div className="relative group">
                    <img src={preview} alt="Preview" className="max-h-80 mx-auto rounded-2xl shadow-xl" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                      <p className="text-white text-sm font-bold uppercase tracking-widest">Change Image</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-6 transform transition-transform group-hover:scale-110">
                      <HiOutlineUpload className="w-10 h-10 text-accent" />
                    </div>
                    <h3 className="text-2xl font-heading font-bold text-secondary">Upload your photo</h3>
                    <p className="text-gray-500 font-body">or drag & drop here</p>
                    <p className="text-gray-400 text-xs uppercase tracking-widest mt-4">JPG, PNG or WEBP · Max 10 MB</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`w-full max-w-xl py-5 px-8 rounded-2xl font-bold text-xl transition-all font-heading ${
                  !file || uploading 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-accent hover:bg-accent-dark text-white shadow-xl shadow-accent/20 active:scale-95'
                }`}
              >
                {uploading ? 'Processing Image...' : 'Continue to Customize →'}
              </button>

              <div className="mt-12 space-y-4">
                <div className="flex items-center justify-center gap-1 text-[#adc140]">
                  <HiStar className="w-5 h-5 fill-current" />
                  <HiStar className="w-5 h-5 fill-current" />
                  <HiStar className="w-5 h-5 fill-current" />
                  <HiStar className="w-5 h-5 fill-current" />
                  <HiStar className="w-5 h-5 fill-current" />
                  <span className="text-secondary font-bold ml-2">4.8/5</span>
                  <span className="text-gray-400 text-sm ml-2">from 1500+ happy customers</span>
                </div>
                <p className="text-accent font-bold text-xs uppercase tracking-[0.2em] font-body">Premium Quality Guaranteed</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-12"
            >
              <div className="text-center">
                 <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-secondary">
                  Customize Your <span className="text-accent">{selectedMaterial.label}</span>
                </h1>
                <p className="text-gray-600">Select your preferences below to see the final look.</p>
              </div>

              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-secondary font-bold hover:text-accent transition-colors uppercase text-xs tracking-widest"
              >
                <HiOutlineChevronLeft className="w-5 h-5" /> Change Photo
              </button>

              {/* Material Selection */}
              <div className="space-y-4">
                <h3 className="uppercase text-xs font-bold tracking-[0.2em] text-[#0B5D3B]/60">Select Material</h3>
                <div className="flex gap-4">
                  {MATERIALS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMaterial(m)}
                      className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 font-bold transition-all ${
                        selectedMaterial.id === m.id
                        ? 'border-accent bg-accent text-white shadow-lg shadow-accent/20'
                        : 'border-white bg-white text-secondary hover:border-accent/30 shadow-sm'
                      }`}
                    >
                      <span>{m.icon}</span> {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="space-y-4">
                <h3 className="uppercase text-xs font-bold tracking-[0.2em] text-[#0B5D3B]/60">Select Size (In Inches)</h3>
                <div className="flex flex-wrap gap-3">
                  {(selectedMaterial.id === 'canvas' ? CANVAS_SIZES : POSTER_SIZES).map(s => (
                    <button
                      key={s.label}
                      onClick={() => setSelectedSize(s)}
                      className={`px-8 py-4 rounded-2xl border-2 font-bold transition-all ${
                        selectedSize?.label === s.label
                        ? 'border-accent bg-accent text-white shadow-lg shadow-accent/20'
                        : 'border-white bg-white text-secondary hover:border-accent/30 shadow-sm'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Selection */}
              <div className="space-y-4">
                <h3 className="uppercase text-xs font-bold tracking-[0.2em] text-[#0B5D3B]/60">Choose Frame Style</h3>
                <div className="flex flex-wrap gap-4">
                  {(selectedMaterial.id === 'canvas' ? CANVAS_FRAMES : POSTER_FRAMES).map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFrame(f)}
                      className="group flex flex-col items-center gap-3"
                    >
                      <div className={`w-24 h-24 rounded-[2rem] border-2 flex items-center justify-center text-3xl transition-all ${
                        selectedFrame?.id === f.id
                        ? 'border-accent bg-accent text-white shadow-lg shadow-accent/20'
                        : 'border-white bg-white text-secondary group-hover:border-accent/30 shadow-sm'
                      }`}>
                        {f.icon}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest text-center leading-tight transition-colors ${
                        selectedFrame?.id === f.id ? 'text-secondary font-extrabold' : 'text-gray-400'
                      }`}>
                        {f.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-4">
                <h3 className="uppercase text-xs font-bold tracking-[0.2em] text-[#0B5D3B]/60">
                  Notes for Design Team <span className="text-gray-400 lowercase font-normal italic">(optional)</span>
                </h3>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Tell us about color preferences, custom text placements, etc."
                  className="w-full h-32 bg-white border-2 border-transparent rounded-[2rem] p-6 focus:outline-none focus:border-accent/30 shadow-sm transition-all text-secondary"
                />
              </div>

              {/* Enhanced Sticky Price Bar */}
              <div className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-[#FFF7E7]/80 backdrop-blur-xl border-t border-[#0B5D3B]/5 md:relative md:bg-transparent md:border-none md:p-0">
                <div className="max-w-4xl mx-auto bg-secondary rounded-[2.5rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
                  <div className="text-center sm:text-left sm:pl-4">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-[0.3em]">Total Value</p>
                    <p className="text-4xl font-heading font-bold text-accent">₹{total.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="w-full sm:w-auto bg-accent hover:bg-accent-dark text-white font-bold py-5 px-12 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-accent/20 font-heading text-lg"
                  >
                    Add to Cart <HiOutlineShoppingBag className="w-6 h-6" />
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
