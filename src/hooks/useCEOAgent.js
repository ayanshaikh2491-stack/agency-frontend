'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { api } from '@/lib/api'
import { generateId } from '@/lib/utils'

function parseCommand(message) {
  const lower = message.toLowerCase().trim()
  return null
}

function extractEntities(message) {
  return {}
}

export function useCEOAgent() {
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [lastCommand, setLastCommand] = useState(null)
  const [lastEntities, setLastEntities] = useState({})
  const historyRef = useRef([])

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

    const command = parseCommand(text)
    const entities = extractEntities(text)
    setLastCommand(command)
    setLastEntities(entities)

    try {
      const response = await api.ceoChat(text, { command, entities, history: historyRef.current })
      // ── Hermes response normalization ──
      // Handles: { message }, { content }, { text }, { response }, { data.content }
      const agentText = (
        response.message ||
        response.content ||
        response.text ||
        response.response ||
        response.data?.content ||
        response.data?.message ||
        (response.success === false ? `⚠️ ${response.error || 'CEO se connect nahi ho pa raha'}` : '') ||
        ''
      )
      const agentMessage = {
        id: response.id || generateId(),
        role: 'agent',
        content: agentText,
        timestamp: new Date(),
        command: response.command || command,
        entities: response.entities || entities,
        structuredActions: response.actions || (command ? [{ action: command.action, entities }] : []),
      }
      setMessages((prev) => [...prev, agentMessage])
      historyRef.current = [...historyRef.current, { role: 'agent', content: agentMessage.content }]
    } catch {
      const agentMessage = {
        id: generateId(),
        role: 'agent',
        content: '⚠️ Backend unavailable. CEO Agent is not connected.',
        timestamp: new Date(),
        command: null,
        entities: {},
        structuredActions: [],
      }
      setMessages((prev) => [...prev, agentMessage])
      historyRef.current = [...historyRef.current, { role: 'agent', content: agentMessage.content }]
    } finally {
      setIsTyping(false)
    }
  }, [])

  const clearConversation = useCallback(() => {
    setMessages([])
    historyRef.current = []
    setLastCommand(null)
    setLastEntities({})
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

  const parsedCommands = useMemo(() => {
    return messages
      .filter((m) => m.role === 'agent' && m.command)
      .map((m) => ({
        command: m.command,
        entities: m.entities,
        actions: m.structuredActions || [],
        timestamp: m.timestamp,
      }))
  }, [messages])

  return {
    messages,
    isTyping,
    lastCommand,
    lastEntities,
    parsedCommands,
    sendMessage,
    clearConversation,
    setInitialMessage,
    parseCommand,
    extractEntities,
  }
}
