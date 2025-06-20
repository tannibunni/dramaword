# Dramaword

A comprehensive vocabulary learning application with React Native frontend and Node.js backend.

## 🏗️ Project Structure

```
Dramaword/
├── mobile/          # React Native + Expo frontend
├── api/             # Node.js + Express backend
├── docs/            # Documentation
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- MongoDB Atlas account
- Expo CLI (for mobile development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Dramaword
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp api/env.example api/.env
   # Edit api/.env with your MongoDB and API keys
   
   # Frontend
   cp mobile/env.example mobile/.env
   # Edit mobile/.env with your backend URL
   ```

4. **Start development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run dev:api    # Backend only
   npm run dev:mobile # Frontend only
   ```

## 📱 Mobile App (Frontend)

- **Framework**: React Native + Expo
- **State Management**: Zustand
- **Navigation**: Expo Router
- **UI Components**: Custom components with modern design

### Features
- Multi-source word lookup (Youdao, Free Dictionary, OpenAI)
- Vocabulary management with review system
- Statistics and progress tracking
- Cloud sync with backend
- Offline support

## 🔧 API Server (Backend)

- **Framework**: Node.js + Express
- **Database**: MongoDB Atlas
- **Authentication**: JWT
- **APIs**: RESTful endpoints

### Features
- User authentication and authorization
- Word data management
- Review system backend
- Statistics calculation
- Cloud sync services

## 🐳 Docker Deployment

```bash
# Build and start all services
npm run docker:up

# Stop services
npm run docker:down

# Rebuild containers
npm run docker:build
```

## 📚 Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Migration Guide](./MIGRATION.md)
- [API Documentation](./api/README.md)
- [Mobile App Guide](./mobile/README.md)

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:api          # Start backend only
npm run dev:mobile       # Start frontend only

# Building
npm run build            # Build both projects
npm run build:api        # Build backend only
npm run build:mobile     # Build frontend only

# Testing
npm run test             # Run all tests
npm run test:api         # Test backend only
npm run test:mobile      # Test frontend only

# Linting
npm run lint             # Lint all code
npm run lint:api         # Lint backend only
npm run lint:mobile      # Lint frontend only

# Docker
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run docker:build     # Build Docker images
```

## 🔑 Environment Variables

### Backend (api/.env)
```env
PORT=3000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
YOUDAO_APP_ID=your_youdao_app_id
YOUDAO_APP_SECRET=your_youdao_app_secret
OPENAI_API_KEY=your_openai_api_key
```

### Frontend (mobile/.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_APP_NAME=Dramaword
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the [documentation](./docs/)
- Open an issue on GitHub
- Contact the development team 