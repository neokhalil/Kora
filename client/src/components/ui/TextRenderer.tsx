import React from 'react';

interface TextContentProps {
  content: string;
  className?: string;
}

/**
 * Composant simplifié pour afficher du texte
 * Sans formatage mathématique ou coloration syntaxique
 */
const TextRenderer: React.FC<TextContentProps> = ({ content, className = '' }) => {
  return (
    <div className={`message-content text-content ${className}`}>
      {content}
    </div>
  );
};

export default TextRenderer;