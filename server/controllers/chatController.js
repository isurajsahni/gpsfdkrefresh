const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * AI Chatbot powered by Google Gemini
 * Model: gemini-1.5-flash (Free/Fast)
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
      systemInstruction: "You are a wall decor expert for GPSFDK. Help users choose canvas size, design, and placement. Keep responses short, friendly, and helpful."
    });

    // Gemini expects 'user' and 'model' roles
    const contents = [];
    
    if (history && Array.isArray(history)) {
      // Use last 10 messages for context
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

    const result = await model.generateContent({
      contents,
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.7,
      },
    });

    const response = await result.response;
    const aiText = response.text();
    
    res.json({ message: aiText });
  } catch (error) {
    console.error('--- Gemini API Error Start ---');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Details:', error.response);
    } else {
      console.error('Stack:', error.stack);
    }
    console.error('--- Gemini API Error End ---');

    res.status(500).json({ 
      message: 'I’m taking a quick break to admire some art. Please try again in a moment!' 
    });
  }
};
