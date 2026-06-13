'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { api } from '@/lib/api'
import { mockCEOAgentResponses, mockCEOCommands } from '@/lib/mockData'
import { generateId } from '@/lib/utils'

function getMockResponse(message) {
  const lower = message.toLowerCase()
  if (lower.includes('new client') || lower.includes('create client') || lower.includes('add client')) {
    return mockCEOAgentResponses.newClient[Math.floor(Math.random() * mockCEOAgentResponses.newClient.length)]
  }
  if (lower.includes('workflow') || lower.includes('campaign')) {
    return mockCEOAgentResponses.workflow[Math.floor(Math.random() * mockCEOAgentResponses.workflow.length)]
  }
  if (lower.includes('report')) {
    return mockCEOAgentResponses.report[Math.floor(Math.random() * mockCEOAgentResponses.report.length)]
  }
  if (lower.includes('status') || lower.includes('dashboard')) {
    return mockCEOAgentResponses.status[Math.floor(Math.random() * mockCEOAgentResponses.status.length)]
  }
  if (lower.includes('help') || lower.includes('what can you do') || lower.includes('command')) {
    return mockCEOAgentResponses.help[Math.floor(Math.random() * mockCEOAgentResponses.help.length)]
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('good')) {
    return mockCEOAgentResponses.greeting[Math.floor(Math.random() * mockCEOAgentResponses.greeting.length)]
  }
  return mockCEOAgentResponses.default[Math.floor(Math.random() * mockCEOAgentResponses.default.length)]
}

function parseCommand(message) {
  const lower = message.toLowerCase().trim()

  for (const [key, command] of Object.entries(mockCEOCommands)) {
    if (lower.includes(key)) {
      return command
    }
  }

  return null
}

function extractEntities(message) {
  const entities = {}

  const clientMatch = mockClients.find((c) =>
    message.toLowerCase().includes(c.company.toLowerCase())
  )
  if (clientMatch) {
    entities.client = clientMatch
    entities.clientName = clientMatch.company
  }

  const workflowMatch = message.toLowerCase().match(/(social media|blog|email|instagram|linkedin|content|workflow)/)
  if (workflowMatch) {
    entities.workflowType = workflowMatch[1]
  }

  const nameMatch = message.match(/(?:for|for client|called|named)\s+['"]?([A-Za-z0-9\s&]+?)['"]?(?:\s+in|\s+with|\s+for|\s*$)/i)
  if (nameMatch && !entities.clientName) {
    entities.extractedName = nameMatch[1].trim()
  }

  return entities
}

const mockClients = [
  { company: 'FitZone Gym' },
  { company: 'Urban Cafe' },
  { company: 'TechFlow SaaS' },
  { company: 'Bloom Beauty' },
  { company: 'PeakPerformance' },
  { company: 'GreenLeaf Organics' },
]

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
      const agentMessage = {
        id: response.id || generateId(),
        role: 'agent',
        content: response.message || response.content || response.text || '',
        timestamp: new Date(),
        command: response.command || command,
        entities: response.entities || entities,
        structuredActions: response.actions || (command ? [{ action: command.action, entities }] : []),
      }
      setMessages((prev) => [...prev, agentMessage])
      historyRef.current = [...historyRef.current, { role: 'agent', content: agentMessage.content }]
    } catch {
      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000))
      const mockContent = getMockResponse(text)
      const agentMessage = {
        id: generateId(),
        role: 'agent',
        content: mockContent,
        timestamp: new Date(),
        command,
        entities,
        structuredActions: command ? [{ action: command.action, entities }] : [],
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
