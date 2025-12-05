import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Loader2 } from 'lucide-react';

export default function AIDataAnalyst() {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async () => {
    setLoading(true);
    setError('');
    setReport('');

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      setError(err.message || 'An error occurred while generating the report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full mb-4">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Autonomous AI Data Analyst
          </h1>
          <p className="text-purple-200 text-lg">
            Generate intelligent insights from your sales data instantly
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-green-400" />
              <h3 className="text-white font-semibold">Revenue Analysis</h3>
            </div>
            <p className="text-purple-200 text-sm">Automated calculation of total revenue and performance metrics</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              <h3 className="text-white font-semibold">Trend Detection</h3>
            </div>
            <p className="text-purple-200 text-sm">AI-powered pattern recognition and anomaly detection</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 text-purple-400" />
              <h3 className="text-white font-semibold">Product Insights</h3>
            </div>
            <p className="text-purple-200 text-sm">Identify top performers and optimization opportunities</p>
          </div>
        </div>

        <div className="text-center mb-8">
          <button
            onClick={generateReport}
            disabled={loading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Data...
              </span>
            ) : (
              'Generate AI Report'
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-8">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {report && (
          <div className="bg-white/95 backdrop-blur-lg rounded-lg p-8 shadow-2xl border border-purple-500/20">
            <div className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: report }} />
            </div>
          </div>
        )}

        <div className="text-center mt-12 text-purple-200 text-sm">
          <p>Powered by React + Vercel Functions + Supabase + Google Gemini</p>
        </div>
      </div>
    </div>
  );
}
