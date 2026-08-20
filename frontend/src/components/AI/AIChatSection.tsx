import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface AIChatSectionProps {
  proposalId: number;
}

const AIChatSection: React.FC<AIChatSectionProps> = ({ proposalId }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hello! I am your AI Matchmaking Assistant. Feel free to ask me any questions about this profile!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await api.post(`/api/v1/ai/proposals/${proposalId}/chat`, {
        message: userMsg,
        history: messages.slice(1) // omit the initial welcome message from history
      });
      setMessages([...newMessages, { role: 'ai', content: response.data.response }]);
    } catch (e: any) {
      setMessages([...newMessages, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
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

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '600px', overflow: 'hidden', padding: 0 }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', background: 'linear-gradient(to right, rgba(108, 99, 255, 0.1), transparent)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #6C63FF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>AI Assistant</h4>
          <span style={{ fontSize: '0.85rem', color: 'var(--success-color, #34C759)' }}>● Online</span>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-secondary)' }}>
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%',
                padding: '12px 16px',
                borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isUser ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: isUser ? 'white' : 'var(--text-primary)',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                border: isUser ? 'none' : '1px solid var(--border-color)',
                lineHeight: 1.5,
                fontSize: '0.95rem',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
             <div style={{
                padding: '12px 16px',
                borderRadius: '16px 16px 16px 4px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                display: 'flex', gap: '4px', alignItems: 'center'
              }}>
                <span className="dot-typing" style={{ width: 6, height: 6, background: 'var(--text-secondary)', borderRadius: '50%', animation: 'blink 1.4s infinite both' }}></span>
                <span className="dot-typing" style={{ width: 6, height: 6, background: 'var(--text-secondary)', borderRadius: '50%', animation: 'blink 1.4s infinite both 0.2s' }}></span>
                <span className="dot-typing" style={{ width: 6, height: 6, background: 'var(--text-secondary)', borderRadius: '50%', animation: 'blink 1.4s infinite both 0.4s' }}></span>
              </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this profile..."
            style={{
              flex: 1,
              resize: 'none',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              minHeight: '24px',
              maxHeight: '120px',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            rows={1}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: input.trim() && !loading ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              color: input.trim() && !loading ? 'white' : 'var(--text-muted)',
              border: 'none',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes blink {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

export default AIChatSection;
