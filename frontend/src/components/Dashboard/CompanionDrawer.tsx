import { useState, useRef, useEffect } from 'react'
import { X, Send, Terminal, MessageSquare } from 'lucide-react'

/* ──────────────────────────────────────────────────────────
   CompanionDrawer.tsx — Slide-out Companion Chat & Log Drawer
   ────────────────────────────────────────────────────────── */

interface CompanionDrawerProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = 'chat' | 'log'

interface ChatMessage {
  id: string
  role: 'user' | 'companion'
  text: string
}

interface LogEntry {
  id: string
  level: 'system' | 'user' | 'error' | 'companion'
  text: string
  timestamp: string
}

const MOCK_CHAT: ChatMessage[] = [
  { id: '1', role: 'companion', text: 'Good morning! I noticed you have 3 critical tasks today. Shall we block out time for the pitch deck first?' },
  { id: '2', role: 'user', text: 'Yes, but I need to do the auth PR review before that.' },
  { id: '3', role: 'companion', text: 'Understood. I\'ll schedule the PR review for 10:00 AM and push the pitch deck block to 10:30 AM.' },
]

const MOCK_LOGS: LogEntry[] = [
  { id: '1', level: 'system', text: 'Workspace initialized. Synced 8 calendar events.', timestamp: '08:00:12' },
  { id: '2', level: 'user', text: 'User authenticated via Google OAuth.', timestamp: '08:01:05' },
  { id: '3', level: 'companion', text: 'Analyzed task backlog: 2 high-priority items at risk.', timestamp: '08:01:10' },
  { id: '4', level: 'system', text: 'Polling calendar... no new events.', timestamp: '08:15:00' },
  { id: '5', level: 'error', text: 'Failed to sync task t5 to external provider. Retrying...', timestamp: '08:15:02' },
]

export default function CompanionDrawer({ isOpen, onClose }: CompanionDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const [inputValue, setInputValue] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(MOCK_CHAT)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeTab === 'chat' && isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory, activeTab, isOpen])

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!inputValue.trim()) return
    
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue.trim(),
    }
    setChatHistory([...chatHistory, newMsg])
    setInputValue('')
    
    // Mock companion reply
    setTimeout(() => {
      setChatHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'companion',
        text: 'I\'ve noted that. Is there anything else you need adjusted?'
      }])
    }, 1000)
  }

  return (
    <>
      {/* Backdrop (mobile only, transparent on desktop if we want it to push content or overlay) */}
      <div 
        className={`
          fixed inset-0 z-30 bg-ink/5 backdrop-blur-[2px] lg:hidden transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`
          fixed top-0 right-0 bottom-0 z-40 w-full max-w-[360px] 
          bg-card-linen border-l border-paper-border
          transform transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1)
          flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-paper-border/60">
          <div className="flex bg-paper-border/30 rounded-none p-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-jakarta font-medium transition-colors
                ${activeTab === 'chat' ? 'bg-white text-ink border border-paper-border/30' : 'text-charcoal hover:text-ink'}
              `}
            >
              <MessageSquare size={14} />
              Companion
            </button>
            <button
              onClick={() => setActiveTab('log')}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-jakarta font-medium transition-colors
                ${activeTab === 'log' ? 'bg-white text-ink border border-paper-border/30' : 'text-charcoal hover:text-ink'}
              `}
            >
              <Terminal size={14} />
              System Log
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-charcoal/50 hover:text-ink hover:bg-paper-border/40 rounded-none transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-canvas">
          {activeTab === 'chat' ? (
            <div className="p-4 space-y-4">
              {chatHistory.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`
                      max-w-[85%] rounded-none px-4 py-3 border border-paper-border
                      ${msg.role === 'user' 
                        ? 'bg-ink text-white' 
                        : 'bg-white text-ink'}
                    `}
                  >
                    <p className={`text-sm leading-relaxed ${msg.role === 'user' ? 'font-jakarta' : 'font-lora'}`}>
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          ) : (
            <div className="p-4 font-mono text-xs space-y-2 bg-[#1E1E1E] min-h-full">
              {MOCK_LOGS.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-charcoal/50 flex-shrink-0">[{log.timestamp}]</span>
                  <span className={`
                    flex-1 break-words
                    ${log.level === 'system' ? 'text-horizon' : ''}
                    ${log.level === 'user' ? 'text-sage' : ''}
                    ${log.level === 'error' ? 'text-terracotta' : ''}
                    ${log.level === 'companion' ? 'text-cyan-400 font-lora italic' : ''}
                  `}>
                    {log.level.toUpperCase()}: {log.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area (Chat only) */}
        {activeTab === 'chat' && (
          <div className="flex-shrink-0 p-4 border-t border-paper-border/60 bg-white">
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="CMD_INPUT >"
                className="
                  w-full bg-canvas border border-paper-border rounded-none pl-4 pr-10 py-3
                  font-jakarta text-sm text-ink placeholder-charcoal/40
                  focus:outline-none focus:ring-1 focus:ring-horizon/30 focus:border-horizon
                "
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="
                  absolute right-2 top-1/2 -translate-y-1/2 p-1.5
                  text-ink hover:text-horizon disabled:text-charcoal/30 disabled:hover:text-charcoal/30
                  transition-colors
                "
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}
      </aside>
    </>
  )
}
