"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Activity, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResourceList } from "@/components/fhir";
import { TriageResponse } from "@/lib/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  resources?: TriageResponse["resources"];
}

interface TriageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TriageModal({ open, onOpenChange }: TriageModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  // Reset conversation when modal closes
  useEffect(() => {
    if (!open) {
      setMessages([]);
      setInput("");
      setError(null);
      setThreadId(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch("/api/triage/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          threadId,
          patientId: "patient123",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No reader available");

        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === "assistant") {
                      lastMessage.content = accumulatedContent;
                    }
                    return newMessages;
                  });
                }
                if (parsed.threadId && !threadId) {
                  setThreadId(parsed.threadId);
                }
                if (parsed.resources) {
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === "assistant") {
                      lastMessage.resources = parsed.resources;
                    }
                    return newMessages;
                  });
                }
              } catch (e) {
                console.error("Failed to parse SSE data:", e);
              }
            }
          }
        }
      } else {
        const data: TriageResponse = await response.json();
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === "assistant") {
            lastMessage.content = data.content;
            lastMessage.resources = data.resources;
          }
          return newMessages;
        });
        if (data.threadId && !threadId) {
          setThreadId(data.threadId);
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessage.id));
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
              <DialogTitle className="text-xl font-semibold text-teal-700">
                Medical Triage Assistant
              </DialogTitle>
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
                <h3 className="text-lg font-semibold text-gray-700">
                  Welcome to Medical Triage
                </h3>
                <p className="text-gray-500">
                  I'm here to help assess your symptoms and provide guidance.
                  Please describe what you're experiencing.
                </p>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-teal-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                        {loading &&
                          message.role === "assistant" &&
                          !message.content && (
                            <span className="inline-flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Thinking...
                            </span>
                          )}
                      </div>
                      {message.resources && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <ResourceList resources={message.resources} />
                        </div>
                      )}
                    </div>
                  </motion.div>
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

        <form
          onSubmit={handleSubmit}
          className="border-t bg-gray-50 p-4 flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your symptoms..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}