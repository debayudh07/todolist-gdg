/*eslint-disable*/
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { BookOpen } from "lucide-react"
import { FloatingParticles } from "@/components/floating-particles"
import { AuthButton } from "@/components/auth-button"

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

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

  return (
    <div className="min-h-screen bg-black text-yellow-400 relative overflow-hidden">
      <FloatingParticles />

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 border-b border-yellow-400/20 bg-black/50 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div className="flex items-center space-x-2" whileHover={{ scale: 1.05 }}>
            <BookOpen className="h-8 w-8 text-yellow-400" />
            <span className="text-2xl font-bold">StudyFlow</span>
          </motion.div>
          <AuthButton user={user} onAuthChange={setUser} />
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <motion.h1
              className="text-6xl md:text-8xl lg:text-9xl font-bold mb-8 bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
              style={{ backgroundSize: "200% 200%" } as React.CSSProperties}
            >
              StudyFlow
            </motion.h1>

            <motion.p
              className="text-xl md:text-3xl lg:text-4xl mb-12 text-yellow-300 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              Master Your Studies with the Ultimate Todo App
              <br />
              <span className="text-lg md:text-xl text-yellow-400/80 block mt-4">
                Organize assignments • Track deadlines • Boost productivity
              </span>
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col items-center gap-8"
          >
            {!user && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <AuthButton user={user} onAuthChange={setUser} />
              </motion.div>
            )}

            {user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <p className="text-yellow-300 mb-4 text-lg">Welcome back, {user.displayName}!</p>
                <motion.a
                  href="/todo"
                  className="inline-block bg-yellow-400 text-black hover:bg-yellow-300 font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Go to Your Tasks →
                </motion.a>
              </motion.div>
            )}
          </motion.div>

          {/* Floating Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto mt-20"
          >
            {[
              { number: "98%", label: "Task Completion Rate" },
              { number: "50K+", label: "Students Using" },
              { number: "4.9★", label: "Average Rating" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center p-6 rounded-lg border border-yellow-400/20 bg-black/30 backdrop-blur-sm"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="text-4xl font-bold text-yellow-400 mb-2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: index * 0.5 }}
                >
                  {stat.number}
                </motion.div>
                <div className="text-yellow-300">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
