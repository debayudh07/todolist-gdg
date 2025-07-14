# 🔧 Technical Documentation

## Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   Firebase      │    │   Google AI     │
│   (Next.js)     │    │   Backend       │    │   (Gemini)      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • React UI      │◄──►│ • Firestore DB  │    │ • AI Analysis   │
│ • Auth State    │    │ • Auth Service  │    │ • Task Gen      │
│ • Real-time     │    │ • Storage       │    │ • Insights      │
│ • AI Integration│    │ • Real-time     │    │ • Suggestions   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. **User Authentication** → Firebase Auth → User State Management
2. **Task Creation** → Firestore → Real-time Updates → UI Refresh
3. **Document Upload** → Firebase Storage/Base64 → Metadata → Firestore
4. **AI Analysis** → Gemini API → Task Generation → Firestore → UI Update

## Component Architecture

### Core Components

#### 1. AIAnalysisModal (`components/ai-analysis-modal.tsx`)
**Purpose**: Display AI-powered analysis and actionable insights

**Key Features**:
- Smart action detection (emails, phones, URLs, addresses)
- Contextual analysis display
- Resource recommendations
- Interactive action buttons

**Props**:
```typescript
interface AIAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  analysis: AIAnalysis | null
  taskText: string
  loading: boolean
}
```

**Action Detection Logic**:
- **Email Regex**: `/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g`
- **Phone Regex**: `/(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})/g`
- **URL Regex**: `/https?:\/\/[^\s]+/g`
- **Address Keywords**: `/\b(?:visit|go to|meet at|address|location)\s+([^.!?]+)/gi`

#### 2. DocumentManager (`components/document-manager.tsx`)
**Purpose**: Handle document upload, categorization, and AI task generation

**Key Features**:
- Drag & drop file upload
- Multi-format support (PDF, images, documents)
- Hybrid storage system (Base64 + Firebase Storage)
- AI task generation based on document type
- Document analysis and insights

**Storage Strategy**:
```typescript
if (file.size < 1024 * 1024) {
  // Store as Base64 for files < 1MB
  downloadURL = base64
} else {
  // Use Firebase Storage for larger files
  const storageRef = ref(storage, `documents/${user.uid}/${fileName}`)
  const snapshot = await uploadBytes(storageRef, file, metadata)
  downloadURL = await getDownloadURL(snapshot.ref)
}
```

**AI Task Generation**:
```typescript
const contextPrompt = getDocumentContextPrompt(fileName, category)
const analysis = await analyzeTask(contextPrompt, "high")
// Create tasks from AI suggestions
```

#### 3. Firebase Integration (`lib/firebase.ts`)
**Purpose**: Configure and export Firebase services

**Services**:
- **Authentication**: Google OAuth integration
- **Firestore**: Real-time database
- **Storage**: File storage with CORS handling
- **Analytics**: Usage tracking (optional)

**Configuration**:
```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... other config
}
```

#### 4. AI Integration (`lib/gemini.ts`)
**Purpose**: Interface with Google Gemini AI for task analysis

**Key Functions**:
- `analyzeTask()`: Main analysis function
- Context-aware prompting
- Error handling with fallbacks
- Structured response parsing

**Analysis Flow**:
```typescript
const prompt = `
  Analyze this task: "${taskText}"
  Priority: ${priority}
  
  Return JSON with:
  - summary
  - suggestedSteps
  - estimatedTime
  - difficulty
  - resources
  - tips
  - contextualActions
`
```

## Database Schema

### Firestore Collections

#### 1. `todos` Collection
```typescript
{
  id: string,                    // Auto-generated document ID
  text: string,                  // Task description
  completed: boolean,            // Completion status
  priority: "low"|"medium"|"high", // Priority level
  createdAt: Timestamp,          // Creation timestamp
  userId: string                 // User who created the task
}
```

#### 2. `documents` Collection
```typescript
{
  id: string,                    // Auto-generated document ID
  name: string,                  // Original filename
  type: string,                  // MIME type
  url: string,                   // Download URL or base64
  size: number,                  // File size in bytes
  uploadedAt: Timestamp,         // Upload timestamp
  userId: string,                // User who uploaded
  category: "certificate"|"resume"|"transcript"|"id"|"other"
}
```

#### 3. `aiTasks` Collection
```typescript
{
  id: string,                    // Auto-generated document ID
  text: string,                  // Task description
  completed: boolean,            // Completion status
  priority: "low"|"medium"|"high", // Priority level
  createdAt: Timestamp,          // Creation timestamp
  documentId: string,            // Associated document ID
  userId: string,                // User who owns the task
  aiGenerated: boolean           // Flag for AI-generated tasks
}
```

