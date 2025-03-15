import React, { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
// Ne pas importer le thème par défaut de Prism - nous utilisons notre propre CSS
// import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
// Ajout du plugin pour les numéros de ligne
import 'prismjs/plugins/line-numbers/prism-line-numbers';

interface CodeBlockProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  className?: string;
}

// Assurer la compatibilité des types avec window.Prism
declare global {
  interface Window {
    Prism: typeof Prism & {
      manual?: boolean;
    };
  }
}

/**
 * Composant pour afficher des blocs de code avec coloration syntaxique
 * 
 * @param code - Le code à afficher
 * @param language - Le langage de programmation du code
 * @param showLineNumbers - Afficher ou non les numéros de ligne
 * @param showCopyButton - Afficher ou non un bouton pour copier le code
 * @param className - Classes CSS additionnelles
 */
const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  showLineNumbers = true,
  showCopyButton = true,
  className = ''
}) => {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [copyTimeout, setCopyTimeout] = useState<NodeJS.Timeout | null>(null);

  // Normaliser le langage
  const normalizedLanguage = language?.toLowerCase() || 'plaintext';
  const supportedLanguage = [
    'javascript', 'js', 'typescript', 'ts', 'python', 'py', 'java', 
    'c', 'cpp', 'csharp', 'cs', 'html', 'css', 'sql', 'bash', 'sh',
    'json', 'yaml', 'yml', 'plaintext', 'text'
  ].includes(normalizedLanguage) 
    ? normalizedLanguage 
    : 'plaintext';

  // Mapper les alias de langage aux noms Prism
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'cs': 'csharp',
    'sh': 'bash',
    'yml': 'yaml',
    'text': 'plaintext'
  };

  const prismLanguage = languageMap[supportedLanguage] || supportedLanguage;

  // Initialisation de Prism et suppression des effets de surexposition
useEffect(() => {
    // Cette fonction s'exécute une seule fois au montage du composant
    const style = document.createElement('style');
    style.innerHTML = `
      code[class*="language-"], pre[class*="language-"] {
        text-shadow: none !important;
        background: transparent !important;
      }
      .token {
        text-shadow: none !important;
        background: transparent !important;
      }
    `;
    document.head.appendChild(style);
    
    // Force le rechargement de Prism pour appliquer les styles
    if (typeof window !== 'undefined' && 'Prism' in window) {
      (window as any).Prism.manual = true;
    }
    
    // Nettoyage lors du démontage
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    // Appliquer la coloration syntaxique
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
      
      // Nettoyer les styles en ligne indésirables après highlight
      if (codeRef.current.querySelectorAll) {
        const tokens = codeRef.current.querySelectorAll('.token');
        tokens.forEach(token => {
          if (token instanceof HTMLElement) {
            // Supprimer tout style inline qui pourrait causer un effet de transparence
            token.style.textShadow = 'none';
            token.style.background = 'transparent';
          }
        });
      }
    }
  }, [code, prismLanguage]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(() => {
      // Nettoyer le timeout existant
      if (copyTimeout) {
        clearTimeout(copyTimeout);
      }
      
      // Afficher la confirmation
      setCopied(true);
      
      // Masquer la confirmation après 2 secondes
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);
      
      setCopyTimeout(timeout);
    }).catch(err => {
      console.error('Failed to copy code: ', err);
    });
  };

  return (
    <div className={`code-block-wrapper ${className}`}>
      <div className="code-header">
        <span className="language-label font-mono">{languageMap[supportedLanguage] || supportedLanguage}</span>
        
        {showCopyButton && (
          <button 
            onClick={copyToClipboard}
            className="copy-button"
            aria-label="Copier le code"
          >
            {copied ? 'Copié !' : 'Copier'}
          </button>
        )}
      </div>
      
      <pre 
        className={`${showLineNumbers ? 'line-numbers' : ''}`}
        style={{ backgroundColor: '#1a202c', color: '#e2e8f0' }}
      >
        <code 
          ref={codeRef}
          className={`language-${prismLanguage}`}
          style={{ backgroundColor: '#1a202c', color: '#e2e8f0' }}
        >
          {code}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;