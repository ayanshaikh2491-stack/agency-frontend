// src/app/admin/office/conversation.js
// Client-side conversation manager for agent proximity chat (AI Town style)

const CONVERSATION_DISTANCE = 80; // px
const INVITE_ACCEPT_PROBABILITY = 0.7;
const CONVERSATION_COOLDOWN = 30000; // ms
const AWKWARD_TIMEOUT = 8000; // ms
const MAX_CONVERSATION_DURATION = 25000; // ms
const MESSAGE_COOLDOWN = 3000; // ms
const MAX_MESSAGES = 5;

const CHAT_LINES = [
  "These pretzels are making me thirsty!",
  "I declare bankruptcy!",
  "That's what she said.",
  "Bears, beets, Battlestar Galactica.",
  "I'm not superstitious, but I am a little stitious.",
  "Identity theft is not a joke, Jim!",
  "Sometimes I'll start a sentence and I don't even know where it's going.",
  "Would I rather be feared or loved? Easy. Both.",
];

const THINKING_LINES = [
  "Hmm...",
  "Let me think...",
  "Interesting...",
  "I see...",
];

class ConversationManager {
  constructor(chars) {
    this.chars = chars; // Map<charId, {x, y, state, idle}>
    this.states = new Map(); // charId -> conversation state
    this.lastInvite = new Map(); // charId -> timestamp
    this.cooldowns = new Map(); // charId -> timestamp
    this.initStates();
  }

  initStates() {
    for (const [id] of this.chars) {
      this.states.set(id, {
        state: 'idle',
        partnerId: null,
        inviteTime: 0,
        chatStartTime: 0,
        messageCount: 0,
        lastMessageTime: 0,
        bubbleText: '',
        isThinking: false,
        isSpeaking: false,
      });
    }
  }

  getState(charId) {
    return this.states.get(charId) || {
      state: 'idle',
      partnerId: null,
      bubbleText: '',
      isThinking: false,
      isSpeaking: false,
    };
  }

  distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }

  findNearbyIdle(charId, char) {
    if (char.state !== 'idle' && char.state !== 'working') return null;
    if (this.cooldowns.get(charId) && Date.now() < this.cooldowns.get(charId)) return null;

    let best = null;
    let bestDist = Infinity;

    for (const [otherId, other] of this.chars) {
      if (otherId === charId) continue;
      if (other.state !== 'idle' && other.state !== 'working') continue;
      if (this.states.get(otherId)?.state === 'chatting') continue;

      const dist = this.distance(char, other);
      if (dist < CONVERSATION_DISTANCE && dist < bestDist) {
        bestDist = dist;
        best = otherId;
      }
    }
    return best;
  }

  midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  tick(dt, liveFloor) {
    const now = Date.now();

    // Update char positions from live floor (if available)
    // Note: actual positions come from Character components

    for (const [charId, char] of this.chars) {
      const state = this.getState(charId);

      // Handle conversation state machine
      switch (state.state) {
        case 'idle': {
          // Check if we can invite someone
          const nearby = this.findNearbyIdle(charId, char);
          if (nearby && (!this.lastInvite.get(charId) || now - this.lastInvite.get(charId) > CONVERSATION_COOLDOWN)) {
            // Send invite
            this.lastInvite.set(charId, now);
            state.state = 'inviting';
            state.partnerId = nearby;
            state.inviteTime = now;
            state.isThinking = true;
            state.bubbleText = "Hey...";
            console.log(`${charId} inviting ${nearby}`);
          }
          break;
        }

        case 'inviting': {
          const partnerState = this.getState(state.partnerId);
          if (partnerState.state === 'inviting' && partnerState.partnerId === charId) {
            // Mutual invite - accept
            if (Math.random() < INVITE_ACCEPT_PROBABILITY) {
              state.state = 'walking';
              partnerState.state = 'walking';
              state.chatStartTime = now;
              partnerState.chatStartTime = now;
              state.isThinking = false;
              state.bubbleText = '';
              partnerState.bubbleText = '';
              console.log(`${charId} and ${state.partnerId} accepted, walking to midpoint`);
            } else {
              // Rejected
              state.state = 'idle';
              state.partnerId = null;
              state.isThinking = false;
              state.bubbleText = '';
              this.cooldowns.set(charId, now + CONVERSATION_COOLDOWN);
            }
          } else if (now - state.inviteTime > INVITE_TIMEOUT || !this.chars.has(state.partnerId)) {
            // Timeout or partner gone
            state.state = 'idle';
            state.partnerId = null;
            state.isThinking = false;
            state.bubbleText = '';
          }
          break;
        }

        case 'walking': {
          // Character components handle walking to midpoint
          // When both arrive, transition to chatting
          const partner = this.chars.get(state.partnerId);
          if (!partner) {
            state.state = 'idle';
            state.partnerId = null;
            break;
          }
          const dist = this.distance(char, partner);
          if (dist < 20) { // Close enough to midpoint
            state.state = 'chatting';
            partner.state = 'chatting';
            state.chatStartTime = now;
            partner.chatStartTime = now;
            console.log(`${charId} and ${state.partnerId} started chatting`);
          }
          break;
        }

        case 'chatting': {
          state.isSpeaking = false;
          state.isThinking = false;

          // Check leave conditions
          if (now - state.chatStartTime > MAX_CONVERSATION_DURATION ||
              state.messageCount >= MAX_MESSAGES) {
            state.state = 'leaving';
            break;
          }

          // Alternate speaking
          const timeSinceLastMsg = now - state.lastMessageTime;
          if (timeSinceLastMsg > MESSAGE_COOLDOWN) {
            state.messageCount++;
            state.lastMessageTime = now;
            state.isSpeaking = true;
            state.bubbleText = CHAT_LINES[Math.floor(Math.random() * CHAT_LINES.length)];

            // Partner thinks
            const partnerState = this.getState(state.partnerId);
            if (partnerState) {
              partnerState.isThinking = true;
              partnerState.bubbleText = THINKING_LINES[Math.floor(Math.random() * THINKING_LINES.length)];
            }

            // Auto-clear speaking after short time
            setTimeout(() => {
              const s = this.getState(charId);
              if (s) { s.isSpeaking = false; s.bubbleText = ''; }
            }, 2000);
            setTimeout(() => {
              const ps = this.getState(state.partnerId);
              if (ps) { ps.isThinking = false; ps.bubbleText = ''; }
            }, 1500);
          }
          break;
        }

        case 'leaving': {
          state.state = 'idle';
          state.partnerId = null;
          state.messageCount = 0;
          state.isSpeaking = false;
          state.isThinking = false;
          state.bubbleText = '';
          this.cooldowns.set(charId, now + CONVERSATION_COOLDOWN);
          break;
        }
      }
    }
  }
}

let manager = null;

export function initConversations(chars) {
  manager = new ConversationManager(chars);
  return manager;
}

export function tickConversations(dt, liveFloor) {
  if (manager) manager.tick(dt, liveFloor);
}

export function getConversationState(charId) {
  return manager?.getState(charId) || {
    state: 'idle',
    partnerId: null,
    bubbleText: '',
    isThinking: false,
    isSpeaking: false,
  };
}