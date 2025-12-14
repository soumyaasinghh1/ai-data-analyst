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
    .map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    products,
    totalRevenue: Math.round(totalRevenue),
    totalUnits,
    uniqueProducts: products.length
  };
}

function generateTimeSeriesData(salesData) {
  const dateRevenue = {};

  salesData.forEach(row => {
    const date = row.sale_date || row['Sale Date'] || row.date;
    const quantity = parseInt(row.quantity || row.Quantity || 0);
    const price = parseFloat(row.price || row.Price || 0);
    const revenue = quantity * price;

    if (date) {
      const dateStr = new Date(date).toISOString().split('T')[0];
      dateRevenue[dateStr] = (dateRevenue[dateStr] || 0) + revenue;
    }
  });

  return Object.entries(dateRevenue)
    .map(([date, revenue]) => ({ date, revenue: Math.round(revenue) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client;
  let salesData = [];

  try {
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024,
    });

    const [fields, files] = await form.parse(req);
    const dataSource = fields.dataSource?.[0] || 'sample';

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

      fs.unlinkSync(filePath);
    }

    if (salesData.length === 0) {
      throw new Error('No data found to analyze');
    }

    const chartData = calculateChartData(salesData);
    const timeSeriesData = generateTimeSeriesData(salesData);

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
              text: `You are an expert data analyst. Analyze this sales data comprehensively.

Sales Data Summary:
- Total Records: ${salesData.length}
- Total Revenue: $${chartData.totalRevenue.toLocaleString()}
- Total Units: ${chartData.totalUnits.toLocaleString()}
- Unique Products: ${chartData.uniqueProducts}

Top Products:
${chartData.products.slice(0, 5).map((p, i) => `${i+1}. ${p.name}: $${p.revenue.toLocaleString()}`).join('\n')}

Sample Records:
${JSON.stringify(salesData.slice(0, 20), null, 2)}

Generate a DETAILED executive report with:

<h3>📊 Executive Summary</h3>
<p>2-3 sentence high-level overview of business performance</p>

<h3>💰 Revenue Analysis</h3>
<p>Deep dive into revenue streams, growth patterns, and key drivers</p>

<h3>🏆 Top Performers</h3>
<p>Analysis of best-selling products with specific metrics and insights</p>

<h3>📈 Trends & Patterns</h3>
<p>Identify seasonality, growth trends, anomalies, and market dynamics</p>

<h3>👥 Customer Insights</h3>
<p>Customer behavior patterns and purchasing trends</p>

<h3>⚠️ Risk Assessment</h3>
<p>Potential concerns, anomalies, or areas needing attention</p>

<h3>🎯 Strategic Recommendations</h3>
<ul>
<li><strong>Priority 1:</strong> Specific action with expected impact</li>
<li><strong>Priority 2:</strong> Specific action with expected impact</li>
<li><strong>Priority 3:</strong> Specific action with expected impact</li>
<li><strong>Priority 4:</strong> Specific action with expected impact</li>
<li><strong>Priority 5:</strong> Specific action with expected impact</li>
</ul>

<h3>📊 Key Metrics Dashboard</h3>
<p>Summary of critical KPIs and benchmarks</p>

Format ONLY with HTML tags: <h3>, <h4>, <p>, <ul>, <li>, <strong>, <em>
NO markdown, code blocks, or other formatting.`
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

    return res.status(200).json({ report, chartData, timeSeriesData });

  } catch (error) {
    console.error('Error:', error);
    if (client) await client.end();
    return res.status(500).json({ 
      error: 'Failed to generate report',
      details: error.message 
    });
  }
}
