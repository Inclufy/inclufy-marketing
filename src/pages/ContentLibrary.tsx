import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  FolderOpen, 
  Video, 
  Image as ImageIcon, 
  FileText,
  Search,
  Plus,
  Trash2,
  Download,
  Share2,
  Copy,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface ContentItem {
  id: string;
  type: "video" | "image" | "tutorial";
  title: string;
  thumbnail?: string;
  createdAt: Date;
  size?: string;
}

// Sample content (in a real app, this would come from a database)
const sampleContent: ContentItem[] = [
  {
    id: "1",
    type: "video",
    title: "Inclufy Solutions Introductie",
    createdAt: new Date("2024-01-15"),
    size: "2.4 MB",
  },
  {
    id: "2",
    type: "image",
    title: "Instagram Post - Launch",
    createdAt: new Date("2024-01-14"),
    size: "345 KB",
  },
  {
    id: "3",
    type: "tutorial",
    title: "Onboarding Tutorial",
    createdAt: new Date("2024-01-10"),
  },
];

const ContentLibrary = () => {
  const [content, setContent] = useState<ContentItem[]>(sampleContent);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "video" | "image" | "tutorial">("all");

  const filteredContent = content.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: ContentItem["type"]) => {
    switch (type) {
      case "video":
        return <Video className="w-5 h-5 text-purple-500" />;
      case "image":
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case "tutorial":
        return <FileText className="w-5 h-5 text-green-500" />;
    }
  };

  const getTypeLabel = (type: ContentItem["type"]) => {
    switch (type) {
      case "video":
        return "Video";
      case "image":
        return "Afbeelding";
      case "tutorial":
        return "Tutorial";
    }
  };

  const deleteItem = (id: string) => {
    setContent(content.filter((item) => item.id !== id));
    toast.success("Item verwijderd");
  };

  const copyLink = (item: ContentItem) => {
    // In a real app, this would copy the actual share link
    navigator.clipboard.writeText(`https://inclufy.app/share/${item.id}`);
    toast.success("Link gekopieerd!");
  };

  const stats = {
    videos: content.filter((c) => c.type === "video").length,
    images: content.filter((c) => c.type === "image").length,
    tutorials: content.filter((c) => c.type === "tutorial").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <FolderOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Content Library</h1>
                <p className="text-sm text-muted-foreground">
                  Al je gemaakte content op één plek
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Video className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{stats.videos}</p>
                  <p className="text-xs text-purple-600/70">Videos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.images}</p>
                  <p className="text-xs text-blue-600/70">Afbeeldingen</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.tutorials}</p>
                  <p className="text-xs text-green-600/70">Tutorials</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Create Buttons */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Maak Nieuwe Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link to="/tutorial-creator">
                  <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <FileText className="w-6 h-6 text-green-500" />
                    <span>Tutorial Video</span>
                  </Button>
                </Link>
                <Link to="/commercial-creator">
                  <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <Video className="w-6 h-6 text-purple-500" />
                    <span>Commercial</span>
                  </Button>
                </Link>
                <Link to="/social-post-generator">
                  <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <ImageIcon className="w-6 h-6 text-blue-500" />
                    <span>Social Post</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek content..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "video", "image", "tutorial"] as const).map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                >
                  {type === "all" ? "Alles" : getTypeLabel(type)}
                </Button>
              ))}
            </div>
          </div>

          {/* Content Grid */}
          {filteredContent.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Geen content gevonden</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? "Probeer een andere zoekterm"
                    : "Begin met het maken van je eerste content"}
                </p>
                <div className="flex justify-center gap-2">
                  <Link to="/tutorial-creator">
                    <Button variant="outline">Maak Tutorial</Button>
                  </Link>
                  <Link to="/commercial-creator">
                    <Button>Maak Commercial</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContent.map((item) => (
                <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    {/* Thumbnail placeholder */}
                    <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                      {getTypeIcon(item.type)}
                    </div>

                    {/* Info */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            {getTypeIcon(item.type)}
                            {getTypeLabel(item.type)}
                          </span>
                          <span>•</span>
                          <span>{item.createdAt.toLocaleDateString("nl-NL")}</span>
                          {item.size && (
                            <>
                              <span>•</span>
                              <span>{item.size}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" title="Download">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => copyLink(item)}
                        title="Kopieer link"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                        className="text-destructive hover:text-destructive"
                        title="Verwijder"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContentLibrary;
