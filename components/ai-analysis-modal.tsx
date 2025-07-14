/*eslint-disable*/
"use client"
import { motion, AnimatePresence } from "framer-motion"
import { X, Clock, Star, ExternalLink, Lightbulb, CheckCircle, Mail, Phone, Calendar, MapPin, FileText, Link, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AIAnalysis } from "@/lib/gemini"

interface SuggestiveAction {
  type: 'email' | 'phone' | 'calendar' | 'maps' | 'search' | 'document' | 'website'
  label: string
  action: () => void
  icon: React.ReactNode
  data: any
}

interface AIAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  analysis: AIAnalysis | null
  taskText: string
  loading: boolean
}

export function AIAnalysisModal({ isOpen, onClose, analysis, taskText, loading }: AIAnalysisModalProps) {
  if (!isOpen) return null

  // Function to extract actionable items from task text
  const extractSuggestiveActions = (text: string): SuggestiveAction[] => {
    const actions: SuggestiveAction[] = []
    
    // Email detection
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const emails = text.match(emailRegex)
    if (emails) {
      emails.forEach(email => {
        actions.push({
          type: 'email',
          label: `Email ${email}`,
          action: () => window.open(`mailto:${email}`, '_blank'),
          icon: <Mail className="h-4 w-4" />,
          data: { email }
        })
      })
    }

    // Phone number detection (various formats)
    const phoneRegex = /(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})/g
    const phones = text.match(phoneRegex)
    if (phones) {
      phones.forEach(phone => {
        const cleanPhone = phone.replace(/\D/g, '')
        if (cleanPhone.length >= 10) {
          actions.push({
            type: 'phone',
            label: `Call ${phone}`,
            action: () => window.open(`tel:${cleanPhone}`, '_blank'),
            icon: <Phone className="h-4 w-4" />,
            data: { phone: cleanPhone }
          })
        }
      })
    }

    // URL detection
    const urlRegex = /https?:\/\/[^\s]+/g
    const urls = text.match(urlRegex)
    if (urls) {
      urls.forEach(url => {
        actions.push({
          type: 'website',
          label: `Visit ${new URL(url).hostname}`,
          action: () => window.open(url, '_blank'),
          icon: <ExternalLink className="h-4 w-4" />,
          data: { url }
        })
      })
    }

    // Address/location detection (basic)
    const addressKeywords = /\b(?:visit|go to|meet at|address|location)\s+([^.!?]+)/gi
    const addressMatches = text.match(addressKeywords)
    if (addressMatches) {
      addressMatches.forEach(match => {
        const location = match.replace(/^(visit|go to|meet at|address|location)\s+/i, '').trim()
        if (location.length > 3) {
          actions.push({
            type: 'maps',
            label: `Navigate to ${location}`,
            action: () => window.open(`https://maps.google.com/?q=${encodeURIComponent(location)}`, '_blank'),
            icon: <MapPin className="h-4 w-4" />,
            data: { location }
          })
        }
      })
    }

    // Meeting/calendar detection
    const meetingKeywords = /\b(?:meeting|schedule|appointment|call|event)\b/i
    if (meetingKeywords.test(text)) {
      actions.push({
        type: 'calendar',
        label: 'Add to Calendar',
        action: () => {
          const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}`
          window.open(calendarUrl, '_blank')
        },
        icon: <Calendar className="h-4 w-4" />,
        data: { event: text }
      })
    }

    // Document creation detection
    const docKeywords = /\b(?:write|create|draft|document|report|proposal|presentation)\b/i
    if (docKeywords.test(text)) {
      actions.push({
        type: 'document',
        label: 'Create Document',
        action: () => window.open('https://docs.google.com/document/create', '_blank'),
        icon: <FileText className="h-4 w-4" />,
        data: { type: 'document' }
      })
    }

    // Search detection
    const searchKeywords = /\b(?:research|search|find|look up|investigate)\s+([^.!?]+)/gi
    const searchMatches = text.match(searchKeywords)
    if (searchMatches) {
      searchMatches.forEach(match => {
        const query = match.replace(/^(research|search|find|look up|investigate)\s+/i, '').trim()
        if (query.length > 2) {
          actions.push({
            type: 'search',
            label: `Search for "${query}"`,
            action: () => window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank'),
            icon: <Search className="h-4 w-4" />,
            data: { query }
          })
        }
      })
    }

    return actions
  }

  const suggestiveActions = extractSuggestiveActions(taskText)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-400 bg-green-400/10 border-green-400"
      case "Medium":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400"
      case "Hard":
        return "text-red-400 bg-red-400/10 border-red-400"
      default:
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400"
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video":
        return "🎥"
      case "article":
        return "📄"
      case "documentation":
        return "📚"
      case "course":
        return "🎓"
      default:
        return "🔗"
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-gray-900 border border-yellow-400/30 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-gray-900 border-b border-yellow-400/20 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                <Star className="h-6 w-6" />
                AI Task Analysis
              </h2>
              <p className="text-yellow-300 mt-1 truncate">{taskText}</p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full"
                />
                <span className="ml-3 text-yellow-400">Analyzing your task with AI...</span>
              </div>
            ) : analysis ? (
              <>
                {/* Suggestive Actions */}
                {suggestiveActions.length > 0 && (
                  <Card className="bg-gray-800 border-yellow-400/30">
                    <CardHeader>
                      <CardTitle className="text-yellow-400 text-lg flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {suggestiveActions.map((action, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={action.action}
                            className="flex items-center gap-3 p-3 bg-gray-700 border border-yellow-400/20 rounded-lg hover:border-yellow-400/40 hover:bg-gray-600 transition-all duration-200 group text-left"
                          >
                            <div className="flex-shrink-0 w-8 h-8 bg-yellow-400/10 rounded-full flex items-center justify-center text-yellow-400 group-hover:bg-yellow-400/20">
                              {action.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-yellow-300 group-hover:text-yellow-200 font-medium text-sm truncate">
                                {action.label}
                              </p>
                              <p className="text-yellow-400/70 text-xs capitalize">{action.type}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Summary */}
                <Card className="bg-gray-800 border-yellow-400/30">
                  <CardHeader>
                    <CardTitle className="text-yellow-400 text-lg">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-yellow-300">{analysis.summary}</p>
                  </CardContent>
                </Card>

                {/* Quick Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-gray-800 border-yellow-400/30">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Clock className="h-5 w-5 text-yellow-400" />
                      <div>
                        <p className="text-sm text-yellow-400">Estimated Time</p>
                        <p className="text-yellow-300 font-medium">{analysis.estimatedTime}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-800 border-yellow-400/30">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getDifficultyColor(analysis.difficulty)}`}>
                        {analysis.difficulty}
                      </div>
                      <div>
                        <p className="text-sm text-yellow-400">Difficulty Level</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Suggested Steps */}
                <Card className="bg-gray-800 border-yellow-400/30">
                  <CardHeader>
                    <CardTitle className="text-yellow-400 text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Suggested Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {analysis.suggestedSteps.map((step, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3"
                        >
                          <span className="flex-shrink-0 w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="text-yellow-300">{step}</span>
                        </motion.li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>

                {/* AI Suggested Actions */}
                {analysis.contextualActions && analysis.contextualActions.length > 0 && (
                  <Card className="bg-gray-800 border-yellow-400/30">
                    <CardHeader>
                      <CardTitle className="text-yellow-400 text-lg flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        AI Suggested Tools
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {analysis.contextualActions.map((action, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => action.url && window.open(action.url, '_blank')}
                            className="flex items-center gap-3 p-3 bg-gray-700 border border-yellow-400/20 rounded-lg hover:border-yellow-400/40 hover:bg-gray-600 transition-all duration-200 group text-left w-full"
                            disabled={!action.url}
                          >
                            <div className="flex-shrink-0 w-8 h-8 bg-yellow-400/10 rounded-full flex items-center justify-center text-yellow-400 group-hover:bg-yellow-400/20">
                              🤖
                            </div>
                            <div className="flex-1">
                              <p className="text-yellow-300 group-hover:text-yellow-200 font-medium">
                                {action.label}
                              </p>
                              <p className="text-yellow-400/70 text-sm">{action.description}</p>
                              <p className="text-yellow-400/50 text-xs capitalize mt-1">{action.type}</p>
                            </div>
                            {action.url && <ExternalLink className="h-4 w-4 text-yellow-400/70 group-hover:text-yellow-400 flex-shrink-0" />}
                          </motion.button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Resources */}
                {analysis.resources.length > 0 && (
                  <Card className="bg-gray-800 border-yellow-400/30">
                    <CardHeader>
                      <CardTitle className="text-yellow-400 text-lg flex items-center gap-2">
                        <ExternalLink className="h-5 w-5" />
                        Helpful Resources
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {analysis.resources.map((resource, index) => (
                          <motion.a
                            key={index}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 p-3 bg-gray-700 border border-yellow-400/20 rounded-lg hover:border-yellow-400/40 transition-colors group"
                          >
                            <span className="text-xl">{getResourceIcon(resource.type)}</span>
                            <div className="flex-1">
                              <p className="text-yellow-300 group-hover:text-yellow-200 font-medium">
                                {resource.title}
                              </p>
                              <p className="text-yellow-400/70 text-sm capitalize">{resource.type}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-yellow-400/70 group-hover:text-yellow-400" />
                          </motion.a>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tips */}
                {analysis.tips.length > 0 && (
                  <Card className="bg-gray-800 border-yellow-400/30">
                    <CardHeader>
                      <CardTitle className="text-yellow-400 text-lg flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        Pro Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {analysis.tips.map((tip, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-2"
                          >
                            <span className="text-yellow-400 mt-1">💡</span>
                            <span className="text-yellow-300">{tip}</span>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                
              </>
            ) : (
              <div className="text-center py-12 text-yellow-400/60">
                <p>Failed to analyze the task. Please try again.</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
