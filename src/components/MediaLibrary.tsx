import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FileUpload } from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Grid, 
  List, 
  Plus,
  Download,
  Trash2,
  Copy,
  FileImage,
  FileVideo,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface MediaAsset {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  duration?: number;
  created_at: string;
  public_url?: string;
}

export function MediaLibrary() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  useEffect(() => {
    if (user) {
      fetchAssets();
    }
  }, [user, filterType]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply type filter
      if (filterType === 'image') {
        query = query.ilike('mime_type', 'image/%');
      } else if (filterType === 'video') {
        query = query.ilike('mime_type', 'video/%');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Add public URLs to assets
      const assetsWithUrls = data.map(asset => {
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(asset.file_path);
        
        return { ...asset, public_url: publicUrl };
      });

      setAssets(assetsWithUrls);
    } catch (error: any) {
      toast.error('Failed to load media: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (url: string, file: File) => {
    // In a real implementation, you'd save the media asset metadata to the database
    await fetchAssets();
    setUploadDialogOpen(false);
  };

  const handleDelete = async (asset: MediaAsset) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([asset.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', asset.id);

      if (dbError) throw dbError;

      toast.success('File deleted successfully');
      await fetchAssets();
    } catch (error: any) {
      toast.error('Failed to delete file: ' + error.message);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredAssets = assets.filter(asset =>
    asset.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All files</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </Button>
          
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Assets Grid/List */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No files found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAssets.map((asset) => (
            <Card 
              key={asset.id} 
              className="group cursor-pointer overflow-hidden"
              onClick={() => setSelectedAsset(asset)}
            >
              <div className="aspect-square relative bg-muted">
                {asset.mime_type.startsWith('image/') ? (
                  <img
                    src={asset.public_url}
                    alt={asset.file_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileVideo className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(asset.public_url!);
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(asset);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate">{asset.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(asset.file_size)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                  {asset.mime_type.startsWith('image/') ? (
                    <FileImage className="w-6 h-6 text-muted-foreground" />
                  ) : (
                    <FileVideo className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{asset.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(asset.file_size)} • {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(asset.public_url!)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(asset)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
            <DialogDescription>
              Upload images or videos to your media library
            </DialogDescription>
          </DialogHeader>
          
          <FileUpload onUpload={handleUpload} />
        </DialogContent>
      </Dialog>

      {/* Asset Preview Dialog */}
      {selectedAsset && (
        <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedAsset.file_name}</DialogTitle>
              <DialogDescription>
                {formatFileSize(selectedAsset.file_size)} • 
                Uploaded {formatDistanceToNow(new Date(selectedAsset.created_at), { addSuffix: true })}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              {selectedAsset.mime_type.startsWith('image/') ? (
                <img
                  src={selectedAsset.public_url}
                  alt={selectedAsset.file_name}
                  className="w-full rounded-lg"
                />
              ) : (
                <video
                  src={selectedAsset.public_url}
                  controls
                  className="w-full rounded-lg"
                />
              )}
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(selectedAsset.public_url!)}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
              <Button
                variant="outline"
                asChild
                className="flex-1"
              >
                <a href={selectedAsset.public_url} download={selectedAsset.file_name}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
