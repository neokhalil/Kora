import React from 'react';

interface TextContentProps {
  content: string;
  className?: string;
}

/**
 * Composant simplifié pour afficher du texte
 * Sans formatage mathématique ou coloration syntaxique
 */
const TextRenderer: React.FC<TextContentProps> = ({ content, className = "" }) => {
  // Simple formattage texte
  const formatPlainText = (text: string): string => {
    if (!text) return '';
    
    // Convertir les sauts de ligne en paragraphes
    const paragraphs = text.split('\n\n');
    
    // Créer un HTML simple avec des paragraphes
    return paragraphs
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');
  };
  
  return (
    <div className={`text-content ${className}`}>
      <div 
        dangerouslySetInnerHTML={{ __html: formatPlainText(content) }}
        className="text-content-inner"
      />
    </div>
  );
};

export default TextRenderer;