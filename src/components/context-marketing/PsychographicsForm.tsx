import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PsychographicsFormProps {
  data?: any;
  onChange: (data: any) => void;
}

export default function PsychographicsForm({ data = {}, onChange }: PsychographicsFormProps) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="values">Core Values</Label>
        <Textarea
          id="values"
          placeholder="e.g., Sustainability, innovation, quality over quantity"
          value={data.values || ''}
          onChange={(e) => handleChange('values', e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="interests">Interests & Hobbies</Label>
        <Textarea
          id="interests"
          placeholder="e.g., Technology, fitness, travel, cooking"
          value={data.interests || ''}
          onChange={(e) => handleChange('interests', e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lifestyle">Lifestyle</Label>
        <Input
          id="lifestyle"
          placeholder="e.g., Health-conscious urban professional"
          value={data.lifestyle || ''}
          onChange={(e) => handleChange('lifestyle', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pain-points">Pain Points</Label>
        <Textarea
          id="pain-points"
          placeholder="What frustrations or challenges do they face?"
          value={data.painPoints || ''}
          onChange={(e) => handleChange('painPoints', e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="motivations">Motivations</Label>
        <Textarea
          id="motivations"
          placeholder="What drives their decisions and behavior?"
          value={data.motivations || ''}
          onChange={(e) => handleChange('motivations', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}
