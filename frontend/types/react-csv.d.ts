declare module 'react-csv' {
  import * as React from 'react';

  export interface CSVLinkProps {
    data: object[] | string;
    headers?: { label: string; key: string }[] | string[];
    filename?: string;
    separator?: string;
    enclosingCharacter?: string;
    uFEFF?: boolean;
    target?: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    asyncOnClick?: boolean;
    id?: string;
    children?: React.ReactNode;
  }

  export const CSVLink: React.FC<CSVLinkProps>;
}
