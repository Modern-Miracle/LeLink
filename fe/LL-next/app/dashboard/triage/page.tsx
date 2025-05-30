"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRight, Loader2, Send, AlertCircle } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"
import { ResourceList } from "@/components/fhir/ResourceList"
import { AnyFhirResource } from "@/lib/types/fhir"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  resources?: AnyFhirResource[] // FHIR resources from backend
}

export default function TriagePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your LeLink medical assistant. I can help assess your symptoms and connect you with appropriate care. How can I help you today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (input.trim() === "") return

    // Clear any previous errors
    setError(null)

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Call backend API
      const response = await fetch("/api/triage/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          threadId: threadId,
          // patientId can be added here when available from user context
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get response")
      }

      // Check if response is streaming
      const contentType = response.headers.get("content-type")
      
      if (contentType?.includes("text/event-stream")) {
        // Handle streaming response
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let assistantContent = ""
        let resources: any[] = []

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6)
                if (data === "[DONE]") continue

                try {
                  const parsed = JSON.parse(data)
                  
                  // Handle different event types
                  if (parsed.type === "content") {
                    assistantContent += parsed.content
                  } else if (parsed.type === "threadId") {
                    setThreadId(parsed.threadId)
                  } else if (parsed.type === "resources") {
                    resources = parsed.resources
                  }
                } catch (e) {
                  // Handle non-JSON data
                  assistantContent += data
                }
              }
            }
          }
        }

        // Add assistant response
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: assistantContent || "I received your message. Let me help you with that.",
          resources: resources.length > 0 ? resources : undefined,
        }

        setMessages((prev) => [...prev, assistantMessage])
      } else {
        // Handle JSON response
        const data = await response.json()
        
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: data.message || data.content || "I received your message. Let me help you with that.",
          resources: data.resources,
        }

        if (data.threadId) {
          setThreadId(data.threadId)
        }

        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error("Error generating response:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")

      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again or contact support if the issue persists.",
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Medical Triage Assistant</h1>
            <Button variant="outline" onClick={() => window.history.back()}>
              Back to Dashboard
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="h-[calc(100vh-12rem)]">
            <CardHeader>
              <CardTitle>Triage Conversation</CardTitle>
              <CardDescription>
                Describe your symptoms and our AI assistant will help assess your needs
                {threadId && <span className="ml-2 text-xs text-muted-foreground">(Session ID: {threadId})</span>}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 20rem)" }}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`flex max-w-[80%] items-start gap-3 rounded-lg px-4 py-2 ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                            <AvatarFallback>AI</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="text-sm">{message.content}</div>
                      </div>
                    </div>
                    
                    {/* Display FHIR resources if available */}
                    {message.resources && message.resources.length > 0 && (
                      <div className="mt-4 ml-12">
                        <ResourceList resources={message.resources} />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex max-w-[80%] items-center gap-3 rounded-lg bg-muted px-4 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            <CardFooter className="border-t p-4">
              <div className="flex w-full items-center space-x-2">
                <Input
                  placeholder="Type your symptoms or questions..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || input.trim() === ""}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </CardFooter>
          </Card>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" className="text-sm text-muted-foreground">
              <ArrowRight className="mr-2 h-4 w-4" />
              Connect with a healthcare provider
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}