'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Bot, MessageSquare, Send, Repeat, Smartphone, Globe,
  Twitter, Instagram, Linkedin, Facebook, Youtube,
  Sparkles, Zap, CheckCircle2, Activity, BarChart3,
  Users, Clock, Settings as SettingsIcon, BookOpen,
  ShieldCheck, Hash, TrendingUp, PieChart,
  AlertCircle, Loader2, RefreshCw, ChevronDown,
  Plus, Search, Filter, Download, ExternalLink,
  Server, Play, Pause,
  GripVertical, Mic, MicOff, Square, FileText,
  Phone, Video, XCircle, Languages, ArrowRightLeft,
  Brain, Lightbulb,
} from 'lucide-react'
import PageShell from '@/components/PageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/* ─── Platform config ─── */
const PLATFORM_CONFIG = {
  facebook: { icon: Facebook, label: 'Facebook', color: '#1877F2' },
  instagram: { icon: Instagram, label: 'Instagram', color: '#E4405F' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: '#0A66C2' },
  twitter: { icon: Twitter, label: 'Twitter', color: '#1DA1F2' },
  tiktok: { icon: Smartphone, label: 'TikTok', color: '#FF004F' },
  youtube: { icon: Youtube, label: 'YouTube', color: '#FF0000' },
}

/* ─── Sample metrics ─── */
const SAMPLE_METRICS = [
  { label: 'Platforms', value: '6', desc: 'connected', icon: Globe, color: '#533afd' },
  { label: 'Total Reach', value: '245.3K', desc: 'this month', icon: TrendingUp, color: '#10b981' },
  { label: 'Engagements', value: '8,427', desc: '+12% vs last month', icon: Activity, color: '#f59e0b' },
  { label: 'Avg Response', value: '4.2m', desc: 'response time', icon: Clock, color: '#3b82f6' },
]

/* ─── Tabs ─── */
const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'pipeline', label: 'Pipeline', icon: Search },
  { id: 'meetings', label: 'Meetings', icon: TrendingUp },
  { id: 'finance', label: 'Finance', icon: Hash },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'platforms', label: 'Platforms', icon: Globe },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

