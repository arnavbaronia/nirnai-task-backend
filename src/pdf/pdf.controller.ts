import {
  Controller,
  Post,
  Get,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfService } from './pdf.service';
import { SearchTransactionsDto } from './dto/search-transactions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as multer from 'multer';  // Import multer

@Controller('pdf')
@UseGuards(JwtAuthGuard)
export class PdfController {
  constructor(private pdfService: PdfService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async handleUpload(@UploadedFile() file: multer.File) {  // Update type here
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.size > 50 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 50MB limit');
    }

    return this.pdfService.processPDF(file);
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