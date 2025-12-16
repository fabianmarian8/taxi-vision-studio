'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  sender_type: 'partner' | 'admin';
  message: string;
  created_at: string;
}

interface ChatWidgetProps {
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
}

export function ChatWidget({ partnerId, partnerName, partnerEmail }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Memoize supabase client
  const supabase = useMemo(() => createClient(), []);

  // Load messages on open
  useEffect(() => {
    if (isOpen && partnerId) {
      loadMessages();
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [isOpen, partnerId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error loading messages:', fetchError);
        setError('Nepodarilo sa načítať správy');
      } else if (data) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Nepodarilo sa načítať správy');
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToMessages = () => {
    try {
      const channel = supabase
        .channel(`chat:${partnerId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `partner_id=eq.${partnerId}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error('Error subscribing to messages:', err);
      return () => {};
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    setError(null);
    const messageText = newMessage.trim();
    setNewMessage('');

    // Optimistic update - show message immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      sender_type: 'partner',
      message: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      // Insert message to Supabase
      const { data, error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          partner_id: partnerId,
          sender_type: 'partner',
          message: messageText,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error sending message:', insertError);
        setError('Nepodarilo sa odoslať správu');
        setNewMessage(messageText); // Restore message
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } else if (data) {
        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data : m))
        );
        // Send Telegram notification (don't wait for it)
        fetch('/api/partner/chat-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partnerName,
            partnerEmail,
            message: messageText,
          }),
        }).catch(console.error);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Nepodarilo sa odoslať správu');
      setNewMessage(messageText); // Restore message
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('sk-SK', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-50 bg-[#f5a623] hover:bg-[#e09000] text-black p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        title="Podpora"
        aria-label={isOpen ? 'Zavrieť chat' : 'Otvoriť chat'}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 z-50 w-80 sm:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="bg-[#f5a623] text-black px-4 py-3 rounded-t-lg">
            <h3 className="font-bold">Podpora TaxiNearMe</h3>
            <p className="text-xs opacity-80">Odpovieme čo najskôr</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-600 text-xs px-4 py-2 border-b border-red-100">
              {error}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[300px] bg-gray-50">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Začnite konverzáciu</p>
                <p className="text-xs mt-1">Napíšte nám a odpovieme</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'partner' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg ${
                      msg.sender_type === 'partner'
                        ? 'bg-[#f5a623] text-black'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.sender_type === 'partner' ? 'text-black/60' : 'text-gray-400'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Napísať správu..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f5a623] focus:border-transparent"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="bg-[#f5a623] hover:bg-[#e09000] disabled:opacity-50 disabled:cursor-not-allowed text-black p-2 rounded-lg transition-colors"
                aria-label="Odoslať správu"
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
