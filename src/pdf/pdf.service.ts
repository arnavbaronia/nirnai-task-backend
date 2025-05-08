import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import { db } from '../db/drizzle';
import { transactions } from '../db/schema';
import { TranslateService } from '../utils/translate.service';
import { File } from 'multer';

@Injectable()
export class PdfService {
  constructor(private readonly translate: TranslateService) {}

  async processPDF(file: File) {
    try {
      if (!file || !file.buffer) {
        throw new Error('Invalid file upload');
      }

      const data = await pdfParse(file.buffer);
      const entries = this.extractEntries(data.text);

      if (entries.length === 0) {
        throw new Error('No valid transactions found in the PDF');
      }

      const translated = await Promise.all(
        entries.map((e) => this.translateFields(e))
      );

      const result = await db.insert(transactions).values(translated).returning();
      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to process PDF'
      );
    }
  }

  private extractEntries(text: string) {
    const entries: any[] = [];
    const lines = text.split('\n');
    
    // This is a simplified parser - you'll need to enhance it based on your actual PDF structure
    let currentEntry: any = null;
    
    for (const line of lines) {
      if (line.includes('விற்பனையாளர்') || line.includes('Seller')) {
        if (currentEntry) {
          entries.push(currentEntry);
        }
        currentEntry = {
          seller: this.extractValue(line, 'விற்பனையாளர்') || this.extractValue(line, 'Seller'),
          buyer: '',
          houseNumber: '',
          surveyNumber: '',
          documentNumber: '',
          value: '',
          date: new Date(),
        };
      } else if (currentEntry) {
        if (line.includes('கொள்முதல்') || line.includes('Buyer')) {
          currentEntry.buyer = this.extractValue(line, 'கொள்முதல்') || this.extractValue(line, 'Buyer');
        } else if (line.includes('வீடு எண்') || line.includes('House No')) {
          currentEntry.houseNumber = this.extractValue(line, 'வீடு எண்') || this.extractValue(line, 'House No');
        } else if (line.includes('அளவீடு எண்') || line.includes('Survey No')) {
          currentEntry.surveyNumber = this.extractValue(line, 'அளவீடு எண்') || this.extractValue(line, 'Survey No');
        } else if (line.includes('ஆவணம் எண்') || line.includes('Document No')) {
          currentEntry.documentNumber = this.extractValue(line, 'ஆவணம் எண்') || this.extractValue(line, 'Document No');
        } else if (line.includes('மதிப்பு') || line.includes('Value')) {
          currentEntry.value = this.extractValue(line, 'மதிப்பு') || this.extractValue(line, 'Value');
        }
      }
    }

    if (currentEntry) {
      entries.push(currentEntry);
    }

    return entries;
  }

  private extractValue(line: string, keyword: string): string {
    const parts = line.split(keyword);
    if (parts.length > 1) {
      return parts[1].trim().split(/\s+/)[0];
    }
    return '';
  }

  private async translateFields(entry: any) {
    try {
      const [buyer, seller] = await Promise.all([
        this.translate.translate(entry.buyer),
        this.translate.translate(entry.seller),
      ]);

      return {
        ...entry,
        buyer,
        seller,
      };
    } catch (error) {
      console.error('Translation error:', error);
      return entry; // Return untranslated if translation fails
    }
  }
}