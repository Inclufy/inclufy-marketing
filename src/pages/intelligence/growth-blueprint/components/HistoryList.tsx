// src/pages/growth-blueprint/components/HistoryList.tsx
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  TrendingUp, 
  Download, 
  Trash2, 
  ExternalLink,
  Loader2,
  Search
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface HistoryListProps {
  onSelectBlueprint: (blueprint: any) => void;
}

export default function HistoryList({ onSelectBlueprint }: HistoryListProps) {
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBlueprints();
  }, []);

  const loadBlueprints = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/growth-blueprint/');
      setBlueprints(response.data);
    } catch (error) {
      console.error('Failed to load blueprints:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const deleteBlueprint = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blueprint?')) return;

    try {
      await axios.delete(`/api/growth-blueprint/${id}`);
      toast.success('Blueprint deleted');
      loadBlueprints();
    } catch (error) {
      toast.error('Failed to delete blueprint');
    }
  };

  const filteredBlueprints = blueprints.filter(bp =>
    bp.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bp.website_url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by company name or website..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Scans</p>
          <p className="text-2xl font-bold">{blueprints.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Avg Score</p>
          <p className="text-2xl font-bold">
            {Math.round(
              blueprints.reduce((sum, bp) => sum + (bp.overall_score || 0), 0) / 
              (blueprints.length || 1)
            )}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">This Month</p>
          <p className="text-2xl font-bold">
            {blueprints.filter(bp => {
              const date = new Date(bp.created_at);
              const now = new Date();
              return date.getMonth() === now.getMonth() && 
                     date.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
      </div>

      {/* Blueprints List */}
      {filteredBlueprints.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No results found' : 'No scans yet'}
          </h3>
          <p className="text-gray-600">
            {searchQuery 
              ? 'Try a different search term' 
              : 'Run your first Growth Blueprint scan to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBlueprints.map((blueprint) => (
            <BlueprintCard
              key={blueprint.id}
              blueprint={blueprint}
              onSelect={() => onSelectBlueprint(blueprint)}
              onDelete={() => deleteBlueprint(blueprint.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Blueprint Card Component
interface BlueprintCardProps {
  blueprint: any;
  onSelect: () => void;
  onDelete: () => void;
}

function BlueprintCard({ blueprint, onSelect, onDelete }: BlueprintCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-blue-50';
    if (score >= 40) return 'bg-orange-50';
    return 'bg-red-50';
  };

  return (
    <div className="bg-white border rounded-xl p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">{blueprint.company_name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ExternalLink className="w-4 h-4" />
            <a 
              href={`https://${blueprint.website_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-600"
            >
              {blueprint.website_url}
            </a>
          </div>
          {blueprint.industry && (
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
              {blueprint.industry}
            </span>
          )}
        </div>
        
        <div className={`text-center ${getScoreBg(blueprint.overall_score || 0)} rounded-xl p-4`}>
          <div className={`text-3xl font-bold ${getScoreColor(blueprint.overall_score || 0)}`}>
            {blueprint.overall_score || 0}
          </div>
          <p className="text-xs text-gray-600 mt-1">Overall</p>
        </div>
      </div>

      {/* Mini Scores */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <MiniScore label="Web" score={blueprint.status_quo?.website_score} />
        <MiniScore label="SEO" score={blueprint.status_quo?.seo_score} />
        <MiniScore label="Content" score={blueprint.status_quo?.content_score} />
        <MiniScore label="Social" score={blueprint.status_quo?.social_score} />
        <MiniScore label="Media" score={blueprint.status_quo?.media_presence_score} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          {formatDistanceToNow(new Date(blueprint.created_at), { addSuffix: true })}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onSelect}
            className="flex items-center gap-1 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            View Details
          </button>
          
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Setup Status */}
      {blueprint.setup_completed && (
        <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
          <span className="w-2 h-2 bg-green-600 rounded-full" />
          Marketing setup completed
        </div>
      )}
    </div>
  );
}

// Mini Score Component
interface MiniScoreProps {
  label: string;
  score?: number;
}

function MiniScore({ label, score = 0 }: MiniScoreProps) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900">{score}</p>
    </div>
  );
}
