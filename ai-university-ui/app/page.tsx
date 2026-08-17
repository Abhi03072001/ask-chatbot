"use client";
import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

// ── Markdown renderer ────────────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="md-h1">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`([^`]+)`/g,     '<code class="md-code">$1</code>')
    .replace(/^\d+\. (.+)$/gm, '<li class="md-oli">$1</li>')
    .replace(/^[-*] (.+)$/gm,  '<li class="md-uli">$1</li>')
    .replace(/^---$/gm,        '<hr class="md-hr">')
    .replace(/\n\n/g, '</p><p class="md-p">')
    .replace(/\n/g, '<br/>');
  html = html
    .replace(/(<li class="md-oli">.*?<\/li>)(\s*<li class="md-oli">.*?<\/li>)*/gs,
      (m) => `<ol class="md-ol">${m}</ol>`)
    .replace(/(<li class="md-uli">.*?<\/li>)(\s*<li class="md-uli">.*?<\/li>)*/gs,
      (m) => `<ul class="md-ul">${m}</ul>`);
  html = `<p class="md-p">${html}</p>`
    .replace(/<p class="md-p"><\/p>/g, '')
    .replace(/<p class="md-p">(<h[123])/g, '$1')
    .replace(/(<\/h[123]>)<\/p>/g, '$1')
    .replace(/<p class="md-p">(<[uo]l)/g, '$1')
    .replace(/(<\/[uo]l>)<\/p>/g, '$1');
  return html;
}

function MarkdownContent({ content }: { content: string }) {
  return <div className="md-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />;
}

// ── Avatars ──────────────────────────────────────────────────────────────────
function UserAvatar() {
  return (
    <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: "#EEF2FF", border: "2px solid #C7D2FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4338CA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
  );
}

function AgentAvatar() {
  return (
    <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: "radial-gradient(circle at 38% 36%, #e9d5ff 0%, #818cf8 55%, #3730d4 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(99,60,220,0.25)" }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2"/>
        <path d="M9 11V7a3 3 0 0 1 6 0v4"/>
        <circle cx="12" cy="16" r="1" fill="white" stroke="none"/>
      </svg>
    </div>
  );
}