/* ─── Metrics bar ─── */
function MetricsBar({ metrics }) {
  return (
    <div className="flex items-stretch gap-px bg-border/50">
      {metrics.map((m) => {
        const Icon = m.icon
        return (
          <div key={m.label} className="flex-1 flex items-center gap-2.5 px-4 py-2.5 bg-canvas min-w-0">
            <div className="size-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${m.color}12` }}>
              <Icon className="size-3.5" style={{ color: m.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold tabular-nums text-foreground leading-tight">{m.value}</p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight">{m.label} · {m.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MEETING COMPANION WIDGET — Live Meeting Notes
   ═══════════════════════════════════════════════ */
function MeetingCompanion({ meeting, onClose }) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [liveNotes, setLiveNotes] = useState(null)
  const [manualNotes, setManualNotes] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const recognitionRef = useRef(null)

  // Translation state
  const [inputText, setInputText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [translating, setTranslating] = useState(false)
  const [translateDirection, setTranslateDirection] = useState('en-hi') // en-hi or hi-en

  // Audio Translation state
  const [audioMode, setAudioMode] = useState(false) // Voice-to-voice translation
  const [listeningFor, setListeningFor] = useState('lead') // 'lead' or 'me'
  const [lastSpoken, setLastSpoken] = useState({ lead: '', me: '' })
  const audioRecognitionRef = useRef(null)

  // SEO Thinking state
  const [situationText, setSituationText] = useState('')
  const [sbaThinking, setSbaThinking] = useState(null)
  const [thinking, setThinking] = useState(false)

  /* ─── Translate (text) ─── */
  async function handleTranslate() {
    if (!inputText.trim()) return
    setTranslating(true)
    try {
      const res = await fetch('/api/seo/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, direction: translateDirection, context: `Meeting with ${meeting?.lead_name}` })
      })
      const d = await res.json()
      if (d?.success) setTranslatedText(d.data.translated)
    } catch (e) { console.error('Translation failed:', e) }
    setTranslating(false)
  }

  /* ─── Voice-to-Voice Translation ─── */
  function startAudioTranslation() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition nahi hai. Chrome browser use karo.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = listeningFor === 'lead' ? 'en-US' : 'en-IN'  // Lead = English, Me = Hinglish

    recognition.onresult = async (event) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' '
        }
      }

      if (finalTranscript.trim()) {
        // Update transcript display
        if (listeningFor === 'lead') {
          setLastSpoken(prev => ({ ...prev, lead: finalTranscript.trim() }))
          setTranscript(prev => prev + `[Lead]: ${finalTranscript}\n`)
        } else {
          setLastSpoken(prev => ({ ...prev, me: finalTranscript.trim() }))
          setTranscript(prev => prev + `[Me]: ${finalTranscript}\n`)
        }

        // Translate and speak
        const direction = listeningFor === 'lead' ? 'en-hi' : 'hi-en'
        try {
          const res = await fetch('/api/seo/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: finalTranscript.trim(), direction })
          })
          const d = await res.json()
          if (d?.success) {
            const translated = d.data.translated
            speakText(translated, direction === 'en-hi' ? 'hi-IN' : 'en-US')
          }
        } catch (e) { console.error('Voice translation failed:', e) }
      }
    }

    recognition.onerror = (e) => console.error('Audio recognition error:', e)
    recognition.start()
    audioRecognitionRef.current = recognition
    setAudioMode(true)
  }

  function stopAudioTranslation() {
    if (audioRecognitionRef.current) {
      audioRecognitionRef.current.stop()
      audioRecognitionRef.current = null
    }
    setAudioMode(false)
  }

  function speakText(text, lang = 'hi-IN') {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = 0.9  // Thoda slow for clarity
      utterance.pitch = 1
      window.speechSynthesis.speak(utterance)
    }
  }

  /* ─── SEO Think ─── */
  async function handleTranslate() {
    if (!inputText.trim()) return
    setTranslating(true)
    try {
      const res = await fetch('/api/seo/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, direction: translateDirection, context: `Meeting with ${meeting?.lead_name}` })
      })
      const d = await res.json()
      if (d?.success) setTranslatedText(d.data.translated)
    } catch (e) { console.error('Translation failed:', e) }
    setTranslating(false)
  }

  /* ─── SEO Think ─── */
  async function handleSBAThink() {
    if (!situationText.trim()) return
    setThinking(true)
    try {
      const res = await fetch('/api/seo/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: situationText, context: { meeting: meeting } })
      })
      const d = await res.json()
      if (d?.success) setSbaThinking(d.data.thinking)
    } catch (e) { console.error('Thinking failed:', e) }
    setThinking(false)
  }

  /* ─── Start/Stop Recording ─── */
  function toggleRecording() {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
      setIsRecording(false)
      analyzeTranscript()
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        alert('Speech recognition not supported. Use Chrome browser.')
        return
      }
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-IN'

      recognition.onresult = (event) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' '
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
          fetch(`/api/seo/meetings/${meeting.id}/transcript`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: finalTranscript.trim(), action: 'append' })
          }).catch(() => {})
        }
      }

      recognition.onerror = (e) => console.error('Speech error:', e)
      recognition.start()
      recognitionRef.current = recognition
      setIsRecording(true)
    }
  }

  /* ─── Analyze Transcript ─── */
  async function analyzeTranscript() {
    if (!transcript.trim()) return
    setAnalyzing(true)
    try {
      const res = await fetch(`/api/seo/meetings/${meeting.id}/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, action: 'analyze' })
      })
      const d = await res.json()
      if (d?.success) setLiveNotes(d.data.analysis)
    } catch (e) { console.error('Analysis failed:', e) }
    setAnalyzing(false)
  }

  /* ─── Finalize Meeting ─── */
  async function finalizeMeeting() {
    setAnalyzing(true)
    try {
      const res = await fetch(`/api/seo/meetings/${meeting.id}/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcript + '\n\nManual Notes:\n' + manualNotes, action: 'finalize' })
      })
      const d = await res.json()
      if (d?.success) {
        setLiveNotes(d.data.final_notes)
        alert('✅ Meeting notes finalized! Ready to send to CEO.')
      }
    } catch (e) { console.error('Finalize failed:', e) }
    setAnalyzing(false)
  }

  /* ─── Send to CEO ─── */
  async function sendToCEO() {
    try {
      const res = await fetch(`/api/seo/meetings/${meeting.id}/handoff-to-ceo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const d = await res.json()
      if (d?.success) {
        alert('🤝 SEO → CEO handoff complete! CEO will now create workspace.')
        onClose()
      } else {
        alert('Handoff failed: ' + (d?.message || 'Unknown error'))
      }
    } catch (e) { alert('Handoff failed: ' + e.message) }
  }

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop()
      if (audioRecognitionRef.current) audioRecognitionRef.current.stop()
      window.speechSynthesis?.cancel()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[90vw] max-w-5xl h-[85vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-gradient-to-r from-accent/5 to-transparent">
          <div className={`size-10 rounded-lg flex items-center justify-center ${isRecording ? 'bg-red-500/20 animate-pulse' : audioMode ? 'bg-blue-500/20 animate-pulse' : 'bg-accent/10'}`}>
            {audioMode ? <Languages className="size-5 text-blue-500" /> : isRecording ? <Mic className="size-5 text-red-500" /> : <Video className="size-5 text-accent" />}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Meeting Companion — {meeting?.lead_name || meeting?.title}</h3>
            <p className="text-[11px] text-muted-foreground">{meeting?.date} at {meeting?.time} · {meeting?.duration_minutes || 30}min</p>
          </div>
          <div className="flex items-center gap-2">
            {audioMode && (
              <span className="flex items-center gap-1 text-[11px] text-blue-400 font-medium">
                <span className="size-2 rounded-full bg-blue-400 animate-pulse" /> Audio Translator ON
              </span>
            )}
            {isRecording && (
              <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
                <span className="size-2 rounded-full bg-red-500 animate-pulse" /> Recording...
              </span>
            )}
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent/10"><XCircle className="size-4 text-muted-foreground" /></button>
          </div>
        </div>

        {/* 3-Column Layout */}
        <div className="flex-1 flex gap-0 min-h-0">
          {/* Left: Controls + Transcript */}
          <div className="w-[35%] border-r border-border flex flex-col">
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <button
                onClick={toggleRecording}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all ${isRecording ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-accent/10 border-accent/30 text-accent'}`}
              >
                {isRecording ? <><Square className="size-4" /> Stop</> : <><Mic className="size-4" /> Record</>}
              </button>
              <button onClick={finalizeMeeting} disabled={analyzing} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 disabled:opacity-50">
                {analyzing ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Live Transcript</h4>
              <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-mono bg-muted/30 rounded-lg p-3 min-h-[150px]">
                {transcript || <span className="text-muted-foreground/40">Recording se transcript aayega...</span>}
              </div>
            </div>
            <div className="border-t border-border p-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Manual Notes</h4>
              <textarea value={manualNotes} onChange={e => setManualNotes(e.target.value)} placeholder="Notes likho..." className="w-full h-16 text-xs bg-muted/30 rounded-lg p-2 border-none outline-none text-foreground placeholder:text-muted-foreground/40 resize-none" />
            </div>
          </div>

          {/* Middle: Audio Translator + SEO Think */}
          <div className="w-[30%] border-r border-border flex flex-col">
            {/* Audio Translator - Voice to Voice */}
            <div className="p-3 border-b border-border">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Languages className="size-3" /> 🎤 Audio Translator
              </h4>

              {/* Audio Mode Toggle */}
              <div className="flex items-center gap-1 mb-2">
                <button
                  onClick={() => { setListeningFor('lead'); if (!audioMode) startAudioTranslation(); else { stopAudioTranslation(); startAudioTranslation(); } }}
                  className={`flex-1 text-[10px] py-2 rounded flex items-center justify-center gap-1 transition-all ${listeningFor === 'lead' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-muted-foreground'}`}
                >
                  <span className={`size-1.5 rounded-full ${audioMode && listeningFor === 'lead' ? 'bg-blue-400 animate-pulse' : 'bg-muted-foreground'}`} />
                  Lead Bol Raha
                </button>
                <button
                  onClick={() => { setListeningFor('me'); if (!audioMode) startAudioTranslation(); else { stopAudioTranslation(); startAudioTranslation(); } }}
                  className={`flex-1 text-[10px] py-2 rounded flex items-center justify-center gap-1 transition-all ${listeningFor === 'me' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-muted-foreground'}`}
                >
                  <span className={`size-1.5 rounded-full ${audioMode && listeningFor === 'me' ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'}`} />
                  Mai Bol Raha
                </button>
              </div>

              {/* Start/Stop Audio Translation */}
              <button
                onClick={audioMode ? stopAudioTranslation : startAudioTranslation}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-all ${
                  audioMode
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    : 'bg-gradient-to-r from-accent to-accent/80 text-white hover:from-accent/90'
                }`}
              >
                {audioMode ? (
                  <><Square className="size-4" /> Translation Band Karo</>
                ) : (
                  <><Mic className="size-4" /> Audio Translation Start</>
                )}
              </button>

              {/* Live Translation Status */}
              {audioMode && (
                <div className="mt-2 p-2 bg-accent/5 rounded-lg border border-accent/20">
                  <div className="flex items-center gap-1.5 text-[10px] text-accent mb-1">
                    <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                    {listeningFor === 'lead' ? 'Lead ki sun raha...' : 'Tumhari sun raha...'}
                  </div>
                  <p className="text-[9px] text-muted-foreground">
                    {listeningFor === 'lead' ? 'Lead English bolega → SEO Hinglish mein bolega' : 'Tum Hinglish bologe → SEO English mein bolega'}
                  </p>
                </div>
              )}

              {/* Last Spoken */}
              {lastSpoken.lead && (
                <div className="mt-2 p-2 bg-blue-500/5 rounded-lg border border-blue-500/20">
                  <p className="text-[10px] text-blue-400 mb-1">🗣️ Lead (English):</p>
                  <p className="text-xs text-foreground">{lastSpoken.lead}</p>
                </div>
              )}
              {lastSpoken.me && (
                <div className="mt-2 p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                  <p className="text-[10px] text-emerald-400 mb-1">🎤 Me (Hinglish):</p>
                  <p className="text-xs text-foreground">{lastSpoken.me}</p>
                </div>
              )}
            </div>

            {/* SEO Think */}
            <div className="p-3 flex-1 overflow-y-auto">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Brain className="size-3" /> SEO Soche
              </h4>
              <textarea
                value={situationText}
                onChange={e => setSituationText(e.target.value)}
                placeholder="Situation batao, SEO sochega..."
                className="w-full h-16 text-xs bg-muted/30 rounded-lg p-2 border-none outline-none text-foreground placeholder:text-muted-foreground/40 resize-none mb-2"
              />
              <button
                onClick={handleSBAThink}
                disabled={thinking}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 disabled:opacity-50"
              >
                {thinking ? <Loader2 className="size-3 animate-spin" /> : <Lightbulb className="size-3" />}
                {thinking ? 'Soch raha...' : 'SEO se Poocho'}
              </button>
              {sbaThinking && (
                <div className="mt-2 space-y-2">
                  {sbaThinking.analysis && (
                    <div className="p-2 bg-amber-500/5 rounded-lg border border-amber-500/20">
                      <p className="text-[10px] text-amber-400 mb-1">🧠 Analysis:</p>
                      <p className="text-xs text-foreground">{sbaThinking.analysis}</p>
                    </div>
                  )}
                  {sbaThinking.decision && (
                    <div className="p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                      <p className="text-[10px] text-emerald-400 mb-1">✅ Decision:</p>
                      <p className="text-xs text-foreground">{sbaThinking.decision}</p>
                    </div>
                  )}
                  {sbaThinking.message_to_send && (
                    <div className="p-2 bg-accent/5 rounded-lg border border-accent/20">
                      <p className="text-[10px] text-accent mb-1">💬 Message:</p>
                      <p className="text-xs text-foreground">{sbaThinking.message_to_send}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: AI Analysis */}
          <div className="w-[35%] overflow-y-auto p-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">AI Notes</h4>
            {liveNotes ? (
              <div className="space-y-3">
                {liveNotes.client_needs && (
                  <div className="bg-card border border-border rounded-lg p-3">
                    <h5 className="text-xs font-semibold text-accent mb-1">🎯 Client Needs</h5>
                    <ul className="text-xs text-foreground space-y-1">{liveNotes.client_needs.map((n, i) => <li key={i}>• {n}</li>)}</ul>
                  </div>
                )}
                {liveNotes.pain_points && (
                  <div className="bg-card border border-border rounded-lg p-3">
                    <h5 className="text-xs font-semibold text-red-400 mb-1">⚠️ Pain Points</h5>
                    <ul className="text-xs text-foreground space-y-1">{liveNotes.pain_points.map((p, i) => <li key={i}>• {p}</li>)}</ul>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card border border-border rounded-lg p-3">
                    <h5 className="text-[10px] text-muted-foreground mb-1">💰 Budget</h5>
                    <p className="text-sm font-semibold text-foreground">{liveNotes.budget || 'Nahi discuss hua'}</p>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-3">
                    <h5 className="text-[10px] text-muted-foreground mb-1">📅 Timeline</h5>
                    <p className="text-sm font-semibold text-foreground">{liveNotes.timeline || 'Nahi discuss hua'}</p>
                  </div>
                </div>
                {liveNotes.agent_setup && (
                  <div className="bg-card border border-border rounded-lg p-3">
                    <h5 className="text-xs font-semibold text-emerald-400 mb-2">🤖 Agent Setup</h5>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {Object.entries(liveNotes.agent_setup).map(([agent, status]) => (
                        <div key={agent} className="flex items-center gap-1.5">
                          <span className={`size-1.5 rounded-full ${status?.toString().toLowerCase().includes('yes') ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                          <span className="text-muted-foreground capitalize">{agent.replace('_', ' ')}:</span>
                          <span className="text-foreground">{status?.toString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {liveNotes.action_items && (
                  <div className="bg-card border border-border rounded-lg p-3">
                    <h5 className="text-xs font-semibold text-amber-400 mb-1">✅ Action Items</h5>
                    <ul className="text-xs text-foreground space-y-1">{liveNotes.action_items.map((a, i) => <li key={i}>• {a}</li>)}</ul>
                  </div>
                )}
                <button onClick={sendToCEO} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg bg-gradient-to-r from-accent to-accent/80 text-white hover:from-accent/90 transition-all">
                  <Bot className="size-4" /> CEO ko Bhejo → Workspace Banao
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="size-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Recording start karo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   SEO Page
   ═══════════════════════════════════════════════ */
export default function SBAPage() {
  const [activeTab, setActiveTab] = useState('chat')
  const [chat, setChat] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [mode, setMode] = useState('ai')
  const [activeAgent, setActiveAgent] = useState('seo-agent')
  const [connectedPlatforms, setConnectedPlatforms] = useState([])
  const [pipelineData, setPipelineData] = useState(null)
  const [meetingsList, setMeetingsList] = useState([])
  const [financeData, setFinanceData] = useState(null)
  const [loadingTab, setLoadingTab] = useState(false)
  const [activeMeeting, setActiveMeeting] = useState(null)  // Meeting companion widget
  const chatEndRef = useRef(null)

  /* ─── Agent options (ONLY SEO) ─── */
  const AGENTS = [
    { id: 'seo-agent', name: '📊 SEO Agent (OpenCode)', desc: 'Lead qualification + Pipeline + Meetings + Finance' },
  ]

  /* ─── SEO Agent Status ─── */
  const [seoStatus, setSbaStatus] = useState('checking') // checking | online | offline

  /* ─── Fetch connected platforms ─── */
  useEffect(() => {
    fetch('/api/social/oauth/status')
      .then(r => r.json())
      .then(d => {
        const accts = d?.data?.accounts || {}
        setConnectedPlatforms(Object.keys(accts))
      })
      .catch(() => {})
  }, [])

  /* ─── Check SEO Agent status on mount ─── */
  useEffect(() => {
    fetch('/api/seo/status')
      .then(r => r.json())
      .then(d => {
        if (d?.success && d?.seo?.status === 'running') {
          setSbaStatus('online')
          // Add welcome message from SEO
          setChat([{
            role: 'assistant',
            content: `👋 **SEO Agent Online!**\n\nAI Brain: OpenClaw (open-source)\n\nMain hun aapka SEO Agent:\n• 🎯 Keyword research + tracking\n• 📊 Site audits + technical SEO\n• 📅 Rank monitoring + reports\n• 💰 Backlink analysis + strategy\n• 📧 Speed + Core Web Vitals\n• 🤖 Competitor analysis\n\nBatao, kya karna hai?`,
            agent: 'seo-agent',
          }])
        } else {
          setSbaStatus('offline')
        }
      })
      .catch(() => setSbaStatus('offline'))
  }, [])

  /* ─── Fetch tab data when switching tabs ─── */
  useEffect(() => {
    if (activeTab === 'pipeline') {
      setLoadingTab(true)
      fetch('/api/seo/pipeline')
        .then(r => r.json())
        .then(d => { setPipelineData(d?.data); setLoadingTab(false) })
        .catch(() => setLoadingTab(false))
    } else if (activeTab === 'meetings') {
      setLoadingTab(true)
      fetch('/api/seo/meetings')
        .then(r => r.json())
        .then(d => { setMeetingsList(d?.data?.meetings || []); setLoadingTab(false) })
        .catch(() => setLoadingTab(false))
    } else if (activeTab === 'finance') {
      setLoadingTab(true)
      fetch('/api/seo/finance')
        .then(r => r.json())
        .then(d => { setFinanceData(d?.data); setLoadingTab(false) })
        .catch(() => setLoadingTab(false))
    }
  }, [activeTab])

  /* ─── Auto-scroll chat ─── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  /* ─── Send message ─── */
  async function send() {
    if (!input.trim() || sending) return
    const msg = input.trim()
    setInput('')
    setChat(c => [...c, { role: 'user', content: msg }])
    setSending(true)

    try {
      if (mode === 'n8n') {
        const n8nUrl = (localStorage.getItem('n8n_url') || 'http://localhost:5678').replace(/\/+$/, '')
        const res = await fetch(`${n8nUrl}/webhook/seo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg, connected_platforms: connectedPlatforms }),
        })
        if (res.ok) {
          const data = await res.json()
          setChat(c => [...c, {
            role: 'assistant',
            content: data?.output || data?.response || '✅ Done via n8n',
          }])
        } else {
          throw new Error('n8n not available')
        }
      } else {
        // Route based on agent selection
        const agentId = activeAgent || 'ceo-agent'
        
        if (agentId === 'seo-agent') {
          // SEO agent goes through dedicated SEO API
          const res = await fetch('/api/seo/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, session_id: 'sba_web' }),
          })
          const d = await res.json()
          const reply = d?.response || d?.message || JSON.stringify(d)
          setChat(c => [...c, { role: 'assistant', content: reply, agent: 'seo-agent' }])
        } else {
          // Other agents go through CEO agent router
          const res = await fetch(`/api/agents/${agentId}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg, session_id: 'web_client' }),
          })
          const d = await res.json()
          const reply = d?.data?.content || d?.data?.response || d?.response || JSON.stringify(d)
          setChat(c => [...c, { role: 'assistant', content: reply, agent: agentId }])
        }
      }
    } catch (e) {
      try {
        // Fallback: always try CEO agent
        const agentId = activeAgent || 'ceo-agent'
        const res = await fetch(`/api/agents/${agentId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg, session_id: 'web_client' }),
        })
        const d = await res.json()
        const reply = d?.data?.content || d?.data?.response || d?.response || JSON.stringify(d)
        setChat(c => [...c, { role: 'assistant', content: reply + '\n\n_(fallback)_' }])
      } catch (e2) {
        setChat(c => [...c, { role: 'assistant', content: `❌ Error: ${e2.message}` }])
      }
    }
    setSending(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  /* ─── Chat tab ─── */
  const renderChat = () => (
    <div className="flex-1 flex gap-4 min-h-0">
      {/* Left — Chat */}
      <div className="flex-1 flex flex-col border border-border rounded-lg bg-card min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border shrink-0">
          <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Bot className="size-4 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground">📊 SEO Agent (OpenCode) — Search Optimization</div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${seoStatus === 'online' ? 'bg-emerald-500' : seoStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'}`} />
              {seoStatus === 'online' ? 'AI Online · OpenCode Zen' : seoStatus === 'offline' ? 'AI Offline' : 'Checking...'}
              {mode === 'n8n' && ' · n8n mode'}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {connectedPlatforms.map(p => {
              const pf = PLATFORM_CONFIG[p]
              const PFIcon = pf?.icon || Globe
              return (
                <span key={p} className="text-muted-foreground/50" title={pf?.label || p}>
                  <PFIcon className="size-3.5" />
                </span>
              )
            })}
            <div className="ml-2 toggle-group">
              <button
                className={`toggle-btn ${mode === 'ai' ? 'active' : ''}`}
                onClick={() => setMode('ai')}
              >AI</button>
              <button
                className={`toggle-btn ${mode === 'n8n' ? 'active' : ''}`}
                onClick={() => setMode('n8n')}
              >n8n</button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {chat.length === 0 && (
            <div className="text-center py-12">
              <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="size-6 text-accent" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">SEO Agent - Search Engine Optimization</p>
              <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
                I manage leads, pipeline, meetings, finance & campaigns.
                <br />
                AI-powered with OpenCode Zen (deepseek-v4-flash-free).
              </p>
              <div className="max-w-md mx-auto grid grid-cols-1 gap-1.5">
                {[
                  '🎯 "Qualify all my leads and show me hot ones (80+)"',
                  '📊 "Show me the full pipeline status"',
                  '📅 "Schedule a meeting with top lead tomorrow"',
                  '💰 "What is my total pipeline value?"',
                  '🤖 "Start the 24/7 autonomous lead processor"',
                ].map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(cmd); }}
                    className="text-left text-[11px] text-muted-foreground px-3 py-1.5 border border-border/60 rounded-md hover:border-accent/30 hover:bg-accent/5 transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chat.map((c, i) => (
            <div key={i} className={`flex gap-2.5 ${c.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {c.role === 'assistant' && (
                <div className="size-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="size-3.5 text-accent" />
                </div>
              )}
              <div className={
                c.role === 'user'
                  ? 'max-w-[85%] px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground whitespace-pre-wrap'
                  : 'max-w-[85%] px-3 py-2 text-sm rounded-lg bg-card border border-border text-foreground whitespace-pre-wrap'
              }>
                {c.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {mode === 'n8n' ? <Repeat className="size-3 animate-spin" /> : <Sparkles className="size-3 animate-pulse" />}
              {mode === 'n8n' ? 'Routing via n8n...' : 'Thinking...'}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 shrink-0">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'n8n' ? 'Tell SEO what to do (via n8n)...' : 'Ask SEO about leads, pipeline, meetings...'}
              className="flex-1 text-sm bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50"
            />
            <Button
              onClick={send}
              disabled={sending || !input.trim()}
              size="sm"
            >
              {sending
                ? <Loader2 className="size-3.5 animate-spin" />
                : <Send className="size-3.5" />
              }
              <span className="ml-1.5">{sending ? '' : 'Send'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Right — Insights Panel */}
      <div className="w-72 shrink-0 hidden lg:flex flex-col gap-3">
        {/* SEO Agent Status */}
        <div className="border border-border rounded-lg bg-card p-3.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            SEO Agent Status
          </h4>
          <div className="flex items-center gap-2 text-xs">
            <span className={`inline-block w-2 h-2 rounded-full ${seoStatus === 'online' ? 'bg-emerald-500' : seoStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'}`} />
            <span className="text-foreground">{seoStatus === 'online' ? 'Online' : seoStatus === 'offline' ? 'Offline' : 'Checking...'}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
            {seoStatus === 'online'
              ? 'AI Brain: OpenClaw (open-source)\nRuns on EC2 port 9001'
              : 'SEO Agent is not connected to backend'}
          </p>
        </div>

        {/* Pipeline Stages */}
        <div className="border border-border rounded-lg bg-card p-3.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            Pipeline Stages
          </h4>
          <div className="space-y-1.5">
            {['lead', 'contacted', 'meeting', 'proposal', 'negotiation', 'closed'].map((stage, i) => {
              const count = pipelineData?.pipeline?.[stage]?.length || 0
              const colors = ['#6b7280', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981']
              return (
                <div key={stage} className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: colors[i] }} />
                  <span className="text-xs text-muted-foreground flex-1 capitalize">{stage}</span>
                  <span className="text-xs font-medium text-foreground">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border border-border rounded-lg bg-card p-3.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            Quick Actions
          </h4>
          <div className="space-y-1">
            {[
              { label: 'Qualify All Leads', icon: Sparkles },
              { label: 'View Pipeline', icon: Search },
              { label: 'Schedule Meeting', icon: TrendingUp },
              { label: 'Start Auto Loop', icon: Play },
            ].map((action) => {
              const ActionIcon = action.icon
              return (
                <button
                  key={action.label}
                  onClick={() => {
                    if (action.label === 'Qualify All Leads') setInput('Qualify all my leads now')
                    else if (action.label === 'View Pipeline') setInput('Show me the full pipeline')
                    else if (action.label === 'Schedule Meeting') setInput('Schedule a meeting with the top lead')
                    else if (action.label === 'Start Auto Loop') setInput('Start the 24/7 autonomous lead processor')
                  }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:bg-accent/5 transition-colors rounded-sm"
                >
                  <ActionIcon className="size-3.5" />
                  {action.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Lead Scoring Info */}
        <div className="border border-border rounded-lg bg-card p-3.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            Lead Scoring
          </h4>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">80-100</span>
              <span className="text-foreground font-medium">🔥 Hot</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">50-79</span>
              <span className="text-foreground">Qualified</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">20-49</span>
              <span className="text-foreground">Nurture</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-gray-500" />
              <span className="text-muted-foreground">0-19</span>
              <span className="text-foreground">Junk</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  /* ─── Overview tab ─── */
  const renderOverview = () => (
    <div className="flex-1 overflow-y-auto space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {SAMPLE_METRICS.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="border border-border bg-card px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${m.color}12` }}>
                  <Icon className="size-4.5" style={{ color: m.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-semibold tabular-nums text-foreground leading-tight">{m.value}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{m.label}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-2">{m.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Performance summary */}
      <div className="border border-border bg-card">
        <div className="px-4 py-3 border-b border-border/60">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Platform Performance</h3>
        </div>
        <div className="divide-y divide-border/60">
          {Object.entries(PLATFORM_CONFIG).slice(0, 4).map(([key, pf]) => {
            const PFIcon = pf.icon
            const active = connectedPlatforms.includes(key)
            return (
              <div key={key} className="px-4 py-3 flex items-center gap-3">
                <PFIcon className="size-4 shrink-0" style={{ color: active ? pf.color : undefined }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground">{pf.label}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {active ? 'Connected · Active' : 'Not connected'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium tabular-nums text-foreground">
                    {active ? Math.floor(Math.random() * 50000 + 5000).toLocaleString() : '—'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">followers</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  /* ─── Agents tab ─── */
  const renderAgents = () => (
    <div className="flex-1 overflow-y-auto space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {[
          { name: 'Content Creator', desc: 'Creates posts, captions, blogs', status: 'running', color: '#533afd' },
          { name: 'Analytics Bot', desc: 'Tracks performance metrics', status: 'running', color: '#10b981' },
          { name: 'Social Manager', desc: 'Manages social media accounts', status: 'running', color: '#3b82f6' },
          { name: 'SEO Engine', desc: 'Optimizes content for search', status: 'running', color: '#f59e0b' },
          { name: 'Ads Runner', desc: 'Runs and monitors ad campaigns', status: 'running', color: '#ef4444' },
          { name: 'Sales Closer', desc: 'Converts leads to clients', status: 'idle', color: '#6b7280' },
        ].map((agent) => (
          <div key={agent.name} className="border border-border bg-card px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${agent.color}12` }}>
                <Bot className="size-4.5" style={{ color: agent.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{agent.name}</span>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${agent.status === 'running' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                </div>
                <div className="text-[11px] text-muted-foreground">{agent.desc}</div>
              </div>
              <Badge variant={agent.status === 'running' ? 'default' : 'secondary'} className="text-[10px]">
                {agent.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  /* ─── Platforms tab ─── */
  const renderPlatforms = () => (
    <div className="flex-1 overflow-y-auto space-y-4">
      <div className="border border-border bg-card">
        <div className="px-4 py-3 border-b border-border/60">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">All Platforms</h3>
        </div>
        <div className="divide-y divide-border/60">
          {Object.entries(PLATFORM_CONFIG).map(([key, pf]) => {
            const PFIcon = pf.icon
            const active = connectedPlatforms.includes(key)
            return (
              <div key={key} className="px-4 py-3.5 flex items-center gap-3.5">
                <div className="size-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${pf.color}10` }}>
                  <PFIcon className="size-5" style={{ color: active ? pf.color : undefined }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{pf.label}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {active ? 'Connected · Ready for tasks' : 'Not connected — click to set up'}
                  </div>
                </div>
                <Button size="sm" variant={active ? 'outline' : 'default'} className="text-[11px] h-7 px-3">
                  {active ? 'Manage' : 'Connect'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  /* ─── Settings tab ─── */
  const renderSettings = () => (
    <div className="flex-1 overflow-y-auto space-y-5 max-w-2xl">
      <div className="border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">SEO Mode</h3>
        <p className="text-xs text-muted-foreground mb-3">Choose how SEO processes your requests.</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode('ai')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md border transition-colors ${
              mode === 'ai'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-muted-foreground hover:border-border/80'
            }`}
          >
            <Sparkles className="size-4 mb-1 inline-block mr-1.5" />
            AI Mode
          </button>
          <button
            onClick={() => setMode('n8n')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md border transition-colors ${
              mode === 'n8n'
                ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                : 'border-border text-muted-foreground hover:border-border/80'
            }`}
          >
            <Zap className="size-4 mb-1 inline-block mr-1.5" />
            n8n Mode
          </button>
        </div>
      </div>

      <div className="border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">n8n Webhook URL</h3>
        <p className="text-xs text-muted-foreground mb-3">Set a custom n8n webhook endpoint.</p>
        <input
          defaultValue={typeof window !== 'undefined' ? localStorage.getItem('n8n_url') || 'http://localhost:5678' : ''}
          onChange={e => localStorage.setItem('n8n_url', e.target.value)}
          placeholder="http://localhost:5678"
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent transition-colors"
        />
      </div>
    </div>
  )

  /* ═══════════════════════════════════════════════
     Pipeline tab — Kanban from Sales Agent
     ═══════════════════════════════════════════════ */
  const renderPipeline = () => {
    if (loadingTab) return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading pipeline...
      </div>
    )

    if (!pipelineData) return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        No pipeline data yet
      </div>
    )

    const stageColors = {
      lead: { bg: 'bg-purple-500/10', dot: 'bg-purple-500', border: 'border-purple-500/30' },
      contacted: { bg: 'bg-blue-500/10', dot: 'bg-blue-500', border: 'border-blue-500/30' },
      meeting: { bg: 'bg-amber-500/10', dot: 'bg-amber-500', border: 'border-amber-500/30' },
      proposal: { bg: 'bg-orange-500/10', dot: 'bg-orange-500', border: 'border-orange-500/30' },
      negotiation: { bg: 'bg-red-500/10', dot: 'bg-red-500', border: 'border-red-500/30' },
      closed: { bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', border: 'border-emerald-500/30' },
    }

    return (
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 h-full min-w-0" style={{ minWidth: pipelineData?.stages?.length * 240 }}>
          {pipelineData?.stages?.map(stage => {
            const items = pipelineData?.pipeline?.[stage] || []
            const sc = stageColors[stage] || { bg: 'bg-gray-500/10', dot: 'bg-gray-500', border: 'border-gray-500/30' }
            return (
              <div key={stage} className="flex-1 min-w-[220px] max-w-[280px] flex flex-col border border-border rounded-lg bg-card/50">
                <div className={`px-3 py-2 border-b ${sc.border} flex items-center gap-2`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${sc.dot}`} />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stage}</span>
                  <span className="text-[10px] text-muted-foreground/60 ml-auto">{items.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {items.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/40 text-center py-6">Empty</p>
                  ) : items.map((item, i) => (
                    <div key={item.id || i} className="px-2.5 py-2 text-xs border border-border/60 rounded bg-card cursor-pointer hover:border-accent/30 transition-colors">
                      <div className="font-medium text-foreground">{item.business_name || item.name || 'Unknown'}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.email || item.industry || ''}</div>
                      {item.score && <div className="text-[10px] text-muted-foreground/60 mt-0.5">Score: {item.score}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     Meetings tab — TrendingUp from Sales Agent
     ═══════════════════════════════════════════════ */
  const renderMeetings = () => {
    if (loadingTab) return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading meetings...
      </div>
    )

    // If active meeting, show Meeting Companion
    if (activeMeeting) {
      return <MeetingCompanion meeting={activeMeeting} onClose={() => setActiveMeeting(null)} />
    }

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="border border-border rounded-lg bg-card">
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">All Meetings</h3>
            <Button size="sm" variant="outline" className="text-[11px] h-7">
              <Plus className="size-3 mr-1" /> Schedule
            </Button>
          </div>
          {meetingsList.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <TrendingUp className="size-8 mx-auto mb-3 text-muted-foreground/40" />
              <p>No meetings yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {meetingsList.map((m, i) => (
                <div key={m.id || i} className="px-4 py-3 flex items-center gap-3.5">
                  <div className="size-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="size-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{m.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {m.date} at {m.time}
                      {m.lead_name ? ` · ${m.lead_name}` : ''}
                      {m.duration_minutes ? ` · ${m.duration_minutes}min` : ''}
                    </div>
                  </div>
                  <Badge variant={m.status === 'scheduled' ? 'default' : 'secondary'} className="text-[10px]">{m.status}</Badge>
                  {m.status === 'scheduled' && (
                    <button
                      onClick={() => setActiveMeeting(m)}
                      className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                    >
                      <Video className="size-3" /> Join & Notes
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     Finance tab — Revenue & forecast from Sales Agent
     ═══════════════════════════════════════════════ */
  const renderFinance = () => {
    if (loadingTab) return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin mr-2" /> Loading finance...
      </div>
    )

    const fd = financeData || {}
    const deals = fd.deals || []
    const forecast = fd.revenue_forecast || []
    const pipelineValue = fd.pipeline_value || 0

    return (
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* KPI cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: 'Pipeline Value', value: `₹${(pipelineValue || 0).toLocaleString()}`, icon: Hash, color: '#10b981' },
            { label: 'Closed Deals', value: String(deals.length || 0), icon: CheckCircle2, color: '#3b82f6' },
            { label: 'Avg Deal Size', value: deals.length ? `₹${Math.round(pipelineValue / deals.length).toLocaleString()}` : '₹0', icon: TrendingUp, color: '#f59e0b' },
            { label: 'Forecast (6mo)', value: forecast.length ? `₹${(forecast.reduce((a, f) => a + f.projected, 0)).toLocaleString()}` : '₹0', icon: PieChart, color: '#533afd' },
          ].map((m) => (
            <div key={m.label} className="border border-border bg-card px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${m.color}12` }}>
                  <m.icon className="size-4.5" style={{ color: m.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-semibold tabular-nums text-foreground leading-tight">{m.value}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{m.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Closed deals */}
        <div className="border border-border rounded-lg bg-card">
          <div className="px-4 py-3 border-b border-border/60">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Closed Deals</h3>
          </div>
          {deals.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No deals closed yet</div>
          ) : (
            <div className="divide-y divide-border/60">
              {deals.map((d, i) => (
                <div key={d.id || i} className="px-4 py-3 flex items-center gap-3">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground">{d.lead_name}</div>
                    <div className="text-[10px] text-muted-foreground">{d.date?.slice(0, 10)}</div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-foreground">₹{d.amount?.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Forecast */}
        <div className="border border-border rounded-lg bg-card">
          <div className="px-4 py-3 border-b border-border/60">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue Forecast</h3>
          </div>
          {forecast.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Forecast generating...</div>
          ) : (
            <div className="divide-y divide-border/60">
              {forecast.map((f, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground">{f.month}</div>
                    <div className="text-[10px] text-muted-foreground">Confidence: {f.confidence}%</div>
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-emerald-500">₹{f.projected?.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════ */
  return (
    <PageShell>
      {/* Topbar */}
      <div className="topbar">
        <div className="flex items-center gap-3">
          <h2 className="flex items-center gap-2">
            <Bot className="size-5" />
            SEO Agent - Search Engine Optimization
          </h2>
          <Badge variant="outline" className="text-[10px] font-mono">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${mode === 'n8n' ? 'bg-blue-500' : 'bg-emerald-500'} mr-1.5`} />
            {mode === 'n8n' ? 'n8n' : 'AI'}
          </Badge>
        </div>
        <div className="topbar-actions">
          <Button size="sm" variant="ghost" className="text-[11px]">
            <RefreshCw className="size-3 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics bar */}
      <MetricsBar metrics={SAMPLE_METRICS} />

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-border/60">
        {TABS.map(tab => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <TabIcon className="size-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col p-4 min-h-0">
        {activeTab === 'chat' && renderChat()}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'pipeline' && renderPipeline()}
        {activeTab === 'meetings' && renderMeetings()}
        {activeTab === 'finance' && renderFinance()}
        {activeTab === 'agents' && renderAgents()}
        {activeTab === 'platforms' && renderPlatforms()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </PageShell>
  )
}
