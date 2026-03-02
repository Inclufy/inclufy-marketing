// components/context-marketing/PersonaBuilder.tsx
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { audienceContextService, type Persona } from '@/services/context-marketing/audience-context.service';
import DemographicsForm from './DemographicsForm';
import PsychographicsForm from './PsychographicsForm';
import BehavioralForm from './BehavioralForm';
import JourneyMapper from './JourneyMapper';

export default function PersonaBuilder() {
  const [persona, setPersona] = useState<Partial<Persona>>({});
  const [activeTab, setActiveTab] = useState('demographics');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await audienceContextService.createPersona(persona);
      toast.success('Persona created successfully');
    } catch (error) {
      console.error('Failed to create persona:', error);
      toast.error('Failed to create persona');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="psychographics">Psychographics</TabsTrigger>
          <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
          <TabsTrigger value="journey">Journey</TabsTrigger>
        </TabsList>

        <TabsContent value="demographics">
          <DemographicsForm 
            data={persona.demographics}
            onChange={(demographics) => setPersona({...persona, demographics})}
          />
        </TabsContent>

        <TabsContent value="psychographics">
          <PsychographicsForm 
            data={persona.psychographics}
            onChange={(psychographics) => setPersona({...persona, psychographics})}
          />
        </TabsContent>

        <TabsContent value="behavioral">
          <BehavioralForm 
            data={persona.behavioral}
            onChange={(behavioral) => setPersona({...persona, behavioral})}
          />
        </TabsContent>

        <TabsContent value="journey">
          <JourneyMapper 
            personaId={persona.id}
            stages={persona.journeyStages}
            onChange={(journeyStages) => setPersona({...persona, journeyStages})}
          />
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Persona'}
        </Button>
      </div>
    </Card>
  );
}