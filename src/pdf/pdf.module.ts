import { Module } from '@nestjs/common';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { TranslateService } from '../utils/translate.service';

@Module({
  controllers: [PdfController],
  providers: [PdfService, TranslateService]
})
export class PdfModule {}