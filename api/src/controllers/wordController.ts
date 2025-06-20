import { Request, Response, NextFunction } from 'express';
import { Word } from '../models/Word';
import axios from 'axios';

// Free Dictionary API 类型定义
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

// 有道 API 类型定义
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
}

// OpenAI GPT 响应类型
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// 1. Free Dictionary API 调用
async function fetchFreeDictionary(word: string) {
  try {
    console.log(`🔍 Fetching from Free Dictionary API: ${word}`);
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data: FreeDictionaryResponse[] = response.data;
    
    if (!data || data.length === 0) {
      console.log(`❌ No data found for word: ${word}`);
      return null;
    }
    
    const wordData = data[0];
    console.log(`✅ Free Dictionary data received for: ${word}`);
    return wordData;
  } catch (error) {
    console.error(`❌ Free Dictionary API error for ${word}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

// 2. 有道 API 调用
async function fetchYoudao(word: string) {
  try {
    console.log(`🔍 Fetching from Youdao API: ${word}`);
    
    // 有道 API 配置
    const appKey = process.env.YOUDAO_APP_ID;
    const appSecret = process.env.YOUDAO_APP_SECRET;
    
    if (!appKey || !appSecret) {
      console.warn('⚠️ Youdao API credentials not configured, using fallback');
      return null;
    }
    
    // 有道 API 调用逻辑 - 使用与 /api/youdao 路由相同的方式
    const salt = Date.now().toString();
    const str = appKey + word + salt + appSecret;
    const sign = require('crypto').createHash('md5').update(str).digest('hex');
    
    const params = new URLSearchParams({
      q: word,
      from: 'en',
      to: 'zh-CHS',
      appKey: appKey,
      salt: salt,
      sign: sign,
    });

    const response = await fetch(`https://openapi.youdao.com/api?${params}`);
    
    if (!response.ok) {
      console.error(`Youdao API HTTP error: ${response.status}`);
      return null;
    }

    const data: YoudaoResponse = await response.json() as YoudaoResponse;

    // Check for Youdao API specific errors
    if (data.errorCode && data.errorCode !== '0') {
      console.warn(`⚠️ Youdao API error code: ${data.errorCode}`);
      return null;
    }
    
    console.log(`✅ Youdao data received for: ${word}`);
    return data;
  } catch (error) {
    console.error(`❌ Youdao API error for ${word}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

// 3. OpenAI GPT API 调用
async function fetchGPT(word: string, youdaoData: any, freeDictData: any) {
  try {
    console.log(`🔍 Fetching from OpenAI GPT API: ${word}`);
    
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      console.warn('⚠️ OpenAI API key not configured, using fallback');
      return null;
    }

    const definitionsForGPT = freeDictData?.meanings?.flatMap((m: any) =>
      m.definitions.slice(0, 2).map((d: any) => ({
        partOfSpeech: m.partOfSpeech,
        definition: d.definition,
        example: d.example || '',
      }))
    ) || [];

    if (definitionsForGPT.length === 0) {
      console.warn(`⚠️ No definitions found for ${word} to send to GPT.`);
      return null;
    }
    
    const prompt = `
请为英语单词 "${word}" 生成结构化的中文学习内容。

你将收到一个包含英文释义和例句的JSON数组。请为数组中的每一项提供对应的中文翻译。

输入数据 (英文释义和例句):
${JSON.stringify(definitionsForGPT, null, 2)}

任务:
1.  为每个对象创建一个包含翻译的完整版本，保留原始英文内容。
2.  将 "definition" 翻译成 "definitionCn"。
3.  将 "example" 翻译成 "exampleCn"。如果 "example" 为空，"exampleCn" 也为空。
4.  提供相关的衍生词和同义词。

请严格按照以下JSON格式返回。"meanings"数组的顺序和数量必须与输入数据完全一致：
{
  "meanings": [
    {
      "partOfSpeech": "词性",
      "definition": "保留原始英文释义",
      "definitionCn": "此处为释义的中文翻译",
      "exampleEn": "保留原始英文例句",
      "exampleCn": "此处为例句的中文翻译"
    }
  ],
  "derivatives": ["衍生词1", "衍生词2"],
  "synonyms": ["同义词1", "同义词2"]
}`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的英语词汇专家，请提供准确的中文释义和例句翻译。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data: OpenAIResponse = response.data;
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      console.warn('⚠️ No content received from GPT');
      return null;
    }
    
    // 解析 JSON 响应
    try {
      const gptData = JSON.parse(content);
      console.log(`✅ GPT data received for: ${word}`);
      return gptData;
    } catch (parseError) {
      console.warn('⚠️ Failed to parse GPT response as JSON');
      return null;
    }
  } catch (error) {
    console.error(`❌ OpenAI GPT API error for ${word}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

// 4. 合并数据
function mergeWordData(word: string, youdaoData: any, freeDictData: any, gptData: any) {
  console.log(`🔄 Merging data for word: ${word}`);
  
  // 从有道 API 提取数据
  const phonetic = youdaoData?.basic?.phonetic || 
                   youdaoData?.basic?.['us-phonetic'] || 
                   youdaoData?.basic?.['uk-phonetic'] || 
                   freeDictData?.phonetic || '';
  
  const chineseTranslations = youdaoData?.translation || [];
  
  // 从 Free Dictionary 提取数据
  const audioUrl = freeDictData?.phonetics?.find((p: any) => p.audio)?.audio || '';
  
  let meanings: any[] = [];
  
  if (gptData?.meanings && gptData.meanings.length > 0) {
    // 理想情况：GPT提供了完整的、包含翻译的释义
    meanings = gptData.meanings;
  } else {
    // 备用方案：如果GPT失败，则使用其他数据源
    if (youdaoData?.basic?.explains) {
      // 使用有道词典的中文释义（但没有例句）
      meanings = youdaoData.basic.explains.map((explain: string) => {
        const match = explain.match(/^([a-z]+\.)\s*(.+)$/);
        return {
          partOfSpeech: match ? match[1].replace('.', '') : '释义',
          definition: '', // 英文释义为空
          definitionCn: match ? match[2] : explain,
          exampleEn: '',
          exampleCn: '',
        };
      });
    } else if (freeDictData?.meanings) {
      // 使用Free Dictionary的英文内容（没有中文）
      meanings = freeDictData.meanings.flatMap((m: any) =>
        m.definitions.map((d: any) => ({
          partOfSpeech: m.partOfSpeech,
          definition: d.definition,
          definitionCn: '',
          exampleEn: d.example || '',
          exampleCn: '',
        }))
      );
    }
  }
  
  // 从 GPT 提取数据
  const derivatives = gptData?.derivatives || [];
  
  // 如果 GPT 没有数据，从 Free Dictionary 提取同义词作为兜底
  const fallbackSynonyms = freeDictData?.meanings?.flatMap((meaning: any) => 
    meaning.definitions?.flatMap((def: any) => def.synonyms || []) || []
  ) || [];
  
  const synonyms = gptData?.synonyms?.length > 0 ? gptData.synonyms : fallbackSynonyms;
  
  const merged = {
    word: word.toLowerCase(),
    phonetic,
    audioUrl,
    chineseTranslations,
    meanings,
    derivatives,
    synonyms,
    difficulty: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    queryCount: 1,
    lastQueried: new Date(),
    searchTerms: [word.toLowerCase()],
  };
  
  console.log(`✅ Data merged successfully for: ${word}`);
  return merged;
}

export const getWord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wordText = req.params.word;
    console.log(`🚀 Starting word lookup for: "${wordText}"`);
    
    // 1. 查库
    console.log('1️⃣ Checking database...');
    let word = await Word.findOne({ word: wordText.toLowerCase() });
    if (word) {
      console.log(`✅ Word found in database: ${wordText}`);
      return res.status(200).json({ success: true, data: word });
    }
    
    console.log(`❌ Word not found in database: ${wordText}`);
    
    // 2. 外部 API 聚合
    console.log('2️⃣ Fetching from external APIs...');
    const [youdaoData, freeDictData] = await Promise.allSettled([
      fetchYoudao(wordText),
      fetchFreeDictionary(wordText)
    ]);
    
    const youdaoResult = youdaoData.status === 'fulfilled' ? youdaoData.value : null;
    const freeDictResult = freeDictData.status === 'fulfilled' ? freeDictData.value : null;
    
    console.log('📊 API Results:', {
      youdao: !!youdaoResult,
      freeDict: !!freeDictResult
    });
    
    // 3. GPT 补全
    console.log('3️⃣ Completing with GPT...');
    const gptData = await fetchGPT(wordText, youdaoResult, freeDictResult);
    
    // 4. 合并数据
    console.log('4️⃣ Merging data sources...');
    const merged = mergeWordData(wordText, youdaoResult, freeDictResult, gptData);
    
    // 5. 存库
    console.log('5️⃣ Saving to database...');
    const saved = await Word.create(merged);
    
    console.log(`✅ Word lookup completed successfully: ${wordText}`);
    return res.status(200).json({ success: true, data: saved });
    
  } catch (error) {
    console.error('❌ Word lookup failed:', error);
    return next(error);
  }
};

export const searchWord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.query as string;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query parameter is required' });
    }
    
    // Mocking search results to avoid real API calls for now
    const mockResults = [
      { word: query, translations: ['模拟释义1', '模拟释义2'] },
      { word: `${query}ing`, translations: ['模拟进行时态'] },
    ];
    
    return res.status(200).json({ success: true, data: mockResults });
  } catch (error) {
    return next(error);
  }
};

// 获取用户所有单词
export const getUserWords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('📚 Getting all user words...');
    
    // 从数据库获取所有单词
    const words = await Word.find().sort({ createdAt: -1 });
    
    console.log(`✅ Found ${words.length} words for user`);
    return res.status(200).json({ success: true, data: words });
  } catch (error) {
    console.error('❌ Get user words failed:', error);
    return next(error);
  }
}; 