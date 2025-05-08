import {
  Controller,
  Post,
  Get,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfService } from './pdf.service';
import { File } from 'multer';
import { SearchTransactionsDto } from './dto/search-transactions.dto';

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
      const result = await this.pdfService.processPDF(file);
      return {
        success: true,
        count: result.data.length,
        data: result
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('search')
  async searchTransactions(
    @Query() searchParams: SearchTransactionsDto
  ) {
    try {
      return await this.pdfService.searchTransactions(searchParams);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}