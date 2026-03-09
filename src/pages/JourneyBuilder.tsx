// src/pages/JourneyBuilder.tsx
import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Save, 
  Play, 
  Download,
  Upload,
  Zap, 
  Mail, 
  Clock, 
  Users, 
  Target,
  MessageSquare,
  GitBranch,
  Settings,
  Database,
  Server,
  FileText,
  CheckSquare,
  AlertCircle,
  Shield,
  Webhook,
  RefreshCw,
  Filter,
  Code,
  UserCheck,
  FileCheck,
  Layers
} from "lucide-react";

// Determine mode from route
function getMode(pathname: string): 'journey' | 'workflow' {
  return pathname.includes('workflow') ? 'workflow' : 'journey';
}

// Custom node components
const TriggerNode = ({ data }: NodeProps) => {
  const bgColor = data.mode === 'workflow' ? 'bg-purple-100 border-purple-300' : 'bg-blue-100 border-blue-300';
  const iconColor = data.mode === 'workflow' ? 'text-purple-600' : 'text-blue-600';
  
  return (
    <div className={`px-4 py-3 ${bgColor} border-2 rounded-lg min-w-[150px]`}>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <Zap className={`h-5 w-5 ${iconColor}`} />
        <div>
          <p className="text-sm font-semibold">Trigger</p>
          <p className="text-xs text-gray-600">{data.label}</p>
        </div>
      </div>
    </div>
  );
};

const ActionNode = ({ data }: NodeProps) => {
  const icons: { [key: string]: any } = {
    email: Mail,
    sms: MessageSquare,
    wait: Clock,
    api: Server,
    database: Database,
    transform: RefreshCw,
    validation: CheckSquare,
    webhook: Webhook,
  };
  const Icon = icons[data.actionType] || Mail;
  
  const bgColor = data.mode === 'workflow' ? 'bg-indigo-100 border-indigo-300' : 'bg-green-100 border-green-300';
  const iconColor = data.mode === 'workflow' ? 'text-indigo-600' : 'text-green-600';
  
  return (
    <div className={`px-4 py-3 ${bgColor} border-2 rounded-lg min-w-[150px]`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${iconColor}`} />
        <div>
          <p className="text-sm font-semibold">{data.actionType}</p>
          <p className="text-xs text-gray-600">{data.label}</p>
        </div>
      </div>
    </div>
  );
};

const DecisionNode = ({ data }: NodeProps) => {
  const bgColor = data.mode === 'workflow' ? 'bg-yellow-100 border-yellow-300' : 'bg-purple-100 border-purple-300';
  const iconColor = data.mode === 'workflow' ? 'text-yellow-600' : 'text-purple-600';
  
  return (
    <div className={`px-4 py-3 ${bgColor} border-2 rounded-lg min-w-[150px]`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} id="yes" style={{ top: '30%' }} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} id="no" style={{ top: '70%' }} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <GitBranch className={`h-5 w-5 ${iconColor}`} />
        <div>
          <p className="text-sm font-semibold">Decision</p>
          <p className="text-xs text-gray-600">{data.label}</p>
        </div>
      </div>
    </div>
  );
};

const GoalNode = ({ data }: NodeProps) => {
  const bgColor = data.mode === 'workflow' ? 'bg-green-100 border-green-300' : 'bg-orange-100 border-orange-300';
  const iconColor = data.mode === 'workflow' ? 'text-green-600' : 'text-orange-600';
  const Icon = data.mode === 'workflow' ? CheckSquare : Target;
  
  return (
    <div className={`px-4 py-3 ${bgColor} border-2 rounded-lg min-w-[150px]`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${iconColor}`} />
        <div>
          <p className="text-sm font-semibold">{data.mode === 'workflow' ? 'Complete' : 'Goal'}</p>
          <p className="text-xs text-gray-600">{data.label}</p>
        </div>
      </div>
    </div>
  );
};

const ApprovalNode = ({ data }: NodeProps) => {
  return (
    <div className="px-4 py-3 bg-amber-100 border-2 border-amber-300 rounded-lg min-w-[150px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} id="approved" style={{ top: '30%' }} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} id="rejected" style={{ top: '70%' }} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <UserCheck className="h-5 w-5 text-amber-600" />
        <div>
          <p className="text-sm font-semibold">Approval</p>
          <p className="text-xs text-gray-600">{data.label}</p>
        </div>
      </div>
    </div>
  );
};

