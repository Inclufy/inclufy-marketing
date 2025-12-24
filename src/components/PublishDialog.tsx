import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Send, Linkedin, Facebook, Instagram, Loader2, CheckCircle2, XCircle, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Platform {
  id: 'linkedin' | 'facebook' | 'instagram';
  name: string;
  icon: React.ReactNode;
}

const platforms: Platform[] = [
  { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin className="w-5 h-5" /> },
  { id: 'facebook', name: 'Facebook', icon: <Facebook className="w-5 h-5" /> },
  { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-5 h-5" /> },
];

interface PublishResult {
  platform: string;
  success: boolean;
  error?: string;
  postId?: string;
}

interface PublishDialogProps {
  getImageBase64: () => Promise<string>;
  children: React.ReactNode;
}

export function PublishDialog({ getImageBase64, children }: PublishDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<PublishResult[]>([]);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Selecteer minimaal één platform");
      return;
    }

    if (scheduleMode && (!scheduleDate || !scheduleTime)) {
      toast.error("Vul datum en tijd in voor planning");
      return;
    }

    setPublishing(true);
    setResults([]);

    try {
      const imageBase64 = await getImageBase64();

      if (scheduleMode) {
        // Schedule posts for later
        const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
        
        if (scheduledAt <= new Date()) {
          toast.error("Kies een tijdstip in de toekomst");
          setPublishing(false);
          return;
        }

        const scheduleResults: PublishResult[] = [];

        for (const platformId of selectedPlatforms) {
          const platform = platforms.find(p => p.id === platformId);
          if (!platform) continue;

          const { error } = await supabase
            .from('scheduled_posts')
            .insert({
              platform: platformId,
              image_base64: imageBase64,
              caption,
              scheduled_at: scheduledAt.toISOString(),
              status: 'pending',
            });

          if (error) {
            scheduleResults.push({ platform: platform.name, success: false, error: error.message });
          } else {
            scheduleResults.push({ platform: platform.name, success: true });
          }
        }

        setResults(scheduleResults);
        const successCount = scheduleResults.filter(r => r.success).length;
        
        if (successCount === scheduleResults.length) {
          toast.success(`${successCount} post(s) ingepland voor ${scheduledAt.toLocaleString('nl-NL')}`);
        } else {
          toast.warning(`${successCount} van ${scheduleResults.length} ingepland`);
        }
      } else {
        // Publish immediately
        const publishResults: PublishResult[] = [];

        for (const platformId of selectedPlatforms) {
          const platform = platforms.find(p => p.id === platformId);
          if (!platform) continue;

          try {
            const { data, error } = await supabase.functions.invoke('publish-social', {
              body: {
                platform: platformId,
                imageBase64,
                caption,
              },
            });

            if (error) {
              publishResults.push({ platform: platform.name, success: false, error: error.message });
            } else if (data.success) {
              publishResults.push({ platform: platform.name, success: true, postId: data.postId });
            } else {
              publishResults.push({ platform: platform.name, success: false, error: data.error });
            }
          } catch (err: unknown) {
            publishResults.push({ 
              platform: platform.name, 
              success: false, 
              error: err instanceof Error ? err.message : String(err) 
            });
          }
        }

        setResults(publishResults);
        
        const successCount = publishResults.filter(r => r.success).length;
        if (successCount === publishResults.length) {
          toast.success(`Gepubliceerd naar ${successCount} platform(s)!`);
        } else if (successCount > 0) {
          toast.warning(`${successCount} van ${publishResults.length} gepubliceerd`);
        } else {
          toast.error("Publiceren mislukt");
        }
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Er ging iets mis");
    } finally {
      setPublishing(false);
    }
  };

  const resetDialog = () => {
    setSelectedPlatforms([]);
    setCaption("");
    setResults([]);
    setScheduleMode(false);
    setScheduleDate("");
    setScheduleTime("");
  };

  // Get minimum date (today) for scheduling
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Publiceren naar Social Media
          </DialogTitle>
          <DialogDescription>
            Selecteer platformen en voeg een caption toe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Platform Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Platformen</label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  disabled={publishing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    selectedPlatforms.includes(platform.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {platform.icon}
                  <span className="text-sm font-medium">{platform.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Caption</label>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Schrijf een pakkende caption..."
              rows={3}
              disabled={publishing}
            />
          </div>

          {/* Schedule Toggle */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <button
              onClick={() => setScheduleMode(false)}
              disabled={publishing}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all ${
                !scheduleMode ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Send className="w-4 h-4" />
              <span className="text-sm font-medium">Nu publiceren</span>
            </button>
            <button
              onClick={() => setScheduleMode(true)}
              disabled={publishing}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all ${
                scheduleMode ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Inplannen</span>
            </button>
          </div>

          {/* Schedule Date/Time */}
          {scheduleMode && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Datum
                </label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={today}
                  disabled={publishing}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Tijd
                </label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  disabled={publishing}
                />
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <label className="text-sm font-medium">Resultaten</label>
              {results.map((result, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {result.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="font-medium">{result.platform}:</span>
                  <span className={result.success ? "text-green-600" : "text-red-600"}>
                    {result.success ? (scheduleMode ? "Ingepland!" : "Gepubliceerd!") : result.error}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={publishing}>
            Annuleren
          </Button>
          <Button
            onClick={handlePublish}
            disabled={publishing || selectedPlatforms.length === 0}
            className="bg-gradient-to-r from-primary to-purple-600"
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {scheduleMode ? "Inplannen..." : "Publiceren..."}
              </>
            ) : (
              <>
                {scheduleMode ? <Calendar className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                {scheduleMode ? "Inplannen" : "Publiceren"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
