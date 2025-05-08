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
      const data = await pdfParse(file.buffer);
      const parsedData = this.parsePDFStructure(data.text);
      const translated = await this.translateEntries(parsedData);
      
      const result = await db.insert(transactions).values(translated).returning();
      return {
        success: true,
        count: result.length,
        data: result
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  private parsePDFStructure(text: string) {
    text = (text || '')
      .replace(/\r\n/g, '\n')
      .replace(/\u00A0/g, ' ')
      .replace(/ +/g, ' ');

    const transactionBlocks = text.split(/(?=Sr\. No\.|வ\. எண்)/g);
    return transactionBlocks.map(block => this.parseTransactionBlock(block)).filter(Boolean);
  }


  private parseTransactionBlock(block: string) {
    const safeMatch = (pattern: string, group = 1, flags = 'i') => {
      try {
        const match = block.match(new RegExp(pattern, flags));
        return match?.[group]?.trim() || null;
      } catch {
        return null;
      }
    };

    return {
      serialNumber: safeMatch('(Sr\\. No\\.|வ\\. எண்)[\\s:]*?(\\d+)', 2),
      documentNumber: safeMatch('Document No\\. & Year[\\s:]*([\\d\\/]+)'),
      executionDate: this.extractDate(block, 'Date of Execution'),
      presentationDate: this.extractDate(block, 'Date of Presentation'),
      registrationDate: this.extractDate(block, 'Date of Registration'),
      nature: safeMatch('Nature[\\s:]*([^\\n]+)'),
      executants: this.extractNames(block, 'Name of Executant'),
      claimants: this.extractNames(block, 'Name of Claimant'),
      considerationValue: this.extractCurrency(block, 'Consideration Value'),
      marketValue: this.extractCurrency(block, 'Market Value'),
      prNumber: safeMatch('PR Number[\\s:]*([\\d\\/, ]+)'),
      propertyType: safeMatch('Property Type[\\s:]*([^\\n]+)'),
      propertyExtent: safeMatch('Property Extent[\\s:]*([^\\n]+)'),
      village: safeMatch('Village[\\s:]*([^\\n]+)'),
      street: safeMatch('Street[\\s:]*([^\\n]+)'),
      surveyNumbers: safeMatch('Survey No\\.[\\s:]*([^\\n]+)'),
      plotNumber: safeMatch('Plot No\\.[\\s:]*(\\d+)'),
      remarks: this.extractRemarks(block)
    };
  }

  private extractDate(block: string, field: string): Date | null {
    const dateStr = block.match(
      new RegExp(`${field}[\\s:]*?(\\d{2}-[A-Za-z]{3}-\\d{4})`, 'i')
    )?.[1] || null;
    
    return dateStr ? new Date(dateStr) : null;
  }

  private extractCurrency(block: string, field: string): string | null {
    const amount = block.match(
      new RegExp(`${field}[\\s:]*ரூ\\.?\\s*([\\d,]+)`, 'i')
    )?.[1]?.replace(/,/g, '') || null;
    
    return amount?.trim() || null;
  }

  private extractNames(block: string, field: string): string | null {
    const namesSection = block.match(
      new RegExp(`${field}[\\s:]*([\\s\\S]+?)(?=\\n\\s*\\n|$)`, 'i')
    )?.[1] || null;

    return namesSection?.split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean)
      .join(', ') || null;
  }

  private extractRemarks(block: string): string | null {
    return block.match(/Document Remarks[:\s]*([\s\S]+?)(?=Schedule 1 Details|$)/i)?.[1]?.trim() || null;
  }

  private async translateEntries(entries: any[]) {
    return Promise.all(entries.map(async entry => {
      const translated: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(entry)) {
        translated[key] = value !== null ? value : null;
        
        if (typeof value === 'string' && value.length > 0) {
          if (['executants', 'claimants'].includes(key)) {
            translated[key] = await this.translateNames(value);
          } else if (['nature', 'propertyType', 'village', 'street', 'remarks'].includes(key)) {
            translated[key] = await this.translate.translate(value);
          }
        }
      }
      
      return translated;
    }));
  }

  private async translateNames(names: string): Promise<string> {
    return Promise.all(
      names.split(', ')
        .map(name => this.translate.translate(name))
    ).then(translated => translated.join(', '));
  }
}