const ErrorHandlerNode = ({ data }: NodeProps) => {
  return (
    <div className="px-4 py-3 bg-red-100 border-2 border-red-300 rounded-lg min-w-[150px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <div>
          <p className="text-sm font-semibold">Error Handler</p>
          <p className="text-xs text-gray-600">{data.label}</p>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  decision: DecisionNode,
  goal: GoalNode,
  approval: ApprovalNode,
  errorHandler: ErrorHandlerNode,
};

// Initial nodes for customer journey
const initialJourneyNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 100, y: 200 },
    data: { label: 'Form Submit', mode: 'journey' },
  },
  {
    id: '2',
    type: 'action',
    position: { x: 300, y: 200 },
    data: { label: 'Welcome Email', actionType: 'email', mode: 'journey' },
  },
  {
    id: '3',
    type: 'action',
    position: { x: 500, y: 200 },
    data: { label: 'Wait 2 days', actionType: 'wait', mode: 'journey' },
  },
  {
    id: '4',
    type: 'decision',
    position: { x: 700, y: 200 },
    data: { label: 'Opened Email?', mode: 'journey' },
  },
  {
    id: '5',
    type: 'action',
    position: { x: 900, y: 150 },
    data: { label: 'Send Follow-up', actionType: 'email', mode: 'journey' },
  },
  {
    id: '6',
    type: 'goal',
    position: { x: 1100, y: 200 },
    data: { label: 'Conversion', mode: 'journey' },
  },
];

// Initial nodes for workflow
const initialWorkflowNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 100, y: 200 },
    data: { label: 'API Request', mode: 'workflow' },
  },
  {
    id: '2',
    type: 'action',
    position: { x: 300, y: 200 },
    data: { label: 'Validate Data', actionType: 'validation', mode: 'workflow' },
  },
  {
    id: '3',
    type: 'action',
    position: { x: 500, y: 200 },
    data: { label: 'Query Database', actionType: 'database', mode: 'workflow' },
  },
  {
    id: '4',
    type: 'decision',
    position: { x: 700, y: 200 },
    data: { label: 'Data Found?', mode: 'workflow' },
  },
  {
    id: '5',
    type: 'action',
    position: { x: 900, y: 100 },
    data: { label: 'Transform Data', actionType: 'transform', mode: 'workflow' },
  },
  {
    id: '6',
    type: 'errorHandler',
    position: { x: 900, y: 300 },
    data: { label: 'Handle Error', mode: 'workflow' },
  },
  {
    id: '7',
    type: 'goal',
    position: { x: 1100, y: 200 },
    data: { label: 'Return Response', mode: 'workflow' },
  },
];

const initialJourneyEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
  { id: 'e4-5', source: '4', target: '5', sourceHandle: 'yes' },
  { id: 'e4-6', source: '4', target: '6', sourceHandle: 'no' },
  { id: 'e5-6', source: '5', target: '6' },
];

const initialWorkflowEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
  { id: 'e4-5', source: '4', target: '5', sourceHandle: 'yes' },
  { id: 'e4-6', source: '4', target: '6', sourceHandle: 'no' },
  { id: 'e5-7', source: '5', target: '7' },
  { id: 'e6-7', source: '6', target: '7' },
];

