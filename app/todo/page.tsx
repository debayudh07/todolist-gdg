/*eslint-disable*/
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { onAuthStateChanged, type User } from "firebase/auth"
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { analyzeTask, type AIAnalysis } from "@/lib/gemini"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Check, Trash2, BookOpen, ArrowLeft, Filter, Star, Search } from "lucide-react"
import { AuthButton } from "@/components/auth-button"
import { AIAnalysisModal } from "@/components/ai-analysis-modal"
import { DocumentManager } from "@/components/document-manager"
import { useRouter } from "next/navigation"

interface Todo {
  id: string
  text: string
  completed: boolean
  priority: "low" | "medium" | "high"
  createdAt: any
  userId: string
}

export default function TodoPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [filterPriority, setFilterPriority] = useState<"all" | "low" | "medium" | "high">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<AIAnalysis | null>(null)
  const [currentTaskText, setCurrentTaskText] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
      if (!user) {
        router.push("/")
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (!user) return

    const q = query(collection(db, "todos"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const todosData: Todo[] = []
      querySnapshot.forEach((doc) => {
        todosData.push({ id: doc.id, ...doc.data() } as Todo)
      })
      setTodos(todosData)
    })

    return () => unsubscribe()
  }, [user])

  const addTodo = async () => {
    if (!newTodo.trim() || !user) return

    try {
      await addDoc(collection(db, "todos"), {
        text: newTodo,
        completed: false,
        priority,
        createdAt: new Date(),
        userId: user.uid,
      })
      setNewTodo("")
    } catch (error) {
      console.error("Error adding todo:", error)
    }
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, "todos", id), {
        completed: !completed,
      })
    } catch (error) {
      console.error("Error updating todo:", error)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      await deleteDoc(doc(db, "todos", id))
    } catch (error) {
      console.error("Error deleting todo:", error)
    }
  }

  const analyzeTaskWithAI = async (taskText: string, taskPriority: string) => {
    setCurrentTaskText(taskText)
    setAiModalOpen(true)
    setAiLoading(true)
    setCurrentAnalysis(null)

    try {
      const analysis = await analyzeTask(taskText, taskPriority)
      setCurrentAnalysis(analysis)
    } catch (error) {
      console.error("Error analyzing task:", error)
    } finally {
      setAiLoading(false)
    }
  }

  // Filter todos based on search term, priority, and status
  const filteredTodos = todos.filter((todo) => {
    const matchesSearch = todo.text.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = filterPriority === "all" || todo.priority === filterPriority
    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "completed" && todo.completed) ||
      (filterStatus === "pending" && !todo.completed)
    
    return matchesSearch && matchesPriority && matchesStatus
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-400 border-red-400"
      case "medium":
        return "text-yellow-400 border-yellow-400"
      case "low":
        return "text-green-400 border-green-400"
      default:
        return "text-yellow-400 border-yellow-400"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const completedCount = todos.filter((todo) => todo.completed).length
  const totalCount = todos.length
  const filteredCompletedCount = filteredTodos.filter((todo) => todo.completed).length
  const filteredTotalCount = filteredTodos.length

  return (
    <div className="min-h-screen bg-black text-yellow-400">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="border-b border-yellow-400/20 bg-black/50 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={() => router.push("/")}
              className="flex items-center space-x-2 text-yellow-400 hover:text-yellow-300 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </motion.button>
            <motion.div className="flex items-center space-x-2" whileHover={{ scale: 1.05 }}>
              <BookOpen className="h-8 w-8 text-yellow-400" />
              <span className="text-2xl font-bold">StudyFlow</span>
            </motion.div>
          </div>
          <AuthButton user={user} onAuthChange={setUser} />
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-4xl font-bold mb-2 text-yellow-400">Welcome back, {user.displayName?.split(" ")[0]}!</h1>
          <p className="text-yellow-300 mb-8 text-lg">Let's organize your study tasks and boost your productivity</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="bg-gray-900 border-yellow-400/30 shadow-2xl">
            <CardHeader className="border-b border-yellow-400/20">
              <CardTitle className="text-yellow-400 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  My Study Tasks
                </span>
                <span className="text-sm font-normal">
                  {searchTerm || filterPriority !== "all" || filterStatus !== "all" 
                    ? `${filteredCompletedCount}/${filteredTotalCount} filtered (${completedCount}/${totalCount} total)`
                    : `${completedCount}/${totalCount} completed`
                  }
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Search and Filter Section */}
              <motion.div
                className="space-y-4 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-yellow-400/50" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tasks..."
                    className="pl-10 bg-black border-yellow-400/30 text-yellow-400 placeholder:text-yellow-400/50 focus:border-yellow-400"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-400 text-sm">Filters:</span>
                  </div>
                  
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as any)}
                    className="bg-black border border-yellow-400/30 text-yellow-400 rounded-md px-3 py-1 text-sm focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="bg-black border border-yellow-400/30 text-yellow-400 rounded-md px-3 py-1 text-sm focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="all">All Tasks</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>

                  {(searchTerm || filterPriority !== "all" || filterStatus !== "all") && (
                    <Button
                      onClick={() => {
                        setSearchTerm("")
                        setFilterPriority("all")
                        setFilterStatus("all")
                      }}
                      variant="ghost"
                      className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 text-sm px-3 py-1 h-auto"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </motion.div>

              {/* Add Todo Form */}
              <motion.div
                className="flex flex-col sm:flex-row gap-3 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Input
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="Add a new study task..."
                  className="flex-1 bg-black border-yellow-400/30 text-yellow-400 placeholder:text-yellow-400/50 focus:border-yellow-400"
                  onKeyPress={(e) => e.key === "Enter" && addTodo()}
                />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                  className="bg-black border border-yellow-400/30 text-yellow-400 rounded-md px-3 py-2 focus:border-yellow-400 focus:outline-none"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={addTodo} className="bg-yellow-400 text-black hover:bg-yellow-300 px-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>

              {/* Todo List */}
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredTodos.map((todo) => (
                    <motion.div
                      key={todo.id}
                      initial={{ opacity: 0, x: -50, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 50, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: 1.02 }}
                      className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-lg border transition-all duration-300 ${
                        todo.completed
                          ? "bg-gray-800/50 border-green-400/30"
                          : "bg-gray-800 border-yellow-400/30 hover:border-yellow-400/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 w-full">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleTodo(todo.id, todo.completed)}
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            todo.completed ? "bg-green-400 border-green-400" : "border-yellow-400 hover:border-yellow-300"
                          }`}
                        >
                          {todo.completed && <Check className="h-4 w-4 text-black" />}
                        </motion.button>

                        <span
                          className={`flex-1 transition-all duration-300 ${
                            todo.completed ? "text-gray-400 line-through" : "text-yellow-400"
                          }`}
                        >
                          {todo.text}
                        </span>

                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(todo.priority)}`}>
                          {todo.priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => analyzeTaskWithAI(todo.text, todo.priority)}
                          className="flex items-center gap-1 px-3 py-1 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 rounded-md transition-all duration-300 text-sm font-medium"
                          title="Get AI analysis and suggestions for this task"
                        >
                          <Star className="h-4 w-4" />
                          <span>Analyze with AI</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteTodo(todo.id)}
                          className="text-red-400 hover:text-red-300 transition-colors duration-300 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {filteredTodos.length === 0 && todos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-yellow-400/60"
                >
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks match your current filters.</p>
                  <Button
                    onClick={() => {
                      setSearchTerm("")
                      setFilterPriority("all")
                      setFilterStatus("all")
                    }}
                    variant="ghost"
                    className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 mt-2"
                  >
                    Clear Filters
                  </Button>
                </motion.div>
              )}

              {todos.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-yellow-400/60"
                >
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks yet. Add your first study task above!</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Document Manager */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <DocumentManager user={user} />
        </motion.div>

        {/* AI Analysis Modal */}
        <AIAnalysisModal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          analysis={currentAnalysis}
          taskText={currentTaskText}
          loading={aiLoading}
        />
      </div>
    </div>
  )
}
