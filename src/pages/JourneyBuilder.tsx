import { useState, useCallback } from 'react';
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
  Settings
} from "lucide-react";

// Custom node components
const TriggerNode = ({ data }: NodeProps) => {
  return (
    <div className="px-4 py-3 bg-blue-100 border-2 border-blue-300 rounded-lg min-w-[150px]">
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-blue-600" />
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
  };
  const Icon = icons[data.actionType] || Mail;
  
  return (
    <div className="px-4 py-3 bg-green-100 border-2 border-green-300 rounded-lg min-w-[150px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-green-600" />
        <div>
          <p className="text-sm font-semibold">{data.actionType}</p>
          <p className="text-xs text-gray-600">{data.label}</p>
        </div>
      </div>
    </div>
  );
};

const DecisionNode = ({ data }: NodeProps) => {
  return (
    <div className="px-4 py-3 bg-purple-100 border-2 border-purple-300 rounded-lg min-w-[150px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} id="yes" style={{ top: '30%' }} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} id="no" style={{ top: '70%' }} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <GitBranch className="h-5 w-5 text-purple-600" />
        <div>
          <p className="text-sm font-semibold">Decision</p>
          <p className="text-xs text-gray-600">{data.label}</p>
        </div>
      </div>
    </div>
  );
};

const GoalNode = ({ data }: NodeProps) => {
  return (
    <div className="px-4 py-3 bg-orange-100 border-2 border-orange-300 rounded-lg min-w-[150px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-orange-600" />
        <div>
          <p className="text-sm font-semibold">Goal</p>
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
};

// Initial nodes and edges for demo
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 100, y: 200 },
    data: { label: 'Form Submit' },
  },
  {
    id: '2',
    type: 'action',
    position: { x: 300, y: 200 },
    data: { label: 'Welcome Email', actionType: 'email' },
  },
  {
    id: '3',
    type: 'action',
    position: { x: 500, y: 200 },
    data: { label: 'Wait 2 days', actionType: 'wait' },
  },
  {
    id: '4',
    type: 'decision',
    position: { x: 700, y: 200 },
    data: { label: 'Opened Email?' },
  },
  {
    id: '5',
    type: 'action',
    position: { x: 900, y: 150 },
    data: { label: 'Send Follow-up', actionType: 'email' },
  },
  {
    id: '6',
    type: 'goal',
    position: { x: 1100, y: 200 },
    data: { label: 'Conversion' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
  { id: 'e4-5', source: '4', target: '5', sourceHandle: 'yes' },
  { id: 'e4-6', source: '4', target: '6', sourceHandle: 'no' },
  { id: 'e5-6', source: '5', target: '6' },
];

const JourneyBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedJourney, setSelectedJourney] = useState('new-customer');
  const [journeyName, setJourneyName] = useState('New Customer Onboarding');

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
        data: { label, actionType },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const saveJourney = () => {
    const journey = {
      id: selectedJourney,
      name: journeyName,
      nodes,
      edges,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`journey-${selectedJourney}`, JSON.stringify(journey));
    alert('Journey saved successfully!');
  };

  const exportJourney = () => {
    const journey = { name: journeyName, nodes, edges };
    const dataStr = JSON.stringify(journey, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${journeyName.toLowerCase().replace(/ /g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const nodeTemplates = [
    { type: 'trigger', label: 'Form Submit', icon: Zap, color: 'blue' },
    { type: 'action', actionType: 'email', label: 'Send Email', icon: Mail, color: 'green' },
    { type: 'action', actionType: 'sms', label: 'Send SMS', icon: MessageSquare, color: 'green' },
    { type: 'action', actionType: 'wait', label: 'Wait', icon: Clock, color: 'purple' },
    { type: 'decision', label: 'Decision', icon: GitBranch, color: 'purple' },
    { type: 'goal', label: 'Goal', icon: Target, color: 'orange' },
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div>
            <input
              type="text"
              value={journeyName}
              onChange={(e) => setJourneyName(e.target.value)}
              className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary focus:outline-none px-1"
            />
            <p className="text-sm text-muted-foreground">Drag nodes from the bottom panel to build your journey</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={exportJourney}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={saveJourney}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button size="sm">
              <Play className="h-4 w-4 mr-2" />
              Activate
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 border-r bg-card p-4">
          <h3 className="font-semibold mb-4">Journey Analytics</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Enrolled</p>
              <p className="text-2xl font-bold">1,247</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">892</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold text-green-600">71.5%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Time</p>
              <p className="text-2xl font-bold">4.3 days</p>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="font-semibold mb-4">Node Settings</h3>
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configure Selected
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
        <h3 className="text-sm font-semibold mb-3">Journey Steps</h3>
        <div className="flex gap-3">
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
              className={`px-4 py-3 bg-${template.color}-50 border border-${template.color}-200 rounded-lg cursor-move hover:shadow-md transition-shadow`}
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