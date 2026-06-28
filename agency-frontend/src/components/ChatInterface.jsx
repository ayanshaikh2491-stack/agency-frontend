'use client';

import { useState, useRef, useEffect } from 'react';
import { callAgent, getAgentInfo } from '@/lib/agentService';

export function ChatInterface() {
  const [agent, setAgent] = useState('ceo');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const response = await callAgent(agent, userMessage);
      
      if (response.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: response.message 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: `Error: ${response.error || 'Unknown error'}`,
          isError: true
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: `Error: ${error.message}`,
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const agentInfo = getAgentInfo(agent);

  return (
    <div style={styles.container}>
      {/* Agent Selector */}
      <div style={styles.agentSelector}>
        {['ceo', 'sba'].map((type) => {
          const info = getAgentInfo(type);
          return (
            <button
              key={type}
              onClick={() => setAgent(type)}
              style={{
                ...styles.agentButton,
                ...(agent === type ? styles.agentButtonActive : {}),
                borderColor: info.color
              }}
            >
              <span style={styles.agentIcon}>{info.icon}</span>
              <span>{info.name}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Container */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 && (
          <div style={styles.welcome}>
            <div style={styles.welcomeIcon}>{agentInfo.icon}</div>
            <h2 style={styles.welcomeTitle}>{agentInfo.name}</h2>
            <p style={styles.welcomeText}>Start chatting with this agent...</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.message,
              ...(msg.role === 'user' ? styles.userMessage : {}),
              ...(msg.role === 'assistant' && msg.isError ? styles.errorMessage : {}),
              ...(msg.role === 'assistant' && !msg.isError ? styles.assistantMessage : {})
            }}
          >
            {msg.text}
          </div>
        ))}

        {loading && (
          <div style={styles.message}>
            <div style={styles.typingIndicator}>
              <span style={styles.typingDot}></span>
              <span style={styles.typingDot}></span>
              <span style={styles.typingDot}></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} style={styles.form}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${agentInfo.name}...`}
          disabled={loading}
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxHeight: '100vh',
    background: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
  },
  agentSelector: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    background: 'white',
    borderBottom: '1px solid #e0e0e0',
    flexWrap: 'wrap'
  },
  agentButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  agentButtonActive: {
    background: 'rgba(102, 126, 234, 0.1)',
    fontWeight: '600'
  },
  agentIcon: {
    fontSize: '20px'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  welcome: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    color: '#999'
  },
  welcomeIcon: {
    fontSize: '48px',
    marginBottom: '12px'
  },
  welcomeTitle: {
    margin: '0 0 8px',
    color: '#333',
    fontSize: '20px'
  },
  welcomeText: {
    margin: '0',
    color: '#666'
  },
  message: {
    maxWidth: '80%',
    padding: '12px 16px',
    borderRadius: '12px',
    wordWrap: 'break-word',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  userMessage: {
    alignSelf: 'flex-end',
    background: '#667eea',
    color: 'white'
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    background: 'white',
    border: '1px solid #e0e0e0',
    color: '#333'
  },
  errorMessage: {
    alignSelf: 'flex-start',
    background: '#fee',
    border: '1px solid #fcc',
    color: '#c33'
  },
  typingIndicator: {
    display: 'flex',
    gap: '4px'
  },
  typingDot: {
    width: '8px',
    height: '8px',
    background: '#999',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'pulse 1.4s infinite'
  },
  form: {
    display: 'flex',
    gap: '8px',
    padding: '16px',
    background: 'white',
    borderTop: '1px solid #e0e0e0'
  },
  input: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none'
  },
  button: {
    padding: '12px 24px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  }
};
