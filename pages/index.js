import React, { useState, useCallback, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Loader2, Upload, Download, Moon, Sun, MessageSquare, Sparkles, Users, Calendar, Filter, X, Zap, Activity, PieChart } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function AIDataAnalyst() {
  const [report, setReport] = useState('');
  const [chartData, setChartData] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dataSource, setDataSource] = useState('sample');
  const [darkMode, setDarkMode] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setDataSource('uploaded');
      setError('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('dataSource', dataSource);
      if (uploadedFile) {
        formData.append('file', uploadedFile);
      }

      const response = await fetch('/api/generate-report', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setReport(data.report);
      setChartData(data.chartData);
      setTimeSeriesData(data.timeSeriesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">AI Data Analyst Pro</h1>
          <p className="text-cyan-200 text-xl">Upload your data and get instant AI-powered insights</p>
        </div>

        {/* Upload */}
        <div className="bg-slate-900/50 backdrop-blur-2xl rounded-3xl p-8 mb-8 border border-cyan-500/20">
          <input
            type="file"
            onChange={handleFileUpload}
            accept=".csv,.xlsx"
            className="mb-4"
          />
          
          <button
            onClick={generateReport}
            disabled={loading}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 px-8 rounded-2xl"
          >
            {loading ? 'Analyzing...' : 'Generate Report'}
          </button>
        </div>

        {error && <div className="text-red-400 mb-4">{error}</div>}

        {/* Charts */}
        {chartData && timeSeriesData && (
          <div className="space-y-8">
            <div className="bg-slate-900/50 backdrop-blur-2xl rounded-3xl p-8 border border-cyan-500/20">
              <h3 className="text-2xl font-bold text-white mb-6">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="bg-slate-900/50 backdrop-blur-2xl rounded-3xl p-8 border border-cyan-500/20">
                <h3 className="text-2xl font-bold text-white mb-6">Product Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie data={chartData.products} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {chartData.products.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-2xl rounded-3xl p-8 border border-cyan-500/20">
                <h3 className="text-2xl font-bold text-white mb-6">Top Products</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.products.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Report */}
        {report && (
          <div className="bg-white rounded-3xl p-8 mt-8">
            <div dangerouslySetInnerHTML={{ __html: report }} />
          </div>
        )}
      </div>
    </div>
  );
}
