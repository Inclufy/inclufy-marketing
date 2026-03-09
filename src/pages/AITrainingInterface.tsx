import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Upload,
  RefreshCw,
  BarChart3,
  FileText,
  Database,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

const AITrainingInterface = () => {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  const [trainingProgress, setTrainingProgress] = useState(73);
  const [selectedModel, setSelectedModel] = useState("content-optimizer");

  const models = [
    {
      id: "content-optimizer",
      name: "Content Optimizer",
      accuracy: 89,
      lastUpdated: "2 hours ago",
      status: "active",
      trainingSessions: 1234
    },
    {
      id: "audience-predictor",
      name: "Audience Predictor",
      accuracy: 92,
      lastUpdated: "1 day ago",
      status: "active",
      trainingSessions: 892
    },
    {
      id: "campaign-analyzer",
      name: "Campaign Analyzer",
      accuracy: 87,
      lastUpdated: "3 days ago",
      status: "training",
      trainingSessions: 567
    }
  ];

  const selectedModelData = models.find(m => m.id === selectedModel);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{nl ? "AI Trainingscentrum" : fr ? "Centre d'Entraînement IA" : "AI Training Center"}</h1>
            <p className="text-muted-foreground">{nl ? "Train en verbeter je AI-modellen met echte data" : fr ? "Entraînez et améliorez vos modèles IA avec des données réelles" : "Train and improve your AI models with real data"}</p>
          </div>
        </div>
        <Button size="lg" className="gap-2">
          <Upload className="h-5 w-5" />
          {nl ? "Trainingsdata Uploaden" : fr ? "Télécharger Données d'Entraînement" : "Upload Training Data"}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{nl ? "Model Nauwkeurigheid" : fr ? "Précision du Modèle" : "Model Accuracy"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {nl ? "+3% sinds vorige week" : fr ? "+3% depuis la semaine dernière" : "+3% from last week"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{nl ? "Trainingssessies" : fr ? "Sessions d'Entraînement" : "Training Sessions"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,693</div>
            <p className="text-xs text-muted-foreground">{nl ? "Over alle modellen" : fr ? "Sur tous les modèles" : "Across all models"}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{nl ? "Datapunten" : fr ? "Points de Données" : "Data Points"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2M</div>
            <p className="text-xs text-muted-foreground">{nl ? "Trainingsvoorbeelden" : fr ? "Échantillons d'entraînement" : "Training samples"}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{nl ? "Laatst Bijgewerkt" : fr ? "Dernière Mise à Jour" : "Last Updated"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nl ? "2u geleden" : fr ? "Il y a 2h" : "2h ago"}</div>
            <p className="text-xs text-muted-foreground">{nl ? "Auto-training ingeschakeld" : fr ? "Entraînement automatique activé" : "Auto-training enabled"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Model List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{nl ? "AI Modellen" : fr ? "Modèles IA" : "AI Models"}</CardTitle>
            <CardDescription>{nl ? "Selecteer een model om details te bekijken" : fr ? "Sélectionnez un modèle pour voir les détails" : "Select a model to view details"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {models.map((model) => (
              <div
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedModel === model.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{model.name}</h4>
                  <Badge 
                    variant={model.status === 'active' ? 'default' : 'secondary'}
                    className="gap-1"
                  >
                    {model.status === 'active' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {model.status === 'active' ? (nl ? "actief" : fr ? "actif" : "active") : (nl ? "training" : fr ? "entraînement" : "training")}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{nl ? "Nauwkeurigheid" : fr ? "Précision" : "Accuracy"}</span>
                    <span className="font-medium">{model.accuracy}%</span>
                  </div>
                  <Progress value={model.accuracy} className="h-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Model Details */}
        {selectedModelData && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedModelData.name}</CardTitle>
                  <CardDescription>{nl ? "Modelprestaties en trainingsdetails" : fr ? "Performances du modèle et détails d'entraînement" : "Model performance and training details"}</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {nl ? "Hertrain" : fr ? "Ré-entraîner" : "Retrain"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Training Progress */}
              {selectedModelData.status === 'training' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">{nl ? "Trainingsvoortgang" : fr ? "Progression de l'Entraînement" : "Training Progress"}</h3>
                    <span className="text-sm text-muted-foreground">{trainingProgress}%</span>
                  </div>
                  <Progress value={trainingProgress} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {nl ? "Geschatte resterende tijd: 23 minuten" : fr ? "Temps restant estimé : 23 minutes" : "Estimated time remaining: 23 minutes"}
                  </p>
                </div>
              )}

              {/* Performance Metrics */}
              <div>
                <h3 className="text-sm font-medium mb-4">{nl ? "Prestatiestatistieken" : fr ? "Métriques de Performance" : "Performance Metrics"}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{nl ? "Precisie" : fr ? "Précision" : "Precision"}</span>
                    </div>
                    <div className="text-2xl font-bold">91.2%</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{nl ? "Snelheid" : fr ? "Vitesse" : "Speed"}</span>
                    </div>
                    <div className="text-2xl font-bold">124ms</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">{nl ? "Trainingsdata" : fr ? "Données d'Entraînement" : "Training Data"}</span>
                    </div>
                    <div className="text-2xl font-bold">423K</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">{nl ? "Parameters" : fr ? "Paramètres" : "Parameters"}</span>
                    </div>
                    <div className="text-2xl font-bold">2.3M</div>
                  </div>
                </div>
              </div>

              {/* Recent Training Sessions */}
              <div>
                <h3 className="text-sm font-medium mb-4">{nl ? "Recente Trainingssessies" : fr ? "Sessions d'Entraînement Récentes" : "Recent Training Sessions"}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">{nl ? "2 uur geleden" : fr ? "Il y a 2 heures" : "2 hours ago"}</span>
                    <span>{nl ? "Succesvol getraind op 12K nieuwe voorbeelden" : fr ? "Entraîné avec succès sur 12K nouveaux échantillons" : "Successfully trained on 12K new samples"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">{nl ? "1 dag geleden" : fr ? "Il y a 1 jour" : "1 day ago"}</span>
                    <span>{nl ? "Modeloptimalisatie voltooid (+3% nauwkeurigheid)" : fr ? "Optimisation du modèle terminée (+3% précision)" : "Model optimization completed (+3% accuracy)"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-muted-foreground">{nl ? "2 dagen geleden" : fr ? "Il y a 2 jours" : "2 days ago"}</span>
                    <span>{nl ? "Training gepauzeerd - onvoldoende datakwaliteit" : fr ? "Entraînement en pause - qualité des données insuffisante" : "Training paused - insufficient data quality"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Training Data Upload */}
      <Card>
        <CardHeader>
          <CardTitle>{nl ? "Trainingsdata" : fr ? "Données d'Entraînement" : "Training Data"}</CardTitle>
          <CardDescription>{nl ? "Upload nieuwe trainingsdata om modelprestaties te verbeteren" : fr ? "Téléchargez de nouvelles données d'entraînement pour améliorer les performances du modèle" : "Upload new training data to improve model performance"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent/50 cursor-pointer transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{nl ? "Sleep trainingsbestanden hierheen" : fr ? "Déposez les fichiers d'entraînement ici" : "Drop training files here"}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {nl ? "Ondersteuning voor CSV, JSON en TXT bestanden tot 100MB" : fr ? "Prise en charge des fichiers CSV, JSON et TXT jusqu'à 100 Mo" : "Support for CSV, JSON, and TXT files up to 100MB"}
            </p>
            <Button variant="secondary">{nl ? "Bestanden Bladeren" : fr ? "Parcourir les Fichiers" : "Browse Files"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Missing import
import { TrendingUp } from "lucide-react";

export default AITrainingInterface;