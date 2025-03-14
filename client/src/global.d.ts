// Global type declarations for the project

// Declare the toggleKoraMenu function added by index.html
interface Window {
  toggleKoraMenu?: () => void;
  MathJax?: {
    typesetPromise: (elements: HTMLElement[]) => Promise<any>;
    typeset: (elements: HTMLElement[]) => void;
  };
}