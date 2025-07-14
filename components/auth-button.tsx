"use client"

import { signInWithPopup, signOut, type User, GoogleAuthProvider } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { LogIn, LogOut, UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"

interface AuthButtonProps {
  user: User | null
  onAuthChange: (user: User | null) => void
}

export function AuthButton({ user, onAuthChange }: AuthButtonProps) {
  const router = useRouter()

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth!, provider)
      onAuthChange(result.user)
      router.push("/todo")
    } catch (error) {
      console.error("Error signing in:", error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      onAuthChange(null)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (user) {
    return (
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 text-yellow-400">
          <UserIcon className="h-5 w-5" />
          <span className="hidden sm:inline">{user.displayName}</span>
        </div>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black bg-transparent"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        onClick={handleSignIn}
        className="bg-yellow-400 text-black hover:bg-yellow-300 font-semibold px-6 py-3 rounded-full"
      >
        <LogIn className="h-4 w-4 mr-2" />
        Sign in with Google
      </Button>
    </motion.div>
  )
}
