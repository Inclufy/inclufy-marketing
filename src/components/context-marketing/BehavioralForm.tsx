import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BehavioralFormProps {
  data?: any;
  onChange: (data: any) => void;
}

export default function BehavioralForm({ data = {}, onChange }: BehavioralFormProps) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="purchase-frequency">Purchase Frequency</Label>
        <Select
          value={data.purchaseFrequency || ''}
          onValueChange={(value) => handleChange('purchaseFrequency', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="How often do they buy?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="annually">Annually</SelectItem>
            <SelectItem value="one-time">One-time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred-channels">Preferred Channels</Label>
        <Input
          id="preferred-channels"
          placeholder="e.g., Email, social media, in-store, mobile app"
          value={data.preferredChannels || ''}
          onChange={(e) => handleChange('preferredChannels', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brand-loyalty">Brand Loyalty</Label>
        <Select
          value={data.brandLoyalty || ''}
          onValueChange={(value) => handleChange('brandLoyalty', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Loyalty level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="switcher">Brand Switcher</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="loyal">Brand Loyal</SelectItem>
            <SelectItem value="advocate">Brand Advocate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="decision-factors">Decision-Making Factors</Label>
        <Textarea
          id="decision-factors"
          placeholder="What influences their buying decisions? (e.g., price, quality, reviews, brand reputation)"
          value={data.decisionFactors || ''}
          onChange={(e) => handleChange('decisionFactors', e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content-preferences">Content Preferences</Label>
        <Input
          id="content-preferences"
          placeholder="e.g., Video tutorials, blog posts, infographics"
          value={data.contentPreferences || ''}
          onChange={(e) => handleChange('contentPreferences', e.target.value)}
        />
      </div>
    </div>
  );
}