// ── Chat Widget ──────────────────────────────────────────────────────────────
function ChatWidget({ onClose }: { onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => {
    const el = textareaRef.current; if (!el) return;
    el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 100) + "px";
  }, [question]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim(); if (!trimmed || loading) return;
    const newMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages); setQuestion(""); setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: trimmed }) });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I couldn't connect to the server. Please try again." }]);
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(question); }
  };

  const canSend = question.trim().length > 0 && !loading;

  const QUICK = ["Help with research computing", "ICT Service Desk response times", "Clubs at Imperial", "ICT support services"];

  return (
    <div style={{
      position: "fixed", bottom: 90, right: 24, zIndex: 1000,
      width: 380, height: 580,
      background: "#FFFFFF",
      borderRadius: 20,
      boxShadow: "0 24px 64px rgba(0,0,0,0.16), 0 4px 16px rgba(99,60,220,0.12)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      animation: "slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards",
    }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #3730D4 0%, #6D28D9 100%)", padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "radial-gradient(circle at 38% 36%, #e9d5ff 0%, #818cf8 48%, #1e1b4b 88%)", boxShadow: "0 2px 10px rgba(0,0,0,0.3)", position: "relative", flexShrink: 0 }}>
          <div style={{ position: "absolute", width: 7, height: 7, background: "rgba(255,255,255,0.9)", borderRadius: "50%", top: 9, left: 11, boxShadow: "9px 6px 0 2px rgba(255,255,255,0.45)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF", margin: 0, lineHeight: 1.2 }}>ASK ChatBot</p>
          <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.75)", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} /> Online
          </p>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "background 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="chat-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 14px 8px" }}>
        {/* Welcome state */}
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "12px 0 16px" }}>
            <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, marginBottom: 14 }}>
              👋 Hi! I&apos;m here to help with Imperial College London ICT services, and more.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {QUICK.map((q) => (
                <button key={q} onClick={() => sendMessage(q)} style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, fontWeight: 500, color: "#4338CA", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#EDE9FE")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#F5F3FF")}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          return (
            <div key={i} className="fade-up" style={{ marginBottom: 16 }}>
              {/* Label */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, justifyContent: isUser ? "flex-end" : "flex-start" }}>
                {!isUser && <><AgentAvatar /><span style={{ fontSize: 10.5, fontWeight: 700, color: "#3730D4", letterSpacing: "0.08em", textTransform: "uppercase" }}>Agent</span></>}
                {isUser  && <><span style={{ fontSize: 10.5, fontWeight: 700, color: "#4338CA", letterSpacing: "0.08em", textTransform: "uppercase" }}>You</span><UserAvatar /></>}
              </div>
              {/* Bubble */}
              <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", paddingLeft: isUser ? 0 : 36, paddingRight: isUser ? 36 : 0 }}>
                <div style={{ maxWidth: isUser ? "78%" : "92%", padding: "10px 13px", borderRadius: isUser ? "16px 16px 3px 16px" : "16px 16px 16px 3px", background: isUser ? "#EEF2FF" : "#F8F8FC", border: isUser ? "1.5px solid #C7D2FE" : "1px solid #EBEBF5", wordBreak: "break-word" }}>
                  {isUser
                    ? <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "#1F2937", margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                    : <div className="md-body-sm"><MarkdownContent content={msg.content} /></div>
                  }
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing */}
        {loading && (
          <div className="fade-up" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <AgentAvatar /><span style={{ fontSize: 10.5, fontWeight: 700, color: "#3730D4", letterSpacing: "0.08em", textTransform: "uppercase" }}>Agent</span>
            </div>
            <div style={{ paddingLeft: 36 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "11px 14px", background: "#F8F8FC", border: "1px solid #EBEBF5", borderRadius: "16px 16px 16px 3px" }}>
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px 14px", borderTop: "1px solid #F0F0F8", flexShrink: 0 }}>
        <div style={{ background: "#F8F8FC", borderRadius: 14, border: "1.5px solid #E5E3F8", display: "flex", alignItems: "flex-end", padding: "8px 8px 8px 12px", gap: 8 }}>
          <textarea ref={textareaRef} className="ia-textarea-sm" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={handleKeyDown} placeholder="Message Imperial Assistant..." rows={1} />
          <button className="send-btn-sm" onClick={() => sendMessage(question)} disabled={!canSend} style={{ width: 34, height: 34, borderRadius: "50%", background: canSend ? "#3730D4" : "#C7C0F7", border: "none", cursor: canSend ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9l20-7z"/>
            </svg>
          </button>
        </div>
        <p style={{ fontSize: 10, color: "#B0AFBC", textAlign: "center", margin: "8px 0 0", letterSpacing: "0.04em" }}>
          Imperial Assistant v2.4 • Powered by Imperial College London
        </p>
      </div>
    </div>
  );
}

// ── Landing Page ─────────────────────────────────────────────────────────────
export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);
  const [pulse, setPulse] = useState(true);

  // Stop pulsing once user opens chat
  const handleOpen = () => { setChatOpen(true); setPulse(false); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { font-family: 'DM Sans', sans-serif; background: #F5F7FF; color: #1F2937; }

        /* Chat scroll */
        .chat-scroll::-webkit-scrollbar { width: 3px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #C7C0F7; border-radius: 4px; }

        /* Textarea */
        .ia-textarea-sm { border: none; background: transparent; resize: none; outline: none; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #111827; line-height: 1.5; width: 100%; min-height: 22px; max-height: 100px; overflow-y: auto; }
        .ia-textarea-sm::placeholder { color: #9CA3AF; }

        .send-btn-sm { transition: background 0.18s, transform 0.1s; }
        .send-btn-sm:hover:not(:disabled) { background: #2d22a8 !important; }
        .send-btn-sm:active:not(:disabled) { transform: scale(0.92); }

        /* Markdown inside chat widget */
        .md-body-sm .md-body { font-size: 13px; line-height: 1.65; color: #1F2937; }
        .md-body    { font-size: 13px; line-height: 1.65; color: #1F2937; }
        .md-body .md-h1 { font-size: 15px; font-weight: 700; color: #111827; margin: 10px 0 4px; }
        .md-body .md-h2 { font-size: 14px; font-weight: 700; color: #1F2937; margin: 10px 0 3px; border-bottom: 1px solid #E5E7EB; padding-bottom: 3px; }
        .md-body .md-h3 { font-size: 13px; font-weight: 700; color: #3730D4; margin: 8px 0 3px; }
        .md-body .md-p  { margin: 0 0 6px; }
        .md-body .md-p:last-child { margin-bottom: 0; }
        .md-body .md-ol { margin: 4px 0 8px 16px; padding: 0; list-style: decimal; }
        .md-body .md-ul { margin: 4px 0 8px 16px; padding: 0; list-style: disc; }
        .md-body .md-oli, .md-body .md-uli { margin-bottom: 4px; line-height: 1.55; }
        .md-body .md-code { background: #F3F4F6; border: 1px solid #E5E7EB; border-radius: 3px; padding: 1px 4px; font-size: 11.5px; color: #6D28D9; }
        .md-body .md-hr { border: none; border-top: 1px solid #E5E7EB; margin: 8px 0; }
        .md-body strong { font-weight: 600; color: #111827; }
        .md-body em { font-style: italic; color: #374151; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.22s ease forwards; }

        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }

        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        .dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #9CA3AF; animation: pulse 1.3s infinite; }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes ripple { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.2); opacity: 0; } }
        .ripple { animation: ripple 1.8s ease-out infinite; }

        /* Landing page */
        .nav-link { font-size: 14px; color: #4B5563; font-weight: 500; text-decoration: none; transition: color 0.15s; }
        .nav-link:hover { color: #3730D4; }
        .hero-card { background: white; border-radius: 20px; padding: 32px; border: 1px solid #E5E3F8; transition: transform 0.2s, box-shadow 0.2s; }
        .hero-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(99,60,220,0.10); }
        .btn-primary { background: #3730D4; color: white; border: none; border-radius: 12px; padding: 14px 28px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.18s, transform 0.12s; }
        .btn-primary:hover { background: #2d22a8; transform: translateY(-1px); }
        .btn-secondary { background: white; color: #3730D4; border: 1.5px solid #C7D2FE; border-radius: 12px; padding: 14px 28px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.18s; }
        .btn-secondary:hover { background: #EEF2FF; }
      `}</style>

      {/* ── Landing Page ── */}
      <div style={{ minHeight: "100vh", background: "#F5F7FF" }}>

        {/* Navbar */}
        <nav style={{ background: "white", borderBottom: "1px solid #E5E3F8", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "radial-gradient(circle at 38% 36%, #e9d5ff 0%, #818cf8 48%, #1e1b4b 88%)" }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#3730D4" }}>ASK ChatBot</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <a href="#" className="nav-link">Home</a>
            <a href="#" className="nav-link">Services</a>
            <a href="#" className="nav-link">About</a>
            <a href="#" className="nav-link">Contact</a>
          </div>
          <button className="btn-primary" style={{ padding: "9px 20px", fontSize: 13.5, borderRadius: 10 }} onClick={handleOpen}>
            Chat with Us
          </button>
        </nav>

        {/* Hero */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 32px 60px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#EEF2FF", borderRadius: 50, padding: "6px 16px", marginBottom: 24, border: "1px solid #C7D2FE" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ADE80" }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#4338CA" }}>AI-Powered Assistant Online</span>
          </div>

          <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 700, color: "#111827", letterSpacing: "-1px", lineHeight: 1.1, marginBottom: 20 }}>
            Your Imperial College<br />
            <span style={{ color: "#3730D4" }}>ICT Support Hub</span>
          </h1>

          <p style={{ fontSize: 18, color: "#6B7280", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.7 }}>
            Get instant answers about Imperial College London ICT services, research computing, clubs, and more — powered by AI.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={handleOpen}>Start Chatting →</button>
            <button className="btn-secondary">Learn More</button>
          </div>
        </div>

        {/* Feature cards */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {[
              { icon: "⚡", title: "Instant Answers", desc: "Get real-time responses to your ICT queries without waiting on hold.", color: "#FEF3C7", border: "#FDE68A" },
              { icon: "🔬", title: "Research Computing", desc: "Support for HPC clusters, software licences, and research tools.", color: "#F0FDF4", border: "#BBF7D0" },
              { icon: "🎓", title: "Student Services", desc: "Find clubs, societies, events, and campus resources instantly.", color: "#EEF2FF", border: "#C7D2FE" },
              { icon: "🛠", title: "ICT Service Desk", desc: "Check response times, raise tickets, and track support requests.", color: "#FDF2F8", border: "#FBCFE8" },
            ].map((card) => (
              <div key={card.title} className="hero-card" style={{ textAlign: "left" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: card.color, border: `1.5px solid ${card.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>
                  {card.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>{card.title}</h3>
                <p style={{ fontSize: 13.5, color: "#6B7280", lineHeight: 1.65 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ background: "#3730D4", padding: "40px 32px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, textAlign: "center" }}>
            {[["10,000+", "Students Helped"], ["< 2s", "Response Time"], ["24/7", "Availability"], ["98%", "Satisfaction"]].map(([num, label]) => (
              <div key={label}>
                <p style={{ fontSize: 32, fontWeight: 700, color: "white", margin: "0 0 4px" }}>{num}</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer style={{ background: "#1F2937", padding: "32px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            © 2026 Imperial Assistant &nbsp;•&nbsp; Imperial College London &nbsp;•&nbsp; Privacy Policy &nbsp;•&nbsp; Terms of Service
          </p>
        </footer>
      </div>

      {/* ── Floating Chat Button ── */}
      {!chatOpen && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999 }}>
          {/* Ripple ring */}
          {pulse && (
            <div className="ripple" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #3730D4", pointerEvents: "none" }} />
          )}
          <button
            onClick={handleOpen}
            style={{
              width: 58, height: 58, borderRadius: "50%",
              background: "linear-gradient(135deg, #3730D4 0%, #6D28D9 100%)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 24px rgba(55,48,212,0.40)",
              transition: "transform 0.18s, box-shadow 0.18s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(55,48,212,0.50)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(55,48,212,0.40)"; }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>

          {/* Tooltip */}
          <div style={{
            position: "absolute", bottom: "calc(100% + 10px)", right: 0,
            background: "#1F2937", color: "white", fontSize: 12, fontWeight: 500,
            borderRadius: 8, padding: "6px 12px", whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            animation: "fadeUp 0.3s ease forwards",
          }}>
            Chat with Imperial Assistant
            <div style={{ position: "absolute", bottom: -4, right: 22, width: 8, height: 8, background: "#1F2937", transform: "rotate(45deg)" }} />
          </div>
        </div>
      )}

      {/* ── Chat Widget ── */}
      {chatOpen && <ChatWidget onClose={() => setChatOpen(false)} />}

      {/* ── Re-open button when chat is closed after first open ── */}
      {chatOpen === false && pulse === false && (
        <button
          onClick={handleOpen}
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 999,
            width: 58, height: 58, borderRadius: "50%",
            background: "linear-gradient(135deg, #3730D4 0%, #6D28D9 100%)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(55,48,212,0.40)",
            transition: "transform 0.18s",
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      )}
    </>
  );
}