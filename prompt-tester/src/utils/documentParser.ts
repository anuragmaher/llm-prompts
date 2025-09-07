import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface ParsedDocument {
  content: string;
  metadata: {
    pageCount?: number;
    wordCount?: number;
    title?: string;
  };
}

export class DocumentParser {
  
  static async parseFile(file: File): Promise<ParsedDocument> {
    const fileExtension = file.name.toLowerCase().split('.').pop() || '';
    
    switch (fileExtension) {
      case 'pdf':
        return this.parsePDF(file);
      case 'doc':
      case 'docx':
        return this.parseWord(file);
      case 'txt':
      case 'md':
      case 'json':
      case 'csv':
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'html':
      case 'css':
      case 'xml':
      case 'yaml':
      case 'yml':
        return this.parseText(file);
      default:
        throw new Error(`Unsupported file type: .${fileExtension}`);
    }
  }

  private static async parseText(file: File): Promise<ParsedDocument> {
    const content = await this.readFileAsText(file);
    return {
      content,
      metadata: {
        wordCount: content.split(/\s+/).length
      }
    };
  }

  private static async parsePDF(file: File): Promise<ParsedDocument> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      let fullText = '';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n\n';
      }
      
      return {
        content: fullText.trim(),
        metadata: {
          pageCount: pdf.numPages,
          wordCount: fullText.split(/\s+/).length
        }
      };
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async parseWord(file: File): Promise<ParsedDocument> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      return {
        content: result.value,
        metadata: {
          wordCount: result.value.split(/\s+/).length
        }
      };
    } catch (error) {
      throw new Error(`Failed to parse Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsText(file);
    });
  }

  static getSupportedExtensions(): string[] {
    return [
      'pdf', 'doc', 'docx', 'txt', 'md', 'json', 'csv',
      'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c',
      'html', 'css', 'xml', 'yaml', 'yml'
    ];
  }

  static getAcceptString(): string {
    const extensions = this.getSupportedExtensions();
    return extensions.map(ext => `.${ext}`).join(',');
  }

  static isSupported(filename: string): boolean {
    const ext = filename.toLowerCase().split('.').pop() || '';
    return this.getSupportedExtensions().includes(ext);
  }
}