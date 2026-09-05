import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Monitor, MonitorOff, Users, Wifi, WifiOff } from 'lucide-react'
import { socketManager } from '../lib/socket'

export function WatchParty() {
  const [isSharing, setIsSharing] = useState(false)
  const [isReceiving, setIsReceiving] = useState(false)
  const [peerConnected, setPeerConnected] = useState(false)
  const [status, setStatus] = useState<'idle' | 'waiting' | 'connected'>('idle')

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const ICE_SERVERS = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  }

  useEffect(() => {
    const socket = socketManager.socket
    if (!socket) return

    socket.on('watch-party:peer-joined', handlePeerJoined)
    socket.on('watch-party:signal', handleSignal)
    socket.on('watch-party:peer-left', handlePeerLeft)

    return () => {
      socket.off('watch-party:peer-joined', handlePeerJoined)
      socket.off('watch-party:signal', handleSignal)
      socket.off('watch-party:peer-left', handlePeerLeft)
      cleanup()
    }
  }, [])

  const createPeer = (initiator: boolean): RTCPeerConnection => {
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
        setIsReceiving(true)
        setPeerConnected(true)
        setStatus('connected')
      }
    }

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
        handlePeerLeft()
      }
    }

    return peer
  }

  const handlePeerJoined = async () => {
    // We are the initiator — create offer
    const peer = createPeer(true)
    peerRef.current = peer

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track =>
        peer.addTrack(track, streamRef.current!)
      )
    }

    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)
    socketManager.socket?.emit('watch-party:signal', { signal: offer })
    setPeerConnected(true)
    setStatus('connected')
    toast.success('Partner joined the watch party!')
  }

  const handleSignal = async ({ signal }: any) => {
    if (!peerRef.current) {
      // We are the receiver — create peer on first signal
      const peer = createPeer(false)
      peerRef.current = peer
    }

    const peer = peerRef.current!

    if (signal.type === 'offer') {
      await peer.setRemoteDescription(new RTCSessionDescription(signal))
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      socketManager.socket?.emit('watch-party:signal', { signal: answer })
    } else if (signal.type === 'answer') {
      await peer.setRemoteDescription(new RTCSessionDescription(signal))
    } else if (signal.type === 'candidate') {
      await peer.addIceCandidate(new RTCIceCandidate(signal.candidate))
    }
  }

  const handlePeerLeft = () => {
    setPeerConnected(false)
    setIsReceiving(false)
    setStatus('idle')
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    peerRef.current?.close()
    peerRef.current = null
    toast.info('Partner disconnected from watch party')
  }

  const startSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true
      })
      streamRef.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Add tracks to existing peer if already connected
      if (peerRef.current) {
        stream.getTracks().forEach(track =>
          peerRef.current!.addTrack(track, stream)
        )
      }

      stream.getVideoTracks()[0].onended = stopSharing

      socketManager.socket?.emit('watch-party:join')
      setIsSharing(true)
      setStatus('waiting')
      toast.success('Screen sharing started — waiting for partner')
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        toast.error('Could not start screen share')
      }
    }
  }

  const stopSharing = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    socketManager.socket?.emit('watch-party:leave')
    setIsSharing(false)
    setStatus('idle')
    cleanup()
  }

  const joinParty = () => {
    socketManager.socket?.emit('watch-party:join')
    setStatus('waiting')
    toast.info('Joining watch party — waiting for partner to share screen')
  }

  const cleanup = () => {
    peerRef.current?.close()
    peerRef.current = null
    setPeerConnected(false)
    setIsReceiving(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Watch Together
        </h2>
        <p className="text-gray-600">Share your screen and watch movies or shows together in real-time</p>
      </div>

      {/* Status bar */}
      <div className={`flex items-center justify-center gap-2 py-3 px-6 rounded-2xl text-sm font-medium ${
        status === 'connected' ? 'bg-green-50 text-green-700 border border-green-200' :
        status === 'waiting'   ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                 'bg-gray-50 text-gray-600 border border-gray-200'
      }`}>
        {status === 'connected' ? <Wifi className="w-4 h-4" /> :
         status === 'waiting'   ? <Users className="w-4 h-4 animate-pulse" /> :
                                  <WifiOff className="w-4 h-4" />}
        {status === 'connected' ? 'Connected — watching together' :
         status === 'waiting'   ? 'Waiting for partner...' :
                                  'Not connected'}
      </div>

      {/* Video panels */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-video relative">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain"
          />
          {!isSharing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Monitor className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Your screen</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-3 text-xs text-white/60">You</div>
        </div>

        <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-video relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
          {!isReceiving && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Monitor className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Partner's screen</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-3 text-xs text-white/60">Partner</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {!isSharing ? (
          <button
            onClick={startSharing}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg transition-all"
          >
            <Monitor className="w-5 h-5" />
            Share My Screen
          </button>
        ) : (
          <button
            onClick={stopSharing}
            className="flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-red-600 transition-all"
          >
            <MonitorOff className="w-5 h-5" />
            Stop Sharing
          </button>
        )}

        {!isSharing && status === 'idle' && (
          <button
            onClick={joinParty}
            className="flex items-center justify-center gap-2 bg-white border-2 border-purple-300 text-purple-600 font-bold py-3 px-8 rounded-xl hover:bg-purple-50 transition-all"
          >
            <Users className="w-5 h-5" />
            Join Partner's Screen
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
