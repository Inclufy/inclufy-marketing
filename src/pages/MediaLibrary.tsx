import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaLibrary as MediaLibraryComponent } from "@/components/MediaLibrary";
import { 
  Image as ImageIcon, 
  Video, 
  FileText, 
  FolderOpen
} from "lucide-react";

const MediaLibrary = () => {
  // Stats could be calculated from actual data in a real implementation
  const stats = [
    { label: "Total Files", value: "124", icon: FileText },
    { label: "Storage Used", value: "2.4 GB", icon: FolderOpen },
    { label: "Images", value: "89", icon: ImageIcon },
    { label: "Videos", value: "12", icon: Video },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Media Library</h2>
        <p className="text-muted-foreground mt-2">
          Manage all your marketing assets in one place
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Media Library Component */}
      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
          <CardDescription>
            Upload, organize, and manage your media files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MediaLibraryComponent />
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaLibrary;