import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TranslateService {
  async translate(text: string): Promise<string> {
    if (!text || text.trim() === '') return text;

    try {
      // Using MyMemory API as it's simple and free
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