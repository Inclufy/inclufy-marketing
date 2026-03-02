import { Target, Plus, DollarSign, Users, TrendingUp, Activity } from 'lucide-react';
import { PageLayout, PageHeader, Section } from '@/components/layouts/PageLayout';
import { MetricCard, ProgressCard } from '@/components/ui/responsive-cards';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function GoalsAndKPIs() {
  return (
    <PageLayout>
      <PageHeader
        title="Goals & KPIs"
        subtitle="Set and track measurable marketing objectives"
        icon={<Target className="h-8 w-8 text-purple-600" />}
        actions={
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Set Your First Goal
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Revenue Goal"
          value="$150K"
          subtitle="85% achieved"
          change={12}
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
        />
        <MetricCard
          title="Leads Target"
          value="3,500"
          subtitle="2,841 generated"
          change={-5}
          icon={<Users className="h-6 w-6" />}
          color="blue"
        />
        <MetricCard
          title="Conversion Rate"
          value="4.2%"
          subtitle="+0.8% vs target"
          change={8}
          icon={<TrendingUp className="h-6 w-6" />}
          color="purple"
        />
        <MetricCard
          title="CAC"
          value="$125"
          subtitle="Target: $100"
          change={-3}
          icon={<Activity className="h-6 w-6" />}
          color="orange"
        />
      </div>

      <Section title="Active Goals">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
              <Target className="h-10 w-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Full Goals & KPIs tracking coming soon</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Set specific, measurable goals and track your progress in real-time
            </p>
          </CardContent>
        </Card>
      </Section>
    </PageLayout>
  );
}