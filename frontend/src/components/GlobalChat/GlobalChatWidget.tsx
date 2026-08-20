import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../services/api';

interface ChatMsg {
  id?: number;
  role: 'user' | 'ai';
  content: string;
  created_at?: string;
}

interface SessionInfo {
  id: number;
  proposal_id: number | null;
  proposal_name: string | null;
  is_active: number;
  started_at: string | null;
  ended_at: string | null;
  message_count?: number;
}

interface ProposalOption {
  id: number;
  name: string;
}

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

const GlobalChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [proposals, setProposals] = useState<ProposalOption[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load proposals for the selector
  useEffect(() => {
    const loadProposals = async () => {
      try {
        const res = await api.get('/api/v1/ai/proposals-list');
        setProposals(res.data);
      } catch {
        // Fallback: load from proposals API
        try {
          const res = await api.get('/api/v1/proposals');
          setProposals((res.data.proposals || res.data || []).map((p: any) => ({ id: p.id, name: p.name })));
        } catch { /* ignore */ }
      }
    };
    loadProposals();
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(async () => {
      if (sessionId) {
        await api.post(`/api/v1/ai/chat/sessions/${sessionId}/end`).catch(() => {});
        try {
          const res = await api.post('/api/v1/ai/chat/sessions', { proposal_id: selectedProposal });
          setSessionId(res.data.id);
        } catch { /* ignore */ }
      }
      setMessages(prev => [
        ...prev,
        { role: 'ai', content: '— New session started (inactive for 10 min) —' },
        { role: 'ai', content: 'Hello! I\'m still here. How can I help you?' },
      ]);
    }, INACTIVITY_TIMEOUT);
  }, [sessionId, selectedProposal]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  // Start or resume a session when chat is opened
  const openChat = async () => {
    setIsOpen(true);
    if (!sessionId) {
      try {
        const sessRes = await api.get('/api/v1/ai/chat/sessions');
        setSessions(sessRes.data);
        const activeSession = sessRes.data.find((s: SessionInfo) => s.is_active === 1);
        if (activeSession) {
          const detailRes = await api.get(`/api/v1/ai/chat/sessions/${activeSession.id}`);
          setSessionId(activeSession.id);
          setSelectedProposal(activeSession.proposal_id);
          const restoredMsgs: ChatMsg[] = detailRes.data.messages.map((m: any) => ({
            id: m.id, role: m.role, content: m.content, created_at: m.created_at,
          }));
          setMessages([
            { role: 'ai', content: 'Hello! I am your AI Matchmaking Assistant. Feel free to ask me anything!' },
            ...restoredMsgs,
          ]);
        } else {
          const newRes = await api.post('/api/v1/ai/chat/sessions', { proposal_id: selectedProposal });
          setSessionId(newRes.data.id);
          setMessages([{ role: 'ai', content: 'Hello! I am your AI Matchmaking Assistant. Select a proposal or ask me anything!' }]);
        }
      } catch {
        // Session endpoints not available yet — work in fallback mode (no persistence)
        setSessionId(-1); // Use -1 as marker for fallback mode
        setMessages([{ role: 'ai', content: 'Hello! I am your AI Matchmaking Assistant. Select a proposal to get started!' }]);
      }
    }
    resetInactivityTimer();
  };

  // Change proposal for current session
  const handleProposalChange = async (proposalId: number | null) => {
    setSelectedProposal(proposalId);
    if (sessionId && sessionId > 0) {
      await api.post(`/api/v1/ai/chat/sessions/${sessionId}/end`).catch(() => {});
      try {
        const res = await api.post('/api/v1/ai/chat/sessions', { proposal_id: proposalId });
        setSessionId(res.data.id);
      } catch {
        setSessionId(-1);
      }
    }
    const proposalName = proposalId ? proposals.find(p => p.id === proposalId)?.name : null;
    setMessages([
      { role: 'ai', content: proposalName
        ? `Switched to proposal: ${proposalName}. Ask me anything about this profile!`
        : 'Switched to general chat. Ask me anything about matchmaking!'
      },
    ]);
    resetInactivityTimer();
  };

  // Load a past session
  const loadSession = async (sid: number) => {
    try {
      const res = await api.get(`/api/v1/ai/chat/sessions/${sid}`);
      setSessionId(sid);
      setSelectedProposal(res.data.proposal_id);
      const restoredMsgs: ChatMsg[] = res.data.messages.map((m: any) => ({
        id: m.id, role: m.role, content: m.content, created_at: m.created_at,
      }));
      setMessages([
        { role: 'ai', content: res.data.is_active ? 'Resumed session.' : 'Viewing past session (read-only).' },
        ...restoredMsgs,
      ]);
      setShowHistory(false);
    } catch { /* ignore */ }
  };

  // Send message
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // In fallback mode without a selected proposal, we can't do anything because the old API requires a proposal ID
    if (sessionId === -1 && !selectedProposal) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Please restart your backend server to enable General Chat, or select a Proposal from the list.' }]);
      return;
    }
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    resetInactivityTimer();

    try {
      if (sessionId && sessionId > 0) {
        // Persistent mode — use session endpoint
        const res = await api.post(`/api/v1/ai/chat/sessions/${sessionId}/messages`, { message: userMsg });
        setMessages(prev => [...prev, { role: 'ai', content: res.data.ai_message.content }]);
      } else if (selectedProposal) {
        // Fallback mode — use old direct chat endpoint
        const res = await api.post(`/api/v1/ai/proposals/${selectedProposal}/chat`, {
          message: userMsg,
          history: messages.filter(m => !m.content.startsWith('—')).slice(-10).map(m => ({ role: m.role, content: m.content })),
        });
        setMessages(prev => [...prev, { role: 'ai', content: res.data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: 'Please restart your backend server to enable General Chat. The new AI features are not loaded yet.' }]);
      }
    } catch (e: any) {
      const errMsg = e.response?.data?.detail || 'Sorry, I encountered an error. Please try again.';
      setMessages(prev => [...prev, { role: 'ai', content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // New chat
  const startNewChat = async () => {
    if (sessionId) {
      await api.post(`/api/v1/ai/chat/sessions/${sessionId}/end`).catch(() => {});
    }
    const res = await api.post('/api/v1/ai/chat/sessions', { proposal_id: selectedProposal });
    setSessionId(res.data.id);
    const proposalName = selectedProposal ? proposals.find(p => p.id === selectedProposal)?.name : null;
    setMessages([
      { role: 'ai', content: proposalName
        ? `New chat started for ${proposalName}. Ask me anything!`
        : 'New chat started. Select a proposal or ask me anything!'
      },
    ]);
    resetInactivityTimer();
  };

  if (!isOpen) {
    return (
      <button
        onClick={openChat}
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
          color: 'white', border: 'none', cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(108, 99, 255, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        title="AI Assistant"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      width: '420px', height: '640px',
      borderRadius: '16px', overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg, #fff)',
      border: '1px solid var(--border, #e5e4e7)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
        color: 'white',
        display: 'flex', alignItems: 'center', gap: '10px',
        flexShrink: 0,
      }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>AI Assistant</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>● Online</div>
        </div>
        <button onClick={startNewChat} title="New Chat" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
          + New
        </button>
        <button onClick={() => setShowHistory(!showHistory)} title="Chat History" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </button>
        <button onClick={() => setIsOpen(false)} title="Close" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      {/* Proposal Selector */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border, #e5e4e7)', background: 'var(--code-bg, #f4f3ec)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text, #6b6375)', whiteSpace: 'nowrap' }}>Proposal:</span>
        <select
          value={selectedProposal ?? ''}
          onChange={(e) => handleProposalChange(e.target.value ? Number(e.target.value) : null)}
          style={{
            flex: 1, padding: '6px 8px', borderRadius: '8px',
            border: '1px solid var(--border, #e5e4e7)',
            background: 'var(--bg, #fff)', color: 'var(--text-h, #08060d)',
            fontSize: '0.85rem', outline: 'none',
          }}
        >
          <option value="">General Chat</option>
          {proposals.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* History sidebar overlay */}
      {showHistory && (
        <div style={{
          position: 'absolute', top: '60px', left: 0, right: 0, bottom: 0,
          background: 'var(--bg, #fff)', zIndex: 10,
          overflowY: 'auto', padding: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, color: 'var(--text-h, #08060d)', fontSize: '1rem' }}>Chat History</h4>
            <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text, #6b6375)' }}>✕</button>
          </div>
          {sessions.length === 0 ? (
            <p style={{ color: 'var(--text, #6b6375)', fontSize: '0.85rem' }}>No past sessions yet.</p>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                onClick={() => loadSession(s.id)}
                style={{
                  padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                  border: '1px solid var(--border, #e5e4e7)', marginBottom: '8px',
                  background: s.id === sessionId ? 'rgba(108, 99, 255, 0.1)' : 'transparent',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(108, 99, 255, 0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = s.id === sessionId ? 'rgba(108, 99, 255, 0.1)' : 'transparent'}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-h, #08060d)' }}>
                  {s.proposal_name || 'General Chat'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text, #6b6375)', marginTop: '4px' }}>
                  {s.message_count || 0} messages • {s.started_at ? new Date(s.started_at).toLocaleDateString() : ''}
                  {s.is_active ? ' • Active' : ''}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Chat Area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '12px',
        background: 'var(--code-bg, #f4f3ec)',
      }}>
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          const isDivider = msg.content.startsWith('—');
          if (isDivider) {
            return (
              <div key={i} style={{ textAlign: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text, #6b6375)', background: 'var(--code-bg, #f4f3ec)', padding: '4px 12px', borderRadius: '12px', border: '1px solid var(--border, #e5e4e7)' }}>
                  {msg.content}
                </span>
              </div>
            );
          }
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: isUser ? 'linear-gradient(135deg, #6C63FF, #4F46E5)' : 'var(--bg, #fff)',
                color: isUser ? 'white' : 'var(--text-h, #08060d)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: isUser ? 'none' : '1px solid var(--border, #e5e4e7)',
                lineHeight: 1.5,
                fontSize: '0.9rem',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '10px 14px',
              borderRadius: '14px 14px 14px 4px',
              background: 'var(--bg, #fff)',
              border: '1px solid var(--border, #e5e4e7)',
              display: 'flex', gap: '4px', alignItems: 'center',
            }}>
              <span style={{ width: 6, height: 6, background: 'var(--text, #6b6375)', borderRadius: '50%', animation: 'globalchat-blink 1.4s infinite both' }}></span>
              <span style={{ width: 6, height: 6, background: 'var(--text, #6b6375)', borderRadius: '50%', animation: 'globalchat-blink 1.4s infinite both 0.2s' }}></span>
              <span style={{ width: 6, height: 6, background: 'var(--text, #6b6375)', borderRadius: '50%', animation: 'globalchat-blink 1.4s infinite both 0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border, #e5e4e7)', background: 'var(--bg, #fff)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            style={{
              flex: 1, resize: 'none',
              padding: '10px 14px', borderRadius: '12px',
              border: '1px solid var(--border, #e5e4e7)',
              background: 'var(--code-bg, #f4f3ec)',
              color: 'var(--text-h, #08060d)',
              minHeight: '20px', maxHeight: '100px',
              fontFamily: 'inherit', outline: 'none',
              fontSize: '0.9rem',
              transition: 'border-color 0.2s',
            }}
            rows={1}
            onFocus={(e) => e.target.style.borderColor = '#6C63FF'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border, #e5e4e7)'}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: input.trim() && !loading ? 'linear-gradient(135deg, #6C63FF, #4F46E5)' : 'var(--code-bg, #f4f3ec)',
              color: input.trim() && !loading ? 'white' : 'var(--text, #6b6375)',
              border: 'none',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes globalchat-blink {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

export default GlobalChatWidget;
