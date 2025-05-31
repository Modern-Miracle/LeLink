'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Markdown } from './markdown';
import { ResourceList } from '@/components/fhir';

interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  resources?: any[];
  isStreaming?: boolean;
  isLast?: boolean;
  className?: string;
}

export function ChatMessage({
  id,
  role,
  content,
  timestamp,
  resources,
  isStreaming,
  isLast,
  className = '',
}: ChatMessageProps) {
  const messageRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (isLast && messageRef.current) {
      messageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest',
      });
    }
  }, [isLast, content, isStreaming]);

  return (
    <motion.div
      ref={messageRef}
      key={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} ${className}`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          role === 'user' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-800'
        }`}
      >
        <div className="text-sm">
          {content && (
            <div className={role === 'user' ? 'text-white' : 'text-gray-800'}>
              {role === 'user' ? (
                // Render user messages as plain text with line breaks
                <div className="whitespace-pre-wrap">{content}</div>
              ) : (
                // Render assistant messages with markdown support
                <Markdown
                  content={content}
                  className={`
                    prose-headings:text-gray-800 
                    prose-p:text-gray-700 
                    prose-strong:text-gray-900
                    prose-code:text-gray-800
                    prose-pre:bg-gray-50
                    prose-blockquote:border-teal-200
                    prose-blockquote:bg-teal-50
                    prose-a:text-teal-600
                    prose-a:hover:text-teal-700
                  `}
                />
              )}
            </div>
          )}

          {isStreaming && (
            <div className="flex items-center gap-2 mt-2">
              {content && <span className="inline-block w-2 h-4 bg-current animate-pulse" />}
              {!content && (
                <span className="inline-flex items-center gap-1 text-gray-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking...
                </span>
              )}
            </div>
          )}
        </div>

        {resources && Array.isArray(resources) && resources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <ResourceList resources={resources} />
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs mt-2 opacity-70 ${role === 'user' ? 'text-teal-100' : 'text-gray-500'}`}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
}
