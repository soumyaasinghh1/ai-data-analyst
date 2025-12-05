import { Client } from 'pg';
import formidable from 'formidable';
import fs from 'fs';
import csv from 'csv-parser';
import xlsx from 'xlsx';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(worksheet);
}

function calculateChartData(salesData) {
  const productRevenue = {};
  let totalRevenue = 0;
  let totalUnits = 0;

  salesData.forEach(row => {
    const product = row.product_name || row['Product Name'] || row.product;
    const quantity = parseInt(row.quantity || row.Quantity || 0);
    const price = parseFloat(row.price || row.Price || 0);
    const revenue = quantity * price;

    if (product) {
      productRevenue[product] = (productRevenue[product] || 0) + revenue;
      totalRevenue += revenue;
      totalUnits += quantity;
    }
  });

  const products = Object.entries(productRevenue)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    products,
    totalRevenue,
    totalUnits,
    uniqueProducts: products.length
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client;
  let salesData = [];

  try {
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    const [fields, files] = await form.parse(req);
    const dataSource = fields.dataSource?.[0] || 'sample';

    // Get data from either sample DB or uploaded file
    if (dataSource === 'sample') {
      client = new Client({
        host: process.env.SUPABASE_HOST,
        port: 6543,
        database: process.env.SUPABASE_DB,
        user: process.env.SUPABASE_USER,
        password: process.env.SUPABASE_PASSWORD,
        ssl: { rejectUnauthorized: false }
      });

      await client.connect();
      const result = await client.query('SELECT * FROM sales_data');
      salesData = result.rows;
      await client.end();
    } else if (files.file) {
      const uploadedFile = files.file[0];
      const filePath = uploadedFile.filepath;

      if (uploadedFile.originalFilename.endsWith('.csv')) {
        salesData = await parseCSV(filePath);
      } else if (uploadedFile.originalFilename.match(/\.xlsx?$/)) {
        salesData = parseExcel(filePath);
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);
    }

    if (salesData.length === 0) {
      throw new Error('No data found to analyze');
    }

    // Calculate chart data
    const chartData = calculateChartData(salesData);

    // Call Gemini API
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
              text: `You are an expert data analyst. Analyze this sales data and generate a comprehensive business report WITH actionable recommendations.

Sales Data (JSON):
${JSON.stringify(salesData.slice(0, 50), null, 2)}

${salesData.length > 50 ? `Note: Showing first 50 of ${salesData.length} records for analysis.` : ''}

Generate a detailed report with:
1. **Executive Summary** - Key findings in 2-3 sentences
2. **Total Revenue Analysis** - Calculate exact total revenue with breakdown
3. **Top 5 Performing Products** - List by revenue with specific numbers
4. **Sales Trends & Patterns** - Identify seasonality, peak periods, growth trends
5. **Customer Insights** - Analysis of customer behavior patterns
6. **Anomalies & Concerns** - Any unusual patterns or red flags
7. **Actionable Recommendations** - At least 5 specific, prioritized action items to:
   - Increase revenue
   - Optimize inventory
   - Improve customer retention
   - Reduce costs
   - Expand market share

Format your response ONLY using these HTML tags: <h3>, <h4>, <p>, <ul>, <li>, <strong>, <em>
Do NOT include markdown, code blocks, or any other formatting.
Start directly with <h3>Executive Summary</h3>

Make recommendations specific, measurable, and prioritized by potential impact.`
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

    return res.status(200).json({ report, chartData });

  } catch (error) {
    console.error('Error:', error);
    if (client) await client.end();
    return res.status(500).json({ 
      error: 'Failed to generate report',
      details: error.message 
    });
  }
}
