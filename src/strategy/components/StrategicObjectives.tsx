// src/components/strategy/StrategicObjectives.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

export default function StrategicObjectives() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Strategic Objectives</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Define and track your key business objectives and OKRs
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Objectives & Key Results
          </CardTitle>
          <CardDescription>
            This feature is coming soon!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-white" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Strategic objectives setup will be available here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}