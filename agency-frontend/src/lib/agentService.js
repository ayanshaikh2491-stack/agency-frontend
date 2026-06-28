// lib/agentService.js
export const callAgent = async (agentType, message) => {
  const endpoint = agentType === 'ceo' 
    ? '/api/ceo/chat-hermes'
    : '/api/sba/chat';

  const payload = {
    message: message,
    session_id: 'web_user',
    workspace_id: 'default'
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    return {
      success: data.success !== false && data.status === 'success',
      message: data.message || data.response || data.content || 'No response',
      error: data.error || null
    };
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error.message}`,
      error: error.message
    };
  }
};

export const getAgentInfo = (agentType) => {
  const agents = {
    ceo: {
      name: 'CEO Agent (Hermes)',
      icon: '👔',
      color: '#667eea'
    },
    sba: {
      name: 'SBA Agent (OpenCode)',
      icon: '📊',
      color: '#764ba2'
    }
  };
  return agents[agentType] || agents.ceo;
};
