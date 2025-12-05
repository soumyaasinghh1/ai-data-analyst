import { Client } from 'pg';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client;

  try {
    // Connect to Supabase PostgreSQL
    client = new Client({
      host: process.env.SUPABASE_HOST,
      port: 6543,
      database: process.env.SUPABASE_DB,
      user: process.env.SUPABASE_USER,
      password: process.env.SUPABASE_PASSWORD,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // Extract sales data
    const result = await client.query('SELECT * FROM sales_data');
    const salesData = result.rows;

    await client.end();

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // AI Prompt
    const prompt = `You are an expert data analyst. Analyze this sales data and generate a comprehensive business report.

Sales Data (JSON):
${JSON.stringify(salesData, null, 2)}

Generate a report with:
1. Total Revenue Calculation
2. Top 3 Performing Products (by revenue)
3. Trend Analysis (patterns, seasonality, anomalies)
4. Actionable Business Recommendations

Format your response ONLY using these HTML tags: <h3>, <p>, <ul>, <li>, <strong>
Do NOT include markdown, code blocks, or any other formatting.
Start directly with <h3>Sales Analysis Report</h3>`;

    // Get AI response
    const aiResult = await model.generateContent(prompt);
    const report = aiResult.response.text();

    return res.status(200).json({ report });

  } catch (error) {
    console.error('Error:', error);
    if (client) await client.end();
    return res.status(500).json({ 
      error: 'Failed to generate report',
      details: error.message 
    });
  }
}
