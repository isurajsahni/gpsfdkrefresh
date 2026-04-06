const { OpenAI } = require('openai');

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

  try {
    const systemPrompt = {
      role: 'system',
      content: 'You are a wall decor expert for GPSFDK. Help users choose canvas size, design, and placement. Keep answers short, friendly, and helpful.'
    };

    // Prepare messages history if provided, or start new
    const messages = [systemPrompt];
    
    if (history && Array.isArray(history)) {
      // Limit history to last 10 messages for token efficiency and speed
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
    console.error('OpenAI Error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'The AI assistant is temporarily resting. Please try again in a moment.' 
    });
  }
};
