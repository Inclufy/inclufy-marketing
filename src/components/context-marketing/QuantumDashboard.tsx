// src/components/context-marketing/QuantumDashboard.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Atom,
  Infinity,
  Brain,
  Orbit,
  Sparkles,
  Waves,
  GitBranch,
  Network,
  Cpu,
  Radio,
  Zap,
  Eye,
  Timer,
  Globe,
  Layers,
  Binary,
  CircuitBoard,
  Aperture,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Quantum state visualization component
const QuantumStateVisualizer = ({ states }: { states: any[] }) => {
  return (
    <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20" />
      
      {/* Quantum particles animation */}
      {states.map((state, idx) => (
        <motion.div
          key={idx}
          className="absolute w-2 h-2 bg-white rounded-full"
          animate={{
            x: [0, Math.random() * 300, Math.random() * 300, 0],
            y: [0, Math.random() * 200, Math.random() * 200, 0],
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1.5, 0]
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            boxShadow: '0 0 10px rgba(255,255,255,0.8)'
          }}
        />
      ))}

      {/* Quantum entanglement lines */}
      <svg className="absolute inset-0 w-full h-full">
        {states.slice(0, 5).map((_, idx) => (
          <motion.line
            key={`line-${idx}`}
            x1={`${20 + idx * 15}%`}
            y1="50%"
            x2={`${80 - idx * 10}%`}
            y2="50%"
            stroke="rgba(147, 51, 234, 0.5)"
            strokeWidth="1"
            animate={{
              opacity: [0, 1, 0],
              pathLength: [0, 1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: idx * 0.5
            }}
          />
        ))}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <Atom className="w-16 h-16 text-purple-400" />
          </motion.div>
          <p className="text-white mt-2 text-sm font-mono">
            Quantum State: Superposition
          </p>
        </div>
      </div>
    </div>
  );
};

