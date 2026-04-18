const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * AI Chatbot powered by Google Gemini
 * Model: gemini-1.5-flash
 */

exports.handleChat = async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('CRITICAL ERROR: GEMINI_API_KEY is not defined.');
    return res.status(500).json({ message: 'AI Assistant internal configuration error.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: `You are the GPSFDK AI Assistant, a specialized expert in premium wall decor, canvases, and house nameplates. GPSFDK stands for quality and artistic excellence.

TONE & STYLE:
- Professional yet warm and enthusiastic about art.
- Concise: Most responses should be 2-3 sentences.
- Helpful: Offer practical advice on sizes, materials, and placement.

KNOWLEDGE BASE:
1. Wall Canvases: Available in various styles (Cinema, Abstract, Botanical, Minimal).
2. Canvas Variations:
   - Materials: Poster, Rolled Canvas, Stretched Canvas.
   - Frames: Soft Board, Sticker, Paper (for posters); Rolled or Stretched (for canvas).
   - Sizes (inches): A4, A3, 12x18, 18x24, 24x36, 30x48, 36x60.
3. House Nameplates: Custom high-quality nameplates in Acrylic and Metal.
4. Customization: We offer custom canvas printing where users can upload their own art.

GUIDELINES:
- If a user asks about sizes, recommend 18x24" for small spaces, 24x36" for medium rooms, and 36x60" for large living rooms.
- Mention that prices vary based on size and material.
- If unsure about a specific product, invite them to visit our catalog.
- Avoid mentioning you are an AI model. You are the GPSFDK Assistant.`
    });

    // Transform history to Gemini format
    const contents = [];
    if (history && Array.isArray(history)) {
      // Use last 10 messages for context to stay within token/limit efficiently
      const recentHistory = history.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      contents.push(...recentHistory);
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // API Call with timeout guard
    const result = await model.generateContent({
      contents,
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.7,
      },
    });

    const response = await result.response;
    
    // ─── LOGGING FOR DEBUGGING ───
    console.log(`[Chat] Incoming: "${message.substring(0, 50)}..."`);
    // Safe logging of candidates info
    if (response.candidates && response.candidates.length > 0) {
      console.log('[Gemini API] Success. Finish Reason:', response.candidates[0].finishReason);
    }

    // ─── ROBUST RESPONSE HANDLING ───
    if (!response || !response.candidates || response.candidates.length === 0) {
      throw new Error('EMPTY_GEMINI_RESPONSE');
    }

    const candidate = response.candidates[0];
    
    // Handle specific finish reasons
    if (candidate.finishReason === 'SAFETY') {
      return res.json({ message: "I'm sorry, I can't discuss that topic. Let's talk about our beautiful wall decor instead!" });
    }

    let aiText = '';
    try {
      aiText = response.text();
    } catch (textErr) {
      console.error('[Chat] Error extracting text:', textErr.message);
      aiText = "I'm here to help you pick the perfect art for your walls. What can I assist you with today?";
    }

    if (!aiText || aiText.trim() === '') {
      aiText = "That's an interesting question! Could you tell me more about your space so I can give you the best advice?";
    }
    
    res.json({ message: aiText });

  } catch (error) {
    // ─── DETAILED ERROR HANDLING ───
    console.error('--- Gemini API Error ---');
    console.error('Error Code:', error.status || 'N/A');
    console.error('Error Message:', error.message);

    // Rate Limit (HTTP 429)
    if (error.status === 429 || error.message.includes('429')) {
      return res.status(429).json({ 
        message: 'I am feeling a bit overwhelmed with requests. Please wait a few seconds and try again!' 
      });
    }

    // Invalid API Key (HTTP 400/403)
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('key not found')) {
      console.error('ALERT: GEMINI_API_KEY is invalid or missing.');
      return res.status(500).json({ 
        message: 'I am having trouble connecting to my creative brain. Please try again later.' 
      });
    }

    // Default Fallback
    res.status(500).json({ 
      message: 'I’m taking a quick break to admire some art. Please try again in a moment!' 
    });
  }
};

