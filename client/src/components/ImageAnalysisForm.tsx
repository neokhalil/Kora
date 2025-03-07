import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

interface ImageAnalysisFormProps {
  onAnalysisComplete?: (data: any) => void;
}

const subjects = [
  { value: "general", label: "Détection automatique" },
  { value: "math", label: "Mathématiques" },
  { value: "science", label: "Sciences" },
  { value: "language", label: "Langues & Littérature" },
  { value: "history", label: "Histoire & Géographie" }
];

const analysisModes = [
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Détaillé" },
  { value: "step-by-step", label: "Étape par étape" }
];

export default function ImageAnalysisForm({ onAnalysisComplete }: ImageAnalysisFormProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [subject, setSubject] = useState("general");
  const [mode, setMode] = useState("standard");
  const [query, setQuery] = useState("");
  
  // References to file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true);
    
    const file = event.target.files?.[0];
    if (file) {
      // Check if the file is an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Type de fichier non supporté",
          description: "Veuillez sélectionner une image (JPG, PNG, etc.).",
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "L'image doit faire moins de 10MB.",
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setSelectedImage(file);
      setImagePreviewUrl(previewUrl);
    }
    
    setIsUploading(false);
  };

  const handleCapture = () => {
    if (captureInputRef.current) {
      captureInputRef.current.click();
    }
  };

  const handleBrowse = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setQuery("");
    
    // Reset file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (captureInputRef.current) captureInputRef.current.value = '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedImage) {
      toast({
        title: "Image requise",
        description: "Veuillez prendre une photo ou sélectionner une image.",
        variant: "destructive"
      });
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('subject', subject);
      formData.append('mode', mode);
      
      // Add optional query if present
      if (query.trim()) {
        formData.append('query', query);
      }
      
      // Generate a unique session ID for this analysis
      const sessionId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      formData.append('sessionId', sessionId);
      
      // Send to API
      const response = await fetch('/api/image-analysis', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'An error occurred during image analysis');
      }
      
      const data = await response.json();
      
      // Call the callback with the analysis results
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }
      
      toast({
        title: "Analyse terminée",
        description: "L'analyse de votre image a été complétée avec succès.",
      });
      
      // Clear the form after successful submission
      resetForm();
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: "Erreur d'analyse",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'analyse de l'image.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Analyse d'image pour devoirs</CardTitle>
        <CardDescription>
          Prenez une photo de votre exercice ou téléchargez une image pour obtenir de l'aide
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-3">
            <label className="text-sm font-medium">Image à analyser:</label>
            
            {/* Hidden file inputs */}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            
            <input 
              type="file"
              ref={captureInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            
            {/* Image selection buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                type="button" 
                onClick={handleCapture}
                variant="outline"
                disabled={isUploading || isAnalyzing}
              >
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Prendre une photo
              </Button>
              
              <Button 
                type="button" 
                onClick={handleBrowse}
                variant="outline"
                disabled={isUploading || isAnalyzing}
              >
                <Upload className="mr-2 h-4 w-4" />
                Parcourir
              </Button>
            </div>
            
            {/* Image preview */}
            {imagePreviewUrl && (
              <div className="mt-2 relative">
                <img 
                  src={imagePreviewUrl} 
                  alt="Preview" 
                  className="max-h-48 max-w-full object-contain rounded-md border border-gray-200 dark:border-gray-700"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={resetForm}
                  disabled={isAnalyzing}
                >
                  Supprimer
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Matière:</label>
              <Select value={subject} onValueChange={setSubject} disabled={isAnalyzing}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une matière" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subj) => (
                    <SelectItem key={subj.value} value={subj.value}>
                      {subj.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Mode d'analyse:</label>
              <Select value={mode} onValueChange={setMode} disabled={isAnalyzing}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un mode" />
                </SelectTrigger>
                <SelectContent>
                  {analysisModes.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Question additionnelle (optionnelle):</label>
            <Textarea
              placeholder="Décrivez votre question ou ce que vous ne comprenez pas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isAnalyzing}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full"
            disabled={!selectedImage || isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Analyser l'image
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}