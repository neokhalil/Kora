declare module 'prismjs' {
  const Prism: {
    highlightElement: (element: HTMLElement) => void;
    highlightAll: () => void;
    languages: any;
  };
  export = Prism;
}