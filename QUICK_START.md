# 🚀 Quick Start Guide

## 5-Minute Setup

### 1. Prerequisites Check
```bash
node --version  # Should be 18+
npm --version   # Should be 9+
```

### 2. Clone & Install
```bash
git clone <repository-url>
cd gdgnomination_project/client
npm install
```

### 3. Firebase Setup (2 minutes)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project or use existing
3. Enable Authentication → Google provider
4. Enable Firestore Database
5. Enable Storage
6. Copy config from Project Settings

### 4. Google AI Setup (1 minute)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Copy the key

### 5. Configuration
Update `lib/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: "paste-your-firebase-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "your-app-id"
}
```

Update `lib/gemini.ts`:
```typescript
const API_KEY = "paste-your-gemini-api-key"
```

### 6. Run
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Common Issues & Solutions

### 🔥 Firebase Errors
```bash
# Error: Firebase config not found
# Solution: Double-check firebase config in lib/firebase.ts
```

### 🤖 AI Not Working
```bash
# Error: Gemini API key invalid
# Solution: Verify API key in lib/gemini.ts and check quotas
```

### 📁 Upload Fails
```bash
# Error: CORS or permission denied
# Solution: Check Firebase Storage rules and authentication
```

## Development Workflow

### 1. Start Development
```bash
npm run dev          # Start with hot reload
npm run lint         # Check code quality
```

### 2. Key Files to Know
- `app/todo/page.tsx` - Main todo interface
- `components/document-manager.tsx` - Document handling
- `components/ai-analysis-modal.tsx` - AI features
- `lib/firebase.ts` - Backend connection
- `lib/gemini.ts` - AI integration

### 3. Add New Features
1. Create component in `components/`
2. Add to relevant page in `app/`
3. Update types if needed
4. Test functionality

### 4. Deployment
```bash
npm run build        # Build for production
npm start           # Test production build
```

## Feature Examples

### Add Quick Action
```typescript
// In ai-analysis-modal.tsx
const newAction: SuggestiveAction = {
  type: 'custom',
  label: 'Custom Action',
  action: () => window.open('https://example.com'),
  icon: <CustomIcon className="h-4 w-4" />,
  data: { custom: 'data' }
}
```

### Add Document Category
```typescript
// In document-manager.tsx
// 1. Update Document interface
category: 'certificate' | 'resume' | 'transcript' | 'id' | 'other' | 'newtype'

// 2. Add to getDocumentContextPrompt()
case 'newtype':
  return `${basePrompt} This is a new type document. What tasks...`

// 3. Add to getCategoryIcon()
case 'newtype':
  return <NewIcon className="h-5 w-5" />
```

### Customize AI Prompts
```typescript
// In lib/gemini.ts
const customPrompt = `
Your custom prompt here...
Task: "${taskText}"
Context: ${additionalContext}

Return JSON with your required format...
`
```

## Testing Your Changes

### Quick Manual Tests
1. **Authentication**: Sign in/out works
2. **Tasks**: Create, edit, delete, AI analysis
3. **Documents**: Upload, categorize, generate tasks
4. **AI Features**: Modal opens, actions work
5. **Responsive**: Test on mobile/tablet

### Browser Console
- Check for errors
- Verify Firebase connection
- Monitor AI API calls

## Getting Help

### Debug Steps
1. Check browser console for errors
2. Verify Firebase project settings
3. Test API keys in separate tools
4. Check network requests in dev tools

### Resources
- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Gemini AI Docs](https://ai.google.dev/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Community
- Open GitHub issues for bugs
- Check existing issues for solutions
- Join Discord/Slack for real-time help

---

**You're ready to build! 🎉**
