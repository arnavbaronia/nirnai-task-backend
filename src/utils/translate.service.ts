import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TranslateService {
  private readonly termMap = {
    'சந்தை மதிப்பு': 'Market Value',
    'கைமாற்றுத் தொகை': 'Consideration Value',
    'ஆவண எண்': 'Document Number',
    'புல எண்': 'Survey Number',
    'மனை எண்': 'Plot Number',
    'கிராமம்': 'Village',
    'தெரு': 'Street',
    'சொத்தின் வகைப்பாடு': 'Property Type',
    'சொத்தின் விஸ்தரணம்': 'Property Extent',
    'முதல்வர்': 'Principal',
    'முகவராகவும்': 'as Agent'
  };

  async translate(text: string): Promise<string> {
    if (!text?.trim()) return text;

    // Check predefined terms first
    const term = Object.entries(this.termMap)
      .find(([ta]) => text.includes(ta));
    if (term) return text.replace(term[0], term[1]);

    try {
      const response = await axios.get('https://api.mymemory.translated.net/get', {
        params: {
          q: text,
          langpair: 'ta|en',
          de: 'example@example.com'
        }
      });
      
      return response.data.responseData?.translatedText?.trim() || text;
    } catch (error) {
      console.error('Translation error:', text, error);
      return text;
    }
  }
}