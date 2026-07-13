import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Send, Loader2 } from 'lucide-react';

export default function ChatWindow({ contactId, contactName, currentUserId, showToast }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await api.getChatMessages(contactId);
      setMessages(data);
    } catch (err) {
      console.error("Error al obtener mensajes:", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Polling to keep chat updated
  useEffect(() => {
    fetchMessages(true);
    
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [contactId]);

  // Autoscroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const textToSend = newMessage;
    setNewMessage('');
    
    try {
      const msg = await api.sendChatMessage(contactId, textToSend);
      setMessages(prev => [...prev, msg]);
    } catch (err) {
      showToast("Error al enviar el mensaje: " + err.message, "error");
      setNewMessage(textToSend); // Restore if error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestampStr) => {
    try {
      // Format YYYY-MM-DD HH:MM:SS to HH:MM
      const timePart = timestampStr.split(' ')[1];
      if (timePart) {
        const [hours, minutes] = timePart.split(':');
        return `${hours}:${minutes}`;
      }
      return timestampStr;
    } catch (e) {
      return timestampStr;
    }
  };

  return (
    <div className="flex flex-col h-[500px] md:h-[600px] bg-gymDark-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="bg-neutral-900 px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white leading-none">{contactName}</h4>
          <span className="text-[10px] text-gymNeon font-bold tracking-wider uppercase mt-1 inline-block">Chat en Línea</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5 bg-black/10">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-neutral-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-gymNeon" />
            <span className="text-xs">Cargando mensajes...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <p className="text-xs text-neutral-500 italic">No hay mensajes anteriores en este chat.</p>
            <p className="text-[10px] text-neutral-600 mt-1">¡Escribe un mensaje para iniciar la conversación!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div 
                key={msg.id}
                className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <div 
                  className={`px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed ${
                    isMe 
                      ? 'bg-gymNeon text-black font-semibold rounded-tr-none' 
                      : 'bg-neutral-900 text-white border border-white/5 rounded-tl-none'
                  }`}
                >
                  {msg.message}
                </div>
                <span className="text-[8px] text-neutral-500 mt-1 px-1">
                  {formatTime(msg.timestamp)} {isMe && (msg.is_read ? '✓✓' : '✓')}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="p-4 bg-neutral-900 border-t border-white/5 flex gap-2 items-center">
        <input 
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe tu mensaje aquí..."
          className="flex-1 bg-gymDark-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gymNeon/50 focus:ring-1 focus:ring-gymNeon/30 transition-all"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="bg-gymNeon hover:bg-gymNeon/80 disabled:opacity-50 disabled:hover:bg-gymNeon text-black p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center flex-shrink-0"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
