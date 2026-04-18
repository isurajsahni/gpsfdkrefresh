import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineUpload, HiOutlineCheck, HiOutlineShoppingBag, HiOutlineChevronLeft, HiOutlinePencilAlt, HiStar } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import SEO from '../components/seo/SEO';

const SIZES = [
  { label: '12 x 18', price: 2500 },
  { label: '18 x 24', price: 3500 },
  { label: '20 x 30', price: 4500 },
  { label: '24 x 36', price: 6000 },
  { label: '30 x 40', price: 8500 },
  { label: '36 x 48', price: 12000 },
  { label: '48 x 66', price: 18000 },
];

const FRAMES = [
  { id: 'rolled', label: 'Without Frame (Rolled)', price: 0, icon: '🕳️' },
  { id: 'stretched', label: 'Stretched Canvas', price: 500, icon: '⬜' },
  { id: 'black', label: 'Black Frame', price: 800, icon: '🖼️' },
  { id: 'white', label: 'White Frame', price: 800, icon: '🖼️' },
  { id: 'darkwood', label: 'Dark Wood Frame', price: 1000, icon: '🪵' },
];

const CustomizeCanvasPage = () => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Customize
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);
  const [selectedFrame, setSelectedFrame] = useState(FRAMES[0]);
  const [instructions, setInstructions] = useState('');
  
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

  const handleAddToCart = () => {
    const product = {
      _id: 'custom-canvas-id', // Placeholder or fetch actual product
      name: 'Custom Portrait Canvas',
      slug: 'custom-canvas',
      images: [{ url: uploadedUrl }]
    };

    const variation = {
      size: selectedSize.label,
      frame: selectedFrame.label,
      price: selectedSize.price + selectedFrame.price
    };

    addToCart(product, variation, 1, instructions, uploadedUrl);
    setIsCartOpen(true);
    toast.success('Added to cart!');
  };

  const total = selectedSize.price + selectedFrame.price;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-28 pb-20 px-4">
      <SEO 
        title="Customize Your Canvas | Turn Photos Into Art" 
        description="Upload your photo and customize your own museum-grade canvas portrait."
      />

      <div className="max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="flex items-center justify-center gap-4 mb-12 text-sm font-medium tracking-wider">
          <span className={`${step >= 1 ? 'text-accent' : 'text-gray-500'} transition-colors`}>Upload</span>
          <span className="text-gray-700">›</span>
          <span className={`${step >= 2 ? 'text-accent' : 'text-gray-500'} transition-colors`}>Customize</span>
          <span className="text-gray-700">›</span>
          <span className="text-gray-500">Order Print</span>
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
              <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6">
                Turn Your Photos Into <br /> <span className="text-white">Timeless Art</span>
              </h1>
              <p className="text-gray-400 mb-12">
                Upload a photo. Choose your style. We'll create the masterpiece.
              </p>

              {/* Upload Box */}
              <div 
                className="max-w-xl mx-auto bg-[#1a1a1a] border-2 border-dashed border-gray-800 rounded-[2rem] p-12 mb-8 cursor-pointer hover:border-accent/50 transition-colors"
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
                    <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-xl shadow-2xl" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                      <p className="text-sm font-bold">Change Image</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-[#262626] rounded-full flex items-center justify-center mx-auto mb-6">
                      <HiOutlineUpload className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold">Upload one or more photos</h3>
                    <p className="text-gray-500 text-sm">or drag & drop here</p>
                    <p className="text-gray-600 text-xs">JPG or PNG · Max 10 MB</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`w-full max-w-xl py-5 px-8 rounded-full font-bold text-lg transition-all ${
                  !file || uploading 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-[#4a5a1f] hover:bg-[#5a6a2f] text-white shadow-lg shadow-black/20'
                }`}
              >
                {uploading ? 'Uploading...' : 'Continue to Customize'}
              </button>

              <div className="mt-12 space-y-4">
                <div className="flex items-center justify-center gap-1 text-accent">
                  <HiStar className="w-5 h-5 fill-current" />
                  <HiStar className="w-5 h-5 fill-current" />
                  <HiStar className="w-5 h-5 fill-current" />
                  <HiStar className="w-5 h-5 fill-current" />
                  <HiStar className="w-5 h-5 fill-current" />
                  <span className="text-white font-bold ml-2">4.8</span>
                  <button className="text-gray-400 underline text-sm ml-2">Read Reviews</button>
                </div>
                <p className="text-gray-500 text-sm italic">Over 1 Lakh Portraits Made</p>
              </div>

              {/* Sample Images */}
              <div className="grid grid-cols-3 gap-4 mt-16 max-w-2xl mx-auto opacity-70">
                <div className="aspect-[3/4] rounded-2xl bg-gray-900 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400" alt="Sample 1" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[3/4] rounded-2xl bg-gray-900 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400" alt="Sample 2" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[3/4] rounded-2xl bg-gray-900 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400" alt="Sample 3" className="w-full h-full object-cover" />
                </div>
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
                <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6">
                  Turn Your Photos Into <br /> <span className="text-white">Timeless Art</span>
                </h1>
                <p className="text-gray-400">
                  Upload a photo. Choose your style. We'll create the masterpiece.
                </p>
              </div>

              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <HiOutlineChevronLeft className="w-5 h-5" /> Back
              </button>

              {/* Selected Image Info */}
              <div className="bg-[#1a1a1a] rounded-2xl p-4 flex items-center justify-between border border-gray-800">
                <div className="flex items-center gap-4">
                  <img src={preview} alt="Thumb" className="w-12 h-12 rounded object-cover" />
                  <span className="font-medium truncate max-w-[200px]">{file?.name}</span>
                </div>
                <button 
                  onClick={() => setStep(1)}
                  className="text-accent text-sm font-bold flex items-center gap-1"
                >
                  <HiOutlinePencilAlt className="w-4 h-4" /> Edit
                </button>
              </div>

              {/* Size Selection */}
              <div className="space-y-4">
                <h3 className="uppercase text-sm font-bold tracking-[0.1em] text-gray-500">Size (In Inches)</h3>
                <div className="flex flex-wrap gap-3">
                  {SIZES.map(s => (
                    <button
                      key={s.label}
                      onClick={() => setSelectedSize(s)}
                      className={`px-6 py-3 rounded-full border-2 transition-all ${
                        selectedSize.label === s.label
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-gray-800 text-gray-500 hover:border-gray-600'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Selection */}
              <div className="space-y-4">
                <h3 className="uppercase text-sm font-bold tracking-[0.1em] text-gray-500">Frame</h3>
                <div className="flex flex-wrap gap-4">
                  {FRAMES.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFrame(f)}
                      className="group flex flex-col items-center gap-2"
                    >
                      <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex items-center justify-center text-3xl transition-all ${
                        selectedFrame.id === f.id
                        ? 'border-accent bg-accent/10'
                        : 'border-gray-800 bg-[#1a1a1a] group-hover:border-gray-600'
                      }`}>
                        {f.icon}
                      </div>
                      <span className={`text-[10px] sm:text-xs font-bold w-20 sm:w-24 text-center leading-tight transition-colors ${
                        selectedFrame.id === f.id ? 'text-white' : 'text-gray-500'
                      }`}>
                        {f.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-4">
                <h3 className="uppercase text-sm font-bold tracking-[0.1em] text-gray-500">
                  Special Instructions <span className="text-gray-700 capitalize font-normal">(optional)</span>
                </h3>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="E.g., 'Add a crown', 'Use warm tones', 'Include both pets in one frame'..."
                  className="w-full h-32 bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              {/* Sticky Price Bar */}
              <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/80 backdrop-blur-xl border-t border-gray-800 md:relative md:bg-transparent md:border-none md:p-0">
                <div className="max-w-4xl mx-auto bg-[#1a1a1a] rounded-[2rem] p-4 flex items-center justify-between border border-gray-800 shadow-2xl">
                  <div className="pl-4">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Total</p>
                    <p className="text-3xl font-bold">₹{total.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="bg-[#adc140] hover:bg-[#bdcf50] text-black font-bold py-4 px-8 sm:px-12 rounded-2xl transition-all flex items-center gap-3 active:scale-95"
                  >
                    Add to Cart <HiOutlineShoppingBag className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="h-24 md:hidden"></div> {/* Spacer for sticky bar */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CustomizeCanvasPage;
