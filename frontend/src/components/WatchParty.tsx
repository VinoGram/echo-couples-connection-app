import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Monitor, MonitorOff, Maximize2, Minimize2, Wifi, WifiOff, Users, Eye } from 'lucide-react'
import { socketManager } from '../lib/socket'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // TURN fallback — replace with your coturn / Metered / Twilio credentials
    // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' },
  ]
}

type Role   = 'sharer' | 'viewer' | null
type Status = 'idle' | 'waiting' | 'connected'

export function WatchParty() {
  const [role, setRole]           = useState<Role>(null)
  const [status, setStatus]       = useState<Status>('idle')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [partnerSharing, setPartnerSharing] = useState(false)

  const videoRef      = useRef<HTMLVideoElement>(null)
  const containerRef  = useRef<HTMLDivElement>(null)
  const peerRef       = useRef<RTCPeerConnection | null>(null)
  const streamRef     = useRef<MediaStream | null>(null)

  // ── peer factory ──────────────────────────────────────────────────────────
  const createPeer = useCallback((): RTCPeerConnection => {
    const peer = new RTCPeerConnection(ICE_SERVERS)

    peer.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socketManager.socket?.emit('watch-party:signal', {
          signal: { type: 'candidate', candidate }
        })
      }
    }

    peer.ontrack = (e) => {
      console.log('[webrtc] ontrack', e.streams)
      if (videoRef.current) videoRef.current.srcObject = e.streams[0]
      setStatus('connected')
    }

    peer.onconnectionstatechange = () => {
      console.log('[webrtc] state', peer.connectionState)
      if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
        handlePeerLeft()
      }
    }

    return peer
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── signaling handlers ────────────────────────────────────────────────────
  // Server fires this only when both sharer + viewer are in the room
  const handleStartOffer = useCallback(async () => {
    console.log('[watch] start-offer, stream=', streamRef.current)
    if (!streamRef.current) return
    const peer = createPeer()
    peerRef.current = peer
    streamRef.current.getTracks().forEach(t => peer.addTrack(t, streamRef.current!))
    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)
    socketManager.socket?.emit('watch-party:signal', { signal: offer })
  }, [createPeer])

  const handleSignal = useCallback(async ({ signal }: any) => {
    console.log('[watch] signal', signal.type ?? 'candidate')
    if (!peerRef.current) peerRef.current = createPeer()
    const peer = peerRef.current

    if (signal.type === 'offer') {
      await peer.setRemoteDescription(new RTCSessionDescription(signal))
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      socketManager.socket?.emit('watch-party:signal', { signal: answer })
      setStatus('connected')
    } else if (signal.type === 'answer') {
      await peer.setRemoteDescription(new RTCSessionDescription(signal))
    } else if (signal.type === 'candidate') {
      try { await peer.addIceCandidate(new RTCIceCandidate(signal.candidate)) } catch {}
    }
  }, [createPeer])

  const handlePeerLeft = useCallback(() => {
    peerRef.current?.close()
    peerRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus('idle')
    setRole(null)
    toast.info('Partner disconnected')
  }, [])

  const handleError = useCallback(({ message }: { message: string }) => {
    toast.error(message)
    setStatus('idle')
    setRole(null)
  }, [])

  // ── socket listener registration ──────────────────────────────────────────
  useEffect(() => {
    const attach = () => {
      const s = socketManager.socket
      if (!s) return
      s.off('watch-party:start-offer',     handleStartOffer)
      s.off('watch-party:signal',          handleSignal)
      s.off('watch-party:peer-left',       handlePeerLeft)
      s.off('watch-party:error',           handleError)
      s.off('watch-party:partner-sharing')
      s.on('watch-party:start-offer',      handleStartOffer)
      s.on('watch-party:signal',           handleSignal)
      s.on('watch-party:peer-left',        handlePeerLeft)
      s.on('watch-party:error',            handleError)
      s.on('watch-party:partner-sharing',  () => {
        setPartnerSharing(true)
        toast('Your partner started sharing their screen', {
          action: { label: 'Watch', onClick: joinAsViewer }
        })
      })
    }
    attach()
    socketManager.socket?.on('connect', attach)
    return () => {
      const s = socketManager.socket
      s?.off('connect', attach)
      s?.off('watch-party:start-offer',    handleStartOffer)
      s?.off('watch-party:signal',         handleSignal)
      s?.off('watch-party:peer-left',      handlePeerLeft)
      s?.off('watch-party:error',          handleError)
      s?.off('watch-party:partner-sharing')
      peerRef.current?.close()
    }
  }, [handleStartOffer, handleSignal, handlePeerLeft, handleError]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── fullscreen sync ───────────────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // ── actions ───────────────────────────────────────────────────────────────
  const startSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true })
      streamRef.current = stream
      // Show local preview while waiting for viewer
      if (videoRef.current) videoRef.current.srcObject = stream
      stream.getVideoTracks()[0].onended = stopSharing

      socketManager.socket?.emit('watch-party:join', { role: 'sharer' })
      setRole('sharer')
      setStatus('waiting')
      toast.success('Sharing started — your partner will be notified')
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') toast.error('Could not start screen share')
    }
  }

  const joinAsViewer = () => {
    socketManager.socket?.emit('watch-party:join', { role: 'viewer' })
    setRole('viewer')
    setStatus('waiting')
    setPartnerSharing(false)
    toast.info('Joining your partner\'s screen…')
  }

  const stopSharing = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    socketManager.socket?.emit('watch-party:leave')
    peerRef.current?.close()
    peerRef.current = null
    setRole(null)
    setStatus('idle')
    if (isFullscreen) document.exitFullscreen()
  }

  const leaveWatch = () => {
    socketManager.socket?.emit('watch-party:leave')
    peerRef.current?.close()
    peerRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setRole(null)
    setStatus('idle')
    if (isFullscreen) document.exitFullscreen()
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const isActive = status !== 'idle'

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-1">
          Watch Together
        </h2>
        <p className="text-gray-500 text-sm">Share your screen with your partner in real-time</p>
      </div>

      {/* Status bar */}
      <div className={`flex items-center justify-center gap-2 py-2 px-5 rounded-2xl text-sm font-medium ${
        status === 'connected' ? 'bg-green-50 text-green-700 border border-green-200' :
        status === 'waiting'   ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                 'bg-gray-50 text-gray-500 border border-gray-200'
      }`}>
        {status === 'connected' ? <Wifi className="w-4 h-4" /> :
         status === 'waiting'   ? <Users className="w-4 h-4 animate-pulse" /> :
                                  <WifiOff className="w-4 h-4" />}
        {status === 'connected' ? (role === 'sharer' ? 'Partner is watching' : 'Watching partner\'s screen') :
         status === 'waiting'   ? (role === 'sharer' ? 'Waiting for partner to join…' : 'Connecting…') :
                                  'Not connected'}
      </div>

      {/* Partner sharing notification (when idle) */}
      {partnerSharing && status === 'idle' && (
        <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 text-purple-700 text-sm font-medium">
            <Eye className="w-4 h-4" />
            Your partner is sharing their screen
          </div>
          <button onClick={joinAsViewer}
            className="bg-purple-500 text-white text-sm font-bold px-4 py-1.5 rounded-xl hover:bg-purple-600 transition-all">
            Watch
          </button>
        </div>
      )}

      {/* Single video panel */}
      <div ref={containerRef}
        className="relative bg-gray-950 rounded-2xl overflow-hidden"
        style={{ aspectRatio: '16/9' }}>

        <video
          ref={videoRef}
          autoPlay
          muted={role === 'sharer'}
          playsInline
          className="w-full h-full object-contain"
        />

        {/* Placeholder when no stream */}
        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
            <Monitor className="w-16 h-16 mb-3 opacity-30" />
            <p className="text-sm opacity-60">No screen being shared</p>
          </div>
        )}

        {/* Waiting overlay */}
        {status === 'waiting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-center text-white">
              <Users className="w-10 h-10 mx-auto mb-2 animate-pulse" />
              <p className="text-sm font-medium">
                {role === 'sharer' ? 'Waiting for partner…' : 'Connecting to partner…'}
              </p>
            </div>
          </div>
        )}

        {/* Fullscreen + stop controls (overlay, shown on hover or when active) */}
        {isActive && (
          <div className="absolute top-3 right-3 flex gap-2">
            <button onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-all backdrop-blur-sm">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Role label */}
        {isActive && (
          <div className="absolute bottom-3 left-3 text-xs text-white/50 bg-black/30 px-2 py-1 rounded-lg backdrop-blur-sm">
            {role === 'sharer' ? 'Your screen' : "Partner's screen"}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {status === 'idle' && (
          <button onClick={startSharing}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg transition-all">
            <Monitor className="w-5 h-5" /> Share My Screen
          </button>
        )}
        {role === 'sharer' && (
          <button onClick={stopSharing}
            className="flex items-center gap-2 bg-red-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-red-600 transition-all">
            <MonitorOff className="w-5 h-5" /> Stop Sharing
          </button>
        )}
        {role === 'viewer' && (
          <button onClick={leaveWatch}
            className="flex items-center gap-2 bg-gray-200 text-gray-700 font-bold py-3 px-8 rounded-xl hover:bg-gray-300 transition-all">
            Leave
          </button>
        )}
      </div>

      <p className="text-center text-xs text-gray-400">
        Video streams peer-to-peer — your server never sees the content
      </p>
    </div>
  )
}
