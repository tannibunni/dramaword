import { Word, WordMeaning } from '@/types/word';

// API response types
interface YoudaoResponse {
  errorCode: string;
  query: string;
  translation?: string[];
  basic?: {
    phonetic?: string;
    'us-phonetic'?: string;
    'uk-phonetic'?: string;
    explains?: string[];
  };
  web?: Array<{
    key: string;
    value: string[];
  }>;
  message?: string;
}

interface FreeDictionaryResponse {
  word: string;
  phonetic?: string;
  phonetics?: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
    }>;
  }>;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

class APIService {
  private readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
  private readonly FREE_DICT_BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

  // 1. Youdao Dictionary API - Chinese translations and phonetics (via proxy)
  async fetchFromYoudao(word: string): Promise<Partial<Word> | undefined> {
    try {
      const response = await fetch('/api/youdao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word }),
      });

      if (!response.ok) {
        console.warn('Youdao API proxy HTTP error:', response.status);
        return undefined;
      }

      const data: YoudaoResponse = await response.json();

      // Handle credential configuration errors gracefully
      if (data.errorCode === 'CREDENTIALS_NOT_CONFIGURED') {
        console.warn('Youdao API credentials not configured, skipping Youdao translation');
        return undefined;
      }

      // Handle other API errors
      if (data.errorCode === 'HTTP_ERROR' || data.errorCode === 'INTERNAL_ERROR') {
        console.warn('Youdao API error:', data.message);
        return undefined;
      }

      // Handle Youdao-specific error codes
      if (data.errorCode !== '0') {
        console.warn('Youdao API error code:', data.errorCode);
        return undefined;
      }

      // Extract Chinese definitions from Youdao's explains field
      const chineseDefinitions: WordMeaning[] = [];
      if (data.basic?.explains) {
        data.basic.explains.forEach((explain, index) => {
          // Parse Youdao's format: "n. 中文释义" or "v. 中文释义"
          const match = explain.match(/^([a-z]+\.)\s*(.+)$/);
          if (match) {
            const partOfSpeech = this.translatePartOfSpeechAbbr(match[1]);
            const definition = match[2];
            chineseDefinitions.push({
              partOfSpeech,
              definition,
              exampleEn: '',
              exampleCn: '',
            });
          } else {
            // If no part of speech, treat as general definition
            chineseDefinitions.push({
              partOfSpeech: '释义',
              definition: explain,
              exampleEn: '',
              exampleCn: '',
            });
          }
        });
      }

      return {
        word: word.toLowerCase(),
        phonetic: data.basic?.phonetic || data.basic?.['us-phonetic'] || data.basic?.['uk-phonetic'],
        chineseTranslations: data.translation || [],
        meanings: chineseDefinitions,
      };
    } catch (error) {
      console.error('Youdao API error:', error);
      return undefined;
    }
  }

  // 2. Free Dictionary API - English definitions and audio (will be translated to Chinese)
  async fetchFromFreeDict(word: string): Promise<Partial<Word> | undefined> {
    try {
      const response = await fetch(`${this.FREE_DICT_BASE_URL}/${word}`);
      
      if (!response.ok) {
        return undefined;
      }

      const data: FreeDictionaryResponse[] = await response.json();
      const wordData = data[0];

      if (!wordData) return undefined;

      // Extract audio URL
      const audioUrl = wordData.phonetics?.find(p => p.audio)?.audio;
      
      // Extract phonetic
      const phonetic = wordData.phonetic || wordData.phonetics?.find(p => p.text)?.text;

      // Store English definitions for GPT translation
      const englishMeanings: Array<{
        partOfSpeech: string;
        definition: string;
        example?: string;
      }> = [];
      
      wordData.meanings.forEach(meaning => {
        meaning.definitions.slice(0, 2).forEach(def => { // Limit to 2 per part of speech
          englishMeanings.push({
            partOfSpeech: meaning.partOfSpeech,
            definition: def.definition,
            example: def.example,
          });
        });
      });

      return {
        word: word.toLowerCase(),
        phonetic,
        audioUrl,
        englishMeanings: englishMeanings.slice(0, 3), // Store for GPT translation
      };
    } catch (error) {
      console.error('Free Dictionary API error:', error);
      return undefined;
    }
  }

  // 3. OpenAI GPT API - Translate to Chinese and complete structure
  async fetchFromGPT(word: string, youdaoData?: Partial<Word>, freeDictData?: Partial<Word>): Promise<Partial<Word> | undefined> {
    try {
      // Check if OpenAI API key is available
      if (!this.OPENAI_API_KEY || this.OPENAI_API_KEY === 'your_openai_api_key') {
        console.warn('OpenAI API key not configured, skipping GPT translation');
        return undefined;
      }

      const prompt = this.buildGPTPrompt(word, youdaoData, freeDictData);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的英语词汇专家。请提供准确的中文释义和例句翻译。所有释义必须使用中文。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1200,
        }),
      });

      if (!response.ok) {
        console.error(`OpenAI API error: ${response.status}`);
        return undefined;
      }

      const data: OpenAIResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) return undefined;

      // Parse JSON response
      const gptData = JSON.parse(content);
      return this.processGPTResponse(gptData);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return undefined;
    }
  }

  // Build GPT prompt for Chinese translation and completion
  private buildGPTPrompt(word: string, youdaoData?: Partial<Word>, freeDictData?: Partial<Word>): string {
    const existingYoudaoMeanings = youdaoData?.meanings || [];
    const existingTranslations = youdaoData?.chineseTranslations || [];
    const englishMeanings = (freeDictData as any)?.englishMeanings || [];

    return `
请为英语单词 "${word}" 提供完整的中文词汇数据，格式为JSON。

现有数据：
- 有道词典中文释义: ${JSON.stringify(existingYoudaoMeanings)}
- 有道词典翻译: ${JSON.stringify(existingTranslations)}
- 英文释义需要翻译: ${JSON.stringify(englishMeanings)}

请提供：
1. 将所有英文释义翻译为准确的中文释义
2. 为每个释义提供中英文例句
3. 4-6个派生词
4. 4-6个近义词
5. 难度等级(1-5，1=基础，5=高级)
6. 补充完整的中文翻译

要求：
- 所有释义必须是中文
- 例句要实用且贴切
- 词性翻译为中文(如：noun→名词，verb→动词)

返回格式（仅返回有效JSON）：
{
  "meanings": [
    {
      "partOfSpeech": "动词",
      "definition": "中文释义",
      "exampleEn": "English example sentence",
      "exampleCn": "对应的中文翻译"
    }
  ],
  "derivatives": ["派生词1", "派生词2", "派生词3", "派生词4"],
  "synonyms": ["近义词1", "近义词2", "近义词3", "近义词4"],
  "difficulty": 2,
  "chineseTranslations": ["翻译1", "翻译2", "翻译3"]
}
`;
  }

  // Process GPT response
  private processGPTResponse(gptData: any): Partial<Word> {
    return {
      meanings: gptData.meanings || [],
      derivatives: gptData.derivatives || [],
      synonyms: gptData.synonyms || [],
      difficulty: gptData.difficulty || 2,
      chineseTranslations: gptData.chineseTranslations || [],
    };
  }

  // Translate part of speech abbreviations from Youdao
  private translatePartOfSpeechAbbr(abbr: string): string {
    const translations: Record<string, string> = {
      'n.': '名词',
      'v.': '动词',
      'adj.': '形容词',
      'adv.': '副词',
      'pron.': '代词',
      'prep.': '介词',
      'conj.': '连词',
      'int.': '感叹词',
      'art.': '冠词',
      'num.': '数词',
      'vi.': '不及物动词',
      'vt.': '及物动词',
    };
    return translations[abbr.toLowerCase()] || abbr.replace('.', '');
  }

  // Translate part of speech to Chinese
  private translatePartOfSpeech(pos: string): string {
    const translations: Record<string, string> = {
      'noun': '名词',
      'verb': '动词',
      'adjective': '形容词',
      'adverb': '副词',
      'pronoun': '代词',
      'preposition': '介词',
      'conjunction': '连词',
      'interjection': '感叹词',
      'determiner': '限定词',
    };
    return translations[pos.toLowerCase()] || pos;
  }

  // 4. Merge all data sources into final Word structure
  mergeWordData(word: string, youdaoData?: Partial<Word>, freeDictData?: Partial<Word>, gptData?: Partial<Word>): Word {
    const now = new Date().toISOString().split('T')[0];
    
    // Prioritize Chinese meanings from Youdao and GPT
    const meanings: WordMeaning[] = [];
    
    // Start with Youdao Chinese meanings (highest priority)
    if (youdaoData?.meanings) {
      meanings.push(...youdaoData.meanings);
    }
    
    // Add or enhance with GPT Chinese meanings
    if (gptData?.meanings) {
      gptData.meanings.forEach(gptMeaning => {
        const existingIndex = meanings.findIndex(m => 
          m.partOfSpeech === gptMeaning.partOfSpeech
        );
        
        if (existingIndex >= 0) {
          // Enhance existing meaning
          meanings[existingIndex] = {
            ...meanings[existingIndex],
            exampleEn: gptMeaning.exampleEn || meanings[existingIndex].exampleEn,
            exampleCn: gptMeaning.exampleCn || meanings[existingIndex].exampleCn,
          };
        } else {
          // Add new meaning
          meanings.push(gptMeaning);
        }
      });
    }

    // Merge Chinese translations
    const chineseTranslations = [
      ...(youdaoData?.chineseTranslations || []),
      ...(gptData?.chineseTranslations || []),
    ].filter((trans, index, arr) => arr.indexOf(trans) === index); // Remove duplicates

    return {
      id: Date.now().toString(),
      word: word.toLowerCase(),
      phonetic: freeDictData?.phonetic || youdaoData?.phonetic,
      audioUrl: freeDictData?.audioUrl,
      chineseTranslations: chineseTranslations.slice(0, 4), // Limit to 4
      meanings: meanings.slice(0, 3), // Limit to 3 meanings
      derivatives: gptData?.derivatives || [],
      synonyms: gptData?.synonyms || [],
      difficulty: gptData?.difficulty || 2,
      createdAt: now,
      reviewCount: 0,
      correctCount: 0,
      isKnown: false,
    };
  }

  // 5. Fallback word generation with Chinese
  generateFallbackWord(word: string): Word {
    const now = new Date().toISOString().split('T')[0];
    
    return {
      id: Date.now().toString(),
      word: word.toLowerCase(),
      phonetic: `/${word}/`,
      chineseTranslations: ['暂无释义'],
      meanings: [
        {
          partOfSpeech: '未知',
          definition: '暂无中文释义',
          exampleEn: `Example with ${word} not available.`,
          exampleCn: '暂无例句',
        }
      ],
      derivatives: [],
      synonyms: [],
      difficulty: 3,
      createdAt: now,
      reviewCount: 0,
      correctCount: 0,
      isKnown: false,
    };
  }
}

export const apiService = new APIService();