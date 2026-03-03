import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
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
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

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
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [stats, setStats] = useState<{ total: number; by_type: Record<string, number> }>({ total: 0, by_type: {} });

  useEffect(() => {
    fetchItems();
    fetchStats();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterType !== "all") params.content_type = filterType;
      if (searchQuery) params.search = searchQuery;

      const response = await api.get("/content-library/", { params });
      setItems(response.data || []);
    } catch {
      // Silently fail - empty library is valid state
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const response = await api.get("/content-library/stats");
      setStats(response.data);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchItems();
  }, [filterType]);

  function handleSearch() {
    fetchItems();
  }

  async function deleteItem(id: string) {
    try {
      await api.delete(`/content-library/${id}`);
      setItems(items.filter((item) => item.id !== id));
      fetchStats();
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
  }

  function copyContent(item: ContentItem) {
    const text = item.content?.body || item.content?.text || JSON.stringify(item.content, null, 2);
    navigator.clipboard.writeText(text);
    toast.success("Content copied to clipboard!");
  }

  function downloadItem(item: ContentItem) {
    const blob = new Blob([JSON.stringify(item.content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.title.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
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
            <h1 className="text-2xl font-bold">Content Library</h1>
            <p className="text-sm text-muted-foreground">
              All your generated content in one place
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => { fetchItems(); fetchStats(); }}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Items</p>
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
            Create New Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link to="/app/campaigns/email">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <Mail className="w-5 h-5 text-purple-500" />
                <span className="text-xs">Email Campaign</span>
              </Button>
            </Link>
            <Link to="/app/campaigns/social">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <ImageIcon className="w-5 h-5 text-blue-500" />
                <span className="text-xs">Social Post</span>
              </Button>
            </Link>
            <Link to="/app/campaigns/landing">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <Globe className="w-5 h-5 text-emerald-500" />
                <span className="text-xs">Landing Page</span>
              </Button>
            </Link>
            <Link to="/app/tutorial-creator">
              <Button variant="outline" className="w-full h-16 flex-col gap-1">
                <FileText className="w-5 h-5 text-green-500" />
                <span className="text-xs">Tutorial</span>
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
            placeholder="Search content..."
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
              {type === "all" ? "All" : getConfig(type).label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No results found" : "Your content library is empty"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try a different search term"
                : "Generated content from campaigns and tools will appear here"}
            </p>
            <div className="flex justify-center gap-2">
              <Link to="/app/campaigns/email">
                <Button>Create Email Campaign</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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

                  {item.tags.length > 0 && (
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
