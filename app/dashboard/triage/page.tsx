"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ArrowRight, Loader2, Send } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
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

  const handleSend = async () => {
    if (input.trim() === "") return

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
      // Create the prompt from conversation history
      const conversationHistory = messages
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n")

      const prompt = `${conversationHistory}\nUser: ${input}\nAssistant:`

      // Generate response using AI SDK
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt,
        system:
          "You are a medical triage assistant for LeLink, a healthcare platform for refugees. Your job is to assess symptoms, ask relevant follow-up questions, and recommend appropriate care. Be compassionate, thorough, and focused on healthcare. Do not diagnose but help determine urgency and next steps.",
      })

      // Add assistant response
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: text,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error generating response:", error)

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
          <Card className="h-[calc(100vh-12rem)]">
            <CardHeader>
              <CardTitle>Triage Conversation</CardTitle>
              <CardDescription>Describe your symptoms and our AI assistant will help assess your needs</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
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

