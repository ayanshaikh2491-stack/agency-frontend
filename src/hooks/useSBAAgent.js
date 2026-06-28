'use client'

import { useState, useCallback, useRef } from 'react'
import { generateId } from '@/lib/utils'

export function useSBAAgent() {
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [agentStatus, setAgentStatus] = useState('unknown') // 'online' | 'offline' | 'unknown'
  const historyRef = useRef([])

  // Check SBA agent status
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/sba/status')
      const data = await res.json()
      if (data?.success && data?.sba?.status === 'running') {
        setAgentStatus('online')
        return true
      }
      setAgentStatus('offline')
      return false
    } catch {
      setAgentStatus('offline')
      return false
    }
  }, [])

  // Send message to SBA Agent
  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return

    const userMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    historyRef.current = [...historyRef.current, { role: 'user', content: text }]
    setIsTyping(true)

    try {
      // Route through backend proxy to OpenCode SBA Agent on EC2
      const response = await fetch('/api/sba/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: 'sba_web',
          history: historyRef.current.slice(-10), // last 10 messages for context
        }),
      })

      const data = await response.json()

      // Normalize response - handle multiple formats
      const agentText = (
        data?.response ||
        data?.message ||
        data?.content ||
        data?.text ||
        data?.data?.response ||
        data?.data?.content ||
        (data?.status === 'success' ? '✅ Request processed' : null) ||
        '⚠️ SBA Agent se koi response nahi mila'
      )

      const agentMessage = {
        id: generateId(),
        role: 'agent',
        content: agentText,
        timestamp: new Date(),
        agent: 'sba-agent',
        ai_brain: data?.ai_brain || 'OpenCode Agent',
        tokens: data?.tokens || 0,
      }

      setMessages((prev) => [...prev, agentMessage])
      historyRef.current = [...historyRef.current, { role: 'agent', content: agentMessage.content }]
    } catch (error) {
      // Fallback error message
      const agentMessage = {
        id: generateId(),
        role: 'agent',
        content: '⚠️ SBA Agent se connect nahi ho pa raha. Backend check karo.',
        timestamp: new Date(),
        agent: 'sba-agent',
        isError: true,
      }
      setMessages((prev) => [...prev, agentMessage])
    } finally {
      setIsTyping(false)
    }
  }, [])

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([])
    historyRef.current = []
  }, [])

  // Set initial welcome message
  const setInitialMessage = useCallback((text) => {
    const welcome = {
      id: 'welcome',
      role: 'agent',
      content: text,
      timestamp: new Date(),
      agent: 'sba-agent',
    }
    setMessages([welcome])
  }, [])

  // Get SBA stats
  const getStats = useCallback(async () => {
    try {
      const res = await fetch('/api/sba/stats')
      const data = await res.json()
      return data?.data || {}
    } catch {
      return {}
    }
  }, [])

  return {
    messages,
    isTyping,
    agentStatus,
    sendMessage,
    clearConversation,
    setInitialMessage,
    checkStatus,
    getStats,
  }
}
