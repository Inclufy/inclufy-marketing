// src/pages/growth-blueprint/components/ScanForm.tsx
import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Building2, Globe, Briefcase } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface ScanFormProps {
  onScanComplete: (blueprint: any) => void;
}

export default function ScanForm({ onScanComplete }: ScanFormProps) {
  const [formData, setFormData] = useState({
    company_name: '',
    website_url: '',
    industry: ''
  });
  
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [blueprintId, setBlueprintId] = useState<string | null>(null);

  const startScan = async () => {
    if (!formData.company_name || !formData.website_url) {
      toast.error('Please fill in company name and website URL');
      return;
    }

    try {
      setScanning(true);
      setProgress(25);
      setStatus('Starting scan...');

      // Start scan
      const response = await axios.post('/api/growth-blueprint/', formData);
      const blueprint = response.data;
      setBlueprintId(blueprint.id);

      // Poll for completion
      pollProgress(blueprint.id);

    } catch (error: any) {
      console.error('❌ Scan failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
      toast.error(`Failed to start scan: ${errorMessage}`);
      setScanning(false);
    }
  };

  const pollProgress = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/growth-blueprint/${id}`);
        const blueprint = response.data.blueprint;
        
        setProgress(blueprint.scan_progress || 0);
        setStatus(blueprint.status === 'scanning' ? 'Scanning website...' : 'Analyzing data...');

        if (blueprint.status === 'completed') {
          clearInterval(interval);
          setScanning(false);
          toast.success('Scan complete!');
          onScanComplete(response.data);
        } else if (blueprint.status === 'failed') {
          clearInterval(interval);
          setScanning(false);
          toast.error('Scan failed');
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 2000);

    // Cleanup after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Info Card */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-lg">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              What We'll Analyze
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Website quality & user experience</li>
              <li>✓ SEO performance & optimization</li>
              <li>✓ Content quality & messaging</li>
              <li>✓ Social media presence</li>
              <li>✓ Brand consistency & positioning</li>
              <li>✓ Growth opportunities & quick wins</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Scan Form */}
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h2 className="text-2xl font-bold mb-6">Company Information</h2>
        
        <div className="space-y-6">
          {/* Company Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4" />
              Company Name *
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="e.g. Inclufy"
              disabled={scanning}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          {/* Website URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4" />
              Website URL *
            </label>
            <input
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              placeholder="e.g. www.inclufy.com"
              disabled={scanning}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4" />
              Industry (Optional)
            </label>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="e.g. AI Software, SaaS, E-commerce"
              disabled={scanning}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
            />
            <p className="text-sm text-gray-500 mt-1">
              We'll detect this automatically if not provided
            </p>
          </div>

          {/* Scan Button */}
          <button
            onClick={startScan}
            disabled={scanning || !formData.company_name || !formData.website_url}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
          >
            {scanning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Growth Blueprint
              </>
            )}
          </button>
        </div>

        {/* Progress */}
        {scanning && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{status}</span>
              <span className="text-sm text-gray-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Analysis in progress...</p>
                <p className="text-blue-700">
                  We're analyzing your website, checking SEO, scanning for social media links, 
                  and generating personalized recommendations. This typically takes 30-60 seconds.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Example Companies */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 mb-3">Try it with these examples:</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {[
            { name: 'Stripe', url: 'stripe.com' },
            { name: 'Booking.com', url: 'booking.com' },
            { name: 'GitHub', url: 'github.com' }
          ].map(example => (
            <button
              key={example.url}
              onClick={() => setFormData({
                company_name: example.name,
                website_url: example.url,
                industry: ''
              })}
              disabled={scanning}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              {example.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
