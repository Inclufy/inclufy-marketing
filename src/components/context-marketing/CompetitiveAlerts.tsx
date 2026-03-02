// src/components/context-marketing/CompetitiveAlerts.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  TrendingUp,
  DollarSign,
  Users,
  Newspaper,
  Building,
  Package,
  CheckCircle,
  Clock,
  Filter,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { competitiveContextService, CompetitiveAlert } from '@/services/context-marketing/competitive-context.service';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface CompetitiveAlertsProps {
  alerts?: CompetitiveAlert[];
  compact?: boolean;
  onUpdate?: () => void;
}

export default function CompetitiveAlerts({ 
  alerts: propAlerts, 
  compact = false,
  onUpdate 
}: CompetitiveAlertsProps) {
  const [alerts, setAlerts] = useState<CompetitiveAlert[]>(propAlerts || []);
  const [filter, setFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const handleAcknowledge = async (alertId: string) => {
    try {
      await competitiveContextService.acknowledgeAlert(alertId);
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
      toast.success('Alert acknowledged');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'price_change': return <DollarSign className="w-5 h-5" />;
      case 'feature_update': return <Package className="w-5 h-5" />;
      case 'news': return <Newspaper className="w-5 h-5" />;
      case 'leadership_change': return <Users className="w-5 h-5" />;
      case 'funding': return <TrendingUp className="w-5 h-5" />;
      case 'acquisition': return <Building className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const getAlertTitle = (alert: CompetitiveAlert) => {
    const competitor = alert.competitor?.competitor_name || 'Unknown Competitor';
    
    switch (alert.alert_type) {
      case 'price_change':
        return `${competitor} changed pricing`;
      case 'feature_update':
        return `${competitor} launched new feature`;
      case 'news':
        return `${competitor} in the news`;
      case 'leadership_change':
        return `${competitor} leadership update`;
      case 'funding':
        return `${competitor} secured funding`;
      case 'acquisition':
        return `${competitor} acquisition activity`;
      default:
        return `${competitor} update`;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter !== 'all' && alert.alert_type !== filter) return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    return true;
  });

  if (compact) {
    return (
      <div className="space-y-2">
        {filteredAlerts.slice(0, 5).map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Alert className={getAlertColor(alert.severity)}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.alert_type)}
                  <div className="space-y-1">
                    <AlertTitle className="text-sm">{getAlertTitle(alert)}</AlertTitle>
                    <AlertDescription className="text-xs">
                      {formatDistanceToNow(new Date(alert.created_at))} ago
                    </AlertDescription>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAcknowledge(alert.id)}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Alert>
          </motion.div>
        ))}
        {filteredAlerts.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No alerts</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Competitive Alerts</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Real-time monitoring of competitor activities
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All alerts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="price_change">Price Changes</SelectItem>
              <SelectItem value="feature_update">Feature Updates</SelectItem>
              <SelectItem value="news">News</SelectItem>
              <SelectItem value="leadership_change">Leadership</SelectItem>
              <SelectItem value="funding">Funding</SelectItem>
              <SelectItem value="acquisition">Acquisitions</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredAlerts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {filteredAlerts.filter(a => !a.acknowledged).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredAlerts.filter(a => a.severity === 'critical').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredAlerts.filter(a => {
                const alertDate = new Date(a.created_at);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return alertDate > weekAgo;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={alert.acknowledged ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getAlertColor(alert.severity)}`}>
                      {getAlertIcon(alert.alert_type)}
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {getAlertTitle(alert)}
                        <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        {alert.acknowledged && (
                          <Badge variant="outline">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Read
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        {alert.competitor && (
                          <>
                            <Badge variant="outline">
                              {alert.competitor.company_type}
                            </Badge>
                            <span>•</span>
                          </>
                        )}
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(alert.created_at))} ago
                      </CardDescription>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAcknowledge(alert.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Read
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Alert Details */}
                  {alert.alert_data && Object.keys(alert.alert_data).length > 0 && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {alert.alert_type === 'price_change' && alert.alert_data.changes && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Price Changes:</p>
                          {alert.alert_data.changes.map((change: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span>{change.plan || change.product}</span>
                              <div className="flex items-center gap-2">
                                <span className="line-through text-gray-400">${change.old_price}</span>
                                <span className="font-medium">${change.new_price}</span>
                                <Badge variant={change.direction === 'up' ? 'destructive' : 'secondary'}>
                                  {change.percentage}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {alert.alert_type === 'feature_update' && alert.alert_data.feature && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">New Feature:</p>
                          <p className="text-sm">{alert.alert_data.feature}</p>
                          {alert.alert_data.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {alert.alert_data.description}
                            </p>
                          )}
                        </div>
                      )}

                      {alert.alert_type === 'funding' && alert.alert_data.amount && (
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">Amount:</span> {alert.alert_data.amount}
                          </p>
                          {alert.alert_data.round && (
                            <p className="text-sm">
                              <span className="font-medium">Round:</span> {alert.alert_data.round}
                            </p>
                          )}
                          {alert.alert_data.investors && (
                            <p className="text-sm">
                              <span className="font-medium">Lead Investors:</span> {alert.alert_data.investors}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Generic alert data display */}
                      {!['price_change', 'feature_update', 'funding'].includes(alert.alert_type) && (
                        <div className="space-y-1">
                          {Object.entries(alert.alert_data).map(([key, value]) => (
                            <p key={key} className="text-sm">
                              <span className="font-medium capitalize">{key.replace('_', ' ')}:</span> {String(value)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recommended Actions */}
                  {alert.severity === 'critical' || alert.severity === 'high' ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Recommended Action</AlertTitle>
                      <AlertDescription className="text-sm">
                        {alert.alert_type === 'price_change' && 'Review and adjust your pricing strategy to remain competitive.'}
                        {alert.alert_type === 'feature_update' && 'Analyze the feature and consider your product roadmap priorities.'}
                        {alert.alert_type === 'funding' && 'Monitor for increased competitive activity and market expansion.'}
                        {alert.alert_type === 'acquisition' && 'Assess potential market consolidation impact on your position.'}
                        {!['price_change', 'feature_update', 'funding', 'acquisition'].includes(alert.alert_type) && 
                          'Review this development and assess its impact on your competitive position.'}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filteredAlerts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No alerts found</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filter !== 'all' || severityFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Competitor monitoring will generate alerts when changes are detected'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}