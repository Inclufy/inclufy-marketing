// src/components/CampaignReadinessGate.tsx
// Pre-launch readiness check modal shown when creating a new campaign if score < 60

import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCopilot } from '@/contexts/CopilotContext';
import { useCampaignReadiness, type ReadinessItem } from '@/hooks/useCampaignReadiness';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface CampaignReadinessGateProps {
  open: boolean;
  onClose: () => void;
  onProceedAnyway: () => void;
}

export default function CampaignReadinessGate({
  open,
  onClose,
  onProceedAnyway,
}: CampaignReadinessGateProps) {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const navigate = useNavigate();
  const { openCopilotWithContext } = useCopilot();
  const { score, items, missingItems, isLoading } = useCampaignReadiness();

  const getLabel = (item: ReadinessItem) =>
    nl ? item.label.nl : fr ? item.label.fr : item.label.en;

  const getDescription = (item: ReadinessItem) =>
    nl ? item.description.nl : fr ? item.description.fr : item.description.en;

  const getScoreColor = () => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const handleAIFix = (item: ReadinessItem) => {
    if (!item.aiFixable || !item.aiSystemPrompt) return;
    onClose();
    openCopilotWithContext({
      systemPrompt: item.aiSystemPrompt,
      firstMessage: item.aiFirstMessage,
    });
  };

  const aiFixableCount = missingItems.filter(i => i.aiFixable).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            {nl ? 'Campagne Gereedheidscheck' : fr ? 'Verification de disponibilite' : 'Campaign Readiness Check'}
          </DialogTitle>
          <DialogDescription>
            {nl
              ? 'Je marketing setup is nog niet compleet. Vul ontbrekende stappen in voor betere campagneresultaten.'
              : fr
                ? 'Votre configuration marketing n\'est pas encore complete. Completez les etapes manquantes pour de meilleurs resultats.'
                : 'Your marketing setup is not yet complete. Fill in missing steps for better campaign results.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Score */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className={`text-4xl font-bold ${getScoreColor()}`}>{score}%</div>
              <div>
                <p className="text-sm font-medium">
                  {nl ? 'Gereedheid' : fr ? 'Disponibilite' : 'Readiness'}
                </p>
                <p className="text-xs text-gray-500">
                  {nl
                    ? `${missingItems.length} van ${items.length} stappen ontbreken`
                    : fr
                      ? `${missingItems.length} sur ${items.length} etapes manquantes`
                      : `${missingItems.length} of ${items.length} steps missing`}
                </p>
              </div>
            </div>

            {/* Missing Items */}
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg ${
                    item.completed
                      ? 'bg-green-50 dark:bg-green-900/10'
                      : 'bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800'
                  }`}
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.completed ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-300'}`}>
                      {getLabel(item)}
                    </p>
                    {!item.completed && (
                      <p className="text-xs text-gray-500 mt-0.5">{getDescription(item)}</p>
                    )}
                  </div>
                  {!item.completed && (
                    item.aiFixable ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAIFix(item)}
                        className="h-7 px-2.5 text-xs text-purple-600 border-purple-200 hover:bg-purple-50 gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        AI Fix
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { onClose(); navigate(item.fixRoute); }}
                        className="h-7 px-2.5 text-xs gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {nl ? 'Instellen' : fr ? 'Configurer' : 'Set up'}
                      </Button>
                    )
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              {aiFixableCount > 0 && (
                <Button
                  onClick={() => {
                    const first = missingItems.find(i => i.aiFixable && i.aiSystemPrompt);
                    if (first) handleAIFix(first);
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {nl
                    ? `Laat AI ${aiFixableCount} ${aiFixableCount === 1 ? 'stap' : 'stappen'} invullen`
                    : fr
                      ? `Laisser l'IA completer ${aiFixableCount} etape${aiFixableCount > 1 ? 's' : ''}`
                      : `Let AI fill ${aiFixableCount} step${aiFixableCount > 1 ? 's' : ''}`}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onProceedAnyway}
                  className="flex-1"
                >
                  {nl ? 'Toch doorgaan' : fr ? 'Continuer quand meme' : 'Proceed anyway'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1"
                >
                  {nl ? 'Annuleren' : fr ? 'Annuler' : 'Cancel'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