const JourneyBuilder = () => {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  const location = useLocation();
  const mode = getMode(location.pathname);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(
    mode === 'workflow' ? initialWorkflowNodes : initialJourneyNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    mode === 'workflow' ? initialWorkflowEdges : initialJourneyEdges
  );
  
  const [selectedItem, setSelectedItem] = useState(mode === 'workflow' ? 'order-processing' : 'new-customer');
  const [itemName, setItemName] = useState(
    mode === 'workflow' ? 'Order Processing Workflow' : 'New Customer Onboarding'
  );

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('nodeType');
      const actionType = event.dataTransfer.getData('actionType');
      const label = event.dataTransfer.getData('label');

      if (!type) return;

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 20,
      };

      const newNode: Node = {
        id: `${Date.now()}`,
        type,
        position,
        data: { label, actionType, mode },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, mode]
  );

  const saveItem = () => {
    const data = {
      id: selectedItem,
      name: itemName,
      nodes,
      edges,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${mode}-${selectedItem}`, JSON.stringify(data));
    alert(nl ? `${mode === 'workflow' ? 'Workflow' : 'Klantreis'} succesvol opgeslagen!` : fr ? `${mode === 'workflow' ? 'Workflow' : 'Parcours'} sauvegarde avec succes !` : `${mode === 'workflow' ? 'Workflow' : 'Journey'} saved successfully!`);
  };

  const exportItem = () => {
    const data = { name: itemName, nodes, edges, mode };
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${itemName.toLowerCase().replace(/ /g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Different node templates for journey vs workflow
  const journeyTemplates = [
    { type: 'trigger', label: 'Form Submit', icon: Zap, color: 'blue' },
    { type: 'action', actionType: 'email', label: 'Send Email', icon: Mail, color: 'green' },
    { type: 'action', actionType: 'sms', label: 'Send SMS', icon: MessageSquare, color: 'green' },
    { type: 'action', actionType: 'wait', label: 'Wait', icon: Clock, color: 'green' },
    { type: 'decision', label: 'Decision', icon: GitBranch, color: 'purple' },
    { type: 'goal', label: 'Goal', icon: Target, color: 'orange' },
  ];

  const workflowTemplates = [
    { type: 'trigger', label: 'API Trigger', icon: Zap, color: 'purple' },
    { type: 'action', actionType: 'api', label: 'API Call', icon: Server, color: 'indigo' },
    { type: 'action', actionType: 'database', label: 'Database', icon: Database, color: 'indigo' },
    { type: 'action', actionType: 'transform', label: 'Transform', icon: RefreshCw, color: 'indigo' },
    { type: 'action', actionType: 'validation', label: 'Validate', icon: CheckSquare, color: 'indigo' },
    { type: 'decision', label: 'Condition', icon: GitBranch, color: 'yellow' },
    { type: 'approval', label: 'Approval', icon: UserCheck, color: 'amber' },
    { type: 'errorHandler', label: 'Error Handler', icon: AlertCircle, color: 'red' },
    { type: 'goal', label: 'Complete', icon: CheckSquare, color: 'green' },
  ];

  const nodeTemplates = mode === 'workflow' ? workflowTemplates : journeyTemplates;

  // Different analytics for journey vs workflow
  const journeyAnalytics = (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">{nl ? 'Totaal ingeschreven' : fr ? 'Total inscrits' : 'Total Enrolled'}</p>
        <p className="text-2xl font-bold">0</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{nl ? 'Voltooid' : fr ? 'Termines' : 'Completed'}</p>
        <p className="text-2xl font-bold">0</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{nl ? 'Conversieratio' : fr ? 'Taux de conversion' : 'Conversion Rate'}</p>
        <p className="text-2xl font-bold">0%</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{nl ? 'Gem. tijd' : fr ? 'Temps moy.' : 'Avg. Time'}</p>
        <p className="text-2xl font-bold">–</p>
      </div>
    </div>
  );

  const workflowAnalytics = (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">{nl ? 'Totaal uitgevoerd' : fr ? "Total d'executions" : 'Total Executions'}</p>
        <p className="text-2xl font-bold">0</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{nl ? 'Slagingspercentage' : fr ? 'Taux de succes' : 'Success Rate'}</p>
        <p className="text-2xl font-bold">0%</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{nl ? 'Gem. duur' : fr ? 'Duree moy.' : 'Avg. Duration'}</p>
        <p className="text-2xl font-bold">–</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{nl ? 'Fouten vandaag' : fr ? "Erreurs aujourd'hui" : 'Errors Today'}</p>
        <p className="text-2xl font-bold">0</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none px-1"
            />
            <p className="text-sm text-muted-foreground">
              {mode === 'workflow'
                ? (nl ? 'Bouw geautomatiseerde workflows met API-integraties en dataverwerking' : fr ? 'Construisez des workflows automatises avec des integrations API et du traitement de donnees' : 'Build automated workflows with API integrations and data processing')
                : (nl ? 'Ontwerp klantreizen met multi-channel contactpunten' : fr ? 'Concevez des parcours clients avec des points de contact multi-canal' : 'Design customer journeys with multi-channel touchpoints')
              }
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant={mode === 'workflow' ? 'secondary' : 'default'} className="mr-2">
              <Layers className="h-3 w-3 mr-1" />
              {mode === 'workflow' ? 'Workflow' : (nl ? 'Klantreis' : fr ? 'Parcours' : 'Journey')}
            </Badge>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              {nl ? 'Importeren' : fr ? 'Importer' : 'Import'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportItem}>
              <Download className="h-4 w-4 mr-2" />
              {nl ? 'Exporteren' : fr ? 'Exporter' : 'Export'}
            </Button>
            <Button variant="outline" size="sm" onClick={saveItem}>
              <Save className="h-4 w-4 mr-2" />
              {nl ? 'Opslaan' : fr ? 'Sauvegarder' : 'Save'}
            </Button>
            <Button size="sm" className={mode === 'workflow' ? 'bg-purple-600 hover:bg-purple-700' : ''}>
              <Play className="h-4 w-4 mr-2" />
              {mode === 'workflow' ? (nl ? 'Implementeren' : fr ? 'Deployer' : 'Deploy') : (nl ? 'Activeren' : fr ? 'Activer' : 'Activate')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 border-r bg-card p-4">
          <h3 className="font-semibold mb-4">
            {mode === 'workflow' ? (nl ? 'Workflow analyse' : fr ? 'Analyse du workflow' : 'Workflow Analytics') : (nl ? 'Klantreis analyse' : fr ? 'Analyse du parcours' : 'Journey Analytics')}
          </h3>
          {mode === 'workflow' ? workflowAnalytics : journeyAnalytics}
          
          <div className="mt-8">
            <h3 className="font-semibold mb-4">
              {mode === 'workflow' ? (nl ? 'Workflow sjablonen' : fr ? 'Modeles de workflow' : 'Workflow Templates') : (nl ? 'Klantreis sjablonen' : fr ? 'Modeles de parcours' : 'Journey Templates')}
            </h3>
            <div className="space-y-2">
              {mode === 'workflow' ? (
                <>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileCheck className="h-4 w-4 mr-2" />
                    {nl ? 'Orderverwerking' : fr ? 'Traitement des commandes' : 'Order Processing'}
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <UserCheck className="h-4 w-4 mr-2" />
                    {nl ? 'Onboarding medewerkers' : fr ? 'Integration des employes' : 'Employee Onboarding'}
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    {nl ? 'Beveiligingsgoedkeuring' : fr ? 'Approbation de securite' : 'Security Approval'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    {nl ? 'Welkomstserie' : fr ? "Serie d'accueil" : 'Welcome Series'}
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Target className="h-4 w-4 mr-2" />
                    {nl ? 'Win-back campagne' : fr ? 'Campagne de reconquete' : 'Win-Back Campaign'}
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {nl ? 'Productlancering' : fr ? 'Lancement de produit' : 'Product Launch'}
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="font-semibold mb-4">{nl ? 'Node-instellingen' : fr ? 'Parametres du noeud' : 'Node Settings'}</h3>
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              {nl ? 'Geselecteerde configureren' : fr ? 'Configurer la selection' : 'Configure Selected'}
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background variant="dots" gap={12} size={1} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      {/* Node Palette */}
      <div className="border-t bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">
          {mode === 'workflow' ? (nl ? 'Workflow stappen' : fr ? 'Etapes du workflow' : 'Workflow Steps') : (nl ? 'Klantreis stappen' : fr ? 'Etapes du parcours' : 'Journey Steps')}
        </h3>
        <div className="flex gap-3 flex-wrap">
          {nodeTemplates.map((template) => (
            <div
              key={`${template.type}-${template.actionType || ''}`}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('nodeType', template.type);
                event.dataTransfer.setData('actionType', template.actionType || '');
                event.dataTransfer.setData('label', template.label);
                event.dataTransfer.effectAllowed = 'move';
              }}
              className={`px-4 py-3 bg-${template.color}-50 border border-${template.color}-200 rounded-lg cursor-move hover:shadow-md transition-shadow flex flex-col items-center`}
              style={{
                backgroundColor: `var(--${template.color}-50)`,
                borderColor: `var(--${template.color}-200)`
              }}
            >
              <template.icon className={`h-5 w-5 text-${template.color}-600 mb-1`} />
              <p className="text-sm font-medium">{template.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Wrap with ReactFlowProvider
const JourneyBuilderWithProvider = () => (
  <ReactFlowProvider>
    <JourneyBuilder />
  </ReactFlowProvider>
);

export default JourneyBuilderWithProvider;