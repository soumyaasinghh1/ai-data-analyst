import { Client } from 'pg';

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

    // Call Gemini API directly with fetch
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert data analyst. Analyze this sales data and generate a comprehensive business report.

Sales Data (JSON):
${JSON.stringify(salesData, null, 2)}

Generate a report with:
1. Total Revenue Calculation
2. Top 3 Performing Products (by revenue)
3. Trend Analysis (patterns, seasonality, anomalies)
4. Actionable Business Recommendations

Format your response ONLY using these HTML tags: <h3>, <p>, <ul>, <li>, <strong>
Do NOT include markdown, code blocks, or any other formatting.
Start directly with <h3>Sales Analysis Report</h3>`
            }]
          }]
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    const report = data.candidates[0].content.parts[0].text;

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
