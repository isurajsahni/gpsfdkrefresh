const { OpenAI } = require('openai');

// Note: Initialization happens once, but we check for existence of API key
if (!process.env.OPENAI_API_KEY) {
  console.warn('WARNING: OPENAI_API_KEY is not defined in environment variables.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Handles AI Chatbot messages
 * POST /api/chat
 */
exports.handleChat = async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  // Double check API key inside handler to catch late-load issues
  if (!process.env.OPENAI_API_KEY) {
    console.error('CRITICAL ERROR: OPENAI_API_KEY is null or undefined.');
    return res.status(500).json({ message: 'AI Assistant initialization error.' });
  }

  try {
    const systemPrompt = {
      role: 'system',
      content: 'You are a wall decor expert for GPSFDK. Help users choose canvas size, design, and placement. Keep answers short, friendly, and helpful.'
    };

    const messages = [systemPrompt];
    
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
      messages.push(...recentHistory);
    }

    messages.push({ role: 'user', content: message });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 250,
      temperature: 0.7,
    });

    const aiMessage = response.choices[0].message.content;
    res.json({ message: aiMessage });
  } catch (error) {
    // Explicit requested logging: log errors clearly for Render/Debug
    console.error('--- OpenAI API Error Start ---');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error Details:', error);
    }
    console.error('--- OpenAI API Error End ---');

    // Handle specific common API failures
    if (error.status === 401) {
      return res.status(500).json({ message: 'Invalid API configuration. Please check the backend settings.' });
    }
    if (error.status === 429) {
      return res.status(429).json({ message: 'The AI is very busy! Please wait a moment and try again.' });
    }

    res.status(500).json({ 
      message: 'I’m having a small technical hiccup. Could you try sending that again?' 
    });
  }
};
