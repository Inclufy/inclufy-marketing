// src/pages/growth-blueprint/components/ResultsView.tsx
import React, { useState } from 'react';
import { 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  Sparkles,
  ArrowRight,
  Download,
  Users,
  Newspaper,
  CheckCircle2
} from 'lucide-react';
import { PostScanWizard } from '../PostScanWizard';
import { toast } from 'sonner';

interface ResultsViewProps {
  blueprint: any;
}

export default function ResultsView({ blueprint }: ResultsViewProps) {
  const [showWizard, setShowWizard] = useState(false);

  if (!blueprint) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Award className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Yet</h3>
        <p className="text-gray-600 mb-4">
          Run a new scan to see your Growth Blueprint results
        </p>
      </div>
    );
  }

  const statusQuo = blueprint.status_quo;
  const vision = blueprint.vision;
  const recommendations = blueprint.recommendations || [];
  const opportunities = blueprint.opportunities || [];
  const threats = blueprint.threats || [];

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {blueprint.blueprint?.company_name}
            </h2>
            <p className="text-purple-100">
              {statusQuo?.website_url}
            </p>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold mb-2">
              {blueprint.blueprint?.overall_score || 0}
            </div>
            <p className="text-purple-100">Overall Score</p>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid md:grid-cols-5 gap-4">
        <ScoreCard
          label="Website"
          score={statusQuo?.website_score || 0}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <ScoreCard
          label="SEO"
          score={statusQuo?.seo_score || 0}
          icon={<Target className="w-5 h-5" />}
        />
        <ScoreCard
          label="Content"
          score={statusQuo?.content_score || 0}
          icon={<Award className="w-5 h-5" />}
        />
        <ScoreCard
          label="Social"
          score={statusQuo?.social_score || 0}
          icon={<Users className="w-5 h-5" />}
        />
        <ScoreCard
          label="Media"
          score={statusQuo?.media_presence_score || 0}
          icon={<Newspaper className="w-5 h-5" />}
        />
      </div>

      {/* Setup Wizard CTA */}
      {!blueprint.blueprint?.setup_completed && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                🚀 Complete Your Marketing Setup
              </h3>
              <p className="text-gray-600 mb-4">
                Your analysis is complete! Now set up your complete marketing strategy in just 5 minutes.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">✅ What we found:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Company & industry information</li>
                    <li>• Website quality analysis</li>
                    <li>• {statusQuo?.weaknesses?.length || 0} improvement areas</li>
                    <li>• Content & SEO scores</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">❓ We need from you:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Target audience details (~2 min)</li>
                    <li>• Budget & team size (~1 min)</li>
                    <li>• Review AI-suggested goals (~2 min)</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowWizard(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  <Sparkles className="w-5 h-5" />
                  Complete Setup (5 min)
                  <ArrowRight className="w-4 h-4" />
                </button>
                
                <button className="px-6 py-3 text-gray-600 hover:text-gray-900">
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-lg">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {statusQuo?.strengths?.map((strength: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-bold text-lg">Areas to Improve</h3>
          </div>
          <ul className="space-y-2">
            {statusQuo?.weaknesses?.map((weakness: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Recommendations</h3>
          <div className="space-y-3">
            {recommendations.map((rec: any, idx: number) => (
              <div 
                key={idx} 
                className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
              >
                <div className={`p-2 rounded-lg ${
                  rec.priority === 'critical' ? 'bg-red-100' :
                  rec.priority === 'high' ? 'bg-orange-100' :
                  'bg-blue-100'
                }`}>
                  <Target className={`w-4 h-4 ${
                    rec.priority === 'critical' ? 'text-red-600' :
                    rec.priority === 'high' ? 'text-orange-600' :
                    'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{rec.title}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      rec.priority === 'critical' ? 'bg-red-100 text-red-700' :
                      rec.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company Profile */}
      {statusQuo?.founders && statusQuo.founders.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Company Profile</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Industry</p>
              <p className="text-gray-900">{statusQuo.industry}</p>
            </div>
            {statusQuo.founding_year && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Founded</p>
                <p className="text-gray-900">{statusQuo.founding_year}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Founders</p>
              {statusQuo.founders.map((founder: any, idx: number) => (
                <div key={idx} className="mb-2">
                  <p className="font-medium text-gray-900">{founder.name}</p>
                  <p className="text-sm text-gray-600">{founder.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            // TODO: Implement PDF export
            toast.success('PDF export coming soon!');
          }}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <PostScanWizard
              blueprintId={blueprint.blueprint?.id}
              onComplete={() => {
                setShowWizard(false);
                toast.success('✅ Marketing setup complete!');
              }}
              onSkip={() => {
                setShowWizard(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Score Card Component
interface ScoreCardProps {
  label: string;
  score: number;
  icon: React.ReactNode;
}

function ScoreCard({ label, score, icon }: ScoreCardProps) {
  const getColorClass = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-blue-500 to-cyan-500';
    if (score >= 40) return 'from-orange-500 to-amber-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className={`text-3xl font-bold bg-gradient-to-r ${getColorClass(score)} bg-clip-text text-transparent`}>
        {score}
      </div>
      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${getColorClass(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