### Security Rules

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own todos
    match /todos/{todoId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Users can only access their own documents
    match /documents/{docId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Users can only access their own AI tasks
    match /aiTasks/{taskId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

#### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only access their own documents
    match /documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    // Limit file size to 10MB
    match /{allPaths=**} {
      allow write: if request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```

## AI Integration Details

### Gemini API Configuration
```typescript
const genAI = new GoogleGenerativeAI(API_KEY)
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash-exp"
})
```

### Prompt Engineering

#### Task Analysis Prompt Structure
```typescript
const prompt = `
Analyze this study/work task and provide helpful suggestions:

Task: "${taskText}"
Priority: ${priority}

IMPORTANT: Return ONLY a valid JSON object with no additional text.

Provide a comprehensive analysis in this exact JSON format:
{
  "summary": "Brief analysis of what this task involves",
  "suggestedSteps": ["Step 1", "Step 2", "Step 3"],
  "estimatedTime": "Realistic time estimate",
  "difficulty": "Easy|Medium|Hard",
  "resources": [
    {
      "title": "Resource name",
      "url": "https://example.com",
      "type": "article|video|documentation|course"
    }
  ],
  "tips": ["Helpful tip 1", "Helpful tip 2"],
  "contextualActions": [
    {
      "type": "productivity",
      "label": "Action label",
      "description": "What this action does",
      "url": "https://tool-url.com"
    }
  ]
}

Requirements:
- Provide 3-5 realistic and actionable steps
- Include 2-4 relevant online resources with real URLs
- Give 3-5 practical tips for completing the task efficiently
- Consider the priority level when suggesting approaches
- Include 1-3 contextual actions for productivity tools
`
```

#### Document Context Prompts
```typescript
const getDocumentContextPrompt = (fileName: string, category: string) => {
  const basePrompt = `I've uploaded a document "${fileName}" of type "${category}".`
  
  switch (category) {
    case 'certificate':
      return `${basePrompt} This is a certificate document. What tasks should I complete to effectively use this certificate for job applications, portfolio building, or skill verification?`
    
    case 'resume':
      return `${basePrompt} This is my resume/CV. What tasks should I do to improve, update, or effectively use this resume for job applications?`
    
    case 'transcript':
      return `${basePrompt} This is an academic transcript. What tasks should I complete to leverage this transcript for applications, career advancement, or further education?`
    
    // ... other cases
  }
}
```

### Error Handling

#### AI Response Parsing
```typescript
try {
  const result = await model.generateContent(prompt)
  const response = await result.response
  let text = response.text().trim()
  
  // Clean markdown formatting
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  }
  
  const analysis: AIAnalysis = JSON.parse(text)
  
  // Validate response structure
  if (!analysis.summary || !analysis.suggestedSteps) {
    throw new Error("Invalid response structure")
  }
  
  return analysis
} catch (error) {
  console.error("AI analysis failed:", error)
  return fallbackAnalysis
}
```

## Performance Optimizations

### Real-time Data Management
```typescript
// Efficient listener setup
useEffect(() => {
  if (!user) return

  const todosQuery = query(
    collection(db, "todos"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  )

  const unsubscribe = onSnapshot(todosQuery, (snapshot) => {
    const todosData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Todo[]
    setTodos(todosData)
  })

  return () => unsubscribe()
}, [user])
```

### Image Optimization
- Base64 encoding for small files (< 1MB)
- Firebase Storage for larger files
- Automatic format detection
- Size validation before upload

### Code Splitting
- Component-level code splitting with dynamic imports
- Lazy loading of heavy components
- Tree shaking for unused code

## Deployment Strategy

### Build Configuration
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### Environment Variables
```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google AI Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
```

### Production Optimizations
- Static generation for public pages
- Image optimization with Next.js Image component
- Automatic code splitting
- Bundle size monitoring
- Performance monitoring with Firebase Analytics

## Testing Strategy

### Unit Tests
```typescript
// Component testing with React Testing Library
import { render, screen } from '@testing-library/react'
import { AIAnalysisModal } from '../components/ai-analysis-modal'

test('renders analysis modal with loading state', () => {
  render(
    <AIAnalysisModal 
      isOpen={true} 
      onClose={() => {}} 
      analysis={null} 
      taskText="Test task" 
      loading={true} 
    />
  )
  
  expect(screen.getByText('Analyzing your task with AI...')).toBeInTheDocument()
})
```

### Integration Tests
- Firebase connection testing
- AI API integration testing
- Authentication flow testing
- File upload testing

### E2E Tests
- User journey testing with Playwright
- Cross-browser compatibility
- Mobile responsiveness testing

## Monitoring & Analytics

### Performance Monitoring
- Core Web Vitals tracking
- Firebase Performance monitoring
- Error tracking with console logging
- User session analytics

### Error Handling
- Graceful degradation for AI failures
- Offline capability with service workers
- User-friendly error messages
- Automatic retry mechanisms

## Security Considerations

### Data Protection
- Client-side input validation
- Server-side security rules
- HTTPS enforcement
- XSS protection

### Authentication Security
- OAuth 2.0 with Google
- JWT token validation
- Session management
- Secure cookie handling

### File Upload Security
- File type validation
- Size limitations
- Virus scanning (recommended for production)
- Content-type verification

## Future Enhancements

### Planned Features
- [ ] Collaborative task sharing
- [ ] Advanced document OCR
- [ ] Voice-to-text task creation
- [ ] Calendar integration
- [ ] Mobile app (React Native)
- [ ] Offline synchronization
- [ ] Advanced AI models integration
- [ ] Custom AI training on user data

### Technical Improvements
- [ ] GraphQL API layer
- [ ] Redis caching
- [ ] CDN integration
- [ ] Advanced monitoring
- [ ] A/B testing framework
- [ ] Microservices architecture migration
