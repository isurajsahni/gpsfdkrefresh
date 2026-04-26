const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Using API Key:", apiKey);
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log(data.models.map(m => m.name).filter(name => name.includes("flash")));
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
