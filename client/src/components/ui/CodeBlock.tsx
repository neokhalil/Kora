import React, { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
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

  useEffect(() => {
    // Appliquer la coloration syntaxique
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
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
    <div className={`code-block-wrapper relative my-4 ${className}`}>
      <div className="code-header flex justify-between items-center bg-gray-800 text-white text-xs py-1 px-4 rounded-t">
        <span className="language-label font-mono">{languageMap[supportedLanguage] || supportedLanguage}</span>
        
        {showCopyButton && (
          <button 
            onClick={copyToClipboard}
            className="copy-button font-medium hover:text-blue-300 transition-colors"
            aria-label="Copier le code"
          >
            {copied ? 'Copié !' : 'Copier'}
          </button>
        )}
      </div>
      
      <pre className={`relative overflow-x-auto p-4 bg-gray-900 rounded-b text-sm ${showLineNumbers ? 'line-numbers' : ''}`}>
        <code 
          ref={codeRef}
          className={`language-${prismLanguage}`}
        >
          {code}
        </code>
      </pre>
      
{/* Styles moved to CSS file */}
    </div>
  );
};

export default CodeBlock;