import { Request, Response, NextFunction } from 'express';

export const validateWord = (req: Request, res: Response, next: NextFunction) => {
  const { word, translation, phonetic } = req.body;
  
  if (!word || typeof word !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Word is required and must be a string'
    });
  }
  
  if (!translation || typeof translation !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Translation is required and must be a string'
    });
  }
  
  next();
  return;
}; 