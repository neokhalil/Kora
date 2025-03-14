import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface KatexRendererProps {
  formula: string;
  display?: boolean;
  className?: string;
  errorColor?: string;
  renderError?: (error: any) => React.ReactNode;
}

/**
 * Composant pour le rendu des formules mathématiques avec KaTeX
 * 
 * @param formula - La formule mathématique à afficher (au format TeX/LaTeX)
 * @param display - Si true, affiche la formule en mode bloc, sinon en mode inline
 * @param className - Classes CSS additionnelles
 * @param errorColor - Couleur utilisée pour afficher les erreurs
 * @param renderError - Fonction personnalisée pour afficher les erreurs
 */
const KatexRenderer: React.FC<KatexRendererProps> = ({
  formula,
  display = false,
  className = '',
  errorColor = '#f44336',
  renderError
}) => {
  // Handler d'erreur par défaut
  const defaultErrorHandler = (error: any) => {
    console.error('KaTeX error:', error);
    return (
      <span 
        className="katex-error" 
        title={error.toString()} 
        style={{ color: errorColor, cursor: 'help' }}
      >
        {formula}
      </span>
    );
  };

  // Utiliser le handler d'erreur personnalisé ou celui par défaut
  const errorHandler = renderError || defaultErrorHandler;

  return display ? (
    <div className={`katex-block-wrapper ${className}`}>
      <BlockMath math={formula} errorColor={errorColor} renderError={errorHandler} />
    </div>
  ) : (
    <span className={`katex-inline-wrapper ${className}`}>
      <InlineMath math={formula} errorColor={errorColor} renderError={errorHandler} />
    </span>
  );
};

export default KatexRenderer;