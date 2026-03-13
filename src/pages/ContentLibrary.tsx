import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useContentLibrary } from "@/hooks/queries/useContentLibrary";
import { LoadingSpinner, EmptyState } from "@/components/DataState";
import {
  FolderOpen,
  Video,
  Image as ImageIcon,
  FileText,
  Search,
  Plus,
  Trash2,
  Download,
  Copy,
  Mail,
  Globe,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from '@/contexts/LanguageContext';

interface ContentItem {
  id: string;
  content_type: string;
  title: string;
  content: Record<string, any>;
  metadata: Record<string, any>;
  tags: string[];
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  email: { icon: Mail, color: "purple", label: "Email" },
  social: { icon: ImageIcon, color: "blue", label: "Social Post" },
  landing_page: { icon: Globe, color: "emerald", label: "Landing Page" },
  blog: { icon: FileText, color: "green", label: "Blog" },
  tutorial: { icon: FileText, color: "amber", label: "Tutorial" },
  commercial: { icon: Video, color: "rose", label: "Commercial" },
  image: { icon: ImageIcon, color: "cyan", label: "Image" },
  other: { icon: FileText, color: "gray", label: "Other" },
};

const ContentLibrary = () => {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const queryClient = useQueryClient();

  // React Query for content list
  const params: Record<string, string> = {};
  if (filterType !== "all") params.content_type = filterType;
  if (searchQuery) params.search = searchQuery;

  const { data: rawData, isLoading, refetch } = useContentLibrary(params as any);
  const items: ContentItem[] = (rawData as any) || [];

  // Derive stats from fetched data
  const stats = {
    total: items.length,
    by_type: items.reduce((acc, item) => {
      const type = item.content_type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  function handleSearch() {
    refetch();
  }

  async function deleteItem(id: string) {
    try {
      const { error } = await supabase.from('content_items').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['content-library'] });
      toast.success(nl ? "Item verwijderd" : fr ? "Élément supprimé" : "Item deleted");
    } catch {
      toast.error(nl ? "Kon item niet verwijderen" : fr ? "Impossible de supprimer l'élément" : "Failed to delete item");
    }
  }

  function copyContent(item: ContentItem) {
    const text = item.content?.body || item.content?.text || JSON.stringify(item.content, null, 2);
    navigator.clipboard.writeText(text);
    toast.success(nl ? "Content gekopieerd naar klembord!" : fr ? "Contenu copié dans le presse-papiers !" : "Content copied to clipboard!");
  }

  function downloadItem(item: ContentItem) {
    const blob = new Blob([JSON.stringify(item.content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.title.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(nl ? "Gedownload!" : fr ? "Téléchargé !" : "Downloaded!");
  }

  const getConfig = (type: string) => TYPE_CONFIG[type] || TYPE_CONFIG.other;

  const typeFilters = ["all", "email", "social", "landing_page", "blog", "tutorial", "commercial"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <FolderOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{nl ? "Content Bibliotheek" : fr ? "Bibliothèque de Contenu" : "Content Library"}</h1>
            <p className="text-sm text-muted-foreground">
              {nl ? "Al je gegenereerde content op één plek" : fr ? "Tout votre contenu généré en un seul endroit" : "All your generated content in one place"}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {nl ? "Vernieuwen" : fr ? "Actualiser" : "Refresh"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted-foreground">{nl ? "Totaal Items" : fr ? "Total Éléments" : "Total Items"}</p>
          </CardContent>
        </Card>
        {Object.entries(stats.by_type).slice(0, 3).map(([type, count]) => {
          const config = getConfig(type);
          return (
            <Card key={type}>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <config.icon className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Create */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            {nl ? "Nieuwe Content Maken" : fr ? "Créer Nouveau Contenu" : "Create New Content"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link to="/app/campaigns/email">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <Mail className="w-5 h-5 text-purple-500" />
                <span className="text-xs">{nl ? "E-mail Campagne" : fr ? "Campagne E-mail" : "Email Campaign"}</span>
              </Button>
            </Link>
            <Link to="/app/campaigns/social">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <ImageIcon className="w-5 h-5 text-blue-500" />
                <span className="text-xs">{nl ? "Social Post" : fr ? "Publication Sociale" : "Social Post"}</span>
              </Button>
            </Link>
            <Link to="/app/campaigns/landing">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <Globe className="w-5 h-5 text-emerald-500" />
                <span className="text-xs">{nl ? "Landingspagina" : fr ? "Page d'Atterrissage" : "Landing Page"}</span>
              </Button>
            </Link>
            <Link to="/app/tutorial-creator">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <FileText className="w-5 h-5 text-green-500" />
                <span className="text-xs">{nl ? "Tutorial" : fr ? "Tutoriel" : "Tutorial"}</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={nl ? "Zoek content..." : fr ? "Rechercher du contenu..." : "Search content..."}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {typeFilters.map((type) => (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type)}
            >
              {type === "all" ? (nl ? "Alles" : fr ? "Tout" : "All") : getConfig(type).label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState
          title={searchQuery
            ? (nl ? "Geen resultaten gevonden" : fr ? "Aucun résultat trouvé" : "No results found")
            : (nl ? "Je content bibliotheek is leeg" : fr ? "Votre bibliothèque de contenu est vide" : "Your content library is empty")}
          description={searchQuery
            ? (nl ? "Probeer een andere zoekterm" : fr ? "Essayez un autre terme de recherche" : "Try a different search term")
            : (nl ? "Gegenereerde content van campagnes en tools verschijnt hier" : fr ? "Le contenu généré par les campagnes et outils apparaîtra ici" : "Generated content from campaigns and tools will appear here")}
          action={!searchQuery ? { label: nl ? "Maak E-mail Campagne" : fr ? "Créer Campagne E-mail" : "Create Email Campaign", onClick: () => window.location.href = "/app/campaigns/email" } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const config = getConfig(item.content_type);
            return (
              <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                    <config.icon className="w-8 h-8 text-muted-foreground" />
                  </div>

                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{item.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Badge variant="secondary" className="text-xs">{config.label}</Badge>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {item.tags?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => downloadItem(item)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => copyContent(item)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ContentLibrary;
