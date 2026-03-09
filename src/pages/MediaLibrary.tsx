import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaLibrary as MediaLibraryComponent } from "@/components/MediaLibrary";
import {
  Image as ImageIcon,
  Video,
  FileText,
  FolderOpen
} from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

const MediaLibrary = () => {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  // Stats could be calculated from actual data in a real implementation
  const stats = [
    { label: nl ? "Totaal bestanden" : fr ? "Fichiers totaux" : "Total Files", value: "124", icon: FileText },
    { label: nl ? "Opslag gebruikt" : fr ? "Stockage utilisé" : "Storage Used", value: "2.4 GB", icon: FolderOpen },
    { label: nl ? "Afbeeldingen" : fr ? "Images" : "Images", value: "89", icon: ImageIcon },
    { label: nl ? "Video's" : fr ? "Vidéos" : "Videos", value: "12", icon: Video },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{nl ? "Mediabibliotheek" : fr ? "Médiathèque" : "Media Library"}</h2>
        <p className="text-muted-foreground mt-2">
          {nl ? "Beheer al je marketingmaterialen op één plek" : fr ? "Gérez tous vos supports marketing en un seul endroit" : "Manage all your marketing assets in one place"}
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
          <CardTitle>{nl ? "Bestanden" : fr ? "Fichiers" : "Assets"}</CardTitle>
          <CardDescription>
            {nl ? "Upload, organiseer en beheer je mediabestanden" : fr ? "Téléchargez, organisez et gérez vos fichiers média" : "Upload, organize, and manage your media files"}
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