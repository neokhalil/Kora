declare module 'react-katex' {
  import React from 'react';

  interface KatexProps {
    math: string;
    block?: boolean;
    errorColor?: string;
    renderError?: (error: Error) => React.ReactNode;
    settings?: {
      displayMode?: boolean;
      throwOnError?: boolean;
      errorColor?: string;
      macros?: { [key: string]: string };
      colorIsTextColor?: boolean;
      strict?: boolean | string;
      trust?: boolean | ((context: { command: string; url: string; protocol: string }) => boolean);
      [key: string]: any;
    };
    children?: React.ReactNode;
  }

  export class InlineMath extends React.Component<KatexProps> {}
  export class BlockMath extends React.Component<KatexProps> {}
}