import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Monitor, MonitorOff, Users, Wifi, WifiOff, Copy, Check } from 'lucide-react'
import { socketManager } from '../lib/socket'

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

export function WatchParty() {
  const [isSharing, setIsSharing]     = useState(false)
  const [isReceiving, setIsReceiving] = useState(false)
  const [status, setStatus]           = useState<'idle' | 'waiting' | 'connected'>('idle')
  const [hostId, setHostId]           = useState<string>('')      // sharer gets this back
  const [joinCode, setJoinCode]       = useState<string>('')      // joiner types this in
  const [copied, setCopied]           = useState(false)

  const localVideoRef  = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerRef        = useRef<RTCPeerConnection | null>(null)
  const streamRef      = useRef<MediaStream | null>(null)

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
      console.log('[webrtc] ontrack fired', e.streams)
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]
      setIsReceiving(true)
      setStatus('connected')
    }

    peer.onconnectionstatechange = () => {
      console.log('[webrtc] connectionState', peer.connectionState)
      if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
        handlePeerLeft()
      }
    }

    return peer
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePeerJoined = useCallback(async () => {
    console.log('[watch] peer-joined received, streamRef=', streamRef.current)
    const peer = createPeer()
    peerRef.current = peer

    streamRef.current?.getTracks().forEach(track => peer.addTrack(track, streamRef.current!))

    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)
    socketManager.socket?.emit('watch-party:signal', { signal: offer })
    setStatus('connected')
    toast.success('Partner joined!')
  }, [createPeer])

  const handleSignal = useCallback(async ({ signal }: any) => {
    console.log('[watch] signal received', signal.type ?? 'candidate')
    if (!peerRef.current) peerRef.current = createPeer()
    const peer = peerRef.current

    if (signal.type === 'offer') {
      streamRef.current?.getTracks().forEach(track => peer.addTrack(track, streamRef.current!))
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
    setStatus(prev => prev !== 'idle' ? 'idle' : prev)
    toast.info('Partner disconnected')
  }, [])

  useEffect(() => {
    const attach = () => {
      const s = socketManager.socket
      if (!s) return
      s.off('watch-party:peer-joined', handlePeerJoined)
      s.off('watch-party:signal',      handleSignal)
      s.off('watch-party:peer-left',   handlePeerLeft)
      s.on('watch-party:peer-joined',  handlePeerJoined)
      s.on('watch-party:signal',       handleSignal)
      s.on('watch-party:peer-left',    handlePeerLeft)
    }
    attach()
    socketManager.socket?.on('connect', attach)
    return () => {
      const s = socketManager.socket
      s?.off('connect', attach)
      s?.off('watch-party:peer-joined', handlePeerJoined)
      s?.off('watch-party:signal',      handleSignal)
      s?.off('watch-party:peer-left',   handlePeerLeft)
      peerRef.current?.close()
    }
  }, [handlePeerJoined, handleSignal, handlePeerLeft])

  // Separate stable effect for room-ready so setHostId is never stale
  useEffect(() => {
    const s = socketManager.socket
    if (!s) return
    const onRoomReady = ({ hostId: id }: { hostId: string }) => {
      console.log('[watch] room-ready, hostId=', id)
      setHostId(id)
    }
    s.on('watch-party:room-ready', onRoomReady)
    return () => { s.off('watch-party:room-ready', onRoomReady) }
  }, [])

  const startSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true })
      streamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      stream.getVideoTracks()[0].onended = stopSharing

      socketManager.socket?.emit('watch-party:join', {})   // no hostId = I am the host

      // Decode userId from JWT immediately — no need to wait for socket event
      const token = sessionStorage.getItem('auth_token')
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          setHostId(payload.userId)
        } catch {}
      }

      setIsSharing(true)
      setStatus('waiting')
      toast.success('Screen sharing started — share the code with your partner')
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
    setHostId('')
    setStatus('idle')
  }

  const joinParty = () => {
    const code = joinCode.trim()
    if (!code) { toast.error('Enter the code your partner shared'); return }
    socketManager.socket?.emit('watch-party:join', { hostId: code })
    setStatus('waiting')
    toast.info("Joining partner's room…")
  }

  const copyCode = () => {
    navigator.clipboard.writeText(hostId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

      {/* Share code (shown to sharer after screen picked) */}
      {hostId && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-purple-700 font-medium mb-2">Share this code with your partner</p>
          <div className="flex items-center justify-center gap-2">
            <code className="bg-white border border-purple-200 rounded-lg px-4 py-2 text-lg font-mono text-purple-800 select-all">
              {hostId}
            </code>
            <button onClick={copyCode} className="p-2 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 transition-all">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Video panels */}
      <div className="grid md:grid-cols-2 gap-4">
        {([
          { ref: localVideoRef,  muted: true,  active: isSharing,   label: 'You' },
          { ref: remoteVideoRef, muted: false, active: isReceiving, label: 'Partner' }
        ] as const).map(({ ref, muted, active, label }) => (
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
      </div>

      {/* Join panel — shown when not sharing */}
      {!isSharing && status !== 'connected' && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <p className="text-sm font-medium text-gray-700 mb-3 text-center">Join your partner's screen</p>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && joinParty()}
              placeholder="Paste partner's code here"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <button onClick={joinParty}
              className="flex items-center gap-2 bg-purple-500 text-white font-bold py-2 px-5 rounded-xl hover:bg-purple-600 transition-all text-sm">
              <Users className="w-4 h-4" /> Join
            </button>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 border border-pink-100 text-sm text-gray-600">
        <p className="font-medium text-gray-700 mb-1">How it works</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>One partner clicks <strong>Share My Screen</strong> and picks a window or tab</li>
          <li>Copy the code that appears and send it to your partner</li>
          <li>Partner pastes the code and clicks <strong>Join</strong></li>
          <li>Video is sent peer-to-peer — your server never sees the content</li>
        </ul>
      </div>
    </div>
  )
}
