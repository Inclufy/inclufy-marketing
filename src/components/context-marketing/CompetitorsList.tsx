// src/components/context-marketing/CompetitorsList.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Building2,
  Globe,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  ExternalLink,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { competitiveContextService, Competitor } from '@/services/context-marketing/competitive-context.service';
import { toast } from 'sonner';

interface CompetitorsListProps {
  competitors: Competitor[];
  onUpdate: () => void;
}

export default function CompetitorsList({ competitors, onUpdate }: CompetitorsListProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);
  const [formData, setFormData] = useState<Partial<Competitor>>({
    competitor_name: '',
    website_url: '',
    company_type: 'direct',
    market_share: 0,
    estimated_revenue: 0,
    employee_count: 0,
    founding_year: new Date().getFullYear(),
    headquarters_location: '',
    pricing_strategy: '',
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: []
  });
  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');

  const handleSubmit = async () => {
    try {
      if (editingCompetitor) {
        await competitiveContextService.updateCompetitor(editingCompetitor.id, formData);
        toast.success('Competitor updated successfully');
      } else {
        await competitiveContextService.createCompetitor(formData);
        toast.success('Competitor added successfully');
      }
      
      setShowAddDialog(false);
      setEditingCompetitor(null);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error saving competitor:', error);
      toast.error('Failed to save competitor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this competitor?')) return;

    try {
      await competitiveContextService.deleteCompetitor(id);
      toast.success('Competitor deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Error deleting competitor:', error);
      toast.error('Failed to delete competitor');
    }
  };

  const handleEdit = (competitor: Competitor) => {
    setEditingCompetitor(competitor);
    setFormData(competitor);
    setShowAddDialog(true);
  };

  const resetForm = () => {
    setFormData({
      competitor_name: '',
      website_url: '',
      company_type: 'direct',
      market_share: 0,
      estimated_revenue: 0,
      employee_count: 0,
      founding_year: new Date().getFullYear(),
      headquarters_location: '',
      pricing_strategy: '',
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: []
    });
    setNewStrength('');
    setNewWeakness('');
  };

  const addStrength = () => {
    if (newStrength.trim()) {
      setFormData({
        ...formData,
        strengths: [...(formData.strengths || []), newStrength.trim()]
      });
      setNewStrength('');
    }
  };

  const addWeakness = () => {
    if (newWeakness.trim()) {
      setFormData({
        ...formData,
        weaknesses: [...(formData.weaknesses || []), newWeakness.trim()]
      });
      setNewWeakness('');
    }
  };

  const removeStrength = (index: number) => {
    setFormData({
      ...formData,
      strengths: formData.strengths?.filter((_, i) => i !== index) || []
    });
  };

  const removeWeakness = (index: number) => {
    setFormData({
      ...formData,
      weaknesses: formData.weaknesses?.filter((_, i) => i !== index) || []
    });
  };

  const getCompanyTypeColor = (type: string) => {
    switch (type) {
      case 'direct': return 'destructive';
      case 'indirect': return 'secondary';
      case 'potential': return 'outline';
      case 'substitute': return 'default';
      default: return 'default';
    }
  };

  const getCompanyTypeIcon = (type: string) => {
    switch (type) {
      case 'direct': return '🎯';
      case 'indirect': return '🔄';
      case 'potential': return '🔮';
      case 'substitute': return '🔀';
      default: return '📊';
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Competitor Profiles</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track and analyze your competitive landscape
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setEditingCompetitor(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Competitor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCompetitor ? 'Edit Competitor' : 'Add New Competitor'}
              </DialogTitle>
              <DialogDescription>
                Track key information about your competitors
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Company Name*</Label>
                  <Input
                    id="name"
                    value={formData.competitor_name}
                    onChange={(e) => setFormData({ ...formData, competitor_name: e.target.value })}
                    placeholder="Competitor Corp"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder="https://competitor.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Competitor Type*</Label>
                  <Select 
                    value={formData.company_type}
                    onValueChange={(value: any) => setFormData({ ...formData, company_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct Competitor</SelectItem>
                      <SelectItem value="indirect">Indirect Competitor</SelectItem>
                      <SelectItem value="potential">Potential Competitor</SelectItem>
                      <SelectItem value="substitute">Substitute Solution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pricing">Pricing Strategy</Label>
                  <Select 
                    value={formData.pricing_strategy}
                    onValueChange={(value) => setFormData({ ...formData, pricing_strategy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="competitive">Competitive</SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                      <SelectItem value="freemium">Freemium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Market & Company Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="market_share">Market Share (%)</Label>
                  <Input
                    id="market_share"
                    type="number"
                    value={formData.market_share}
                    onChange={(e) => setFormData({ ...formData, market_share: parseFloat(e.target.value) || 0 })}
                    placeholder="15"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Label htmlFor="revenue">Est. Annual Revenue</Label>
                  <Input
                    id="revenue"
                    type="number"
                    value={formData.estimated_revenue}
                    onChange={(e) => setFormData({ ...formData, estimated_revenue: parseFloat(e.target.value) || 0 })}
                    placeholder="1000000"
                  />
                </div>
                <div>
                  <Label htmlFor="employees">Employee Count</Label>
                  <Input
                    id="employees"
                    type="number"
                    value={formData.employee_count}
                    onChange={(e) => setFormData({ ...formData, employee_count: parseInt(e.target.value) || 0 })}
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="founded">Founding Year</Label>
                  <Input
                    id="founded"
                    type="number"
                    value={formData.founding_year}
                    onChange={(e) => setFormData({ ...formData, founding_year: parseInt(e.target.value) || new Date().getFullYear() })}
                    placeholder="2010"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Headquarters</Label>
                  <Input
                    id="location"
                    value={formData.headquarters_location}
                    onChange={(e) => setFormData({ ...formData, headquarters_location: e.target.value })}
                    placeholder="San Francisco, CA"
                  />
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Strengths</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newStrength}
                        onChange={(e) => setNewStrength(e.target.value)}
                        placeholder="Add a strength"
                        onKeyPress={(e) => e.key === 'Enter' && addStrength()}
                      />
                      <Button size="sm" onClick={addStrength}>Add</Button>
                    </div>
                    <div className="space-y-1">
                      {formData.strengths?.map((strength, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary">{strength}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeStrength(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Weaknesses</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newWeakness}
                        onChange={(e) => setNewWeakness(e.target.value)}
                        placeholder="Add a weakness"
                        onKeyPress={(e) => e.key === 'Enter' && addWeakness()}
                      />
                      <Button size="sm" onClick={addWeakness}>Add</Button>
                    </div>
                    <div className="space-y-1">
                      {formData.weaknesses?.map((weakness, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">{weakness}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeWeakness(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false);
                setEditingCompetitor(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.competitor_name}>
                {editingCompetitor ? 'Update' : 'Add'} Competitor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {competitors.map((competitor, index) => (
          <motion.div
            key={competitor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span>{getCompanyTypeIcon(competitor.company_type)}</span>
                      {competitor.competitor_name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getCompanyTypeColor(competitor.company_type)}>
                        {competitor.company_type}
                      </Badge>
                      {competitor.market_share && competitor.market_share > 0 && (
                        <Badge variant="secondary">
                          {competitor.market_share}% market share
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {competitor.website_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                      >
                        <a href={competitor.website_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(competitor)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(competitor.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Company Info */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {competitor.employee_count && (
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        {competitor.employee_count.toLocaleString()} employees
                      </div>
                    )}
                    {competitor.founding_year && (
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        Founded {competitor.founding_year}
                      </div>
                    )}
                    {competitor.estimated_revenue && competitor.estimated_revenue > 0 && (
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4" />
                        ${(competitor.estimated_revenue / 1000000).toFixed(1)}M revenue
                      </div>
                    )}
                    {competitor.headquarters_location && (
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        {competitor.headquarters_location}
                      </div>
                    )}
                  </div>

                  {/* Strengths & Weaknesses Summary */}
                  {(competitor.strengths.length > 0 || competitor.weaknesses.length > 0) && (
                    <div className="space-y-2 pt-2 border-t">
                      {competitor.strengths.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                            Key Strengths ({competitor.strengths.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {competitor.strengths.slice(0, 3).map((strength, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {strength}
                              </Badge>
                            ))}
                            {competitor.strengths.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{competitor.strengths.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      {competitor.weaknesses.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                            Key Weaknesses ({competitor.weaknesses.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {competitor.weaknesses.slice(0, 3).map((weakness, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {weakness}
                              </Badge>
                            ))}
                            {competitor.weaknesses.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{competitor.weaknesses.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pricing Strategy */}
                  {competitor.pricing_strategy && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Pricing</span>
                      <Badge variant="outline" className="capitalize">
                        {competitor.pricing_strategy}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {competitors.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">No competitors tracked yet</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Start by adding your first competitor to monitor
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Competitor
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}