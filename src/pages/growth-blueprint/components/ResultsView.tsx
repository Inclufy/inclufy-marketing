import React, { useState } from 'react';
import { 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  Sparkles,
  ArrowRight,
  Users,
  Newspaper,
  CheckCircle2,
  Building2,
  Calendar,
  MapPin
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
        <p className="text-gray-600">Run a new scan to see your Growth Blueprint results</p>
      </div>
    );
  }

  const statusQuo = blueprint.status_quo;
  const aiAnalysis = statusQuo?.ai_analysis || {};
  const recommendations = blueprint.recommendations || [];
  const setupCompleted = blueprint.blueprint?.setup_completed;

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {blueprint.blueprint?.company_name}
            </h2>
            <p className="text-purple-100">{statusQuo?.website_url}</p>
            {aiAnalysis.industry && (
              <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                {aiAnalysis.industry}
              </span>
            )}
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold mb-2">
              {blueprint.blueprint?.overall_score || 0}
            </div>
            <p className="text-purple-100">Overall Score</p>
          </div>
        </div>
      </div>

      {/* 🔥 SETUP WIZARD CTA - Big & Prominent */}
      {!setupCompleted && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white shadow-2xl">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
              <Sparkles className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-3">
                🚀 Complete Your Marketing Setup in 5 Minutes
              </h3>
              <p className="text-purple-100 text-lg mb-6">
                We've analyzed your business and pre-filled most fields. Just review and add a few details!
              </p>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <CheckCircle2 className="w-6 h-6 mb-2" />
                  <p className="font-semibold mb-1">✅ Already Found</p>
                  <ul className="text-sm text-purple-100 space-y-1">
                    <li>• Company info</li>
                    <li>• Industry & mission</li>
                    <li>• {aiAnalysis.founders?.length || 0} founders detected</li>
                    <li>• {statusQuo?.weaknesses?.length || 0} improvement areas</li>
                  </ul>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <Users className="w-6 h-6 mb-2" />
                  <p className="font-semibold mb-1">❓ We Need (~2 min)</p>
                  <ul className="text-sm text-purple-100 space-y-1">
                    <li>• Target audience age</li>
                    <li>• Job titles</li>
                    <li>• Company size focus</li>
                  </ul>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <Target className="w-6 h-6 mb-2" />
                  <p className="font-semibold mb-1">🎯 AI-Generated</p>
                  <ul className="text-sm text-purple-100 space-y-1">
                    <li>• 3 custom goals</li>
                    <li>• Tailored KPIs</li>
                    <li>• Growth timeline</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowWizard(true)}
                  className="flex items-center gap-3 px-8 py-4 bg-white text-purple-600 rounded-xl hover:shadow-2xl transition-all font-bold text-lg"
                >
                  <Sparkles className="w-6 h-6" />
                  Start 5-Minute Setup
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                <div className="text-purple-100">
                  <p className="text-sm">Save €100-500/month</p>
                  <p className="text-xs">vs. manual setup time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {setupCompleted && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-xl font-bold text-green-900">Setup Complete! ✅</h3>
              <p className="text-green-700">Your marketing setup is ready. Go to Setup → Brand to review.</p>
            </div>
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      <div className="grid md:grid-cols-5 gap-4">
        <ScoreCard label="Website" score={statusQuo?.website_score || 0} icon={<TrendingUp className="w-5 h-5" />} />
        <ScoreCard label="SEO" score={statusQuo?.seo_score || 0} icon={<Target className="w-5 h-5" />} />
        <ScoreCard label="Content" score={statusQuo?.content_score || 0} icon={<Award className="w-5 h-5" />} />
        <ScoreCard label="Social" score={statusQuo?.social_score || 0} icon={<Users className="w-5 h-5" />} />
        <ScoreCard label="Media" score={statusQuo?.media_presence_score || 0} icon={<Newspaper className="w-5 h-5" />} />
      </div>

      {/* 🏢 COMPANY PROFILE - New Section */}
      <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Building2 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Company Profile</h3>
            <p className="text-gray-600">Extracted from your website</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Business Information</h4>
            <div className="space-y-3">
              <InfoRow 
                icon={<Building2 className="w-4 h-4" />}
                label="Industry"
                value={aiAnalysis.industry || 'Not detected'}
              />
              {aiAnalysis.founding_year && (
                <InfoRow 
                  icon={<Calendar className="w-4 h-4" />}
                  label="Founded"
                  value={aiAnalysis.founding_year}
                />
              )}
              <InfoRow 
                icon={<Target className="w-4 h-4" />}
                label="Target Audience"
                value={aiAnalysis.target_audience || 'Not specified'}
              />
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Value Proposition</h4>
            <p className="text-gray-700 leading-relaxed">
              {aiAnalysis.value_proposition || 'No value proposition detected on website'}
            </p>
            
            {aiAnalysis.key_services && aiAnalysis.key_services.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Key Services:</p>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.key_services.map((service: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 👥 FOUNDERS PROFILE - New Section */}
      {aiAnalysis.founders && aiAnalysis.founders.length > 0 && (
        <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Leadership Team</h3>
              <p className="text-gray-600">{aiAnalysis.founders.length} founder{aiAnalysis.founders.length > 1 ? 's' : ''} detected</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {aiAnalysis.founders.map((founder: any, idx: number) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-900">{founder.name}</h4>
                  <p className="text-blue-600 font-medium mb-2">{founder.role}</p>
                  {founder.bio && (
                    <p className="text-sm text-gray-600 leading-relaxed">{founder.bio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              💡 <strong>Smart Setup:</strong> This founder information will be automatically added to your Brand Setup when you complete the 5-minute wizard above!
            </p>
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
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
          <h3 className="font-bold text-lg mb-4">Growth Recommendations</h3>
          <div className="space-y-3">
            {recommendations.map((rec: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-lg ${
                  rec.priority === 'critical' ? 'bg-red-100' :
                  rec.priority === 'high' ? 'bg-orange-100' : 'bg-blue-100'
                }`}>
                  <Target className={`w-4 h-4 ${
                    rec.priority === 'critical' ? 'text-red-600' :
                    rec.priority === 'high' ? 'text-orange-600' : 'text-blue-600'
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

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <PostScanWizard
              blueprintId={blueprint.blueprint?.id}
              onComplete={() => {
                setShowWizard(false);
                toast.success('✅ Marketing setup complete!');
                window.location.reload(); // Refresh to show updated state
              }}
              onSkip={() => setShowWizard(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
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

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-gray-100 rounded-lg mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-gray-900 font-medium">{value}</p>
      </div>
    </div>
  );
}
