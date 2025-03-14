// Global type declarations for the project

// Declare the toggleKoraMenu function added by index.html
interface Window {
  toggleKoraMenu?: () => void;
  MathJax?: {
    typesetPromise: (elements: HTMLElement[]) => Promise<any>;
    typeset: (elements: HTMLElement[]) => void;
    typesetClear: (elements: HTMLElement[]) => void;
    startup: {
      typeset: () => void;
    };
    config: {
      tex: {
        inlineMath: [string, string][];
        displayMath: [string, string][];
      };
    };
  };
}