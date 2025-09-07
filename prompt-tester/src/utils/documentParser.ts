import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedDocument {
  content: string;
  metadata: {
    pageCount?: number;
    wordCount?: number;
    title?: string;
    lineCount?: number;
    expectedColumns?: number;
    validatedRows?: number;
    warnings?: string[];
    truncated?: boolean;
    truncatedAt?: number;
  };
}

export class DocumentParser {
  
  static async parseFile(file: File): Promise<ParsedDocument> {
    console.log('DocumentParser.parseFile called with:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    try {
      // Check file size (limit to 10MB for CSV/large text files, 50MB for others)
      const fileExtension = file.name.toLowerCase().split('.').pop() || '';
      console.log('File extension:', fileExtension);
      
      const maxSize = ['csv', 'json', 'xml'].includes(fileExtension) 
        ? 10 * 1024 * 1024  // 10MB for data files
        : 50 * 1024 * 1024; // 50MB for other files
        
      if (file.size > maxSize) {
        const limitMB = maxSize / 1024 / 1024;
        throw new Error(`File too large (${Math.round(file.size / 1024 / 1024)}MB). Please use files smaller than ${limitMB}MB for .${fileExtension} files.`);
      }
      
      console.log('File size check passed, proceeding with parsing...');
    
    switch (fileExtension) {
      case 'pdf':
        return this.parsePDF(file);
      case 'doc':
      case 'docx':
        return this.parseWord(file);
      case 'csv':
        return this.parseCSV(file);
      case 'txt':
      case 'md':
      case 'json':
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
        console.log('Calling parseText for file:', file.name);
        return this.parseText(file);
      default:
        throw new Error(`Unsupported file type: .${fileExtension}`);
    }
    } catch (error) {
      console.error('DocumentParser.parseFile error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unknown error parsing file: ${error}`);
    }
  }

  private static async parseText(file: File): Promise<ParsedDocument> {
    console.log('parseText called for:', file.name);
    try {
      const content = await this.readFileAsText(file);
      console.log('parseText: content read successfully, length:', content.length);
      
      const wordCount = content.split(/\s+/).length;
      console.log('parseText: calculated word count:', wordCount);
      
      return {
        content,
        metadata: {
          wordCount
        }
      };
    } catch (error) {
      console.error('parseText error:', error);
      throw error;
    }
  }

  private static async parseCSV(file: File): Promise<ParsedDocument> {
    try {
      const content = await this.readFileAsText(file);
      
      // For large CSV files, we might want to limit the content
      const lines = content.split('\n').filter(line => line.trim() !== ''); // Remove empty lines
      const maxLines = 1000; // Limit to first 1000 lines for very large CSVs
      
      let processedContent = content;
      let metadata: any = {
        wordCount: content.split(/\s+/).length,
        lineCount: lines.length
      };
      
      // Validate CSV structure
      if (lines.length > 0) {
        const headerLine = lines[0];
        const expectedColumns = this.countCSVColumns(headerLine);
        
        // Check for inconsistent column counts
        const inconsistentRows: number[] = [];
        for (let i = 1; i < Math.min(lines.length, 100); i++) { // Check first 100 rows
          const rowColumns = this.countCSVColumns(lines[i]);
          if (rowColumns !== expectedColumns) {
            inconsistentRows.push(i + 1); // 1-based line numbers
          }
        }
        
        if (inconsistentRows.length > 0) {
          console.warn(`CSV has inconsistent column counts in rows: ${inconsistentRows.slice(0, 10).join(', ')}${inconsistentRows.length > 10 ? '...' : ''}`);
          metadata.warnings = [`CSV has inconsistent column counts in ${inconsistentRows.length} rows`];
        }
        
        metadata.expectedColumns = expectedColumns;
        metadata.validatedRows = Math.min(lines.length, 100);
      }
      
      if (lines.length > maxLines) {
        processedContent = lines.slice(0, maxLines).join('\n') + 
          `\n\n... (truncated after ${maxLines} lines out of ${lines.length} total)`;
        metadata.truncated = true;
        metadata.truncatedAt = maxLines;
      }
      
      return {
        content: processedContent,
        metadata
      };
    } catch (error) {
      // Provide more specific error messages based on the error type
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid array length')) {
          errorMessage = 'CSV file has inconsistent row lengths. Some rows have more or fewer columns than expected.';
        } else if (error.message.includes('File reading error')) {
          errorMessage = 'Could not read the CSV file. The file may be corrupted or in an unsupported encoding.';
        } else if (error.message.includes('File too large')) {
          errorMessage = error.message; // Keep the original size error message
        } else {
          errorMessage = error.message;
        }
      }
      
      throw new Error(`Failed to parse CSV: ${errorMessage}. Try saving the CSV as a .txt file instead, or check that the CSV file is properly formatted.`);
    }
  }

  private static countCSVColumns(line: string): number {
    // Simple CSV column counting that handles quoted fields
    let inQuotes = false;
    let columnCount = 1;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        columnCount++;
      }
    }
    
    return columnCount;
  }

  private static async parsePDF(file: File): Promise<ParsedDocument> {
    try {
      console.log('parsePDF called for:', file.name);
      
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      console.log('PDF ArrayBuffer read, size:', arrayBuffer.byteLength);
      
      // Load the PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log(`PDF loaded: ${pdf.numPages} pages`);
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`Processing page ${pageNum}/${pdf.numPages}`);
        
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items into readable text
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        if (pageText) {
          fullText += `\n\n--- Page ${pageNum} ---\n${pageText}`;
        }
      }
      
      // Clean up the full text
      fullText = fullText.trim();
      const wordCount = fullText.split(/\s+/).filter(word => word.length > 0).length;
      
      console.log(`PDF parsing complete: ${fullText.length} characters, ${wordCount} words`);
      
      return {
        content: fullText,
        metadata: {
          pageCount: pdf.numPages,
          wordCount: wordCount
        }
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async parseWord(file: File): Promise<ParsedDocument> {
    try {
      // Use FileReader instead of file.arrayBuffer() for better compatibility
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
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
      // Add debugging
      console.log('Attempting to read file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      const reader = new FileReader();
      
      reader.onload = (e) => {
        console.log('FileReader onload event:', e.target?.result?.constructor.name);
        if (e.target?.result) {
          const result = e.target.result as string;
          console.log('Successfully read file, content length:', result.length);
          resolve(result);
        } else {
          console.error('FileReader onload: no result');
          reject(new Error('Failed to read file - no result'));
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error event:', error);
        reject(new Error(`File reading error: ${JSON.stringify(error)}`));
      };
      
      reader.onabort = () => {
        console.error('FileReader aborted');
        reject(new Error('File reading was aborted'));
      };
      
      try {
        console.log('Starting FileReader.readAsText...');
        reader.readAsText(file, 'UTF-8');
      } catch (error) {
        console.error('Failed to start FileReader:', error);
        reject(new Error(`Failed to start file reading: ${error}`));
      }
    });
  }

  private static readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as ArrayBuffer);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error(`File reading error: ${error}`));
      };
      reader.onabort = () => reject(new Error('File reading was aborted'));
      
      try {
        reader.readAsArrayBuffer(file);
      } catch (error) {
        reject(new Error(`Failed to start file reading: ${error}`));
      }
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