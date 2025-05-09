import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PdfModule } from './pdf/pdf.module';

@Module({
  imports: [AuthModule, PdfModule],
})
export class AppModule {}