// Probability wave component
const ProbabilityWave = ({ amplitude }: { amplitude: number }) => {
  return (
    <div className="relative h-32 bg-gray-900 rounded-lg overflow-hidden">
      <svg className="absolute inset-0 w-full h-full">
        <motion.path
          d={`M 0 64 Q 50 ${64 - amplitude} 100 64 T 200 64 T 300 64 T 400 64`}
          fill="none"
          stroke="rgba(59, 130, 246, 0.8)"
          strokeWidth="2"
          animate={{
            d: [
              `M 0 64 Q 50 ${64 - amplitude} 100 64 T 200 64 T 300 64 T 400 64`,
              `M 0 64 Q 50 ${64 + amplitude} 100 64 T 200 64 T 300 64 T 400 64`,
              `M 0 64 Q 50 ${64 - amplitude} 100 64 T 200 64 T 300 64 T 400 64`
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </svg>
      <div className="absolute bottom-2 right-2">
        <Badge variant="outline" className="bg-gray-900/50 text-blue-400">
          ψ = {amplitude.toFixed(2)}
        </Badge>
      </div>
    </div>
  );
};

export default function QuantumDashboard() {
  const [quantumState, setQuantumState] = useState('superposition');
  const [entanglementLevel, setEntanglementLevel] = useState(75);
  const [probabilityAmplitude, setProbabilityAmplitude] = useState(30);
  const [selectedDimension, setSelectedDimension] = useState('prime');
  
  // Mock quantum states
  const [quantumMetrics, setQuantumMetrics] = useState({
    superpositionStates: 1024,
    entangledPairs: 512,
    collapsedStates: 89,
    quantumCoherence: 94.7,
    dimensionalReach: 7,
    probabilityFlux: 0.23
  });

  // Mock quantum campaigns
  const quantumCampaigns = [
    {
      id: 'qc_1',
      name: 'Temporal Echo Campaign',
      state: 'superposition',
      dimensions: ['present', 'future-1', 'future-2'],
      probability: 0.89,
      entanglement: 'high',
      status: 'active'
    },
    {
      id: 'qc_2',
      name: 'Consciousness Resonance',
      state: 'entangled',
      dimensions: ['prime', 'alpha', 'theta'],
      probability: 0.76,
      entanglement: 'quantum',
      status: 'measuring'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div 
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center"
            animate={{ 
              boxShadow: [
                '0 0 20px rgba(139, 92, 246, 0.5)',
                '0 0 40px rgba(139, 92, 246, 0.8)',
                '0 0 20px rgba(139, 92, 246, 0.5)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Atom className="w-7 h-7 text-white" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text">
              Quantum Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Marketing across infinite possibilities
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          <Infinity className="w-3 h-3 mr-1" />
          Dimension: {selectedDimension}
        </Badge>
      </div>

      {/* Quantum State Warning */}
      <Alert className="border-violet-500 bg-violet-500/10">
        <Brain className="h-4 w-4" />
        <AlertTitle>Quantum Coherence Active</AlertTitle>
        <AlertDescription>
          System operating in superposition. Reality states may fluctuate. Observer effect minimized.
        </AlertDescription>
      </Alert>

      {/* Quantum Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-violet-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-600" />
              Superposition States
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quantumMetrics.superpositionStates}</div>
            <p className="text-xs text-gray-500 mt-1">Simultaneous realities</p>
          </CardContent>
        </Card>

        <Card className="border-violet-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Network className="w-4 h-4 text-violet-600" />
              Entangled Pairs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">{quantumMetrics.entangledPairs}</div>
            <p className="text-xs text-gray-500 mt-1">Quantum connections</p>
          </CardContent>
        </Card>

        <Card className="border-violet-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-600" />
              Quantum Coherence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quantumMetrics.quantumCoherence}%</div>
            <Progress value={quantumMetrics.quantumCoherence} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="states" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="states">Quantum States</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
          <TabsTrigger value="probability">Probability</TabsTrigger>
        </TabsList>

        <TabsContent value="states" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quantum State Visualization</CardTitle>
              <CardDescription>
                Real-time quantum superposition and entanglement states
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuantumStateVisualizer states={Array(20).fill(0)} />
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Entanglement Level</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[entanglementLevel]}
                      onValueChange={([value]) => setEntanglementLevel(value)}
                      max={100}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-12">{entanglementLevel}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={quantumState === 'superposition' ? 'default' : 'outline'}
                    onClick={() => setQuantumState('superposition')}
                    className="text-xs"
                  >
                    <Orbit className="w-4 h-4 mr-1" />
                    Superposition
                  </Button>
                  <Button
                    variant={quantumState === 'entangled' ? 'default' : 'outline'}
                    onClick={() => setQuantumState('entangled')}
                    className="text-xs"
                  >
                    <GitBranch className="w-4 h-4 mr-1" />
                    Entangled
                  </Button>
                  <Button
                    variant={quantumState === 'collapsed' ? 'default' : 'outline'}
                    onClick={() => setQuantumState('collapsed')}
                    className="text-xs"
                  >
                    <CircuitBoard className="w-4 h-4 mr-1" />
                    Collapsed
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quantum Marketing Campaigns</CardTitle>
              <CardDescription>
                Campaigns running across multiple realities simultaneously
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quantumCampaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{campaign.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Dimensions: {campaign.dimensions.join(', ')}
                        </p>
                      </div>
                      <Badge variant="outline" className={cn(
                        campaign.status === 'active' ? 'text-green-600' : 'text-blue-600'
                      )}>
                        {campaign.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">State</span>
                        <p className="font-medium">{campaign.state}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Probability</span>
                        <p className="font-medium">{(campaign.probability * 100).toFixed(0)}%</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Entanglement</span>
                        <p className="font-medium">{campaign.entanglement}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        Observe
                      </Button>
                      <Button size="sm" variant="outline">
                        <Waves className="w-4 h-4 mr-1" />
                        Collapse
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dimensions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dimensional Marketing Matrix</CardTitle>
              <CardDescription>
                Access to parallel universes and alternate realities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['Prime', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Theta'].map((dimension) => (
                  <motion.div
                    key={dimension}
                    whileHover={{ scale: 1.05 }}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all",
                      selectedDimension.toLowerCase() === dimension.toLowerCase()
                        ? "border-violet-600 bg-violet-50 dark:bg-violet-900/20"
                        : "hover:border-violet-400"
                    )}
                    onClick={() => setSelectedDimension(dimension.toLowerCase())}
                  >
                    <Globe className="w-8 h-8 mb-2 text-violet-600" />
                    <h4 className="font-medium">{dimension}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.floor(Math.random() * 1000)}M entities
                    </p>
                    <Progress 
                      value={Math.random() * 100} 
                      className="mt-2 h-1"
                    />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="probability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Probability Wave Functions</CardTitle>
              <CardDescription>
                Quantum probability distributions for marketing outcomes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProbabilityWave amplitude={probabilityAmplitude} />
              
              <div>
                <Label className="text-sm">Wave Amplitude</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[probabilityAmplitude]}
                    onValueChange={([value]) => setProbabilityAmplitude(value)}
                    max={50}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12">{probabilityAmplitude}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Binary className="w-8 h-8 mx-auto mb-2 text-violet-600" />
                  <p className="text-sm font-medium">Quantum Bits</p>
                  <p className="text-2xl font-bold">1,024</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Radio className="w-8 h-8 mx-auto mb-2 text-violet-600" />
                  <p className="text-sm font-medium">Decoherence Time</p>
                  <p className="text-2xl font-bold">∞</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Required imports for Label
import { Label } from '@/components/ui/label';