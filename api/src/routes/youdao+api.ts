import crypto from 'crypto';
import express from 'express';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { word } = req.body;
    
    if (!word) {
      return res.status(400).json({ error: 'Word parameter is required' });
    }

    const YOUDAO_APP_ID = process.env.YOUDAO_APP_ID;
    const YOUDAO_APP_SECRET = process.env.YOUDAO_APP_SECRET;

    // Check if credentials are configured and not placeholder values
    if (!YOUDAO_APP_ID || !YOUDAO_APP_SECRET || 
        YOUDAO_APP_ID === 'your_youdao_app_id' || 
        YOUDAO_APP_SECRET === 'your_youdao_app_secret') {
      console.warn('Youdao API credentials not properly configured');
      return res.json({ 
        errorCode: 'CREDENTIALS_NOT_CONFIGURED',
        message: 'Youdao API credentials not configured' 
      });
    }

    const salt = Date.now().toString();
    const str = YOUDAO_APP_ID + word + salt + YOUDAO_APP_SECRET;
    const sign = crypto.createHash('md5').update(str).digest('hex');
    
    const params = new URLSearchParams({
      q: word,
      from: 'en',
      to: 'zh-CHS',
      appKey: YOUDAO_APP_ID,
      salt: salt,
      sign: sign,
    });

    const response = await fetch(`https://openapi.youdao.com/api?${params}`);
    
    if (!response.ok) {
      console.error(`Youdao API HTTP error: ${response.status}`);
      return res.json({ 
        errorCode: 'HTTP_ERROR',
        message: `HTTP ${response.status}` 
      });
    }

    const data = await response.json() as any;

    // Check for Youdao API specific errors
    if (data.errorCode && data.errorCode !== '0') {
      console.warn(`Youdao API error: ${data.errorCode}`);
    }

    return res.json(data);
  } catch (error) {
    console.error('Youdao API proxy error:', error);
    return res.json({ 
      errorCode: 'INTERNAL_ERROR',
      message: 'Internal server error' 
    });
  }
});

export default router;