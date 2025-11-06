import { useState } from 'react'
import { Shield, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../lib/api'

interface ConflictResolutionProps {
  onBack: () => void
}

export function ConflictResolution({ onBack }: ConflictResolutionProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(false)

  const steps = [
    {
      id: 'issue',
      title: 'Identify the Issue',
      question: 'What is the main issue you want to address?',
      placeholder: 'Describe the situation objectively, without blame',
      tip: 'Focus on the specific behavior or situation, not character attacks'
    },
    {
      id: 'feelings',
      title: 'Express Your Feelings',
      question: 'How does this situation make you feel?',
      placeholder: 'I feel... when... because...',
      tip: 'Use "I" statements to express emotions without blame'
    },
    {
      id: 'needs',
      title: 'Identify Your Needs',
      question: 'What do you need from your partner?',
      placeholder: 'I need... so that we can...',
      tip: 'Be specific about what would help resolve the situation'
    },
    {
      id: 'understanding',
      title: 'Seek Understanding',
      question: 'What might your partner\'s perspective be?',
      placeholder: 'They might feel... or think... because...',
      tip: 'Try to see the situation from their point of view'
    },
    {
      id: 'solution',
      title: 'Propose Solutions',
      question: 'What are some possible solutions?',
      placeholder: 'We could try... or maybe...',
      tip: 'Think of win-win solutions that address both perspectives'
    }
  ]

  const handleNext = () => {
    const currentStepData = steps[currentStep]
    const response = responses[currentStepData.id]
    
    if (!response?.trim()) {
      toast.error('Please complete this step before continuing')
      return
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeExercise()
    }
  }

  const completeExercise = async () => {
    setLoading(true)
    try {
      const exerciseData = {
        type: 'conflict_resolution',
        responses,
        completedAt: new Date().toISOString(),
        framework: 'gottman_method'
      }

      await api.submitExerciseResult('conflict_resolution', exerciseData)
      setCompleted(true)
      toast.success('Conflict resolution exercise completed! +15 XP earned')
    } catch (error) {
      toast.error('Failed to save exercise')
    } finally {
      setLoading(false)
    }
  }

  const updateResponse = (stepId: string, value: string) => {
    setResponses({ ...responses, [stepId]: value })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
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
            You've worked through a structured approach to conflict resolution. This framework can help you navigate future disagreements more effectively.
          </p>
          
          <div className="bg-orange-50 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-3">Key Takeaways:</h3>
            <ul className="text-left space-y-2 text-gray-700">
              <li>• Focus on specific behaviors, not character</li>
              <li>• Use "I" statements to express feelings</li>
              <li>• Seek to understand before being understood</li>
              <li>• Look for win-win solutions</li>
              <li>• Practice this framework regularly</li>
            </ul>
          </div>

          <button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-6 rounded-xl"
          >
            Return to Exercises
          </button>
        </div>
      </div>
    )
  }

  const currentStepData = steps[currentStep]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-2 text-orange-500">
            <Shield className="w-6 h-6" />
            <span className="font-bold">Conflict Resolution</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm font-medium text-orange-500">{currentStepData.title}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">{currentStepData.question}</h3>
          
          <div className="bg-orange-50 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800 mb-1">Tip:</p>
              <p className="text-sm text-gray-700">{currentStepData.tip}</p>
            </div>
          </div>

          <textarea
            value={responses[currentStepData.id] || ''}
            onChange={(e) => updateResponse(currentStepData.id, e.target.value)}
            placeholder={currentStepData.placeholder}
            className="w-full p-4 border border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none resize-none"
            rows={4}
            maxLength={500}
          />
          
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-gray-500">
              {(responses[currentStepData.id] || '').length}/500
            </span>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Previous
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!(responses[currentStepData.id]?.trim())}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <h4 className="font-bold text-gray-800 mb-3">Your Progress:</h4>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 text-sm ${
                  index <= currentStep ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full ${
                    index < currentStep
                      ? 'bg-green-500'
                      : index === currentStep
                      ? 'bg-orange-500'
                      : 'bg-gray-300'
                  }`}
                />
                <span className={index <= currentStep ? 'font-medium' : ''}>{step.title}</span>
                {responses[step.id] && index < currentStep && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}