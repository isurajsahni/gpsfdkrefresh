import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineUpload, HiOutlineCheck, HiOutlineShoppingBag, HiOutlineChevronLeft, HiOutlinePencilAlt, HiStar } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import SEO from '../components/seo/SEO';
import BeforeAfterSection from '../components/home/BeforeAfterSection';

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
];

const POSTER_FRAMES = [
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size < 3 * 1024 * 1024) {
        toast.error('Please upload a high-resolution image (minimum 3MB required)');
        return;
      }
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
    <div className="min-h-screen bg-[#FFF7E7] text-secondary pt-24 sm:pt-28 pb-20 px-4">
      <SEO 
        title="Customize Your Canvas | Turn Photos Into Art" 
        description="Upload your photo and customize your own museum-grade canvas portrait."
      />

      <div className="max-w-4xl mx-auto">
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-heading font-bold mb-4 sm:mb-6 text-secondary leading-tight">
                Turn Your Photos Into <span className="text-accent underline decoration-[#adc140]">Timeless Art</span>
              </h1>
              <p className="text-gray-600 font-body text-base sm:text-lg mb-8 sm:mb-12 max-w-2xl mx-auto px-2">
                Upload a photo. Choose your style. We'll create the masterpiece.
              </p>

              {/* Upload Box */}
              <div 
                className="max-w-xl mx-auto bg-white border-2 border-dashed border-[#0B5D3B]/20 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-12 mb-6 sm:mb-8 cursor-pointer hover:border-accent shadow-sm transition-all"
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
                    <img src={preview} alt="Preview" className="max-h-64 sm:max-h-80 mx-auto rounded-2xl shadow-xl" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                      <p className="text-white text-xs sm:text-sm font-bold uppercase tracking-widest">Change Image</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent/10 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 transform transition-transform group-hover:scale-110">
                      <HiOutlineUpload className="w-8 h-8 sm:w-10 sm:h-10 text-accent" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-heading font-bold text-secondary">Upload your photo</h3>
                    <p className="text-gray-500 text-sm sm:text-base font-body">or drag & drop here</p>
                    <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-widest mt-3 sm:mt-4">JPG, PNG or WEBP · 3 MB TO 10 MB</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`w-full max-w-xl py-3.5 sm:py-5 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg md:text-xl transition-all font-heading ${
                  !file || uploading 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-accent hover:bg-accent-dark text-white shadow-xl shadow-accent/20 active:scale-95'
                }`}
              >
                {uploading ? 'Processing Image...' : 'Continue to Customize →'}
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
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-8 sm:space-y-12"
            >
              <div className="text-center px-2">
                 <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold mb-3 sm:mb-4 text-secondary">
                  Customize Your <span className="text-accent">{selectedMaterial.label}</span>
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">Select your preferences below to see the final look.</p>
              </div>

              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-secondary font-bold hover:text-accent transition-colors uppercase text-[10px] sm:text-xs tracking-widest pl-2"
              >
                <HiOutlineChevronLeft className="w-4 h-4 sm:w-5 h-5" /> Change Photo
              </button>

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
                      <span>{m.icon}</span> {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="space-y-3 sm:space-y-4 px-2">
                <h3 className="uppercase text-[10px] sm:text-xs font-bold tracking-[0.2em] text-[#0B5D3B]/60">Select Size (In Inches)</h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {(selectedMaterial.id === 'canvas' ? CANVAS_SIZES : POSTER_SIZES).map(s => (
                    <button
                      key={s.label}
                      onClick={() => setSelectedSize(s)}
                      className={`px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl border-2 font-bold text-xs sm:text-sm md:text-base transition-all flex-1 sm:flex-initial text-center justify-center min-w-[70px] sm:min-w-[100px] ${
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
              <div className="space-y-3 sm:space-y-4 px-2">
                <h3 className="uppercase text-[10px] sm:text-xs font-bold tracking-[0.2em] text-[#0B5D3B]/60">Choose Frame Style</h3>
                <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-3 sm:gap-4 justify-items-center">
                  {(selectedMaterial.id === 'canvas' ? CANVAS_FRAMES : POSTER_FRAMES).map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFrame(f)}
                      className="group flex flex-col items-center gap-2 sm:gap-3"
                    >
                      <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-[2rem] border-2 flex items-center justify-center text-2xl sm:text-3xl transition-all ${
                        selectedFrame?.id === f.id
                        ? 'border-accent bg-accent text-white shadow-lg shadow-accent/20'
                        : 'border-white bg-white text-secondary group-hover:border-accent/30 shadow-sm'
                      }`}>
                        {f.icon}
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
                <div className="max-w-4xl mx-auto bg-secondary rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 flex flex-row items-center justify-between gap-4 shadow-2xl">
                  <div className="text-left pl-2 sm:pl-4">
                    <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold tracking-[0.2em] sm:tracking-[0.3em]">Total Price</p>
                    <p className="text-2xl sm:text-4xl font-heading font-bold text-accent">₹{total.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="bg-accent hover:bg-accent-dark text-white font-bold py-3.5 sm:py-5 px-5 sm:px-12 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-accent/20 font-heading text-sm sm:text-lg"
                  >
                    Add <span className="hidden sm:inline">to Cart</span> <HiOutlineShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
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
