import { useState, useCallback } from 'react';
import { Upload, X, FileImage, FileVideo, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface FileUploadProps {
  onUpload: (url: string, file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  bucket?: 'media' | 'avatars';
}

export function FileUpload({ 
  onUpload, 
  accept = 'image/*,video/*',
  maxSize = 50, // 50MB default
  bucket = 'media'
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();

  const getFileIcon = (type: string) => {
    if (type.startsWith('video/')) return <FileVideo className="w-10 h-10" />;
    return <FileImage className="w-10 h-10" />;
  };

  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    const validTypes = accept.split(',').map(t => t.trim());
    const isValidType = validTypes.some(type => {
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return file.type.startsWith(category + '/');
      }
      return file.type === type;
    });

    if (!isValidType) {
      toast.error('Invalid file type');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Generate unique file path
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExt}`;
      
      // For team-based uploads, prefix with team ID (you'll need to pass this in)
      // For now, we'll use user ID as prefix
      const filePath = bucket === 'avatars' 
        ? `${user.id}/${fileName}`
        : `uploads/${user.id}/${fileName}`;

      // Upload file with progress tracking
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onProgress: (e) => {
            const percent = (e.loaded / e.total) * 100;
            setProgress(Math.round(percent));
          }
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(publicUrl);
      }

      onUpload(publicUrl, file);
      toast.success('File uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [accept, bucket, maxSize, onUpload, user]);

  const clearUpload = () => {
    setPreview(null);
    setProgress(0);
  };

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative group">
          {preview.includes('video') ? (
            <video 
              src={preview} 
              className="w-full rounded-lg max-h-64 object-cover"
              controls
            />
          ) : (
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full rounded-lg max-h-64 object-cover"
            />
          )}
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={clearUpload}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label 
          className={`
            flex flex-col items-center justify-center w-full h-64 
            border-2 border-dashed rounded-lg cursor-pointer 
            transition-colors duration-200
            ${uploading 
              ? 'border-muted bg-muted/50 cursor-not-allowed' 
              : 'border-muted-foreground/25 hover:border-primary hover:bg-muted/50'
            }
          `}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <>
                <Loader2 className="w-10 h-10 mb-3 text-primary animate-spin" />
                <p className="mb-2 text-sm text-muted-foreground">
                  Uploading... {progress}%
                </p>
                <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground text-center">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  {accept.includes('video') && accept.includes('image') 
                    ? 'Images or Videos' 
                    : accept.includes('video') 
                    ? 'Videos only' 
                    : 'Images only'
                  } (up to {maxSize}MB)
                </p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}
