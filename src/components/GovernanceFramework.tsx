// src/components/context-marketing/GovernanceFramework.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Save, 
  Plus, 
  X, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Users,
  Gavel,
  Lock,
  UserCheck,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { businessContextService } from '@/services/context-marketing/business-context.service';
import { toast } from 'sonner';

interface GovernanceFrameworkProps {
  onUpdate: () => void;
}

interface ApprovalLevel {
  level: number;
  role: string;
  threshold: string;
  description: string;
}

interface ComplianceRequirement {
  name: string;
  type: string;
  status: 'compliant' | 'in_progress' | 'non_compliant';
  description: string;
}

interface Policy {
  name: string;
  category: string;
  status: 'active' | 'draft' | 'review';
  lastReviewed: string;
}

interface GovernanceBody {
  name: string;
  type: string;
  frequency: string;
  members: string[];
}

export function GovernanceFramework({ onUpdate }: GovernanceFrameworkProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    decision_framework: '',
    risk_tolerance: 'moderate',
    approval_levels: [] as ApprovalLevel[],
    compliance_requirements: [] as ComplianceRequirement[],
    key_policies: [] as Policy[],
    governance_bodies: [] as GovernanceBody[],
    reporting_structure: {
      board_reporting: '',
      executive_reporting: '',
      operational_reporting: ''
    }
  });

  // Form inputs for new items
  const [newApproval, setNewApproval] = useState<ApprovalLevel>({ 
    level: 1, role: '', threshold: '', description: '' 
  });
  const [newCompliance, setNewCompliance] = useState<ComplianceRequirement>({ 
    name: '', type: 'regulatory', status: 'in_progress', description: '' 
  });
  const [newPolicy, setNewPolicy] = useState<Policy>({ 
    name: '', category: 'operational', status: 'draft', lastReviewed: new Date().toISOString().split('T')[0] 
  });
  const [newBody, setNewBody] = useState<GovernanceBody>({ 
    name: '', type: 'committee', frequency: 'monthly', members: [] 
  });
  const [newMember, setNewMember] = useState('');

  useEffect(() => {
    loadGovernance();
  }, []);

  const loadGovernance = async () => {
    try {
      setLoading(true);
      const framework = await businessContextService.getGovernanceFramework();
      if (framework) {
        setFormData({
          ...formData,
          ...framework,
          approval_levels: framework.approval_levels || [],
          compliance_requirements: framework.compliance_requirements || [],
          key_policies: framework.key_policies || [],
          governance_bodies: framework.governance_bodies || [],
          reporting_structure: framework.reporting_structure || {
            board_reporting: '',
            executive_reporting: '',
            operational_reporting: ''
          }
        });
      }
    } catch (error) {
      console.error('Error loading governance:', error);
      toast.error('Failed to load governance framework');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await businessContextService.saveGovernanceFramework(formData);
      toast.success('Governance framework saved successfully');
      onUpdate();
    } catch (error) {
      console.error('Error saving governance:', error);
      toast.error('Failed to save governance framework');
    } finally {
      setSaving(false);
    }
  };

  const addApprovalLevel = () => {
    if (newApproval.role && newApproval.threshold) {
      setFormData({
        ...formData,
        approval_levels: [...formData.approval_levels, newApproval].sort((a, b) => a.level - b.level)
      });
      setNewApproval({ level: formData.approval_levels.length + 2, role: '', threshold: '', description: '' });
    }
  };

  const removeApprovalLevel = (index: number) => {
    setFormData({
      ...formData,
      approval_levels: formData.approval_levels.filter((_, i) => i !== index)
    });
  };

  const addCompliance = () => {
    if (newCompliance.name) {
      setFormData({
        ...formData,
        compliance_requirements: [...formData.compliance_requirements, newCompliance]
      });
      setNewCompliance({ name: '', type: 'regulatory', status: 'in_progress', description: '' });
    }
  };

  const removeCompliance = (index: number) => {
    setFormData({
      ...formData,
      compliance_requirements: formData.compliance_requirements.filter((_, i) => i !== index)
    });
  };

  const addPolicy = () => {
    if (newPolicy.name) {
      setFormData({
        ...formData,
        key_policies: [...formData.key_policies, newPolicy]
      });
      setNewPolicy({ 
        name: '', 
        category: 'operational', 
        status: 'draft', 
        lastReviewed: new Date().toISOString().split('T')[0] 
      });
    }
  };

  const removePolicy = (index: number) => {
    setFormData({
      ...formData,
      key_policies: formData.key_policies.filter((_, i) => i !== index)
    });
  };

  const addGovernanceBody = () => {
    if (newBody.name) {
      setFormData({
        ...formData,
        governance_bodies: [...formData.governance_bodies, newBody]
      });
      setNewBody({ name: '', type: 'committee', frequency: 'monthly', members: [] });
    }
  };

  const removeGovernanceBody = (index: number) => {
    setFormData({
      ...formData,
      governance_bodies: formData.governance_bodies.filter((_, i) => i !== index)
    });
  };

  const addMemberToBody = () => {
    if (newMember) {
      setNewBody({
        ...newBody,
        members: [...newBody.members, newMember]
      });
      setNewMember('');
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'non_compliant':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getComplianceBadgeVariant = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'non_compliant':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading governance framework...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Governance Framework</CardTitle>
              <CardDescription>
                Define decision rights, compliance requirements, and risk management
              </CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Framework
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="approvals">Approvals</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
              <TabsTrigger value="bodies">Bodies</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  A strong governance framework ensures consistent decision-making and compliance across your organization.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="decision_framework">Decision-Making Framework</Label>
                <Textarea
                  id="decision_framework"
                  value={formData.decision_framework}
                  onChange={(e) => setFormData({ ...formData, decision_framework: e.target.value })}
                  placeholder="Describe how decisions are made in your organization, including key principles and processes..."
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="risk_tolerance">Risk Tolerance</Label>
                <Select
                  value={formData.risk_tolerance}
                  onValueChange={(value) => setFormData({ ...formData, risk_tolerance: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative - Minimize risk exposure</SelectItem>
                    <SelectItem value="moderate">Moderate - Balanced risk approach</SelectItem>
                    <SelectItem value="aggressive">Aggressive - Accept higher risk for growth</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Reporting Structure</h3>
                
                <div>
                  <Label htmlFor="board_reporting">Board Reporting</Label>
                  <Textarea
                    id="board_reporting"
                    value={formData.reporting_structure.board_reporting}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      reporting_structure: {
                        ...formData.reporting_structure,
                        board_reporting: e.target.value
                      }
                    })}
                    placeholder="How and when does the organization report to the board?"
                    rows={2}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="executive_reporting">Executive Reporting</Label>
                  <Textarea
                    id="executive_reporting"
                    value={formData.reporting_structure.executive_reporting}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      reporting_structure: {
                        ...formData.reporting_structure,
                        executive_reporting: e.target.value
                      }
                    })}
                    placeholder="Executive team reporting cadence and structure"
                    rows={2}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="operational_reporting">Operational Reporting</Label>
                  <Textarea
                    id="operational_reporting"
                    value={formData.reporting_structure.operational_reporting}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      reporting_structure: {
                        ...formData.reporting_structure,
                        operational_reporting: e.target.value
                      }
                    })}
                    placeholder="Day-to-day operational reporting structure"
                    rows={2}
                    className="mt-2"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="approvals" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Approval Hierarchy</h3>
                <div className="space-y-3">
                  {formData.approval_levels.map((level, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center font-bold text-purple-600">
                        {level.level}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{level.role}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Approval limit: {level.threshold}
                        </div>
                        {level.description && (
                          <div className="text-sm text-gray-500 mt-1">{level.description}</div>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeApprovalLevel(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Add Approval Level</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Level (1, 2, 3...)"
                      value={newApproval.level}
                      onChange={(e) => setNewApproval({ 
                        ...newApproval, 
                        level: parseInt(e.target.value) || 1 
                      })}
                      className="w-32"
                    />
                    <Input
                      placeholder="Role (e.g., Manager, Director)"
                      value={newApproval.role}
                      onChange={(e) => setNewApproval({ ...newApproval, role: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Approval threshold (e.g., Up to $10,000)"
                      value={newApproval.threshold}
                      onChange={(e) => setNewApproval({ ...newApproval, threshold: e.target.value })}
                      className="flex-1"
                    />
                    <Button onClick={addApprovalLevel} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Description (optional)"
                    value={newApproval.description}
                    onChange={(e) => setNewApproval({ ...newApproval, description: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Compliance Requirements</h3>
                <div className="space-y-3">
                  {formData.compliance_requirements.map((req, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center justify-center">
                        {getComplianceIcon(req.status)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{req.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {req.type} requirement
                        </div>
                        {req.description && (
                          <div className="text-sm text-gray-500 mt-1">{req.description}</div>
                        )}
                      </div>
                      <Badge variant={getComplianceBadgeVariant(req.status)}>
                        {req.status.replace('_', ' ')}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeCompliance(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Add Compliance Requirement</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Requirement name"
                      value={newCompliance.name}
                      onChange={(e) => setNewCompliance({ ...newCompliance, name: e.target.value })}
                    />
                    <Select
                      value={newCompliance.type}
                      onValueChange={(value) => setNewCompliance({ ...newCompliance, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regulatory">Regulatory</SelectItem>
                        <SelectItem value="industry">Industry Standard</SelectItem>
                        <SelectItem value="certification">Certification</SelectItem>
                        <SelectItem value="contractual">Contractual</SelectItem>
                        <SelectItem value="internal">Internal Policy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3">
                    <Select
                      value={newCompliance.status}
                      onValueChange={(value: any) => setNewCompliance({ ...newCompliance, status: value })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compliant">Compliant</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Description"
                      value={newCompliance.description}
                      onChange={(e) => setNewCompliance({ ...newCompliance, description: e.target.value })}
                      className="flex-1"
                    />
                    <Button onClick={addCompliance} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="policies" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Key Policies</h3>
                <div className="space-y-3">
                  {formData.key_policies.map((policy, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <div className="font-medium">{policy.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {policy.category} policy • Last reviewed: {new Date(policy.lastReviewed).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant={policy.status === 'active' ? 'default' : 'secondary'}>
                        {policy.status}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removePolicy(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Add Policy</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Policy name"
                      value={newPolicy.name}
                      onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                    />
                    <Select
                      value={newPolicy.category}
                      onValueChange={(value) => setNewPolicy({ ...newPolicy, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="hr">Human Resources</SelectItem>
                        <SelectItem value="it">Information Technology</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="risk">Risk Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3">
                    <Select
                      value={newPolicy.status}
                      onValueChange={(value: any) => setNewPolicy({ ...newPolicy, status: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="review">Under Review</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={newPolicy.lastReviewed}
                      onChange={(e) => setNewPolicy({ ...newPolicy, lastReviewed: e.target.value })}
                      className="w-40"
                    />
                    <Button onClick={addPolicy} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bodies" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Governance Bodies</h3>
                <div className="space-y-3">
                  {formData.governance_bodies.map((body, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Users className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <div className="font-medium">{body.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {body.type} • Meets {body.frequency}
                            </div>
                            {body.members.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium mb-1">Members:</p>
                                <div className="flex flex-wrap gap-2">
                                  {body.members.map((member, idx) => (
                                    <Badge key={idx} variant="outline">
                                      {member}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeGovernanceBody(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Add Governance Body</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Body name"
                      value={newBody.name}
                      onChange={(e) => setNewBody({ ...newBody, name: e.target.value })}
                    />
                    <Select
                      value={newBody.type}
                      onValueChange={(value) => setNewBody({ ...newBody, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="board">Board</SelectItem>
                        <SelectItem value="committee">Committee</SelectItem>
                        <SelectItem value="council">Council</SelectItem>
                        <SelectItem value="workgroup">Work Group</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Select
                    value={newBody.frequency}
                    onValueChange={(value) => setNewBody({ ...newBody, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="space-y-2">
                    <Label>Members</Label>
                    {newBody.members.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {newBody.members.map((member, idx) => (
                          <Badge key={idx} variant="secondary">
                            {member}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add member name/role"
                        value={newMember}
                        onChange={(e) => setNewMember(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addMemberToBody()}
                      />
                      <Button onClick={addMemberToBody} size="icon" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Button onClick={addGovernanceBody} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Governance Body
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}