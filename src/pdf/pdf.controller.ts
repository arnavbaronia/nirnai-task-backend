import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfService } from './pdf.service';
import { File } from 'multer';

@Controller('pdf')
export class PdfController {
  constructor(private pdfService: PdfService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async handleUpload(@UploadedFile() file: File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    try {
      return await this.pdfService.processPDF(file);
    } catch (error) {
      throw error; // Let the global exception filter handle it
    }
  }
}