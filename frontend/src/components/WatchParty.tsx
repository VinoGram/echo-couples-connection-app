import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Monitor, MonitorOff, Users, Wifi, WifiOff } from 'lucide-react'
import { socketManager } from '../lib/socket'

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

export function WatchParty() {
  const [isSharing, setIsSharing]     = useState(false)
  const [isReceiving, setIsReceiving] = useState(false)
  const [status, setStatus]           = useState<'idle' | 'waiting' | 'connected'>('idle')

  const localVideoRef  = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerRef        = useRef<RTCPeerConnection | null>(null)
  const streamRef      = useRef<MediaStream | null>(null)

  // --- peer factory ---
  const createPeer = useCallback(() => {
    const peer = new RTCPeerConnection(ICE_SERVERS)

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socketManager.socket?.emit('watch-party:signal', {
          signal: { type: 'candidate', candidate: e.candidate }
        })
      }
    }

    peer.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0]
      }
      setIsReceiving(true)
      setStatus('connected')
    }

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
        handlePeerLeft()
      }
    }

    return peer
  }, [])

  // --- signaling handlers (use useCallback so they always read latest refs) ---
  const handlePeerJoined = useCallback(async () => {
    const peer = createPeer()
    peerRef.current = peer

    // Attach tracks — streamRef.current is always current because it's a ref
    streamRef.current?.getTracks().forEach(track =>
      peer.addTrack(track, streamRef.current!)
    )

    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)
    socketManager.socket?.emit('watch-party:signal', { signal: offer })
    setStatus('connected')
    toast.success('Partner joined!')
  }, [createPeer])

  const handleSignal = useCallback(async ({ signal }: any) => {
    if (!peerRef.current) {
      peerRef.current = createPeer()
    }
    const peer = peerRef.current

    if (signal.type === 'offer') {
      // Attach local tracks before answering (if this side is also sharing)
      streamRef.current?.getTracks().forEach(track =>
        peer.addTrack(track, streamRef.current!)
      )
      await peer.setRemoteDescription(new RTCSessionDescription(signal))
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      socketManager.socket?.emit('watch-party:signal', { signal: answer })
    } else if (signal.type === 'answer') {
      await peer.setRemoteDescription(new RTCSessionDescription(signal))
    } else if (signal.type === 'candidate') {
      try { await peer.addIceCandidate(new RTCIceCandidate(signal.candidate)) } catch {}
    }
  }, [createPeer])

  const handlePeerLeft = useCallback(() => {
    peerRef.current?.close()
    peerRef.current = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    setIsReceiving(false)
    setStatus('idle')
    toast.info('Partner disconnected')
  }, [])

  // --- register socket listeners (re-run if socket connects after mount) ---
  useEffect(() => {
    const attach = () => {
      const socket = socketManager.socket
      if (!socket) return
      socket.off('watch-party:peer-joined', handlePeerJoined)
      socket.off('watch-party:signal',      handleSignal)
      socket.off('watch-party:peer-left',   handlePeerLeft)
      socket.on('watch-party:peer-joined',  handlePeerJoined)
      socket.on('watch-party:signal',       handleSignal)
      socket.on('watch-party:peer-left',    handlePeerLeft)
    }

    attach()
    socketManager.socket?.on('connect', attach)

    return () => {
      const socket = socketManager.socket
      socket?.off('connect', attach)
      socket?.off('watch-party:peer-joined', handlePeerJoined)
      socket?.off('watch-party:signal',      handleSignal)
      socket?.off('watch-party:peer-left',   handlePeerLeft)
      peerRef.current?.close()
    }
  }, [handlePeerJoined, handleSignal, handlePeerLeft])

  // --- actions ---
  const startSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true
      })
      streamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      stream.getVideoTracks()[0].onended = stopSharing

      socketManager.socket?.emit('watch-party:join')
      setIsSharing(true)
      setStatus('waiting')
      toast.success('Screen sharing started — waiting for partner')
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') toast.error('Could not start screen share')
    }
  }

  const stopSharing = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    socketManager.socket?.emit('watch-party:leave')
    peerRef.current?.close()
    peerRef.current = null
    setIsSharing(false)
    setStatus('idle')
  }

  const joinParty = () => {
    socketManager.socket?.emit('watch-party:join')
    setStatus('waiting')
    toast.info('Joining — waiting for partner to share screen')
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Watch Together
        </h2>
        <p className="text-gray-600">Share your screen and watch movies or shows together in real-time</p>
      </div>

      {/* Status */}
      <div className={`flex items-center justify-center gap-2 py-3 px-6 rounded-2xl text-sm font-medium ${
        status === 'connected' ? 'bg-green-50 text-green-700 border border-green-200' :
        status === 'waiting'   ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                 'bg-gray-50 text-gray-600 border border-gray-200'
      }`}>
        {status === 'connected' ? <Wifi className="w-4 h-4" /> :
         status === 'waiting'   ? <Users className="w-4 h-4 animate-pulse" /> :
                                  <WifiOff className="w-4 h-4" />}
        {status === 'connected' ? 'Connected — watching together' :
         status === 'waiting'   ? 'Waiting for partner...' : 'Not connected'}
      </div>

      {/* Video panels */}
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { ref: localVideoRef,  muted: true,  active: isSharing,   label: 'You' },
          { ref: remoteVideoRef, muted: false, active: isReceiving, label: 'Partner' }
        ].map(({ ref, muted, active, label }) => (
          <div key={label} className="bg-gray-900 rounded-2xl overflow-hidden aspect-video relative">
            <video ref={ref} autoPlay muted={muted} playsInline className="w-full h-full object-contain" />
            {!active && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Monitor className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{label}'s screen</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-3 text-xs text-white/60">{label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {!isSharing ? (
          <button onClick={startSharing}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg transition-all">
            <Monitor className="w-5 h-5" /> Share My Screen
          </button>
        ) : (
          <button onClick={stopSharing}
            className="flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-red-600 transition-all">
            <MonitorOff className="w-5 h-5" /> Stop Sharing
          </button>
        )}
        {!isSharing && status === 'idle' && (
          <button onClick={joinParty}
            className="flex items-center justify-center gap-2 bg-white border-2 border-purple-300 text-purple-600 font-bold py-3 px-8 rounded-xl hover:bg-purple-50 transition-all">
            <Users className="w-5 h-5" /> Join Partner's Screen
          </button>
        )}
      </div>

      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 border border-pink-100 text-sm text-gray-600">
        <p className="font-medium text-gray-700 mb-1">How it works</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>One partner clicks <strong>Share My Screen</strong> and picks a window or tab</li>
          <li>The other clicks <strong>Join Partner's Screen</strong> to receive the stream</li>
          <li>Video is sent peer-to-peer — your server never sees the content</li>
        </ul>
      </div>
    </div>
  )
}
