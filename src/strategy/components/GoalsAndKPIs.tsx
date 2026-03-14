// src/strategy/components/GoalsAndKPIs.tsx
import React, { useState, useEffect } from 'react';
import { Target, Plus, DollarSign, Users, TrendingUp, Activity, Loader2, ChevronLeft, ChevronRight, X, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface Objective {
  id: string;
  dbId?: string;
  title: string;
  description: string;
  objectiveType: string;
  priority: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: string;
}

const OBJECTIVE_TYPES = [
  { value: 'revenue', label: 'Revenue', labelNl: 'Omzet', labelFr: 'Revenus', icon: DollarSign, color: 'text-green-600 bg-green-100' },
  { value: 'growth', label: 'Growth', labelNl: 'Groei', labelFr: 'Croissance', icon: TrendingUp, color: 'text-blue-600 bg-blue-100' },
  { value: 'acquisition', label: 'Acquisition', labelNl: 'Acquisitie', labelFr: 'Acquisition', icon: Users, color: 'text-purple-600 bg-purple-100' },
  { value: 'engagement', label: 'Engagement', labelNl: 'Engagement', labelFr: 'Engagement', icon: Activity, color: 'text-orange-600 bg-orange-100' },
  { value: 'operational', label: 'Operational', labelNl: 'Operationeel', labelFr: 'Opérationnel', icon: Target, color: 'text-gray-600 bg-gray-100' },
];

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export default function GoalsAndKPIs() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [objectives, setObjectives] = useState<Objective[]>([]);

  // Load strategic objectives from DB
  useEffect(() => {
    async function loadObjectives() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsLoading(false); return; }

        const { data, error } = await supabase
          .from('strategic_objectives')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at');

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped: Objective[] = data.map((o: any, i: number) => ({
            id: String(i + 1),
            dbId: o.id,
            title: o.title || '',
            description: o.description || '',
            objectiveType: o.objective_type || 'operational',
            priority: o.priority || 'medium',
            targetValue: o.target_value || 0,
            currentValue: o.current_value || 0,
            unit: o.success_metrics?.[0]?.metric || '',
            status: o.status || 'active',
          }));
          setObjectives(mapped);
        }
      } catch (err) {
        console.error('Failed to load objectives:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadObjectives();
  }, []);

  const handleAdd = () => {
    setObjectives([...objectives, {
      id: Date.now().toString(),
      title: '',
      description: '',
      objectiveType: 'growth',
      priority: 'medium',
      targetValue: 0,
      currentValue: 0,
      unit: '',
      status: 'active',
    }]);
  };

  const handleUpdate = (index: number, field: keyof Objective, value: any) => {
    const updated = [...objectives];
    updated[index] = { ...updated[index], [field]: value };
    setObjectives(updated);
  };

  const handleDelete = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (const obj of objectives) {
        const row = {
          user_id: user.id,
          title: obj.title,
          description: obj.description,
          objective_type: obj.objectiveType,
          priority: obj.priority,
          target_value: obj.targetValue,
          current_value: obj.currentValue,
          status: obj.status,
          success_metrics: obj.unit ? [{ metric: obj.unit, target: obj.targetValue }] : [],
        };

        if (obj.dbId) {
          const { error } = await supabase.from('strategic_objectives').update(row).eq('id', obj.dbId);
          if (error) throw error;
        } else {
          const { data: inserted, error } = await supabase.from('strategic_objectives').insert(row).select('id').single();
          if (error) throw error;
          obj.dbId = inserted.id;
        }
      }

      toast({
        title: nl ? 'Doelen opgeslagen!' : fr ? 'Objectifs enregistrés !' : 'Goals saved!',
        description: nl ? 'Je strategische doelen zijn bijgewerkt.' : fr ? 'Vos objectifs stratégiques ont été mis à jour.' : 'Your strategic objectives have been updated.',
      });
    } catch (err: any) {
      console.error('Failed to save objectives:', err);
      toast({
        title: nl ? 'Opslaan mislukt' : fr ? 'Échec de l\'enregistrement' : 'Save failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    await handleSave();
    navigate('/app/setup/competitive');
  };

  const completionPercentage = objectives.length > 0
    ? Math.round(objectives.filter(o => o.title && o.targetValue > 0).length / objectives.length * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="w-full py-2 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-500">{nl ? 'Doelen laden...' : fr ? 'Chargement des objectifs...' : 'Loading goals...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-2">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{nl ? 'Doelen & KPI\'s' : fr ? 'Objectifs & KPIs' : 'Goals & KPIs'}</h1>
            <p className="text-gray-600 mt-2">
              {nl ? 'Stel meetbare marketingdoelen in en volg je voortgang' : fr ? 'Définissez des objectifs marketing mesurables et suivez vos progrès' : 'Set measurable marketing objectives and track progress'}
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {completionPercentage}% {nl ? 'Voltooid' : fr ? 'Terminé' : 'Complete'}
          </Badge>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* Summary metrics */}
      {objectives.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{objectives.length}</p>
                  <p className="text-sm text-gray-600">{nl ? 'Actieve Doelen' : fr ? 'Objectifs Actifs' : 'Active Goals'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{objectives.filter(o => o.priority === 'critical' || o.priority === 'high').length}</p>
                  <p className="text-sm text-gray-600">{nl ? 'Hoge Prioriteit' : fr ? 'Haute Priorité' : 'High Priority'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {objectives.length > 0
                      ? Math.round(objectives.reduce((sum, o) => sum + (o.targetValue > 0 ? (o.currentValue / o.targetValue) * 100 : 0), 0) / objectives.length)
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-600">{nl ? 'Gem. Voortgang' : fr ? 'Progrès Moyen' : 'Avg Progress'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{objectives.filter(o => o.currentValue >= o.targetValue && o.targetValue > 0).length}</p>
                  <p className="text-sm text-gray-600">{nl ? 'Behaald' : fr ? 'Atteints' : 'Achieved'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Objectives list */}
      {objectives.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <Target className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {nl ? 'Geen doelen ingesteld' : fr ? 'Aucun objectif défini' : 'No goals set yet'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              {nl ? 'Voeg je eerste strategisch doel toe om je marketing voortgang te volgen' : fr ? 'Ajoutez votre premier objectif stratégique pour suivre vos progrès marketing' : 'Add your first strategic goal to start tracking your marketing progress'}
            </p>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              {nl ? 'Eerste Doel Toevoegen' : fr ? 'Ajouter le Premier Objectif' : 'Add First Goal'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{nl ? 'Strategische Doelen' : fr ? 'Objectifs Stratégiques' : 'Strategic Objectives'}</h2>
            <Button variant="outline" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              {nl ? 'Doel Toevoegen' : fr ? 'Ajouter un Objectif' : 'Add Goal'}
            </Button>
          </div>

          {objectives.map((obj, index) => {
            const typeInfo = OBJECTIVE_TYPES.find(t => t.value === obj.objectiveType) || OBJECTIVE_TYPES[4];
            const progressPct = obj.targetValue > 0 ? Math.min(100, Math.round((obj.currentValue / obj.targetValue) * 100)) : 0;

            return (
              <Card key={obj.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
                      <typeInfo.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={obj.title}
                        onChange={(e) => handleUpdate(index, 'title', e.target.value)}
                        placeholder={nl ? 'Doeltitel...' : fr ? 'Titre de l\'objectif...' : 'Objective title...'}
                        className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={PRIORITY_COLORS[obj.priority] || PRIORITY_COLORS.medium}>
                      {obj.priority}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={obj.description}
                    onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                    placeholder={nl ? 'Beschrijf dit doel...' : fr ? 'Décrivez cet objectif...' : 'Describe this objective...'}
                    rows={2}
                    className="text-sm"
                  />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">{nl ? 'Type' : fr ? 'Type' : 'Type'}</Label>
                      <select
                        value={obj.objectiveType}
                        onChange={(e) => handleUpdate(index, 'objectiveType', e.target.value)}
                        className="w-full px-2 py-1.5 border rounded-md text-sm"
                      >
                        {OBJECTIVE_TYPES.map(t => (
                          <option key={t.value} value={t.value}>
                            {nl ? t.labelNl : fr ? t.labelFr : t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{nl ? 'Prioriteit' : fr ? 'Priorité' : 'Priority'}</Label>
                      <select
                        value={obj.priority}
                        onChange={(e) => handleUpdate(index, 'priority', e.target.value)}
                        className="w-full px-2 py-1.5 border rounded-md text-sm"
                      >
                        <option value="critical">{nl ? 'Kritisch' : fr ? 'Critique' : 'Critical'}</option>
                        <option value="high">{nl ? 'Hoog' : fr ? 'Haute' : 'High'}</option>
                        <option value="medium">{nl ? 'Gemiddeld' : fr ? 'Moyenne' : 'Medium'}</option>
                        <option value="low">{nl ? 'Laag' : fr ? 'Basse' : 'Low'}</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{nl ? 'Doelwaarde' : fr ? 'Valeur Cible' : 'Target Value'}</Label>
                      <Input
                        type="number"
                        value={obj.targetValue || ''}
                        onChange={(e) => handleUpdate(index, 'targetValue', Number(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{nl ? 'Huidige Waarde' : fr ? 'Valeur Actuelle' : 'Current Value'}</Label>
                      <Input
                        type="number"
                        value={obj.currentValue || ''}
                        onChange={(e) => handleUpdate(index, 'currentValue', Number(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{nl ? 'Voortgang' : fr ? 'Progrès' : 'Progress'}</span>
                      <span>{progressPct}%{obj.unit ? ` (${obj.currentValue}/${obj.targetValue} ${obj.unit})` : ''}</span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-8">
        <Button variant="outline" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Save className="w-4 h-4 mr-2" />
          {nl ? 'Opslaan' : fr ? 'Enregistrer' : 'Save'}
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/app/setup/audience')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            {nl ? 'Terug' : fr ? 'Retour' : 'Back'}
          </Button>
          <Button onClick={handleNext} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {nl ? 'Opslaan & Doorgaan' : fr ? 'Enregistrer & Continuer' : 'Save & Continue'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
