// src/components/context-marketing/OrganizationChart.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  ChevronDown,
  ChevronRight,
  Building,
  Briefcase,
  UserCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { businessContextService } from '@/services/context-marketing/business-context.service';
import { toast } from 'sonner';

interface OrgNode {
  id: string;
  entity_name: string;
  entity_type: string;
  parent_id?: string;
  legal_name?: string;
  description?: string;
  employee_count?: number;
  children?: OrgNode[];
}

interface OrganizationChartProps {
  onUpdate: () => void;
}

export function OrganizationChart({ onUpdate }: OrganizationChartProps) {
  const [orgTree, setOrgTree] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null);
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_type: 'division',
    parent_id: '',
    legal_name: '',
    description: '',
    employee_count: 0
  });

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      const data = await businessContextService.getOrganizationStructure();
      setOrgTree(data);
    } catch (error) {
      console.error('Error loading organization:', error);
      toast.error('Failed to load organization structure');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingNode) {
        await businessContextService.updateOrganization(editingNode.id, formData);
        toast.success('Organization updated');
      } else {
        await businessContextService.createOrganization(formData);
        toast.success('Organization entity created');
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadOrganization();
      onUpdate();
    } catch (error) {
      console.error('Error saving organization:', error);
      toast.error('Failed to save organization entity');
    }
  };

  const resetForm = () => {
    setFormData({
      entity_name: '',
      entity_type: 'division',
      parent_id: '',
      legal_name: '',
      description: '',
      employee_count: 0
    });
    setEditingNode(null);
  };

  const openEditDialog = (node: OrgNode) => {
    setEditingNode(node);
    setFormData({
      entity_name: node.entity_name,
      entity_type: node.entity_type,
      parent_id: node.parent_id || '',
      legal_name: node.legal_name || '',
      description: node.description || '',
      employee_count: node.employee_count || 0
    });
    setIsDialogOpen(true);
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'holding':
        return <Building className="w-4 h-4" />;
      case 'subsidiary':
        return <Building2 className="w-4 h-4" />;
      case 'division':
        return <Briefcase className="w-4 h-4" />;
      case 'team':
        return <Users className="w-4 h-4" />;
      default:
        return <UserCircle className="w-4 h-4" />;
    }
  };

  const OrgNodeComponent = ({ node, level = 0 }: { node: OrgNode; level?: number }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: level * 0.1 }}
        className={`${level > 0 ? 'ml-8' : ''}`}
      >
        <div className="flex items-center gap-2 mb-2">
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          
          <div className="flex-1 flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              level === 0 
                ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              {getEntityIcon(node.entity_type)}
            </div>
            
            <div className="flex-1">
              <div className="font-medium">{node.entity_name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {node.entity_type.charAt(0).toUpperCase() + node.entity_type.slice(1)}
                {node.employee_count && ` • ${node.employee_count} employees`}
              </div>
              {node.description && (
                <div className="text-xs text-gray-500 mt-1">{node.description}</div>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => openEditDialog(node)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setFormData({ ...formData, parent_id: node.id });
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="space-y-2">
            {node.children!.map((child) => (
              <OrgNodeComponent key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Organization Structure</CardTitle>
              <CardDescription>
                Define your organization's hierarchy and entities
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Entity
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading organization structure...</div>
            </div>
          ) : orgTree.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">No organization structure defined</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start by adding your main organization entity
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Entity
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orgTree.map((node) => (
                <OrgNodeComponent key={node.id} node={node} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNode ? 'Edit Organization Entity' : 'Add Organization Entity'}
            </DialogTitle>
            <DialogDescription>
              Define an entity within your organization structure
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="entity_name">Entity Name *</Label>
              <Input
                id="entity_name"
                value={formData.entity_name}
                onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
                placeholder="e.g., Marketing Department, ACME Holdings"
              />
            </div>

            <div>
              <Label htmlFor="entity_type">Entity Type *</Label>
              <Select
                value={formData.entity_type}
                onValueChange={(value) => setFormData({ ...formData, entity_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="holding">Holding Company</SelectItem>
                  <SelectItem value="subsidiary">Subsidiary</SelectItem>
                  <SelectItem value="division">Division</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="legal_name">Legal Name</Label>
              <Input
                id="legal_name"
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                placeholder="Official registered name (if applicable)"
              />
            </div>

            <div>
              <Label htmlFor="employee_count">Employee Count</Label>
              <Input
                id="employee_count"
                type="number"
                value={formData.employee_count}
                onChange={(e) => setFormData({ ...formData, employee_count: parseInt(e.target.value) || 0 })}
                placeholder="Number of employees"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this entity's role"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.entity_name}>
              {editingNode ? 'Update' : 'Create'} Entity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}