# 🎯 AI-Powered Task & Document Management System

A comprehensive Next.js application that combines intelligent task management with document organization, powered by Google's Gemini AI and Firebase. This system automatically analyzes documents, generates relevant tasks, and provides actionable insights to boost productivity.

![Project Demo](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black)
![Firebase](https://img.shields.io/badge/Firebase-11.10.0-orange)
![AI Integration](https://img.shields.io/badge/AI-Gemini%202.0-blue)

## 🌟 Features

### 📋 Smart Task Management
- **AI-Powered Analysis**: Get intelligent insights for every task using Google Gemini AI
- **Priority System**: Organize tasks by Low, Medium, and High priority levels
- **Real-time Updates**: Live synchronization across all devices using Firebase
- **Smart Filtering**: Filter tasks by priority, completion status, and search terms
- **Quick Actions**: Auto-detect emails, phone numbers, URLs, and locations in tasks

### 📁 Intelligent Document Management
- **Multi-format Support**: Upload PDFs, images (JPG, PNG), documents (DOC, DOCX), and text files
- **Smart Categorization**: Organize documents by type (Certificate, Resume, Transcript, ID, Other)
- **AI Task Generation**: Automatically generate relevant tasks based on document content and category
- **Hybrid Storage**: Base64 for small files (<1MB) with Firebase Storage fallback for larger files
- **Document Analysis**: Get AI-powered insights for document-related workflows

### 🤖 AI-Powered Features
- **Contextual Analysis**: Smart analysis based on document type and content
- **Actionable Insights**: Get specific steps, resources, and time estimates
- **Quick Actions Detection**: Auto-detect and create action buttons for:
  - 📧 Email addresses → Direct email composition
  - 📞 Phone numbers → Click-to-call functionality
  - 📍 Addresses → Google Maps navigation
  - 📅 Meeting references → Calendar integration
  - 🔍 Research topics → Google search
  - 📄 Document creation → Google Docs

### 🎨 Modern UI/UX
- **Dark Theme**: Elegant dark interface with yellow accent colors
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Smooth Animations**: Framer Motion animations for enhanced user experience
- **Real-time Feedback**: Loading states and progress indicators
- **Interactive Components**: Hover effects and micro-interactions

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.1.6 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **UI Components**: Custom components with Radix UI primitives

### Backend & Services
- **Database**: Firestore (NoSQL)
- **Authentication**: Firebase Auth with Google Sign-in
- **Storage**: Firebase Storage + Base64 fallback
- **AI Integration**: Google Gemini 2.0 Flash Experimental
- **Real-time**: Firebase real-time listeners

### Development Tools
- **Build Tool**: Turbopack (Next.js)
- **Linting**: ESLint with Next.js configuration
- **Package Manager**: npm

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Firebase project setup
- Google AI API key (Gemini)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gdgnomination_project/client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Update the Firebase configuration in `lib/firebase.ts`:
   ```typescript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.firebasestorage.app",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id",
     measurementId: "your-measurement-id"
   }
   ```

   Update the Gemini API key in `lib/gemini.ts`:
   ```typescript
   const API_KEY = "your-gemini-api-key"
   ```

4. **Firebase Setup**
   
   Configure Firestore security rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /todos/{document} {
         allow read, write: if request.auth != null && 
           request.auth.uid == resource.data.userId;
       }
       match /documents/{document} {
         allow read, write: if request.auth != null && 
           request.auth.uid == resource.data.userId;
       }
       match /aiTasks/{document} {
         allow read, write: if request.auth != null && 
           request.auth.uid == resource.data.userId;
       }
     }
   }
   ```

   Configure Storage security rules:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /documents/{userId}/{allPaths=**} {
         allow read, write: if request.auth != null && 
           request.auth.uid == userId;
       }
     }
   }
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

### 🔐 Authentication
1. Click "Sign In with Google" on the homepage
2. Complete Google OAuth flow
3. Access your personalized dashboard

### ✅ Managing Tasks
1. **Create Tasks**: Enter task description and select priority
2. **AI Analysis**: Click "Analyze with AI" for intelligent insights
3. **Quick Actions**: Use auto-detected action buttons (email, call, navigate)
4. **Filter & Search**: Use filters to find specific tasks
5. **Track Progress**: Mark tasks as complete

### 📄 Document Management
1. **Upload Documents**: Drag & drop or browse files
2. **Categorize**: Select appropriate document category
3. **AI Task Generation**: System automatically creates relevant tasks
4. **Analyze Documents**: Click "Generate & Analyze" for insights
5. **Manage Tasks**: Track and complete document-related tasks

### 🎯 AI Features
- **Smart Analysis**: Get difficulty ratings, time estimates, and step-by-step guides
- **Contextual Actions**: AI suggests relevant tools and resources
- **Quick Actions**: Auto-detect actionable items in text
- **Resource Recommendations**: Get curated educational resources

## 🏗️ Project Structure

```
client/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Homepage
│   └── todo/
│       └── page.tsx      # Todo management page
├── components/            # React components
│   ├── ui/               # Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   ├── ai-analysis-modal.tsx      # AI analysis interface
│   ├── auth-button.tsx            # Authentication component
│   ├── document-manager.tsx       # Document management
│   ├── floating-ai-assistant.tsx  # AI assistant
│   ├── floating-particles.tsx     # Visual effects
│   └── study-tips-carousel.tsx    # Tips carousel
├── lib/                   # Utility libraries
│   ├── firebase.ts       # Firebase configuration
│   ├── gemini.ts         # AI integration
│   └── utils.ts          # Helper functions
├── public/               # Static assets
└── package.json         # Dependencies and scripts
```

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Google provider)
3. Enable Firestore Database
4. Enable Storage
5. Update configuration in `lib/firebase.ts`

### Google AI Setup
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Update `API_KEY` in `lib/gemini.ts`

### Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📊 Data Models

### Todo
```typescript
interface Todo {
  id: string
  text: string
  completed: boolean
  priority: "low" | "medium" | "high"
  createdAt: Timestamp
  userId: string
}
```

### Document
```typescript
interface Document {
  id: string
  name: string
  type: string
  url: string
  size: number
  uploadedAt: Timestamp
  userId: string
  category: 'certificate' | 'resume' | 'transcript' | 'id' | 'other'
  aiTasks?: AIGeneratedTask[]
}
```

### AI Generated Task
```typescript
interface AIGeneratedTask {
  id: string
  text: string
  completed: boolean
  priority: "low" | "medium" | "high"
  createdAt: Timestamp
  documentId: string
  userId: string
  aiGenerated: boolean
}
```

## 🔐 Security Features

- **Authentication Required**: All data access requires authentication
- **User Isolation**: Users can only access their own data
- **Secure Rules**: Firestore and Storage rules enforce data privacy
- **Input Validation**: Client and server-side validation
- **CORS Protection**: Configured for secure cross-origin requests

## 🎨 Design System

### Colors
- **Primary**: Yellow (#FBBF24)
- **Background**: Dark grays (#111827, #1F2937)
- **Text**: Yellow variations for hierarchy
- **Accents**: Green (success), Red (danger), Blue (info)

### Typography
- **System Fonts**: Inter, system-ui fallbacks
- **Hierarchy**: Clear size and weight variations
- **Readability**: High contrast ratios

### Components
- **Consistent Spacing**: 4px grid system
- **Border Radius**: Consistent rounding (8px, 12px)
- **Animations**: Smooth transitions and micro-interactions

## 🐛 Troubleshooting

### Common Issues

**CORS Errors with Firebase Storage**
- Update Firebase Storage rules
- Use base64 fallback for small files
- Check authentication status

**AI Analysis Not Working**
- Verify Gemini API key
- Check network connectivity
- Review browser console for errors

**Authentication Issues**
- Verify Firebase configuration
- Check Google OAuth setup
- Ensure proper redirect URLs

### Development Tips
- Use browser dev tools for debugging
- Check Firebase console for data
- Monitor network requests
- Review console logs for errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for intelligent analysis capabilities
- **Firebase** for backend infrastructure
- **Next.js** for the excellent React framework
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for smooth animations
- **Lucide** for beautiful icons

## 📞 Support

For support and questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review Firebase and Google AI documentation

---

**Built with ❤️ using Next.js, Firebase, and Google AI**
