import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function generateTriageResponse(conversationHistory: string, userInput: string) {
  try {
    const prompt = `${conversationHistory}\nUser: ${userInput}\nAssistant:`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      system:
        "You are a medical triage assistant for LeLink, a healthcare platform for refugees. Your job is to assess symptoms, ask relevant follow-up questions, and recommend appropriate care. Be compassionate, thorough, and focused on healthcare. Do not diagnose but help determine urgency and next steps.",
    })

    return { success: true, text }
  } catch (error) {
    console.error("Error generating AI response:", error)
    return {
      success: false,
      text: "I'm sorry, I encountered an error. Please try again or contact support if the issue persists.",
    }
  }
}

