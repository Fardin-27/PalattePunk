// src/pages/Messages.js
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  listConversations,
  sendMessage,          // fallback path
  openOrCreateDM,
  searchUsers,          // used by the search box
  listMessages,         // fetch messages
} from '../utils/msgApi';
import { makeSocket } from '../socket';

function getMyIdFromJWT() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || payload._id || payload.userId || null;
  } catch {
    return null;
  }
}

export default function Messages() {
  const [convos, setConvos] = useState([]);
  const [active, setActive] = useState(null);     // active conversation _id
  const [msgs, setMsgs] = useState([]);           // messages for the active convo only
  const [text, setText] = useState('');
  const [err, setErr] = useState('');

  // search UI
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState([]);
  const searchDebounce = useRef(null);

  // refs
  const sinceRef   = useRef(null);                // last timestamp fetched for *current* convo
  const sockRef    = useRef(null);
  const activeRef  = useRef(null);                // mirror active for socket handler
  const myIdRef    = useRef(getMyIdFromJWT());
  const msgIdsRef  = useRef(new Set());          // dedupe for *current* convo only

  // scrolling
  const listRef = useRef(null);
  const scrollToBottom = () => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  };

  // ---- derived state ----
  const activeConvo = useMemo(
    () => convos.find(c => String(c._id) === String(active)) || null,
    [convos, active]
  );

  const otherNames = useMemo(() => {
    const parts = activeConvo?.participants || [];
    const mine = myIdRef.current;
    const list = parts.filter(p => !mine || String(p._id) !== String(mine));
    const names = (list.length ? list : parts).map(p => p.name).filter(Boolean);
    return names.join(', ') || 'Unknown';
  }, [activeConvo]);

  // ---- data helpers ----
  const loadConvos = async () => {
    try {
      setErr('');
      const r = await listConversations();
      setConvos(r.data || []);
      if (!active && r.data?.[0]?._id) {
        select(r.data[0]._id);
      }
    } catch {
      setErr('Failed to load conversations');
    }
  };

  // switch conversations: reset everything that is conversation-scoped
  const select = async (id) => {
    if (!id) return;
    setActive(id);
    activeRef.current = id;

    // 🔒 reset per-conversation state so nothing carries over
    sinceRef.current = null;
    msgIdsRef.current = new Set();
    setMsgs([]);                         // hard reset UI immediately

    await loadMsgs(id, true);
    scrollToBottom();
  };

  // append with dedupe + maintain sinceRef for polling
  const appendMessages = (arr, replace = false) => {
    if (!Array.isArray(arr) || !arr.length) return;
    const fresh = [];
    for (const m of arr) {
      const id = String(m._id || '');
      if (!id || msgIdsRef.current.has(id)) continue;
      msgIdsRef.current.add(id);
      fresh.push(m);
      // bump since to the newest
      if (!sinceRef.current || new Date(m.createdAt) > new Date(sinceRef.current)) {
        sinceRef.current = m.createdAt;
      }
    }
    if (fresh.length) {
      setMsgs(prev => (replace ? fresh : [...prev, ...fresh]));
    }
  };

  const loadMsgs = async (id, full = false) => {
    try {
      const r = await listMessages(id, full ? undefined : sinceRef.current);
      const arr = r.data || [];
      appendMessages(arr, full);
    } catch {
      setErr('Failed to load messages');
    }
  };

  // ---- effects ----
  useEffect(() => { loadConvos(); }, []);

  // socket
  useEffect(() => {
    const s = makeSocket();
    sockRef.current = s;

    s.on('msg:new', (msg) => {
      // only for currently open conversation
      if (String(msg.conversation) !== String(activeRef.current)) return;
      // de-dupe; also prevents sender seeing 2-3 copies (ACK + echo + poll)
      if (msgIdsRef.current.has(String(msg._id))) return;
      appendMessages([msg]);
      scrollToBottom();
    });

    return () => {
      s.off('msg:new');
      s.close();
    };
  }, []);

  // keep mirror for socket handler
  useEffect(() => { activeRef.current = active || null; }, [active]);

  // polling fallback (dedupe ensures no duplicates)
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => loadMsgs(active, false), 5000);
    return () => clearInterval(t);
  }, [active]);

  // ---- send ----
  const onSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !active) return;

    // Prefer socket; REST fallback
    if (sockRef.current) {
      sockRef.current.emit(
        'msg:send',
        { conversationId: active, text: text.trim() },
        (ack) => {
          if (ack?.ok && ack.data) {
            // optimistic but still deduped
            appendMessages([ack.data]);
            setText('');
            scrollToBottom();
          } else {
            setErr(ack?.error || 'Failed to send via socket');
          }
        }
      );
      return;
    }

    try {
      const r = await sendMessage(active, text.trim());
      appendMessages([r.data]);
      setText('');
      scrollToBottom();
    } catch {
      setErr('Failed to send message');
    }
  };

  // ---- search users & start chat ----
  const runSearch = async (q) => {
    const term = String(q || '').trim();
    if (!term) { setSearchRes([]); return; }
    try {
      const r = await searchUsers(term);
      const arr = Array.isArray(r.data) ? r.data : [];
      const mine = myIdRef.current;
      const filtered = arr.filter(u => !mine || String(u._id) !== String(mine));
      setSearchRes(filtered.slice(0, 8));
    } catch {
      setSearchRes([]);
    }
  };
  const onSearchChange = (q) => {
    setSearchQ(q);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => runSearch(q), 300);
  };
  const onSearchClick = () => runSearch(searchQ);
  const onSearchKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); runSearch(searchQ); } };

  const startChatWith = async (user) => {
    try {
      const dm = await openOrCreateDM(user._id);
      const dmId = dm?.data?._id || dm?._id;
      await loadConvos();            // refresh list so it appears
      if (dmId) await select(dmId);  // 🔁 switch; resets state for that convo
      setSearchQ('');
      setSearchRes([]);
    } catch {
      setErr('Could not start chat.');
    }
  };

  // small helper for avatars
  const initials = (name = '') => name.trim().split(/\s+/).slice(0,2).map(s => s[0]?.toUpperCase() || '').join('');

  // ---- UI ----
  return (
    <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:20, padding:20 }}>
      {/* LEFT: list + search */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden', background:'#fff' }}>
        <div style={{ padding:14, borderBottom:'1px solid #f1f5f9', fontWeight:700, fontSize:16 }}>Messages</div>

        {/* search box + button */}
        <div style={{ padding:12, borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ display:'flex', gap:8 }}>
            <input
              value={searchQ}
              onChange={e => onSearchChange(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Start chat: search name or email…"
              style={{ flex:1, border:'1px solid #e5e7eb', borderRadius:10, padding:'10px 12px', outline:'none' }}
            />
            <button className="btn" onClick={onSearchClick} style={{ borderRadius:10, padding:'10px 14px' }}>Search</button>
          </div>

          {!!searchRes.length && (
            <div style={{ marginTop:10, border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
              {searchRes.map(u => (
                <button
                  key={u._id}
                  onClick={() => startChatWith(u)}
                  style={{
                    width:'100%', textAlign:'left', padding:10,
                    borderBottom:'1px solid #f3f4f6', background:'#fff', display:'flex', alignItems:'center', gap:10
                  }}
                >
                  <div style={{
                    width:28, height:28, borderRadius:9999, background:'#eef2ff',
                    display:'grid', placeItems:'center', fontSize:12, fontWeight:700, color:'#3730a3'
                  }}>
                    {initials(u.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight:600, lineHeight:1.2 }}>{u.name}</div>
                    <div style={{ color:'#6b7280', fontSize:12 }}>{u.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* conversation list */}
        <div style={{ display:'grid', maxHeight: 'calc(100vh - 260px)', overflowY:'auto' }}>
          {convos.map(c => (
            <button
              key={c._id}
              onClick={() => select(c._id)}
              style={{
                textAlign:'left', padding:12, borderBottom:'1px solid #f8fafc',
                background: active === c._id ? '#eef2ff' : '#fff', display:'flex', alignItems:'center', gap:10
              }}
            >
              <div style={{
                width:32, height:32, borderRadius:9999, background:'#f1f5f9',
                display:'grid', placeItems:'center', fontWeight:700, color:'#334155'
              }}>
                {initials((c.participants || []).map(p => p.name).join(', '))}
              </div>
              <div style={{ overflow:'hidden' }}>
                <div style={{ fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {(c.participants || []).map(p => p.name).join(', ')}
                </div>
                <div style={{ color:'#94a3b8', fontSize:12 }}>Conversation</div>
              </div>
            </button>
          ))}
          {!convos.length && <div style={{ padding:12, color:'#94a3b8' }}>No conversations yet.</div>}
        </div>
      </div>

      {/* RIGHT: conversation */}
      <div style={{ border:'1px solid #e5e7eb', borderRadius:16, display:'grid', gridTemplateRows:'auto 1fr auto', background:'#fff' }}>
        {/* header */}
        <div style={{ padding:'12px 16px', borderBottom:'1px solid #f1f5f9', background:'#fafafa' }}>
          <div style={{ fontWeight:700, fontSize:16 }}>Chat with {otherNames}</div>
          {activeConvo && (
            <div style={{ fontSize:12, color:'#6b7280' }}>
              {activeConvo.participants?.length || 0} participant{(activeConvo.participants?.length||0) !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* messages */}
        <div ref={listRef} style={{ padding:16, overflowY:'auto' }}>
          {msgs.map(m => {
            const mine = String(m.sender?._id || m.sender) === String(myIdRef.current);
            return (
              <div key={m._id} style={{ display:'flex', justifyContent: mine ? 'flex-end' : 'flex-start', margin:'6px 0' }}>
                <div style={{
                  maxWidth:'70%',
                  borderRadius:14,
                  padding:'8px 12px',
                  background: mine ? '#3b82f6' : '#f3f4f6',
                  color: mine ? '#fff' : '#111827',
                  boxShadow:'0 1px 2px rgba(0,0,0,0.04)'
                }}>
                  {!mine && <div style={{ fontSize:12, opacity:0.7, marginBottom:2 }}>{m.sender?.name}</div>}
                  <div style={{ lineHeight:1.35 }}>{m.text}</div>
                </div>
              </div>
            );
          })}
          {!msgs.length && <div style={{ color:'#94a3b8' }}>No messages.</div>}
        </div>

        {/* composer */}
        <form onSubmit={onSend} style={{ display:'flex', gap:10, padding:12, borderTop:'1px solid #f1f5f9' }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Type a message to ${otherNames}...`}
            style={{
              flex:1, border:'1px solid #e5e7eb', borderRadius:12, padding:'12px 14px',
              outline:'none'
            }}
          />
          <button className="btn primary" style={{ borderRadius:12, padding:'10px 18px' }}>Send</button>
        </form>
      </div>

      {err && <p className="error">{err}</p>}
    </div>
  );
}
