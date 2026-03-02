// src/pages/PresentationGenerator.tsx
import { useState, useEffect } from 'react';
import { PresentationGenerator as PresentationGeneratorComponent } from '@/components/PresentationGenerator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Presentation, 
  Calendar, 
  Building2, 
  Trash2, 
  Eye,
  Download,
  Loader2 
} from 'lucide-react';

interface SavedPresentation {
  id: string;
  company_name: string;
  website_url: string;
  created_at: string;
  content: any;
}

export default function PresentationGenerator() {
  const { user } = useAuth();
  const [savedPresentations, setSavedPresentations] = useState<SavedPresentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPresentation, setSelectedPresentation] = useState<SavedPresentation | null>(null);

  useEffect(() => {
    if (user) {
      loadPresentations();
    }
  }, [user]);

  const loadPresentations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading presentations:', error);
        toast.error('Failed to load saved presentations');
      } else {
        setSavedPresentations(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePresentation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this presentation?')) return;

    try {
      const { error } = await supabase
        .from('presentations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Presentation deleted');
      setSavedPresentations(prev => prev.filter(p => p.id !== id));
      if (selectedPresentation?.id === id) {
        setSelectedPresentation(null);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete presentation');
    }
  };

  const exportPresentation = (presentation: SavedPresentation) => {
    const content = JSON.stringify(presentation.content, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${presentation.company_name.toLowerCase().replace(/\s+/g, '-')}-presentation.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePresentationGenerated = () => {
    // Reload the presentations list after generating a new one
    loadPresentations();
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate New</TabsTrigger>
          <TabsTrigger value="saved">
            Saved Presentations
            {savedPresentations.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {savedPresentations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <PresentationGeneratorComponent onPresentationGenerated={handlePresentationGenerated} />
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Presentation className="h-5 w-5" />
                Saved Presentations
              </CardTitle>
              <CardDescription>
                View and manage your previously generated presentations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : savedPresentations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Presentation className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No saved presentations yet.</p>
                  <p className="text-sm">Generate your first presentation to see it here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedPresentations.map((presentation) => (
                    <div
                      key={presentation.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium">{presentation.company_name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(presentation.created_at).toLocaleDateString()}
                            </span>
                            {presentation.content?.presentation?.slides && (
                              <span>{presentation.content.presentation.slides.length} slides</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPresentation(presentation)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportPresentation(presentation)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePresentation(presentation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Show selected presentation details */}
          {selectedPresentation && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedPresentation.company_name} - Presentation Details</CardTitle>
                <CardDescription>
                  Generated on {new Date(selectedPresentation.created_at).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Executive Summary</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedPresentation.content?.presentation?.executiveSummary}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Slides ({selectedPresentation.content?.presentation?.slides?.length || 0})</h4>
                    <div className="space-y-2">
                      {selectedPresentation.content?.presentation?.slides?.map((slide: any, index: number) => (
                        <div key={index} className="pl-4 border-l-2 border-gray-200">
                          <p className="font-medium text-sm">{index + 1}. {slide.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}