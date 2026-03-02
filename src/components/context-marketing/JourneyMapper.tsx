import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface JourneyStage {
  name: string;
  touchpoints: string;
  emotions: string;
  actions: string;
}

interface JourneyMapperProps {
  personaId?: string;
  stages?: JourneyStage[];
  onChange: (stages: JourneyStage[]) => void;
}

const DEFAULT_STAGES: JourneyStage[] = [
  { name: 'Awareness', touchpoints: '', emotions: '', actions: '' },
  { name: 'Consideration', touchpoints: '', emotions: '', actions: '' },
  { name: 'Decision', touchpoints: '', emotions: '', actions: '' },
  { name: 'Retention', touchpoints: '', emotions: '', actions: '' },
  { name: 'Advocacy', touchpoints: '', emotions: '', actions: '' },
];

export default function JourneyMapper({ stages, onChange }: JourneyMapperProps) {
  const [journeyStages, setJourneyStages] = useState<JourneyStage[]>(
    stages || DEFAULT_STAGES
  );

  const updateStage = (index: number, field: keyof JourneyStage, value: string) => {
    const updated = [...journeyStages];
    updated[index] = { ...updated[index], [field]: value };
    setJourneyStages(updated);
    onChange(updated);
  };

  const addStage = () => {
    const updated = [...journeyStages, { name: '', touchpoints: '', emotions: '', actions: '' }];
    setJourneyStages(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {journeyStages.map((stage, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap px-3 py-1 bg-muted rounded-full">
              {stage.name || `Stage ${index + 1}`}
            </span>
            {index < journeyStages.length - 1 && (
              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {journeyStages.map((stage, index) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              <Input
                value={stage.name}
                onChange={(e) => updateStage(index, 'name', e.target.value)}
                placeholder="Stage name"
                className="font-semibold"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Touchpoints</Label>
              <Textarea
                value={stage.touchpoints}
                onChange={(e) => updateStage(index, 'touchpoints', e.target.value)}
                placeholder="How do they interact at this stage?"
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Emotions</Label>
              <Input
                value={stage.emotions}
                onChange={(e) => updateStage(index, 'emotions', e.target.value)}
                placeholder="How do they feel?"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Actions</Label>
              <Textarea
                value={stage.actions}
                onChange={(e) => updateStage(index, 'actions', e.target.value)}
                placeholder="What actions do they take?"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addStage} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Stage
      </Button>
    </div>
  );
}
