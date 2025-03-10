import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import ImageAnalysisForm from '@/components/ImageAnalysisForm';
import { Separator } from '@/components/ui/separator';
import TextRenderer from '@/components/ui/TextRenderer';
import { useIsMobile } from '@/hooks/use-mobile';

interface AnalysisResponse {
  content: string;
  timestamp: string;
  sessionId: string;
  mode: string;
  subject: string;
  interactionId?: number;
}

export default function ImageAnalysisTest() {
  const [analysisResponse, setAnalysisResponse] = useState<AnalysisResponse | null>(null);
  const isMobile = useIsMobile();

  const handleAnalysisComplete = (data: AnalysisResponse) => {
    setAnalysisResponse(data);
    
    // Scroll to results section
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 200);
  };

  // Plus besoin de détecter les expressions mathématiques car on utilise maintenant un simple rendu de texte

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Test d'analyse d'image pour aide aux devoirs
      </h1>
      
      <div className="mb-8">
        <ImageAnalysisForm onAnalysisComplete={handleAnalysisComplete} />
      </div>
      
      {analysisResponse && (
        <div id="results-section" className={`mt-8 ${isMobile ? 'animate-fadeIn' : 'animate-slideUp'}`}>
          <h2 className="text-xl font-semibold mb-3">Résultats de l'analyse</h2>
          <Card>
            <CardHeader>
              <CardTitle>Réponse éducative</CardTitle>
              <CardDescription>
                Mode: {analysisResponse.mode} | Sujet: {analysisResponse.subject}
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <TextRenderer content={analysisResponse.content} />
              
              <div className="text-xs text-gray-500 mt-4">
                Timestamp: {new Date(analysisResponse.timestamp).toLocaleString()}
                {analysisResponse.interactionId && (
                  <span> | ID: {analysisResponse.interactionId}</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}