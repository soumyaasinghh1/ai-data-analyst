export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, chartData } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful AI data analyst assistant. Answer questions about this sales data concisely and accurately.

Data Summary:
- Total Revenue: $${chartData.totalRevenue.toLocaleString()}
- Total Units: ${chartData.totalUnits}
- Products: ${chartData.uniqueProducts}
- Top Products: ${chartData.products.slice(0, 3).map(p => p.name).join(', ')}

User Question: ${message}

Provide a clear, concise answer (2-3 sentences max). Be specific with numbers when relevant.`
            }]
          }]
        })
      }
    );

    const data = await response.json();
    const answer = data.candidates[0].content.parts[0].text;

    return res.status(200).json({ response: answer });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Chat failed' });
  }
}
