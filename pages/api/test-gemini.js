import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try a simple generation with the simplest syntax
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say hello');
    const text = result.response.text();
    
    return res.status(200).json({ 
      success: true,
      message: text,
      apiKeyPresent: !!process.env.GEMINI_API_KEY,
      apiKeyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10)
    });
  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      apiKeyPresent: !!process.env.GEMINI_API_KEY,
      apiKeyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10)
    });
  }
}
