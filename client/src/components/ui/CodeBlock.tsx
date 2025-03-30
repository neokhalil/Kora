import React, { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
// Import Prism core styles first (important for proper initialization)
import 'prismjs/themes/prism-okaidia.css';
// Import line numbers plugin
import 'prismjs/plugins/line-numbers/prism-line-numbers.js';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';

// Import all language components for syntax highlighting
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating'; // Required for PHP
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-php-extras';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-swift';

// Type sécurisé pour Prism
interface ExtendedPrism {
  highlightElement: (element: HTMLElement) => void;
  highlightAll: () => void;
  manual?: boolean;
  hooks?: {
    run: (name: string, env: any) => void;
  };
  languages: any;
}

// Déclaration étendue pour TypeScript
declare global {
  interface Window {
    Prism: ExtendedPrism;
  }
}

interface CodeBlockProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  className?: string;
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
  
  // Liste complète des langages supportés
  const supportedLanguages = [
    'javascript', 'js', 'typescript', 'ts', 'python', 'py', 'java', 
    'c', 'cpp', 'csharp', 'cs', 'html', 'css', 'sql', 'bash', 'sh',
    'json', 'yaml', 'yml', 'php', 'ruby', 'rb', 'go', 'kotlin', 'kt',
    'swift', 'jsx', 'tsx', 'markdown', 'md', 'plaintext', 'text'
  ];
  
  const supportedLanguage = supportedLanguages.includes(normalizedLanguage) 
    ? normalizedLanguage 
    : 'plaintext';

  // Mapper les alias de langage aux noms Prism
  const languageMap: Record<string, string> = {
    // JavaScript & TypeScript
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'jsx',
    'tsx': 'tsx',
    
    // Python
    'py': 'python',
    
    // .NET
    'cs': 'csharp',
    
    // Shell
    'sh': 'bash',
    
    // Data formats
    'yml': 'yaml',
    
    // Ruby
    'rb': 'ruby',
    
    // Kotlin
    'kt': 'kotlin',
    
    // Markdown
    'md': 'markdown',
    
    // Plain text
    'text': 'plaintext'
  };

  const prismLanguage = languageMap[supportedLanguage] || supportedLanguage;

  // Initialisation de Prism - une seule fois au montage du composant
  useEffect(() => {
    // S'assurer que Prism est correctement configuré
    if (typeof window !== 'undefined') {
      // Définir global Prism si non défini
      if (!window.Prism) {
        window.Prism = Prism as unknown as ExtendedPrism;
      }
      
      // Prism.manual = true signifie que nous devons appeler manuellement highlight
      window.Prism.manual = true;
    }
    
    // Nettoyer les ressources à la destruction du composant
    return () => {
      if (copyTimeout) {
        clearTimeout(copyTimeout);
      }
    };
  }, [copyTimeout]);
  
  // Effet pour appliquer la coloration syntaxique quand le code ou le langage change
  useEffect(() => {
    if (!code) return;
    
    // Fonction pour appliquer la coloration syntaxique
    const highlightCode = () => {
      try {
        // Vérifier que l'élément et le DOM sont disponibles
        if (codeRef.current && document.body.contains(codeRef.current)) {
          // Réinitialiser les classes pour éviter les conflits
          codeRef.current.className = `language-${prismLanguage}`;
          
          // Appliquer la coloration syntaxique
          Prism.highlightElement(codeRef.current);
          
          // Forcer l'affichage des numéros de ligne si nécessaire
          if (showLineNumbers) {
            const parent = codeRef.current.parentElement;
            if (parent && !parent.querySelector('.line-numbers-rows')) {
              // Appliquer la coloration à tout le bloc
              Prism.highlightAll();
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de la coloration syntaxique:', error);
      }
    };
    
    // Appliquer la coloration syntaxique après le rendu du DOM
    // Essayer plusieurs fois avec un délai croissant pour s'assurer que cela fonctionne
    const timeouts = [10, 100, 500, 1000].map((delay) => 
      setTimeout(highlightCode, delay)
    );
    
    // Nettoyage des timeouts
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [code, prismLanguage, showLineNumbers]);

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
        className={`${showLineNumbers ? 'line-numbers' : ''} prism-code`}
      >
        <code 
          ref={codeRef}
          className={`language-${prismLanguage}`}
        >
          {code}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;