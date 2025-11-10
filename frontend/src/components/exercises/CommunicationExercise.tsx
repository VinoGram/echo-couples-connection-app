import { useState, useEffect } from 'react'
import { MessageSquare, ArrowLeft, Send, CheckCircle, Users, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../lib/api'

interface CommunicationExerciseProps {
  onBack: () => void
}

export function CommunicationExercise({ onBack }: CommunicationExerciseProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<string[]>([])
  const [partnerResponses, setPartnerResponses] = useState<string[]>([])
  const [currentResponse, setCurrentResponse] = useState('')
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [partnerName, setPartnerName] = useState('Partner')
  const [bothCompleted, setBothCompleted] = useState(false)

  const prompts = [
    {
      title: 'Express Appreciation',
      prompt: 'I feel grateful when you...',
      placeholder: 'Complete this sentence about something your partner does that you appreciate',
      example: 'I feel grateful when you listen to me without trying to fix everything'
    },
    {
      title: 'Share a Need',
      prompt: 'I feel loved when...',
      placeholder: 'Share what makes you feel most loved and connected',
      example: 'I feel loved when we have uninterrupted conversations about our day'
    },
    {
      title: 'Address a Concern',
      prompt: 'I feel disconnected when...',
      placeholder: 'Gently share something that creates distance (use "I" statements)',
      example: 'I feel disconnected when we both scroll our phones during dinner'
    },
    {
      title: 'Express Hope',
      prompt: 'I feel excited about our future when I imagine...',
      placeholder: 'Share a positive vision for your relationship',
      example: 'I feel excited about our future when I imagine us traveling together'
    }
  ]

  useEffect(() => {
    loadExerciseSession()
    const interval = setInterval(loadExerciseSession, 2000)
    return () => clearInterval(interval)
  }, [])

  const loadExerciseSession = async () => {
    try {
      const results = await api.getCoupleActivityResults('exercise', 'communication_exercise')
      if (results.results) {
        if (results.results.user.response) {
          const userData = results.results.user.response
          setResponses(userData.responses?.map((r: any) => r.response) || [])
          setCurrentStep(userData.responses?.length || 0)
          setCompleted(userData.completed || false)
        }
        if (results.results.partner.response) {
          const partnerData = results.results.partner.response
          setPartnerResponses(partnerData.responses?.map((r: any) => r.response) || [])
        }
        setPartnerName(results.results.partner.name || 'Partner')
        setBothCompleted(results.bothCompleted)
      }
    } catch (error) {
      console.log('No existing exercise session')
    }
  }

  const handleSubmit = async () => {
    if (!currentResponse.trim()) {
      toast.error('Please write a response')
      return
    }

    const newResponses = [...responses, currentResponse.trim()]
    setResponses(newResponses)
    setCurrentResponse('')

    // Save progress immediately
    try {
      const exerciseData = {
        type: 'communication_exercise',
        responses: newResponses.map((response, index) => ({
          prompt: prompts[index].prompt,
          response,
          timestamp: new Date().toISOString()
        })),
        currentStep: newResponses.length,
        completed: newResponses.length === prompts.length,
        updatedAt: new Date().toISOString()
      }

      await api.submitCoupleActivity('exercise', 'communication_exercise', exerciseData)
    } catch (error) {
      console.error('Failed to save progress:', error)
    }

    if (currentStep < prompts.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      await completeExercise(newResponses)
    }
  }

  const completeExercise = async (allResponses: string[]) => {
    setLoading(true)
    try {
      const exerciseData = {
        type: 'communication_exercise',
        responses: allResponses.map((response, index) => ({
          prompt: prompts[index].prompt,
          response,
          timestamp: new Date().toISOString()
        })),
        completed: true,
        completedAt: new Date().toISOString()
      }

      await api.submitCoupleActivity('exercise', 'communication_exercise', exerciseData)
      setCompleted(true)
      toast.success('Communication exercise completed!')
    } catch (error) {
      toast.error('Failed to save exercise')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Exercise Complete!</h2>
          <p className="text-gray-600 mb-6">
            Great job practicing healthy communication! {bothCompleted ? 'Both you and your partner have completed the exercise.' : 'Your responses are now visible to your partner.'}
          </p>
          
          <div className="bg-blue-50 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-3">Next Steps:</h3>
            <ul className="text-left space-y-2 text-gray-700">
              <li>• Share your responses with your partner</li>
              <li>• Discuss what you learned about each other</li>
              <li>• Practice using "I feel" statements daily</li>
              <li>• Schedule regular check-ins</li>
            </ul>
          </div>

          <button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-3 px-6 rounded-xl"
          >
            Return to Exercises
          </button>
        </div>
      </div>
    )
  }

  const currentPrompt = prompts[currentStep]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-2 text-blue-500">
            <MessageSquare className="w-6 h-6" />
            <span className="font-bold">Communication Exercise</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">Step {currentStep + 1} of {prompts.length}</span>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-500">{currentPrompt.title}</span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="w-3 h-3" />
                {bothCompleted ? 'Both completed' : 'In progress'}
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentStep + 1) / prompts.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">{currentPrompt.prompt}</h3>
          
          <div className="bg-blue-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Example:</p>
            <p className="text-gray-700 italic">"{currentPrompt.example}"</p>
          </div>

          <div className="space-y-4">
            <textarea
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
              placeholder={currentPrompt.placeholder}
              className="w-full p-4 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{currentResponse.length}/500</span>
              <button
                onClick={handleSubmit}
                disabled={!currentResponse.trim()}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-2 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {currentStep === prompts.length - 1 ? 'Complete' : 'Next'}
              </button>
            </div>
          </div>
        </div>

        {(responses.length > 0 || partnerResponses.length > 0) && (
          <div className="space-y-4">
            {responses.length > 0 && (
              <div className="bg-blue-50 rounded-2xl p-4">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  Your Responses:
                </h4>
                <div className="space-y-2">
                  {responses.map((response, index) => (
                    <div key={index} className="bg-white rounded-lg p-3">
                      <div className="text-xs text-blue-600 mb-1 font-medium">{prompts[index].prompt}</div>
                      <div className="text-gray-700">{response}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {partnerResponses.length > 0 && (
              <div className="bg-pink-50 rounded-2xl p-4">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  {partnerName}'s Responses:
                </h4>
                <div className="space-y-2">
                  {partnerResponses.map((response, index) => (
                    <div key={index} className="bg-white rounded-lg p-3">
                      <div className="text-xs text-pink-600 mb-1 font-medium">{prompts[index].prompt}</div>
                      <div className="text-gray-700">{response}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}