import React from 'react';
// Le fichier CSS global est déjà importé dans main.tsx

interface TextContentProps {
  content: string;
  className?: string;
}

/**
 * Composant simplifié pour afficher du texte
 * Sans formatage mathématique ou coloration syntaxique
 */
const TextRenderer: React.FC<TextContentProps> = ({ content, className = '' }) => {
  if (!content) {
    return null;
  }

  return (
    <div 
      className={`text-renderer ${className}`}
    >
      <div className="whitespace-pre-wrap">{content}</div>
    </div>
  );
};

export default TextRenderer;