'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bot, User, AlertCircle, Sparkles, Activity } from 'lucide-react';
import { ResourceList } from '@/components/fhir';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  resources?: any[];
  isStreaming?: boolean;
  timestamp?: Date;
}

export default function TriagePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm your AI medical assistant. Please describe your symptoms, and I'll help assess your condition. Remember, this is for informational purposes only and doesn't replace professional medical advice.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const messageText = input.trim();
    if (messageText === '' || isLoading) return;

    // Clear any previous errors
    setError(null);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

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
      // Call backend API
      const response = await fetch('/api/triage/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          threadId: threadId,
          patientId: 'default-patient-001', // TODO: Get from user session when authentication is implemented
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Check if response is streaming
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
                    resources = parsed.resources;
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
                  resources: resources.length > 0 ? resources : undefined,
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
                  resources: data.resources,
                  isStreaming: false,
                }
              : msg
          )
        );

        if (data.threadId) {
          setThreadId(data.threadId);
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);

      // Remove the streaming message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== streamingMessageId));

      // Show error message
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');

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
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh)] bg-teal-600 ">
      <div className="bg-teal-600 text-white">
        <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            <h1 className="text-lg sm:text-2xl font-semibold">Medical Triage Assistant</h1>
          </div>
          {threadId && (
            <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-white/30 text-xs sm:text-sm">
              {threadId.slice(-6)}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 bg-gray-50 dark:bg-gray-900 relative overflow-hidden mb-1">
        <div className="max-w-4xl mx-auto h-full flex flex-col pb-[50px] mt-2 ">
          <ScrollArea className="flex-1 border shadow-md">
            <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={cn('flex gap-2 sm:gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}
                    >
                      {message.role === 'assistant' && (
                        <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-teal-200 flex-shrink-0">
                          <AvatarFallback className="bg-teal-100">
                            <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={cn(
                          'group relative max-w-[90%] sm:max-w-[85%] rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm shadow-sm',
                          message.role === 'user'
                            ? 'bg-teal-600 text-white ml-4 sm:ml-12'
                            : 'bg-white dark:bg-gray-700 mr-4 sm:mr-12 border border-gray-200 dark:border-gray-600'
                        )}
                      >
                        {message.isStreaming && (
                          <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-teal-500 animate-pulse" />
                        )}

                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                          {message.isStreaming && message.content && (
                            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                          )}
                          {message.isStreaming && !message.content && (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin text-teal-600" />
                              <span className="text-gray-500 dark:text-gray-400">Thinking...</span>
                            </div>
                          )}
                        </div>

                        {message.timestamp && (
                          <div
                            className={cn(
                              'text-xs mt-1 opacity-50',
                              message.role === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                            )}
                          >
                            {formatTime(message.timestamp)}
                          </div>
                        )}
                      </div>

                      {message.role === 'user' && (
                        <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-teal-200 flex-shrink-0">
                          <AvatarFallback className="bg-teal-100">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>

                    {/* Display FHIR resources if available */}
                    {message.resources && message.resources.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="mt-3 sm:mt-4 ml-8 sm:ml-11"
                      >
                        <ResourceList resources={message.resources} />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Fixed input area */}
        <div className="absolute bottom-0 left-0 right-0 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto p-2 sm:p-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative w-full"
            >
              <Input
                ref={inputRef}
                placeholder="Describe your symptoms..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="w-full h-12 text-base rounded-full pl-4 pr-12 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="absolute right-1 top-1 h-10 w-10 rounded-full bg-teal-600 hover:bg-teal-700 text-white disabled:bg-gray-300 dark:disabled:bg-gray-700"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
