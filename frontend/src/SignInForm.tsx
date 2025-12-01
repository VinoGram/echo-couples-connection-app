import { useState } from "react";
import { toast } from "sonner";
import { api } from "./lib/api";
import { ensureBackendReady } from "./lib/healthCheck";

interface SignInFormProps {
  onLogin: () => void;
}

export function SignInForm({ onLogin }: SignInFormProps) {
  const [flow, setFlow] = useState<"signIn" | "signUp" | "forgotPassword">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [selectedGender, setSelectedGender] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Wake up backend first
    try {
      await ensureBackendReady();
    } catch (error) {
      toast.error('Server is starting up, please try again in a moment');
      setSubmitting(false);
      return;
    }
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // Frontend validation
      if (!email || !password) {
        toast.error("Please fill in all fields");
        setSubmitting(false);
        return;
      }
      
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        setSubmitting(false);
        return;
      }
      
      let result;
      if (flow === "signIn") {
        result = await api.login(email, password);
      } else {
        if (!selectedGender) {
          toast.error("Please select your gender");
          setSubmitting(false);
          return;
        }
        const username = `${selectedGender}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`; // Generate unique username
        result = await api.register(email, password, username);
      }
      sessionStorage.setItem('userId', result.user.id);
      toast.success(flow === "signIn" ? "Signed in successfully!" : "Account created successfully!");
      onLogin();
    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = error.message || error.toString();
      
      if (flow === "signIn") {
        if (errorMessage.includes('Invalid credentials') || errorMessage.includes('401')) {
          toast.error("Invalid email or password. Did you mean to sign up?");
        } else {
          toast.error(`Sign in failed: ${errorMessage}`);
        }
      } else {
        if (errorMessage.includes('User already exists') || errorMessage.includes('400')) {
          toast.error("Email already registered. Did you mean to sign in?");
        } else {
          toast.error(`Sign up failed: ${errorMessage}`);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form className="flex flex-col gap-form-field" onSubmit={handleSubmit}>
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password (min 6 characters)"
          minLength={6}
          required
        />
        {flow === "signUp" && (
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-secondary">I am:</label>
            <div className="flex gap-3">
              <button
                type="button"
                className={`flex-1 p-4 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 ${
                  selectedGender === "male" 
                    ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-105" 
                    : "bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700"
                }`}
                onClick={() => setSelectedGender("male")}
              >
                <div className="w-8 h-8 rounded-full bg-current opacity-20"></div>
                <span className="text-sm font-medium">Him</span>
              </button>
              <button
                type="button"
                className={`flex-1 p-4 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 ${
                  selectedGender === "female" 
                    ? "bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg scale-105" 
                    : "bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700"
                }`}
                onClick={() => setSelectedGender("female")}
              >
                <div className="w-8 h-8 rounded-full bg-current opacity-20"></div>
                <span className="text-sm font-medium">Her</span>
              </button>
            </div>
          </div>
        )}
        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? (flow === "signIn" ? "Signing in..." : "Creating account...") : (flow === "signIn" ? "Sign in" : "Sign up")}
        </button>
        {submitting && (
          <div className="text-center text-sm text-gray-600">
            {flow === "signIn" ? "Waking up server and signing in..." : "Waking up server and creating account..."}<br/>
            This may take up to 5 minutes on first use. Please be patient.
          </div>
        )}
        
        {flow === "signIn" && (
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline cursor-pointer bg-transparent border-none p-0"
              onClick={() => setFlow("forgotPassword")}
            >
              Forgot password?
            </button>
          </div>
        )}
        
        {flow === "forgotPassword" && (
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">We'll send a temporary password to your email</p>
            <button
              type="button"
              className="text-sm text-pink-600 hover:text-pink-700 hover:underline cursor-pointer bg-transparent border-none p-0"
              disabled={submitting}
              onClick={async () => {
                const formData = new FormData(document.querySelector('form') as HTMLFormElement);
                const email = formData.get("email") as string;
                if (!email) {
                  toast.error("Please enter your email first");
                  return;
                }
                setSubmitting(true);
                try {
                  await api.forgotPassword(email);
                  toast.success("Temporary password sent to your email!");
                  setFlow("signIn");
                } catch (error: any) {
                  const errorData = error.message;
                  if (errorData.includes('tempPassword')) {
                    // Extract temp password from error message
                    try {
                      const response = JSON.parse(errorData.split('API Error: ')[1]);
                      if (response.tempPassword) {
                        toast.success(`Your temporary password: ${response.tempPassword}`);
                        toast.info('Please save this password and change it after logging in.');
                      } else {
                        toast.error("Email not found. Please check your email address.");
                      }
                    } catch {
                      toast.error("Email not found. Please check your email address.");
                    }
                  } else {
                    toast.error("Email not found. Please check your email address.");
                  }
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? "Sending..." : "Send Temporary Password"}
            </button>
            <div>
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-700 hover:underline cursor-pointer bg-transparent border-none p-0"
                onClick={() => setFlow("signIn")}
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
        
        {flow !== "forgotPassword" && (
          <div className="text-center text-sm text-secondary">
            <span>
              {flow === "signIn"
                ? "Don't have an account? "
                : "Already have an account? "}
            </span>
            <button
              type="button"
              className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer bg-transparent border-none p-0"
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            >
              {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
