import { useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Heart, Lock } from "lucide-react";

interface CoupleSetupProps {
  couple: any;
  onCoupleUpdate: (couple: any) => void;
}

export function CoupleSetup({ couple, onCoupleUpdate }: CoupleSetupProps) {
  const [connectionCode, setConnectionCode] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerWhatsApp, setPartnerWhatsApp] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  const generateUniqueCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${random}${timestamp.slice(-3)}`;
  };

  const handleCreateCouple = async () => {
    setIsCreating(true);
    try {
      const result = await api.createCouple();
      const inviteLink = `${window.location.origin}?join=${result.connectionCode}`;
      toast.success(`Room created! Share the link to invite anyone.`);
      const updatedCouple = await api.getCurrentCouple();
      onCoupleUpdate(updatedCouple);
    } catch (error) {
      toast.error("Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!partnerEmail.trim()) {
      toast.error("Please enter your partner's email address");
      return;
    }

    if (!couple?.connectionCode) {
      toast.error("No connection code available");
      return;
    }

    setIsSendingEmail(true);
    try {
      await api.sendConnectionCode(partnerEmail, couple.connectionCode);
      toast.success(`Connection code sent to ${partnerEmail}`);
      setPartnerEmail("");
    } catch (error) {
      toast.error("Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!partnerEmail.trim()) {
      toast.error("Please enter your partner's email address");
      return;
    }

    if (!couple?.connectionCode) {
      toast.error("No connection code available");
      return;
    }

    setIsSendingEmail(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('userId') || '{}');
      const senderName = currentUser.name || 'Your partner';
      
      await api.sendInvitation(partnerEmail, senderName, couple.connectionCode);
      toast.success(`Invitation sent to ${partnerEmail}! They'll receive instructions to join Echo.`);
      setPartnerEmail("");
    } catch (error) {
      toast.error("Failed to send invitation");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!partnerWhatsApp.trim()) {
      toast.error("Please enter WhatsApp number");
      return;
    }

    setIsSendingWhatsApp(true);
    try {
      await api.sendWhatsAppInvite(partnerWhatsApp);
      toast.success(`WhatsApp invitation sent to ${partnerWhatsApp}`);
      setPartnerWhatsApp("");
    } catch (error) {
      toast.error("Failed to send WhatsApp invitation");
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleJoinCouple = async () => {
    if (!connectionCode.trim()) {
      toast.error("Please enter a connection code");
      return;
    }

    setIsJoining(true);
    try {
      await api.joinCouple(connectionCode.trim());
      toast.success("Successfully connected to your partner!");
      const updatedCouple = await api.getCurrentCouple();
      onCoupleUpdate(updatedCouple);
    } catch (error) {
      toast.error("Invalid connection code or connection failed");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Heart className="w-10 h-10 text-pink-500 fill-pink-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to Echo!
          </h1>
        </div>
        <p className="text-xl text-gray-600 mb-2">
          Connect with your partner to start your journey
        </p>
        <p className="text-gray-500">
          Share meaningful moments and deepen your relationship together
        </p>
      </div>

      {couple && !couple.isComplete ? (
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-pink-100 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Your Connection Code
            </h2>
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl p-6 mb-6">
              <div className="text-2xl font-mono font-bold text-gray-800 mb-2">
                {couple.connectionCode}
              </div>
              <div className="bg-white rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-600 mb-1">Invite Link:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}?join=${couple.connectionCode}`}
                    readOnly
                    className="flex-1 text-sm bg-gray-50 px-2 py-1 rounded border"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}?join=${couple.connectionCode}`);
                      toast.success('Link copied!');
                    }}
                    className="text-xs bg-pink-500 text-white px-3 py-1 rounded hover:bg-pink-600"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <p className="text-gray-600">
                Share this link with one person to join your private room
              </p>
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ Room limited to 2 people only
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Send via Email
                </h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    placeholder="partner@example.com"
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || !partnerEmail.trim()}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl whitespace-nowrap"
                  >
                    {isSendingEmail ? "Sending..." : "Send Code"}
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Send via WhatsApp
                </h3>
                <div className="flex gap-3">
                  <input
                    type="tel"
                    value={partnerWhatsApp}
                    onChange={(e) => setPartnerWhatsApp(e.target.value)}
                    placeholder="+1234567890"
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                  />
                  <button
                    onClick={handleSendWhatsApp}
                    disabled={isSendingWhatsApp || !partnerWhatsApp.trim()}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl whitespace-nowrap"
                  >
                    {isSendingWhatsApp ? "Sending..." : "Send via WhatsApp"}
                  </button>
                </div>
              </div>
              
              <div className="text-center">
                <button
                  onClick={handleSendInvitation}
                  disabled={isSendingEmail || !partnerEmail.trim()}
                  className="text-sm text-purple-600 hover:text-purple-700 hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  Partner doesn't have Echo? Send invitation instead
                </button>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Waiting for your partner to join...
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-pink-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Start New Connection
            </h2>
            <p className="text-gray-600 mb-6">
              Create a connection code to share with your partner
            </p>
            <button
              onClick={handleCreateCouple}
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isCreating ? "Creating..." : "Create Connection Code"}
            </button>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-pink-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Join Partner
            </h2>
            <p className="text-gray-600 mb-6">
              Enter the connection code your partner shared with you
            </p>
            <div className="space-y-4">
              <input
                type="text"
                value={connectionCode}
                onChange={(e) => setConnectionCode(e.target.value.toUpperCase())}
                placeholder="Enter connection code"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all text-center font-mono text-lg"
                maxLength={8}
              />
              <button
                onClick={handleJoinCouple}
                disabled={isJoining || !connectionCode.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isJoining ? "Connecting..." : "Connect to Partner"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          Your connection is private and secure
        </p>
      </div>
    </div>
  );
}
