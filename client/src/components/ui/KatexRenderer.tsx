import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { useIsMobile } from '@/hooks/use-mobile';

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
  // Nettoyer la formule pour éviter les erreurs courantes
  const cleanFormula = formula
    // Remplacer les fractions sans accolades
    .replace(/\\frac([a-zA-Z0-9])([a-zA-Z0-9])/g, '\\frac{$1}{$2}')
    
    // Remplacer les racines carrées sans accolades
    .replace(/\\sqrt([a-zA-Z0-9])/g, '\\sqrt{$1}')
    
    // Ajouter des accolades aux indices et exposants
    .replace(/\_([a-zA-Z0-9])/g, '_{$1}')
    .replace(/\^([a-zA-Z0-9])/g, '^{$1}')
    
    // Nettoyer les espaces superflus
    .trim();

  // Fonction personnalisée pour gérer les erreurs de rendu
  const handleError = (error: any) => {
    console.error('Erreur de rendu KaTeX:', error);
    
    if (renderError) {
      return renderError(error);
    }
    
    return (
      <span 
        className="katex-error" 
        title={error.toString()} 
        style={{ color: errorColor }}
      >
        {cleanFormula}
      </span>
    );
  };

  const isMobile = useIsMobile();
  
  // Optimisation pour les formules mathématiques sur mobile
  const mobileMathClass = isMobile ? 'mobile-math' : '';
  
  // Simplification de la formule sur mobile pour moins d'espacement
  const mobileOptimizedFormula = isMobile && display 
    ? cleanFormula
        // Utiliser des formes plus compactes sur mobile
        .replace(/\\frac{([^{}]+)}{([^{}]+)}/g, '\\tfrac{$1}{$2}') // fractions plus petites
        .replace(/\\sum_{([^{}]+)}^{([^{}]+)}/g, '\\sum\\limits_{$1}^{$2}') // limites plus compactes
        .replace(/\\int_{([^{}]+)}^{([^{}]+)}/g, '\\int\\limits_{$1}^{$2}') // intégrales plus compactes
    : cleanFormula;
  
  return (
    <div className={`katex-${display ? 'block' : 'inline'}-wrapper ${mobileMathClass} ${className}`} 
         style={isMobile && display ? { 
           margin: '0.1em 0', // Réduire la marge verticale sur mobile
           padding: '0',      // Éliminer le padding
           maxHeight: 'none', // Éviter les restrictions de hauteur
           overflow: 'visible' // Éviter les barres de défilement indésirables
         } : undefined}>
      {display ? (
        <BlockMath 
          math={mobileOptimizedFormula} 
          errorColor={errorColor}
          renderError={handleError}
        />
      ) : (
        <InlineMath 
          math={mobileOptimizedFormula} 
          errorColor={errorColor}
          renderError={handleError}
        />
      )}
    </div>
  );
};

export default KatexRenderer;