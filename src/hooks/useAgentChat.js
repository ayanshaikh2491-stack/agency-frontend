'use client'

import { useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { generateId } from '@/lib/utils'

export function useAgentChat(agentName = 'Agent') {
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const historyRef = useRef([])

  const sendMessage = useCallback(
    async (text) => {
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
        const response = await api.chatWithAgent(agentName, text, historyRef.current)
        const agentMessage = {
          id: response.id || generateId(),
          role: 'agent',
          content: response.message || response.content || response.text || '',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, agentMessage])
        historyRef.current = [...historyRef.current, { role: 'agent', content: agentMessage.content }]
      } catch {
        const agentMessage = {
          id: generateId(),
          role: 'agent',
          content: '⚠️ Backend unavailable. Agent chat is not connected.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, agentMessage])
        historyRef.current = [...historyRef.current, { role: 'agent', content: agentMessage.content }]
      } finally {
        setIsTyping(false)
      }
    },
    [agentName]
  )

  const clearConversation = useCallback(() => {
    setMessages([])
    historyRef.current = []
  }, [])

  const setInitialMessage = useCallback((text) => {
    const welcome = {
      id: 'welcome',
      role: 'agent',
      content: text,
      timestamp: new Date(),
    }
    setMessages([welcome])
  }, [])

  return {
    messages,
    isTyping,
    sendMessage,
    clearConversation,
    setInitialMessage,
  }
}
