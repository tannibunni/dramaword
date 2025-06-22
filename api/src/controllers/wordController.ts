import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { Word } from '../models/Word';
import { IWord } from '../types/word';
import { isDBConnected } from '../config/database';

// GPT API 响应类型
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// 模拟数据生成函数
function generateMockWord(word: string): IWord {
  // 常见单词的真实数据
  const commonWords: { [key: string]: any } = {
    'hello': {
      pronunciation: '/həˈloʊ/',
      meanings: [
        {
          partOfSpeech: '感叹词',
          definitionCn: '你好，喂（用于问候或引起注意）',
          example: 'Hello, how are you today?',
          exampleCn: '你好，你今天怎么样？'
        },
        {
          partOfSpeech: '名词',
          definitionCn: '问候，招呼',
          example: 'She gave me a friendly hello.',
          exampleCn: '她友好地向我打招呼。'
        }
      ]
    },
    'world': {
      pronunciation: '/wɜːrld/',
      meanings: [
        {
          partOfSpeech: '名词',
          definitionCn: '世界，地球',
          example: 'The world is getting smaller with technology.',
          exampleCn: '随着科技发展，世界变得越来越小。'
        },
        {
          partOfSpeech: '名词',
          definitionCn: '领域，界',
          example: 'He is famous in the business world.',
          exampleCn: '他在商界很有名。'
        }
      ]
    },
    'example': {
      pronunciation: '/ɪɡˈzæmpəl/',
      meanings: [
        {
          partOfSpeech: '名词',
          definitionCn: '例子，实例',
          example: 'This is a good example of teamwork.',
          exampleCn: '这是团队合作的好例子。'
        },
        {
          partOfSpeech: '名词',
          definitionCn: '榜样，模范',
          example: 'She sets a good example for others.',
          exampleCn: '她为他人树立了好榜样。'
        }
      ]
    },
    'celebration': {
      pronunciation: '/ˌselɪˈbreɪʃn/',
      meanings: [
        {
          partOfSpeech: '名词',
          definitionCn: '庆祝，庆典',
          example: 'We had a big celebration for her birthday.',
          exampleCn: '我们为她的生日举行了盛大的庆祝活动。'
        }
      ]
    },
    'parody': {
      pronunciation: '/ˈpærədi/',
      meanings: [
        {
          partOfSpeech: '名词',
          definitionCn: '滑稽模仿，戏仿',
          example: 'The movie is a parody of classic horror films.',
          exampleCn: '这部电影是对经典恐怖片的滑稽模仿。'
        },
        {
          partOfSpeech: '动词',
          definitionCn: '模仿，戏仿',
          example: 'They parodied the famous speech.',
          exampleCn: '他们模仿了那个著名的演讲。'
        }
      ]
    },
    'prodigy': {
      pronunciation: '/ˈprɒdɪdʒi/',
      meanings: [
        {
          partOfSpeech: '名词',
          definitionCn: '神童，天才',
          example: 'Mozart was a musical prodigy.',
          exampleCn: '莫扎特是一个音乐神童。'
        },
        {
          partOfSpeech: '名词',
          definitionCn: '奇才，奇观',
          example: 'The child is a prodigy in mathematics.',
          exampleCn: '这个孩子在数学方面是个奇才。'
        }
      ]
    }
  };

  // 拼写建议映射
  const spellingSuggestions: { [key: string]: string[] } = {
    'progady': ['prodigy', 'prognosis', 'prognostic'],
    'prodagy': ['prodigy', 'prognosis', 'prognostic'],
    'pragody': ['prodigy', 'parody', 'prognosis'],
    'helllo': ['hello', 'helo', 'hallo'],
    'worlld': ['world', 'word', 'would'],
    'examplle': ['example', 'exemplar', 'exemplary'],
    'celebrationn': ['celebration', 'celebrating', 'celebratory'],
    'parodyy': ['parody', 'parodied', 'parodist']
  };

  // 如果单词在常见单词列表中，使用真实数据
  if (commonWords[word.toLowerCase()]) {
    const data = commonWords[word.toLowerCase()];
    return {
      _id: `mock_${Date.now()}`,
      word: word,
      pronunciation: data.pronunciation,
      meanings: data.meanings,
      audioUrl: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/words/${word}/audio`,
      difficulty: 1,
      queryCount: 1,
      lastQueried: new Date(),
      searchTerms: [word],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // 检查是否有拼写建议
  const suggestions = spellingSuggestions[word.toLowerCase()];
  if (suggestions) {
    return {
      _id: `mock_${Date.now()}`,
      word: word,
      pronunciation: `/${word}/`,
      meanings: [
        {
          partOfSpeech: '拼写建议',
          definitionCn: `未找到单词 "${word}"，您是否想查询以下单词？`,
          example: `建议查询: ${suggestions.join(', ')}`,
          exampleCn: `可能的正确拼写: ${suggestions.join(', ')}`
        }
      ],
      audioUrl: '',
      difficulty: 1,
      queryCount: 1,
      lastQueried: new Date(),
      searchTerms: [word, ...suggestions],
      createdAt: new Date(),
      updatedAt: new Date(),
      spellingSuggestions: suggestions, // 添加拼写建议字段
    };
  }

  // 对于其他未知单词，生成基本结构
  return {
    _id: `mock_${Date.now()}`,
    word: word,
    pronunciation: `/${word}/`,
    meanings: [
      {
        partOfSpeech: '未找到',
        definitionCn: `未找到单词 "${word}" 的定义`,
        example: `请检查拼写是否正确，或尝试搜索其他相关单词`,
        exampleCn: `建议检查拼写或尝试其他搜索词`
      }
    ],
    audioUrl: '',
    difficulty: 1,
    queryCount: 1,
    lastQueried: new Date(),
    searchTerms: [word],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// 模拟用户词汇列表
function generateMockUserWords(): IWord[] {
  return [
    generateMockWord('hello'),
    generateMockWord('world'),
    generateMockWord('example'),
    generateMockWord('celebration'),
  ];
}

async function fetchWordData(word: string): Promise<Partial<IWord> | null> {
  console.log(`🔍 Fetching word data from GPT: ${word}`);
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    console.warn('⚠️ OpenAI API key not configured');
    return null;
  }

  const prompt = `
You are a helpful assistant for a language learning app.
For the English word or phrase "${word}", please provide the following information in a JSON object format.
If the word or phrase is misspelled or does not exist, return a JSON object with an empty "meanings" array, and a "spellingSuggestions" array with up to 3 possible correct words or phrases, like this: {"word": "${word}", "meanings": [], "spellingSuggestions": ["prodigy", "parody"]}.

The JSON object should have the following structure:
{
  "word": "${word}",
  "pronunciation": "string (phonetic spelling, if applicable)",
  "meanings": [
    {
      "partOfSpeech": "string (The part of speech in Chinese, e.g., 名词, 动词, 形容词, 短语, 习语等)",
      "definitionCn": "string (The primary Chinese definition)",
      "example": "string (An example sentence in English)",
      "exampleCn": "string (The Chinese translation of the example sentence)"
    }
  ],
  "spellingSuggestions": ["string", ...] // Only present if the word or phrase is not found or is misspelled
}

- The input may be a single word, a phrase, a fixed expression, or an idiom.
- For the "meanings" array, provide up to 3 of the most common and important meanings or usages.
- For "definitionCn", prioritize the most direct and common Chinese translation(s) first.
- For each meaning, prioritize the most common definition and example.
- The partOfSpeech can be "短语", "习语", "固定搭配" etc. for phrases.
- If the word or phrase is not found, provide up to 3 spelling suggestions in the "spellingSuggestions" array.
`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in English vocabulary and translation. Provide the response strictly in the requested JSON format. Do not include any extra text, explanations, or markdown formatting.'
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data: OpenAIResponse = response.data;
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.warn('⚠️ No content received from GPT');
      return null;
    }

    const gptData = JSON.parse(content) as Partial<IWord>;
    console.log(`✅ GPT data received for: ${word}`);

    if (!gptData.word || (!gptData.meanings && !gptData.spellingSuggestions)) {
        console.warn('⚠️ GPT response is missing required fields.');
        return null;
    }
    
    return gptData;

  } catch (error) {
    console.error(`❌ OpenAI GPT API error for ${word}:`);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Axios error response:', error.response.data);
    } else {
      console.error(error);
    }
    return null;
  }
}

export const getWord = async (req: Request, res: Response, next: NextFunction) => {
  const wordText = req.params.word.toLowerCase();
  
  try {
    console.log(`🚀 Starting word lookup for: "${wordText}"`);

    // 检查数据库连接
    if (!isDBConnected()) {
      console.log('⚠️ Database not connected, using mock data');
      const mockWord = generateMockWord(wordText);
      return res.status(200).json(mockWord);
    }

    // 1. Check database
    console.log('1️⃣ Checking database...');
    let word = await Word.findOne({ word: wordText });
    
    if (word) {
      console.log(`✅ Word found in database: ${wordText}`);
      word.queryCount = (word.queryCount || 1) + 1;
      word.lastQueried = new Date();
      await word.save();
      return res.status(200).json(word);
    }

    console.log(`❌ Word not found in database: ${wordText}`);

    // 2. Fetch from GPT
    console.log('2️⃣ Fetching from external APIs...');
    const gptData = await fetchWordData(wordText);

    if (!gptData) {
      return res.status(500).json({ error: 'Failed to fetch word data' });
    }
    
    // 如果GPT返回拼写建议（即使meanings为空），直接返回
    if (gptData.spellingSuggestions && Array.isArray(gptData.spellingSuggestions) && gptData.spellingSuggestions.length > 0) {
      const suggestionWord: IWord = {
        _id: `temp_${Date.now()}`,
        word: gptData.word || wordText,
        pronunciation: gptData.pronunciation || '',
        meanings: gptData.meanings || [],
        audioUrl: '',
        difficulty: 1,
        queryCount: 0,
        lastQueried: new Date(),
        searchTerms: [wordText],
        createdAt: new Date(),
        updatedAt: new Date(),
        spellingSuggestions: gptData.spellingSuggestions,
      };
      return res.status(200).json(suggestionWord);
    }
    
    if (!gptData.meanings || gptData.meanings.length === 0) {
        console.log(`❌ Word "${wordText}" not found or no definitions provided, and no spelling suggestions.`);
        return res.status(404).json({ message: `Word not found: ${wordText}` });
    }

    // 3. Return the unsaved word data. The user can choose to save it explicitly.
    console.log(`✅ Word lookup completed, returning unsaved data for: ${wordText}`);
    
    // Create a temporary word object that matches the IWord interface
    const unsavedWord: IWord = {
      _id: `temp_${Date.now()}`,
      word: gptData.word || wordText,
      pronunciation: gptData.pronunciation,
      meanings: gptData.meanings,
      audioUrl: `${req.protocol}://${req.get('host')}/api/words/${wordText}/audio`,
      difficulty: 1,
      queryCount: 0,
      lastQueried: new Date(),
      searchTerms: [wordText],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Return the temporary plain object.
    return res.status(200).json(unsavedWord);

  } catch (error) {
    console.error(`❌ Word lookup failed for "${wordText}":`, error);
    next(error); // Pass error to the central error handler
    return;
  }
};

// Save a new word to the user's vocabulary
export const saveWord = async (req: Request, res: Response, next: NextFunction) => {
  const wordData = req.body as IWord;

  try {
    console.log(`💾 Backend: Received save request for word: "${wordData.word}"`);

    // 检查数据库连接
    if (!isDBConnected()) {
      console.log('⚠️ Database not connected, simulating save success');
      const mockWord = generateMockWord(wordData.word);
      return res.status(201).json(mockWord);
    }

    console.log(`💾 Backend: Word data:`, JSON.stringify(wordData, null, 2));

    // 验证请求数据
    if (!wordData || !wordData.word) {
      console.error('💾 Backend: Invalid word data received');
      return res.status(400).json({ error: 'Word data is required' });
    }

    // Check if the word already exists
    const existingWord = await Word.findOne({ word: wordData.word });
    if (existingWord) {
      console.log(`ℹ️ Backend: Word "${wordData.word}" already exists. Returning existing word.`);
      return res.status(200).json(existingWord);
    }

    console.log(`💾 Backend: Saving new word: "${wordData.word}"`);

    // 准备保存的数据，确保字段正确
    const wordToSave = {
      word: wordData.word,
      pronunciation: wordData.pronunciation || '',
      meanings: wordData.meanings || [],
      audioUrl: wordData.audioUrl || '',
      difficulty: wordData.difficulty || 1,
      queryCount: 1, // First time saving
      lastQueried: new Date(),
      searchTerms: wordData.searchTerms || [wordData.word],
    };

    console.log(`💾 Backend: Prepared word data for saving:`, JSON.stringify(wordToSave, null, 2));

    // Create a new Mongoose document and save it
    const newWord = new Word(wordToSave);
    await newWord.save();
    
    console.log(`✅ Backend: Word saved successfully: "${wordData.word}"`);
    console.log(`✅ Backend: Saved word:`, JSON.stringify(newWord.toObject(), null, 2));
    
    return res.status(201).json(newWord);

  } catch (error) {
    console.error(`❌ Backend: Failed to save word "${wordData?.word}":`, error);
    console.error(`❌ Backend: Error details:`, {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    next(error);
    return;
  }
};

/*
// TODO: searchWord logic needs to be re-evaluated based on current models.
export const searchWord = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.query as string;
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }
    
    const gptData = await fetchWordData(query);
    
    if (!gptData || !gptData.meanings || gptData.meanings.length === 0) {
      return res.status(404).json({ 
        message: `无法找到单词 "${query}" 的相关信息` 
      });
    }
    
    return res.status(200).json(gptData);
  } catch (error) {
    return next(error);
  }
};
*/

// Get all words for the user
export const getUserWords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('📚 Getting all user words...');
    
    // 检查数据库连接
    if (!isDBConnected()) {
      console.log('⚠️ Database not connected, returning mock user words');
      const mockWords = generateMockUserWords();
      return res.status(200).json(mockWords);
    }
    
    const words = await Word.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${words.length} words for user`);
    return res.status(200).json(words);
  } catch (error) {
    console.error('❌ Get user words failed:', error);
    next(error);
    return;
  }
};

// 音频代理端点 - 已切换到 Google TTS
export const proxyAudio = async (req: Request, res: Response, next: NextFunction) => {
  const { word } = req.params;
  
  if (!word) {
    return res.status(400).json({ error: 'Word parameter is required' });
  }

  try {
    console.log(`🔊 Proxying audio for "${word}" via Google TTS`);

    // 构建 Google TTS URL
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word)}&tl=en&client=tw-ob`;
    
    console.log(`🔊 Fetching audio from: ${googleTtsUrl}`);

    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const audioResponse = await axios.get(googleTtsUrl, {
      responseType: 'stream',
      headers: {
        'Referer': 'http://translate.google.com/',
        'User-Agent': 'stagefright/1.2 (Linux;Android 5.0)',
      }
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 缓存1天

    audioResponse.data.pipe(res);
    return; // 确保函数有返回值

  } catch (error) {
    console.error(`❌ Google TTS proxy error for "${word}":`, error);
    return res.status(500).json({ error: 'Failed to proxy audio from Google TTS' });
  }
}; 