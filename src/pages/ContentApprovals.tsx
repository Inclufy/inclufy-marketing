// src/pages/ContentApprovals.tsx
// Content approval workflow — review, approve, or reject content items

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useContentLibrary, useUpdateContentStatus } from '@/hooks/queries/useContentLibrary';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/DataState';
import { useToast } from '@/components/ui/use-toast';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Send,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────

interface ApprovalItem {
  id: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
  content?: string;
}

// ─── Seed data when API returns empty ───────────────────────────────

const SEED_ITEMS: ApprovalItem[] = [
  { id: 'a1', title: 'Q1 Email Newsletter Draft', type: 'email', status: 'review', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'a2', title: 'Instagram Campaign - Spring Launch', type: 'social', status: 'review', created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'a3', title: 'Blog: 5 Marketing Automation Tips', type: 'blog', status: 'review', created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'a4', title: 'LinkedIn Thought Leadership Series', type: 'social', status: 'draft', created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'a5', title: 'Product Update Announcement', type: 'email', status: 'approved', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'a6', title: 'Customer Case Study: Acme Corp', type: 'blog', status: 'approved', created_at: new Date(Date.now() - 6 * 86400000).toISOString() },
];

// ─── Component ──────────────────────────────────────────────────────

export default function ContentApprovals() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('review');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Fetch content from API
  const { data: contentData, isLoading, isError, refetch } = useContentLibrary({ limit: 100 });
  const updateStatus = useUpdateContentStatus();

  const apiItems: ApprovalItem[] = ((contentData as any)?.items || contentData || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    type: c.type || 'blog',
    status: c.status || 'draft',
    created_at: c.created_at,
    content: c.content,
  }));

  const items = apiItems.length > 0 ? apiItems : SEED_ITEMS;

  // Filter by status
  const reviewItems = items.filter(i => i.status === 'review');
  const draftItems = items.filter(i => i.status === 'draft');
  const approvedItems = items.filter(i => i.status === 'approved');
  const publishedItems = items.filter(i => i.status === 'published');

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      toast({
        title: nl ? 'Status bijgewerkt' : fr ? 'Statut mis à jour' : 'Status updated',
        description: nl
          ? `Item is nu "${newStatus}"`
          : fr ? `L'élément est maintenant "${newStatus}"`
          : `Item is now "${newStatus}"`,
      });
    } catch {
      toast({
        title: nl ? 'Fout' : fr ? 'Erreur' : 'Error',
        description: nl ? 'Kon status niet bijwerken' : fr ? 'Impossible de mettre à jour le statut' : 'Could not update status',
        variant: 'destructive',
      });
    }
  };

  const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
    draft: {
      icon: FileText,
      color: 'text-gray-500',
      label: nl ? 'Concept' : fr ? 'Brouillon' : 'Draft',
    },
    review: {
      icon: Eye,
      color: 'text-yellow-600',
      label: nl ? 'In Review' : fr ? 'En Révision' : 'In Review',
    },
    approved: {
      icon: CheckCircle,
      color: 'text-green-600',
      label: nl ? 'Goedgekeurd' : fr ? 'Approuvé' : 'Approved',
    },
    published: {
      icon: Send,
      color: 'text-blue-600',
      label: nl ? 'Gepubliceerd' : fr ? 'Publié' : 'Published',
    },
  };

  const renderItemCard = (item: ApprovalItem, showActions: boolean) => {
    const config = statusConfig[item.status] || statusConfig.draft;
    const StatusIcon = config.icon;
    const isExpanded = expandedItem === item.id;

    return (
      <Card key={item.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <StatusIcon className={`h-5 w-5 mt-0.5 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{item.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">
                    {item.type}
                  </Badge>
                  <Badge variant={item.status === 'approved' ? 'success' : item.status === 'review' ? 'warning' : 'secondary'} className="text-[10px]">
                    {config.label}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString(
                      nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-US',
                      { day: 'numeric', month: 'short' }
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedItem(isExpanded ? null : item.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>

              {showActions && item.status === 'review' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleStatusChange(item.id, 'approved')}
                    disabled={updateStatus.isPending}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleStatusChange(item.id, 'draft')}
                    disabled={updateStatus.isPending}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </>
              )}

              {item.status === 'draft' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                  onClick={() => handleStatusChange(item.id, 'review')}
                  disabled={updateStatus.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}

              {item.status === 'approved' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => handleStatusChange(item.id, 'published')}
                  disabled={updateStatus.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Expanded preview */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-muted-foreground">
                {item.content || (nl ? 'Geen preview beschikbaar' : fr ? 'Pas de prévisualisation disponible' : 'No preview available')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">
              {nl ? 'Content Goedkeuring' : fr ? 'Approbation de Contenu' : 'Content Approvals'}
            </h1>
            <p className="text-muted-foreground">
              {nl ? 'Beoordeel en keur content goed' : fr ? 'Examinez et approuvez le contenu' : 'Review and approve content'}
            </p>
          </div>
        </div>

        {/* Status summary */}
        <div className="flex gap-3">
          {reviewItems.length > 0 && (
            <Badge variant="warning" className="flex items-center gap-1.5 px-3 py-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {reviewItems.length} {nl ? 'te reviewen' : fr ? 'à réviser' : 'to review'}
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {items.length} {nl ? 'totaal' : fr ? 'total' : 'total'}
          </Badge>
        </div>
      </div>

      {/* Workflow status bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            {[
              { label: nl ? 'Concept' : fr ? 'Brouillon' : 'Draft', count: draftItems.length, color: 'bg-gray-200' },
              { label: nl ? 'In Review' : fr ? 'En Révision' : 'In Review', count: reviewItems.length, color: 'bg-yellow-400' },
              { label: nl ? 'Goedgekeurd' : fr ? 'Approuvé' : 'Approved', count: approvedItems.length, color: 'bg-green-400' },
              { label: nl ? 'Gepubliceerd' : fr ? 'Publié' : 'Published', count: publishedItems.length, color: 'bg-blue-400' },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className="text-center">
                  <div className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {step.count}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{step.label}</p>
                </div>
                {i < 3 && (
                  <div className="w-12 h-0.5 bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="review" className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {nl ? 'Te Reviewen' : fr ? 'À Réviser' : 'To Review'}
            {reviewItems.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 h-4">
                {reviewItems.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="drafts">
            {nl ? 'Concepten' : fr ? 'Brouillons' : 'Drafts'} ({draftItems.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            {nl ? 'Goedgekeurd' : fr ? 'Approuvé' : 'Approved'} ({approvedItems.length})
          </TabsTrigger>
          <TabsTrigger value="published">
            {nl ? 'Gepubliceerd' : fr ? 'Publié' : 'Published'} ({publishedItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="mt-4 space-y-3">
          {reviewItems.length === 0 ? (
            <EmptyState
              title={nl ? 'Geen items te reviewen' : fr ? 'Aucun élément à réviser' : 'No items to review'}
              description={nl
                ? 'Alle content is beoordeeld. Goed bezig!'
                : fr ? 'Tout le contenu a été examiné. Bon travail !'
                : 'All content has been reviewed. Great job!'}
            />
          ) : (
            reviewItems.map(item => renderItemCard(item, true))
          )}
        </TabsContent>

        <TabsContent value="drafts" className="mt-4 space-y-3">
          {draftItems.length === 0 ? (
            <EmptyState
              title={nl ? 'Geen concepten' : fr ? 'Aucun brouillon' : 'No drafts'}
            />
          ) : (
            draftItems.map(item => renderItemCard(item, false))
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4 space-y-3">
          {approvedItems.length === 0 ? (
            <EmptyState
              title={nl ? 'Geen goedgekeurde items' : fr ? 'Aucun élément approuvé' : 'No approved items'}
            />
          ) : (
            approvedItems.map(item => renderItemCard(item, false))
          )}
        </TabsContent>

        <TabsContent value="published" className="mt-4 space-y-3">
          {publishedItems.length === 0 ? (
            <EmptyState
              title={nl ? 'Nog niets gepubliceerd' : fr ? 'Rien de publié encore' : 'Nothing published yet'}
            />
          ) : (
            publishedItems.map(item => renderItemCard(item, false))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
