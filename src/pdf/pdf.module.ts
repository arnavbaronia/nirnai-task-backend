import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { TranslateService } from '../utils/translate.service';

@Module({
  controllers: [PdfController],
  providers: [PdfService, TranslateService],
})
export class PdfModule {}