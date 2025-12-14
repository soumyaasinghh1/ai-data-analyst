import React, { useState, useCallback } from 'react';
import { BarChart3, TrendingUp, DollarSign, Loader2, Upload, Download, Moon, Sun, MessageSquare, Sparkles, Users, Filter, X, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

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

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      setUploadedFile(file);
      setDataSource('uploaded');
      setError('');
    }
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setDataSource('uploaded');
      setError('');
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError('');
    setReport('');
    setChartData(null);

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

      if (!response.ok) throw new Error('Failed to generate report');

      const data = await response.json();
      setReport(data.report);
      if (data.chartData) setChartData(data.chartData);
      if (data.timeSeriesData) setTimeSeriesData(data.timeSeriesData);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !chartData) return;
    setChatLoading(true);
    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, chartData }),
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const downloadPDF = () => {
    const element = document.createElement('a');
    const content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>AI Report</title><style>body{font-family:Arial;padding:40px;max-width:1200px;margin:0 auto}h3{color:#7c3aed;margin-top:30px}strong{color:#059669}ul{line-height:1.8}</style></head><body><h1 style="color:#7c3aed;text-align:center">📊 AI Data Analysis Report</h1><p style="text-align:center;color:#6b7280;margin-bottom:40px">Generated on ${new Date().toLocaleDateString()}</p>${chartData ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:30px 0"><div style="background:#f9fafb;padding:20px;border-radius:8px;border-left:4px solid #7c3aed"><div style="font-size:32px;font-weight:bold;color:#7c3aed">$${chartData.totalRevenue.toLocaleString()}</div><div style="color:#6b7280;font-size:14px;margin-top:5px">Total Revenue</div></div><div style="background:#f9fafb;padding:20px;border-radius:8px;border-left:4px solid #7c3aed"><div style="font-size:32px;font-weight:bold;color:#7c3aed">${chartData.totalUnits.toLocaleString()}</div><div style="color:#6b7280;font-size:14px;margin-top:5px">Units Sold</div></div><div style="background:#f9fafb;padding:20px;border-radius:8px;border-left:4px solid #7c3aed"><div style="font-size:32px;font-weight:bold;color:#7c3aed">${chartData.uniqueProducts}</div><div style="color:#6b7280;font-size:14px;margin-top:5px">Products</div></div></div>` : ''}${report}<hr style="margin:40px 0;border:none;border-top:2px solid #e5e7eb"><p style="text-align:center;color:#9ca3af;font-size:12px">Generated by AI Data Analyst • Powered by Google Gemini 2.0</p></body></html>`;
    const file = new Blob([content], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `AI-Report-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const bgClass = darkMode 
    ? 'min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
    : 'min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50';

  const cardClass = darkMode
    ? 'bg-white/10 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl'
    : 'bg-white/70 backdrop-blur-xl rounded-2xl border border-purple-200 shadow-2xl';

  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const subtextClass = darkMode ? 'text-purple-200' : 'text-gray-600';

  return (
    <div className={bgClass}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${textClass}`}>AI Data Analyst Pro</h1>
              <p className={`text-sm ${subtextClass}`}>Real-time insights powered by AI</p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 ${cardClass} hover:scale-105 transition-transform`}
          >
            {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-purple-600" />}
          </button>
        </div>

        {/* KPI Cards */}
        {chartData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { icon: DollarSign, label: 'Total Revenue', value: `$${chartData.totalRevenue.toLocaleString()}`, color: 'from-green-400 to-emerald-500', trend: '+12.5%' },
              { icon: TrendingUp, label: 'Units Sold', value: chartData.totalUnits.toLocaleString(), color: 'from-blue-400 to-cyan-500', trend: '+8.3%' },
              { icon: Users, label: 'Unique Products', value: chartData.uniqueProducts, color: 'from-purple-400 to-pink-500', trend: '+5' },
              { icon: BarChart3, label: 'Avg Order Value', value: `$${(chartData.totalRevenue / chartData.totalUnits).toFixed(2)}`, color: 'from-orange-400 to-red-500', trend: '+4.2%' }
            ].map((stat, i) => (
              <div key={i} className={`${cardClass} p-6 hover:scale-105 transition-transform cursor-pointer`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-green-400 text-sm font-semibold">{stat.trend}</span>
                </div>
                <div className={`text-3xl font-bold ${textClass} mb-1`}>{stat.value}</div>
                <div className={`text-sm ${subtextClass}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Section */}
        <div className={`${cardClass} p-8 mb-8`}>
          <h3 className={`text-xl font-bold ${textClass} mb-4 flex items-center gap-2`}>
            <Upload className="w-6 h-6" />
            Data Source
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                dataSource === 'sample'
                  ? 'border-purple-500 bg-purple-500/10'
                  : darkMode ? 'border-white/10 hover:border-white/20' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="dataSource"
                  value="sample"
                  checked={dataSource === 'sample'}
                  onChange={() => setDataSource('sample')}
                  className="mr-3"
                />
                <div>
                  <div className={`${textClass} font-medium`}>Use Sample Data</div>
                  <div className={`text-sm ${subtextClass}`}>10 demo sales records</div>
                </div>
              </label>

              <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                dataSource === 'uploaded'
                  ? 'border-purple-500 bg-purple-500/10'
                  : darkMode ? 'border-white/10 hover:border-white/20' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="dataSource"
                  value="uploaded"
                  checked={dataSource === 'uploaded'}
                  onChange={() => setDataSource('uploaded')}
                  className="mr-3"
                />
                <div>
                  <div className={`${textClass} font-medium`}>Upload Your Data</div>
                  <div className={`text-sm ${subtextClass}`}>CSV or Excel file</div>
                </div>
              </label>
            </div>

            {dataSource === 'uploaded' && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  isDragging
                    ? 'border-purple-500 bg-purple-500/20 scale-105'
                    : darkMode ? 'border-purple-500/50 hover:border-purple-500' : 'border-purple-300 hover:border-purple-500'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-12 h-12 text-purple-400 mb-4" />
                  <span className={`${textClass} font-medium mb-2`}>
                    {uploadedFile ? uploadedFile.name : 'Drop files here or click to browse'}
                  </span>
                  <span className={`text-sm ${subtextClass}`}>CSV or Excel files (Max 5MB)</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="text-center mb-8">
          <button
            onClick={generateReport}
            disabled={loading || (dataSource === 'uploaded' && !uploadedFile)}
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

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-8">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Charts */}
        {chartData && timeSeriesData && (
          <div className="space-y-8 mb-8">
            <div className={`${cardClass} p-6`}>
              <h3 className={`text-xl font-bold ${textClass} mb-6`}>Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#ffffff20' : '#00000020'} />
                  <XAxis dataKey="date" stroke={darkMode ? '#fff' : '#000'} />
                  <YAxis stroke={darkMode ? '#fff' : '#000'} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={`${cardClass} p-6`}>
                <h3 className={`text-xl font-bold ${textClass} mb-6`}>Product Revenue Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.products.slice(0, 6)}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {chartData.products.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className={`${cardClass} p-6`}>
                <h3 className={`text-xl font-bold ${textClass} mb-6`}>Top 10 Products</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.products}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#ffffff20' : '#00000020'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#fff' : '#000'} angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke={darkMode ? '#fff' : '#000'} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '12px' }} />
                    <Bar dataKey="revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Report */}
        {report && (
          <div className={`${cardClass} p-8`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-2xl font-bold ${textClass}`}>AI Analysis Report</h3>
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg transition-all hover:scale-105"
              >
                <Download className="w-5 h-5" />
                Export PDF
              </button>
            </div>
            <div className="prose prose-lg max-w-none" style={{ color: darkMode ? '#e5e7eb' : '#1f2937' }}>
              <div dangerouslySetInnerHTML={{ __html: report }} />
            </div>
          </div>
        )}

        {/* AI Chat */}
        {chartData && (
          <>
            <button
              onClick={() => setShowChat(!showChat)}
              className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50"
            >
              <MessageSquare className="w-7 h-7 text-white" />
            </button>

            {showChat && (
              <div className={`fixed bottom-28 right-8 w-96 ${cardClass} shadow-2xl z-50`}>
                <div className="p-4 border-b border-purple-500/20">
                  <div className="flex justify-between items-center">
                    <h4 className={`font-bold ${textClass}`}>Ask the AI Analyst</h4>
                    <button onClick={() => setShowChat(false)}>
                      <X className={`w-5 h-5 ${textClass}`} />
                    </button>
                  </div>
                </div>
                <div className="h-96 overflow-y-auto p-4 space-y-3">
                  {chatHistory.length === 0 && (
                    <div className={`text-center ${subtextClass} py-8`}>
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Ask me anything about your data!</p>
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`p-3 rounded-xl ${msg.role === 'user' ? 'bg-purple-500 text-white ml-8' : 'bg-white/10 mr-8'}`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex items-center gap-2 text-purple-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-purple-500/20">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      placeholder="Ask about trends, insights..."
                      className={`flex-1 px-4 py-2 rounded-xl ${darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'} border border-purple-500/20 focus:outline-none focus:border-purple-500`}
                    />
                    <button
                      onClick={sendChatMessage}
                      disabled={!chatMessage.trim() || chatLoading}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl hover:scale-105 transition-transform disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className={`text-center mt-12 ${subtextClass} text-sm`}>
          <p>Powered by React + Vercel Functions + Supabase + Google Gemini</p>
          <p className="mt-2 text-xs">Free Tier: 15 req/min • 1K req/day • 250K tokens/min</p>
        </div>
      </div>
    </div>
  );
}
