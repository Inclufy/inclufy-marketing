import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Linkedin,
  Facebook,
  Instagram,
  RefreshCw,
  Send
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl as nlLocale } from "date-fns/locale";
import { fr as frLocale } from "date-fns/locale";
import { useLanguage } from '@/contexts/LanguageContext';

interface ScheduledPost {
  id: string;
  platform: string;
  caption: string;
  scheduled_at: string;
  status: string;
  error_message: string | null;
  published_at: string | null;
  created_at: string;
}

const platformIcons: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-5 h-5" />,
  facebook: <Facebook className="w-5 h-5" />,
  instagram: <Instagram className="w-5 h-5" />,
};

const platformColors: Record<string, string> = {
  linkedin: "bg-blue-500",
  facebook: "bg-blue-600",
  instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
};

const ScheduledPosts = () => {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    pending: {
      icon: <Clock className="w-4 h-4" />,
      label: nl ? "Gepland" : fr ? "Planifié" : "Scheduled",
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
    },
    published: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: nl ? "Gepubliceerd" : fr ? "Publié" : "Published",
      color: "bg-green-500/10 text-green-600 border-green-500/20"
    },
    failed: {
      icon: <XCircle className="w-4 h-4" />,
      label: nl ? "Mislukt" : fr ? "Échoué" : "Failed",
      color: "bg-red-500/10 text-red-600 border-red-500/20"
    },
  };

  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "published" | "failed">("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('scheduled_posts')
        .select('*')
        .order('scheduled_at', { ascending: false });

      if (filter !== "all") {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error(nl ? "Kon posts niet laden" : fr ? "Impossible de charger les publications" : "Could not load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('scheduled-posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_posts'
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPosts(posts.filter(p => p.id !== id));
      toast.success(nl ? "Post verwijderd" : fr ? "Publication supprimée" : "Post deleted");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(nl ? "Kon post niet verwijderen" : fr ? "Impossible de supprimer la publication" : "Could not delete post");
    } finally {
      setDeleting(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    if (nl) return format(date, "d MMM yyyy 'om' HH:mm", { locale: nlLocale });
    if (fr) return format(date, "d MMM yyyy 'à' HH:mm", { locale: frLocale });
    return format(date, "d MMM yyyy 'at' HH:mm");
  };

  const filterButtons = [
    { id: "all", label: nl ? "Alle" : fr ? "Tous" : "All" },
    { id: "pending", label: nl ? "Gepland" : fr ? "Planifié" : "Scheduled" },
    { id: "published", label: nl ? "Gepubliceerd" : fr ? "Publié" : "Published" },
    { id: "failed", label: nl ? "Mislukt" : fr ? "Échoué" : "Failed" },
  ] as const;

  return (
    <div className="w-full">
      <main className="space-y-6">
        <div className="w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{nl ? "Geplande Posts" : fr ? "Publications Planifiées" : "Scheduled Posts"}</h1>
                <p className="text-sm text-muted-foreground">
                  {nl ? "Beheer je geplande en gepubliceerde posts" : fr ? "Gérez vos publications planifiées et publiées" : "Manage your scheduled and published posts"}
                </p>
              </div>
            </div>
            <Button
              onClick={fetchPosts}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {nl ? "Vernieuwen" : fr ? "Actualiser" : "Refresh"}
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {filterButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === btn.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Posts List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {nl ? "Geen posts gevonden" : fr ? "Aucune publication trouvée" : "No posts found"}
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {filter === "all"
                    ? (nl ? "Je hebt nog geen posts ingepland of gepubliceerd." : fr ? "Vous n'avez pas encore planifié ou publié de publications." : "You haven't scheduled or published any posts yet.")
                    : (nl ? `Er zijn geen posts met status "${filterButtons.find(b => b.id === filter)?.label}".` : fr ? `Aucune publication avec le statut "${filterButtons.find(b => b.id === filter)?.label}".` : `No posts with status "${filterButtons.find(b => b.id === filter)?.label}".`)
                  }
                </p>
                <Button asChild>
                  <a href="/social-post-generator">
                    <Send className="w-4 h-4 mr-2" />
                    {nl ? "Maak een post" : fr ? "Créer une publication" : "Create a post"}
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const status = statusConfig[post.status] || statusConfig.pending;
                
                return (
                  <Card key={post.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        {/* Platform indicator */}
                        <div className={`w-2 ${platformColors[post.platform] || 'bg-gray-500'}`} />
                        
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Platform & Status */}
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-2 text-foreground">
                                  {platformIcons[post.platform] || <Send className="h-4 w-4" />}
                                  <span className="font-medium capitalize">{post.platform}</span>
                                </div>
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                                  {status.icon}
                                  {status.label}
                                </span>
                              </div>
                              
                              {/* Caption */}
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {post.caption || <em className="text-muted-foreground/50">{nl ? "Geen caption" : fr ? "Pas de légende" : "No caption"}</em>}
                              </p>
                              
                              {/* Dates */}
                              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {nl ? "Gepland" : fr ? "Planifié" : "Scheduled"}: {formatDateTime(post.scheduled_at)}
                                </span>
                                {post.published_at && (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {nl ? "Gepubliceerd" : fr ? "Publié" : "Published"}: {formatDateTime(post.published_at)}
                                  </span>
                                )}
                              </div>
                              
                              {/* Error message */}
                              {post.error_message && (
                                <p className="mt-2 text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded">
                                  {post.error_message}
                                </p>
                              )}
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              {post.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(post.id)}
                                  disabled={deleting === post.id}
                                  className="text-muted-foreground hover:text-red-500"
                                >
                                  {deleting === post.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ScheduledPosts;
