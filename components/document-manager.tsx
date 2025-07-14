/*eslint-disable*/
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { analyzeTask, type AIAnalysis } from "@/lib/gemini"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Star, 
  Plus, 
  Calendar,
  UserCircle,
  Award,
  Briefcase,
  GraduationCap,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"
import { AIAnalysisModal } from "@/components/ai-analysis-modal"
import type { User as FirebaseUser } from "firebase/auth"

interface Document {
  id: string
  name: string
  type: string
  url: string
  size: number
  uploadedAt: any
  userId: string
  category: 'certificate' | 'resume' | 'transcript' | 'id' | 'other'
  aiTasks?: AIGeneratedTask[]
}

interface AIGeneratedTask {
  id: string
  text: string
  completed: boolean
  priority: "low" | "medium" | "high"
  createdAt: any
  documentId: string
  aiGenerated: boolean
}

interface DocumentManagerProps {
  user: FirebaseUser | null
}

export function DocumentManager({ user }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [aiTasks, setAiTasks] = useState<AIGeneratedTask[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<AIAnalysis | null>(null)
  const [currentTaskText, setCurrentTaskText] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Document['category']>('other')

  useEffect(() => {
    if (!user) return

    // Listen to documents
    const documentsQuery = query(
      collection(db, "documents"),
      where("userId", "==", user.uid),
      orderBy("uploadedAt", "desc")
    )

    const unsubscribeDocuments = onSnapshot(documentsQuery, (snapshot) => {
      const documentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Document[]
      setDocuments(documentsData)
    })

    // Listen to AI tasks
    const tasksQuery = query(
      collection(db, "aiTasks"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AIGeneratedTask[]
      setAiTasks(tasksData)
    })

    return () => {
      unsubscribeDocuments()
      unsubscribeTasks()
    }
  }, [user])

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !user) return

    setUploading(true)
    
    try {
      for (const file of Array.from(files)) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`)
          continue
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(pdf|jpg|jpeg|png|txt|doc|docx)$/)) {
          alert(`File type ${file.type} is not supported.`)
          continue
        }
        
        // Create a safe filename
        const timestamp = Date.now()
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${timestamp}_${safeFileName}`
        
        // For now, let's use a base64 approach to avoid CORS issues
        const base64 = await convertFileToBase64(file)
        
        // Save document metadata to Firestore with base64 data (for small files) or upload to storage
        let downloadURL = ''
        
        if (file.size < 1024 * 1024) { // Less than 1MB, store as base64
          downloadURL = base64
        } else {
          // For larger files, we'll try Firebase Storage with better error handling
          try {
            const storageRef = ref(storage, `documents/${user.uid}/${fileName}`)
            
            const metadata = {
              contentType: file.type,
              customMetadata: {
                originalName: file.name,
                uploadedBy: user.uid,
                category: selectedCategory
              }
            }
            
            const snapshot = await uploadBytes(storageRef, file, metadata)
            downloadURL = await getDownloadURL(snapshot.ref)
          } catch (storageError) {
            console.error("Storage upload failed, falling back to base64:", storageError)
            // Fallback to base64 for smaller files
            if (file.size < 5 * 1024 * 1024) { // Less than 5MB
              downloadURL = base64
            } else {
              throw new Error("File too large and storage upload failed")
            }
          }
        }

        // Save document metadata to Firestore
        const docData = {
          name: file.name,
          type: file.type,
          url: downloadURL,
          size: file.size,
          uploadedAt: new Date(),
          userId: user.uid,
          category: selectedCategory
        }

        const docRef = await addDoc(collection(db, "documents"), docData)

        // Generate AI tasks based on document type and category
        await generateAITasksForDocument(docRef.id, file.name, selectedCategory)
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      // Add user-friendly error handling
      if (error instanceof Error) {
        if (error.message.includes('cors') || error.message.includes('CORS')) {
          alert('Upload failed due to browser security settings. Please try again or contact support.')
        } else if (error.message.includes('permission')) {
          alert('Permission denied. Please ensure you are logged in and try again.')
        } else {
          alert('Upload failed. Please check your internet connection and try again.')
        }
      }
    } finally {
      setUploading(false)
    }
  }

  const generateAITasksForDocument = async (documentId: string, fileName: string, category: Document['category']) => {
    try {
      console.log(`Generating AI tasks for document: ${fileName}, category: ${category}`)
      const contextPrompt = getDocumentContextPrompt(fileName, category)
      console.log(`Context prompt: ${contextPrompt}`)
      
      const analysis = await analyzeTask(contextPrompt, "high")
      console.log(`AI Analysis received:`, analysis)
      
      if (!analysis.suggestedSteps || analysis.suggestedSteps.length === 0) {
        console.warn("No suggested steps received from AI analysis")
        return
      }
      
      // Create AI-generated tasks based on the analysis
      for (const step of analysis.suggestedSteps) {
        console.log(`Creating AI task: ${step}`)
        await addDoc(collection(db, "aiTasks"), {
          text: step,
          completed: false,
          priority: "medium" as const,
          createdAt: new Date(),
          documentId,
          userId: user?.uid,
          aiGenerated: true
        })
      }
      console.log(`Successfully created ${analysis.suggestedSteps.length} AI tasks`)
    } catch (error) {
      console.error("Error generating AI tasks:", error)
      // Create fallback tasks if AI generation fails
      const fallbackTasks = getFallbackTasks(fileName, category)
      for (const task of fallbackTasks) {
        try {
          await addDoc(collection(db, "aiTasks"), {
            text: task,
            completed: false,
            priority: "medium" as const,
            createdAt: new Date(),
            documentId,
            userId: user?.uid,
            aiGenerated: true
          })
        } catch (fallbackError) {
          console.error("Error creating fallback task:", fallbackError)
        }
      }
    }
  }

  const getDocumentContextPrompt = (fileName: string, category: Document['category']) => {
    const basePrompt = `I've uploaded a document "${fileName}" of type "${category}".`
    
    switch (category) {
      case 'certificate':
        return `${basePrompt} This is a certificate document. What tasks should I complete to effectively use this certificate for job applications, portfolio building, or skill verification?`
      case 'resume':
        return `${basePrompt} This is my resume/CV. What tasks should I do to improve, update, or effectively use this resume for job applications?`
      case 'transcript':
        return `${basePrompt} This is an academic transcript. What tasks should I complete to leverage this transcript for applications, career advancement, or further education?`
      case 'id':
        return `${basePrompt} This is an identification document. What organizational or administrative tasks should I complete related to this document?`
      default:
        return `${basePrompt} What relevant tasks should I complete related to this document for organization, processing, or follow-up actions?`
    }
  }

  const deleteDocument = async (docToDelete: Document) => {
    try {
      // Delete from Storage only if it's not a base64 URL
      if (!docToDelete.url.startsWith('data:')) {
        try {
          const storageRef = ref(storage, docToDelete.url)
          await deleteObject(storageRef)
        } catch (storageError) {
          console.error("Error deleting from storage (may not exist):", storageError)
          // Continue with Firestore deletion even if storage deletion fails
        }
      }
      
      // Delete from Firestore
      await deleteDoc(doc(db, "documents", docToDelete.id))
      
      // Delete associated AI tasks
      const relatedTasks = aiTasks.filter(task => task.documentId === docToDelete.id)
      for (const task of relatedTasks) {
        await deleteDoc(doc(db, "aiTasks", task.id))
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      alert("Failed to delete document. Please try again.")
    }
  }

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, "aiTasks", taskId), { completed: !completed })
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const analyzeDocumentTasks = async (documentId: string) => {
    let relatedTasks = aiTasks.filter(task => task.documentId === documentId)
    
    // If no AI tasks exist for this document, generate them first
    if (relatedTasks.length === 0) {
      const document = documents.find(doc => doc.id === documentId)
      if (document) {
        setAiLoading(true)
        try {
          await generateAITasksForDocument(documentId, document.name, document.category)
          // Wait a moment for the real-time listener to update
          await new Promise(resolve => setTimeout(resolve, 1000))
          relatedTasks = aiTasks.filter(task => task.documentId === documentId)
        } catch (error) {
          console.error("Error generating AI tasks:", error)
        }
      }
    }
    
    let taskTexts = relatedTasks.map(task => task.text).join(". ")
    
    // If still no tasks, use document name and category for analysis
    if (!taskTexts) {
      const document = documents.find(doc => doc.id === documentId)
      if (document) {
        taskTexts = getDocumentContextPrompt(document.name, document.category)
      } else {
        taskTexts = "Analyze this document and provide insights"
      }
    }

    setCurrentTaskText(taskTexts)
    setAiModalOpen(true)
    setAiLoading(true)

    try {
      const analysis = await analyzeTask(taskTexts, "high")
      setCurrentAnalysis(analysis)
    } catch (error) {
      console.error("Error analyzing tasks:", error)
      setCurrentAnalysis(null)
    } finally {
      setAiLoading(false)
    }
  }

  const getCategoryIcon = (category: Document['category']) => {
    switch (category) {
      case 'certificate':
        return <Award className="h-5 w-5" />
      case 'resume':
        return <UserCircle className="h-5 w-5" />
      case 'transcript':
        return <GraduationCap className="h-5 w-5" />
      case 'id':
        return <Briefcase className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: Document['category']) => {
    switch (category) {
      case 'certificate':
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400"
      case 'resume':
        return "text-blue-400 bg-blue-400/10 border-blue-400"
      case 'transcript':
        return "text-green-400 bg-green-400/10 border-green-400"
      case 'id':
        return "text-purple-400 bg-purple-400/10 border-purple-400"
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Helper function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const getFallbackTasks = (fileName: string, category: Document['category']) => {
    const baseTasks = [`Review and organize ${fileName}`, `Ensure ${fileName} is up to date`]
    
    switch (category) {
      case 'certificate':
        return [
          ...baseTasks,
          "Add certificate to portfolio",
          "Update resume with new certification",
          "Share achievement on professional networks"
        ]
      case 'resume':
        return [
          ...baseTasks,
          "Review resume for accuracy and relevance",
          "Tailor resume for specific job applications",
          "Update contact information and skills"
        ]
      case 'transcript':
        return [
          ...baseTasks,
          "Verify transcript accuracy",
          "Use transcript for academic applications",
          "Calculate GPA if needed"
        ]
      case 'id':
        return [
          ...baseTasks,
          "Store document securely",
          "Create backup copies",
          "Note expiration date if applicable"
        ]
      default:
        return [
          ...baseTasks,
          "File document appropriately",
          "Create backup if important"
        ]
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="bg-gray-800 border-yellow-400/30">
        <CardHeader>
          <CardTitle className="text-yellow-400 text-xl flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Document Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-yellow-400 mb-2">
                Document Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as Document['category'])}
                className="w-full px-3 py-2 bg-gray-700 border border-yellow-400/30 rounded-md text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
              >
                <option value="certificate">Certificate</option>
                <option value="resume">Resume/CV</option>
                <option value="transcript">Academic Transcript</option>
                <option value="id">ID Document</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                dragOver
                  ? "border-yellow-400 bg-yellow-400/5"
                  : "border-yellow-400/30 hover:border-yellow-400/50"
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                handleFileUpload(e.dataTransfer.files)
              }}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-yellow-400/60" />
              <p className="text-yellow-300 mb-2">
                Drag and drop files here, or{" "}
                <label className="text-yellow-400 hover:text-yellow-300 cursor-pointer underline">
                  browse
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  />
                </label>
              </p>
              <p className="text-yellow-400/60 text-sm">
                Support for PDF, DOC, DOCX, JPG, PNG, TXT files
              </p>
              {uploading && (
                <div className="mt-4">
                  <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-yellow-400 mt-2">Uploading and analyzing...</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="bg-gray-800 border-yellow-400/30">
        <CardHeader>
          <CardTitle className="text-yellow-400 text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence>
              {documents.map((document) => {
                const relatedTasks = aiTasks.filter(task => task.documentId === document.id)
                const completedTasks = relatedTasks.filter(task => task.completed).length
                
                return (
                  <motion.div
                    key={document.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gray-700 border border-yellow-400/20 rounded-lg p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-full border ${getCategoryColor(document.category)}`}>
                          {getCategoryIcon(document.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-yellow-300 font-medium truncate">
                            {document.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-yellow-400/70">
                            <span>{formatFileSize(document.size)}</span>
                            <span className="capitalize">{document.category}</span>
                            <span>{relatedTasks.length} AI tasks</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {relatedTasks.length > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                            <span className="text-yellow-400/70">
                              {completedTasks}/{relatedTasks.length}
                            </span>
                          </div>
                        )}
                        
                        <Button
                          onClick={() => analyzeDocumentTasks(document.id)}
                          variant="ghost"
                          size="sm"
                          className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                        >
                          <Star className="h-4 w-4 mr-1" />
                          {relatedTasks.length === 0 ? 'Generate & Analyze' : 'Analyze'}
                        </Button>

                        <Button
                          onClick={() => {
                            if (document.url.startsWith('data:')) {
                              // Handle base64 download
                              const link = window.document.createElement('a')
                              link.href = document.url
                              link.download = document.name
                              link.click()
                            } else {
                              // Handle regular URL
                              window.open(document.url, '_blank')
                            }
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        <Button
                          onClick={() => deleteDocument(document)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Related Tasks */}
                    {relatedTasks.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-yellow-400/20">
                        <h4 className="text-yellow-400 text-sm font-medium mb-2 flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          AI Generated Tasks
                        </h4>
                        <div className="space-y-2">
                          {relatedTasks.slice(0, 3).map((task) => (
                            <div
                              key={task.id}
                              className="flex items-start gap-2 text-sm"
                            >
                              <button
                                onClick={() => toggleTaskCompletion(task.id, task.completed)}
                                className={`mt-0.5 ${
                                  task.completed
                                    ? "text-green-400"
                                    : "text-yellow-400/60 hover:text-yellow-400"
                                }`}
                              >
                                {task.completed ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <Clock className="h-4 w-4" />
                                )}
                              </button>
                              <span
                                className={`flex-1 ${
                                  task.completed
                                    ? "text-yellow-400/60 line-through"
                                    : "text-yellow-300"
                                }`}
                              >
                                {task.text}
                              </span>
                            </div>
                          ))}
                          {relatedTasks.length > 3 && (
                            <p className="text-yellow-400/60 text-xs">
                              +{relatedTasks.length - 3} more tasks
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {documents.length === 0 && (
              <div className="text-center py-12 text-yellow-400/60">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents uploaded yet.</p>
                <p className="text-sm">Upload your first document to get started with AI task generation!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Modal */}
      <AIAnalysisModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        analysis={currentAnalysis}
        taskText={currentTaskText}
        loading={aiLoading}
      />
    </div>
  )
}
