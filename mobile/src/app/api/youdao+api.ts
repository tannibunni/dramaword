import md5 from 'js-md5';

export async function POST(request: Request) {
  try {
    const { word } = await request.json();
    
    if (!word) {
      return new Response('Word parameter is required', { status: 400 });
    }

    const YOUDAO_APP_ID = process.env.EXPO_PUBLIC_YOUDAO_APP_ID;
    const YOUDAO_APP_SECRET = process.env.EXPO_PUBLIC_YOUDAO_APP_SECRET;

    // Check if credentials are configured and not placeholder values
    if (!YOUDAO_APP_ID || !YOUDAO_APP_SECRET || 
        YOUDAO_APP_ID === 'your_youdao_app_id' || 
        YOUDAO_APP_SECRET === 'your_youdao_app_secret') {
      console.warn('Youdao API credentials not properly configured');
      return new Response(JSON.stringify({ 
        errorCode: 'CREDENTIALS_NOT_CONFIGURED',
        message: 'Youdao API credentials not configured' 
      }), { 
        status: 200, // Return 200 to avoid breaking the app
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const salt = Date.now().toString();
    const str = YOUDAO_APP_ID + word + salt + YOUDAO_APP_SECRET;
    const sign = md5(str);
    
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
      return new Response(JSON.stringify({ 
        errorCode: 'HTTP_ERROR',
        message: `HTTP ${response.status}` 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();

    // Check for Youdao API specific errors
    if (data.errorCode && data.errorCode !== '0') {
      console.warn(`Youdao API error: ${data.errorCode}`);
    }

    return Response.json(data);
  } catch (error) {
    console.error('Youdao API proxy error:', error);
    return new Response(JSON.stringify({ 
      errorCode: 'INTERNAL_ERROR',
      message: 'Internal server error' 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}