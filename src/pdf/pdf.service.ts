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

      // Translate only necessary fields
      const translated = await Promise.all(
        entries.map(async (entry) => ({
          ...entry,
          executants: await this.translate.translate(entry.executants),
          claimants: await this.translate.translate(entry.claimants),
          nature: await this.translate.translate(entry.nature),
          propertyType: await this.translate.translate(entry.propertyType),
          village: await this.translate.translate(entry.village),
          street: await this.translate.translate(entry.street),
          remarks: await this.translate.translate(entry.remarks),
        }))
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
    const sections = text.split(/(?=\nSr\. No\.|வ\. எண்)/g).filter(Boolean);

    for (const section of sections) {
      if (!section.trim()) continue;

      const entry: any = {
        serialNumber: this.extractValue(section, 'Sr\. No\.|வ\. எண்'),
        documentNumber: this.extractValue(section, 'Document No\.|ஆவண எண்'),
        documentYear: this.extractValue(section, 'Year|ஆண்டு'),
        executionDate: this.extractDate(section, 'Date of Execution|எழுதிக் கொடுத்த நாள்'),
        presentationDate: this.extractDate(section, 'Date of Presentation|தாக்கல் நாள்'),
        registrationDate: this.extractDate(section, 'Date of Registration|பதிவு நாள்'),
        nature: this.extractValue(section, 'Nature|தன்மை'),
        executants: this.extractNames(section, 'Name of Executant|எழுதிக் கொடுத்தவர்'),
        claimants: this.extractNames(section, 'Name of Claimant|எழுதி வாங்கியவர்'),
        volumeNumber: this.extractValue(section, 'Vol\.No|தொகுதி எண்'),
        pageNumber: this.extractValue(section, 'Page\. No|பக்க எண்'),
        considerationValue: this.extractMoney(section, 'Consideration Value|கைமாற்றுத் தொகை'),
        marketValue: this.extractMoney(section, 'Market Value|சந்தை மதிப்பு'),
        prNumber: this.extractValue(section, 'PR Number|முந்தய ஆவண எண்'),
        propertyType: this.extractValue(section, 'Property Type|சொத்தின் வகைப்பாடு'),
        propertyExtent: this.extractValue(section, 'Property Extent|சொத்தின் விஸ்தரணம்'),
        village: this.extractValue(section, 'Village|கிராமம்'),
        street: this.extractValue(section, 'Street|தெரு'),
        surveyNumbers: this.extractValue(section, 'Survey No\.|புல எண்'),
        plotNumber: this.extractValue(section, 'Plot No\.|மனை எண்'),
        remarks: this.extractRemarks(section),
      };

      // Clean up extracted values
      Object.keys(entry).forEach(key => {
        if (typeof entry[key] === 'string') {
          entry[key] = entry[key].trim();
          if (entry[key] === '') entry[key] = null;
        }
      });

      entries.push(entry);
    }

    return entries;
  }

  private extractValue(text: string, patterns: string): string {
    const regex = new RegExp(`(${patterns}).*?[:\\s]*(.*?)(\\n|$)`, 'i');
    const match = text.match(regex);
    return match ? match[2].trim() : '';
  }

  private extractDate(text: string, patterns: string): Date | null {
    const value = this.extractValue(text, patterns);
    if (!value) return null;
    
    // Handle dates like "06-Feb-2013"
    const dateMatch = value.match(/(\d{2})-([a-zA-Z]{3})-(\d{4})/);
    if (dateMatch) {
      return new Date(`${dateMatch[2]} ${dateMatch[1]}, ${dateMatch[3]}`);
    }
    return null;
  }

  private extractNames(text: string, patterns: string): string {
    const regex = new RegExp(`(${patterns}).*?[\\s\\n]*([\\s\\S]*?)(?=\\n\\s*\\n|$)`, 'i');
    const match = text.match(regex);
    if (!match) return '';

    // Clean up names list
    return match[2]
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean)
      .join(', ');
  }

  private extractMoney(text: string, patterns: string): string {
    const value = this.extractValue(text, patterns);
    const amountMatch = value.match(/[\d,]+/);
    return amountMatch ? amountMatch[0].replace(/,/g, '') : '';
  }

  private extractRemarks(text: string): string {
    const remarksRegex = /(Document Remarks|ஆவணக் குறிப்புகள்|Schedule Remarks|சொத்து விவரம் தொடர்பான குறிப்புரை)[:\s]*([\s\S]*?)(?=\n\s*\n|$)/i;
    const match = text.match(remarksRegex);
    return match ? match[2].trim() : '';
  }
}