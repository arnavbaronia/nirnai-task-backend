import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TranslateService {
  async translate(text: string): Promise<string> {
    if (!text) return text;

    try {
      const response = await axios.get('https://api.mymemory.translated.net/get', {
        params: {
          q: text,
          langpair: 'ta|en'
        }
      });
      return response.data.responseData.translatedText || text;
    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    }
  }
}