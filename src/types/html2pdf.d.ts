declare module 'html2pdf.js' {
  export interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      [key: string]: any;
    };
    jsPDF?: {
      unit?: string;
      format?: string;
      orientation?: 'portrait' | 'landscape';
      [key: string]: any;
    };
    [key: string]: any;
  }

  export interface Html2PdfInstance {
    from(element: HTMLElement): Html2PdfInstance;
    set(options: Html2PdfOptions): Html2PdfInstance;
    outputPdf(type: 'blob' | 'datauristring' | 'dataurlstring'): Promise<any>;
    save(): Promise<void>;
    output(type: string): Promise<any>;
    then(callback: (pdf: any) => void): Html2PdfInstance;
    catch(callback: (error: any) => void): Html2PdfInstance;
  }

  export default function html2pdf(): Html2PdfInstance;
} 