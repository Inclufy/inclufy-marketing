import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, Loader2, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface HistoryListProps {
  onSelectBlueprint: (blueprint: any) => void;
}

export default function HistoryList({ onSelectBlueprint }: HistoryListProps) {
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlueprints();
  }, []);

  const loadBlueprints = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/growth-blueprint');
      setBlueprints(response.data);
    } catch (error) {
      console.error('Failed to load blueprints:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (blueprints.length === 0) {
    return (
      <div className="text-center py-12 bg-white border rounded-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No scans yet</h3>
        <p className="text-gray-600">
          Run your first Growth Blueprint scan to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {blueprints.map((blueprint) => (
        <div key={blueprint.id} className="bg-white border rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">{blueprint.company_name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ExternalLink className="w-4 h-4" />
                <span>{blueprint.website_url}</span>
              </div>
            </div>
            
            <div className="text-center bg-purple-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-purple-600">
                {blueprint.overall_score || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Overall</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              {new Date(blueprint.created_at).toLocaleDateString()}
            </div>
            
            <button
              onClick={() => onSelectBlueprint(blueprint)}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
