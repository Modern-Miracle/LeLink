'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Activity, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChatMessage } from '@/components/ui/chat-message';
import { TriageResponse } from '@/lib/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  resources?: TriageResponse['resources'];
  isStreaming?: boolean;
}

interface TriageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TriageModal({ open, onOpenChange }: TriageModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  // Reset conversation when modal closes
  useEffect(() => {
    if (!open) {
      setMessages([]);
      setInput('');
      setError(null);
      setThreadId(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    // Add a placeholder streaming message
    const streamingMessageId = Date.now().toString() + '-streaming';
    const streamingMessage: Message = {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, streamingMessage]);

    try {
      const response = await fetch('/api/triage/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          threadId: threadId,
          patientId: 'default-patient-001',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const contentType = response.headers.get('content-type');

      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';
        let resources: any[] = [];

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);

                  // Handle different event types
                  if (parsed.type === 'content') {
                    accumulatedContent += parsed.content;
                    // Update the streaming message
                    setMessages((prev) =>
                      prev.map((msg) => (msg.id === streamingMessageId ? { ...msg, content: accumulatedContent } : msg))
                    );
                  } else if (parsed.type === 'threadId') {
                    setThreadId(parsed.threadId);
                  } else if (parsed.type === 'resources') {
                    resources = Array.isArray(parsed.resources) ? parsed.resources : [];
                  }
                } catch (e) {
                  // Handle non-JSON data as content
                  if (data.trim()) {
                    accumulatedContent += data;
                    setMessages((prev) =>
                      prev.map((msg) => (msg.id === streamingMessageId ? { ...msg, content: accumulatedContent } : msg))
                    );
                  }
                }
              }
            }
          }
        }

        // Finalize the streaming message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingMessageId
              ? {
                  ...msg,
                  content: accumulatedContent || 'I received your message. Let me help you with that.',
                  resources: Array.isArray(resources) && resources.length > 0 ? resources : undefined,
                  isStreaming: false,
                }
              : msg
          )
        );
      } else {
        // Handle JSON response
        const data = await response.json();

        // Update the streaming message with the full response
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingMessageId
              ? {
                  ...msg,
                  content:
                    data.reply || data.message || data.content || 'I received your message. Let me help you with that.',
                  resources: Array.isArray(data.resources) && data.resources.length > 0 ? data.resources : undefined,
                  isStreaming: false,
                }
              : msg
          )
        );

        if (data.threadId) {
          setThreadId(data.threadId);
        }
      }
    } catch (err) {
      console.error('Error generating response:', err);

      // Remove the streaming message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== streamingMessageId));

      // Show error message
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');

      // Add error message from assistant
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        content:
          "I'm sorry, I encountered an error while processing your request. Please try again or contact support if the issue persists.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-teal-50 to-teal-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-600 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-xl font-semibold text-teal-700">Medical Triage Assistant</DialogTitle>
            </div>
            {threadId && (
              <Badge variant="outline" className="text-xs">
                Session: {threadId}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3 max-w-md">
                <div className="p-4 bg-teal-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                  <Activity className="h-10 w-10 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">Welcome to Medical Triage</h3>
                <p className="text-gray-500">
                  I'm here to help assess your symptoms and provide guidance. Please describe what you're experiencing.
                </p>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    id={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                    resources={message.resources}
                    isStreaming={message.isStreaming}
                    isLast={index === messages.length - 1}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>

        {error && (
          <div className="px-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="border-t bg-gray-50 p-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your symptoms..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()} className="bg-teal-600 hover:bg-teal-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
