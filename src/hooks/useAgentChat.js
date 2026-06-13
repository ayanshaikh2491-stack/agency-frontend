'use client'

import { useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { mockAgentChatResponses } from '@/lib/mockData'
import { generateId } from '@/lib/utils'

const fallbackResponses = {
  contentwriter: [
    "I've drafted a blog post outline for your review. It covers the key topics with SEO-optimized headers and a compelling narrative arc.",
    "Here's a piece of web copy that speaks directly to your target audience. The tone is conversational yet authoritative.",
  ],
  default: [
    "I've analyzed the request. Let me prepare a comprehensive response for you.",
    "Got it! I'm pulling together the relevant information now.",
    "Excellent question. Here's what I recommend based on current data.",
    "I've processed your request. Here's a summary of what I found.",
    "Let me check with the relevant systems and get back to you.",
  ],
}

function getMockResponse(agentName) {
  const responses = mockAgentChatResponses[agentName] || fallbackResponses.default
  return responses[Math.floor(Math.random() * responses.length)]
}

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
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 700))
        const agentMessage = {
          id: generateId(),
          role: 'agent',
          content: getMockResponse(agentName),
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
