import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 扩展Request类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: '服务器配置错误'
      });
    }

    // 验证JWT令牌
    const decoded = jwt.verify(token, secret) as {
      id: string;
      username: string;
      email: string;
      iat: number;
      exp: number;
    };

    // 将用户信息添加到请求对象
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
    };

    next();
    return;
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: '访问令牌已过期'
      });
    }

    return res.status(500).json({
      success: false,
      message: '认证失败'
    });
  }
};

// 可选认证中间件 - 不强制要求认证
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // 继续执行，但不设置用户信息
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return next(); // 继续执行，但不设置用户信息
    }

    const decoded = jwt.verify(token, secret) as {
      id: string;
      username: string;
      email: string;
      iat: number;
      exp: number;
    };

    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
    };

    next();
  } catch (error) {
    // 认证失败时继续执行，但不设置用户信息
    next();
  }
}; 