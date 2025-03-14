declare module 'react-katex' {
  import React from 'react';

  interface KatexProps {
    math: string;
    errorColor?: string;
    renderError?: (error: any) => React.ReactNode;
    children?: React.ReactNode;
    className?: string;
  }

  export const InlineMath: React.FC<KatexProps>;
  export const BlockMath: React.FC<KatexProps>;
}