import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChatAlt2, HiX, HiPaperAirplane, HiDotsHorizontal } from 'react-icons/hi';
import API from '../../utils/api';

const QUICK_OPTIONS = [
  "Suggest canvas for living room",
  "Best size for my wall",
  "Modern design ideas",
  "How to hang a canvas?"
];

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I am your GPSFDK wall decor expert. How can I help you transform your space today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  const handleSend = async (text) => {
    const userInput = text || message;
    if (!userInput.trim() || isLoading) return;

    const newHistory = [...chatHistory, { role: 'user', content: userInput }];
    setChatHistory(newHistory);
    setMessage('');
    setIsLoading(true);

    try {
      const { data } = await API.post('/chat', { 
        message: userInput,
        history: chatHistory 
      });

      setChatHistory(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: error.response?.data?.message || "I'm having trouble connecting right now. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[calc(100vw-2rem)] sm:w-[400px] h-[500px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-secondary p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-accent p-2 rounded-xl">
                  <HiChatAlt2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg">GPSFDK Assistant</h3>
                  <p className="text-xs text-white/70">Wall Decor Expert</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 bg-primary/20 scroll-smooth"
            >
              {chatHistory.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`
                    max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${msg.role === 'user' 
                      ? 'bg-secondary text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}
                  `}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }} 
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-1.5 h-1.5 bg-accent rounded-full" 
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }} 
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                      className="w-1.5 h-1.5 bg-accent rounded-full" 
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }} 
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                      className="w-1.5 h-1.5 bg-accent rounded-full" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Options */}
            {!isLoading && (
              <div className="px-5 py-2 flex flex-wrap gap-2 bg-white/50 border-t border-gray-50">
                {QUICK_OPTIONS.map(option => (
                  <button
                    key={option}
                    onClick={() => handleSend(option)}
                    className="text-[11px] font-bold text-accent bg-accent/10 hover:bg-accent hover:text-white px-3 py-1.5 rounded-full transition-all border border-accent/20"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2"
              >
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about sizes, styles..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                  disabled={isLoading}
                />
                <button 
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className="bg-accent text-white p-3 rounded-2xl shadow-lg hover:bg-accent-dark transition-all disabled:opacity-50 disabled:scale-95"
                >
                  <HiPaperAirplane className="w-5 h-5 rotate-90" />
                </button>
              </form>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                Powered by GPSFDK AI Decor Specialist
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-accent text-white rounded-2xl shadow-2xl flex items-center justify-center hover:bg-accent-dark transition-colors relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        {isOpen ? (
          <HiX className="w-7 h-7" />
        ) : (
          <HiChatAlt2 className="w-7 h-7" />
        )}
        
        {/* Glow indicator */}
        {!isOpen && (
          <span className="absolute top-0 right-0 flex h-3 w-3 -mt-1 -mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
          </span>
        )}
      </motion.button>
    </div>
  );
};

export default ChatBot;
