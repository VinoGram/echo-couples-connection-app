import { Box, Flex, Heading, Text, Spinner, VStack, HStack, Icon, Badge } from "@chakra-ui/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { Dashboard } from "./components/Dashboard";
import { CoupleSetup } from "./components/CoupleSetup";
import { api } from "./lib/api";
import { Heart, MessageCircle, Gamepad2, TrendingUp } from "lucide-react";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [couple, setCouple] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNotificationOptIn, setShowNotificationOptIn] = useState(false)
  const [showCoupleSetup, setShowCoupleSetup] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const urlParams = new URLSearchParams(window.location.search)
    const joinCode = urlParams.get('join')
    
    if (token) {
      setIsAuthenticated(true)
      loadCouple()
      
      // Auto-join if there's a join code in URL
      if (joinCode) {
        setTimeout(() => {
          handleAutoJoin(joinCode)
        }, 1000)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const loadCouple = async () => {
    try {
      const coupleData = await api.getCurrentCouple()
      // Mark couple as complete if both users are connected
      if (coupleData && coupleData.user1Id && coupleData.user2Id && coupleData.user1Id !== coupleData.user2Id) {
        coupleData.isComplete = true
      }
      setCouple(coupleData)
    } catch (error) {
      console.error('Failed to load couple:', error)
      // If unauthorized, clear token and set as not authenticated
      if (error.message?.includes('Unauthorized')) {
        localStorage.removeItem('auth_token')
        setIsAuthenticated(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    setIsAuthenticated(true)
    loadCouple()
    // Show notification opt-in for new users
    const hasSeenOptIn = localStorage.getItem('notification_opt_in_seen')
    if (!hasSeenOptIn) {
      setShowNotificationOptIn(true)
    }
  }

  const handleNotificationOptIn = (enabled: boolean) => {
    localStorage.setItem('notification_opt_in_seen', 'true')
    setShowNotificationOptIn(false)
  }

  const handleAutoJoin = async (joinCode: string) => {
    try {
      await api.joinCouple(joinCode)
      toast.success('Joined room successfully!')
      loadCouple()
      // Clear URL parameter
      window.history.replaceState({}, document.title, window.location.pathname)
    } catch (error) {
      toast.error('Failed to join room')
    }
  }

  const handleLogout = () => {
    api.clearToken()
    setIsAuthenticated(false)
    setCouple(null)
  }

  return (
    <Box minH="100vh" bg="linear-gradient(135deg, #fdf2f8 0%, #ffffff 50%, #faf5ff 100%)" position="relative">
      {isAuthenticated && (
        <Flex
          as="header"
          position="sticky"
          top={0}
          zIndex={50}
          bg="rgba(255, 255, 255, 0.9)"
          backdropFilter="blur(10px)"
          borderBottom="1px"
          borderColor="pink.100"
          shadow="lg"
        >
          <Box maxW="7xl" mx="auto" px={6} h={20} w="full">
            <Flex justify="space-between" align="center" h="full">
              <HStack spacing={4}>
                <Box position="relative">
                  <Box
                    w={12}
                    h={12}
                    bg="linear-gradient(135deg, #ec4899, #8b5cf6)"
                    borderRadius="2xl"
                    display="flex"
                    align="center"
                    justify="center"
                    shadow="lg"
                  >
                    <Text color="white" fontSize="xl">💕</Text>
                  </Box>
                  <Badge
                    position="absolute"
                    top={-1}
                    right={-1}
                    w={4}
                    h={4}
                    bg="green.400"
                    borderRadius="full"
                    border="2px"
                    borderColor="white"
                  />
                </Box>
                <VStack align="start" spacing={0}>
                  <Heading
                    size="lg"
                    bgGradient="linear(to-r, pink.600, purple.600)"
                    bgClip="text"
                  >
                    Echo
                  </Heading>
                  <Text fontSize="xs" color="gray.500">
                    Couples Connection
                  </Text>
                </VStack>
              </HStack>
              <SignOutButton onLogout={handleLogout} />
            </Flex>
          </Box>
        </Flex>
      )}
      <Box as="main" flex={1} position="relative" zIndex={10}>
        <Box maxW="7xl" mx="auto" px={6} py={isAuthenticated ? 8 : 0}>
          <Content 
            isAuthenticated={isAuthenticated}
            couple={couple}
            loading={loading}
            handleLogin={handleLogin}
            setCouple={setCouple}
            showCoupleSetup={showCoupleSetup}
            setShowCoupleSetup={setShowCoupleSetup}
          />
        </Box>
      </Box>
      <Toaster />
    </Box>
  );
}

function Content({ isAuthenticated, couple, loading, handleLogin, setCouple, showCoupleSetup, setShowCoupleSetup }: {
  isAuthenticated: boolean
  couple: any
  loading: boolean
  handleLogin: () => void
  setCouple: (couple: any) => void
  showCoupleSetup: boolean
  setShowCoupleSetup: (show: boolean) => void
}) {

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="60vh">
        <VStack>
          <Spinner size="xl" color="pink.500" thickness="4px" />
          <Text color="gray.600">Connecting hearts...</Text>
        </VStack>
      </Flex>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {!isAuthenticated ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-12">
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-3xl flex items-center justify-center animate-bounce shadow-2xl mb-4">
                  <Heart className="w-10 h-10 text-white fill-white" />
                </div>
                <h1 className="text-7xl font-bold bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">
                  Echo
                </h1>
              </div>
              <p className="text-3xl text-gray-700 mb-4 font-light">Go beyond "What's for dinner?"</p>
              <p className="text-xl text-gray-600 mb-8">Deepen your connection, one question at a time</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                  <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center mb-3">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Daily Questions</h3>
                  <p className="text-sm text-gray-600">Meaningful conversations every day</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                  <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center mb-3">
                    <Gamepad2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Fun Games</h3>
                  <p className="text-sm text-gray-600">Play together, grow together</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-3">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Track Progress</h3>
                  <p className="text-sm text-gray-600">Level up your relationship</p>
                </div>
              </div>
            </div>
            
            <div className="max-w-md mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
                <SignInForm onLogin={handleLogin} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Dashboard couple={couple} onCoupleSetup={() => setShowCoupleSetup(true)} />
          {showCoupleSetup && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Connect with Partner</h2>
                    <button 
                      onClick={() => setShowCoupleSetup(false)}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  <CoupleSetup 
                    couple={couple} 
                    onCoupleUpdate={(updatedCouple) => {
                      setCouple(updatedCouple)
                      setShowCoupleSetup(false)
                    }} 
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
