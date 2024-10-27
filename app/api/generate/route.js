import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

// Initialize the GROQ client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// Define the POST method for the /api/generate route
export async function POST(request) {
  try {
    const { prompt } = await request.json()

    // Use GROQ to generate an initial room design concept
    const groqResponse = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert interior designer. Generate a brief room design concept based on the given prompt."
        },
        {
          role: "user",
          content: `Create a room design concept for: ${prompt}`
        }
      ],
      model: "mixtral-8x7b-32768",
      max_tokens: 150,
      temperature: 0.7,
    })

    const initialConcept = groqResponse.choices[0]?.message?.content
    if (!initialConcept) {
      throw new Error('No design concept generated by GROQ')
    }

    // Use Groq again to generate a detailed room design based on the initial concept
    const detailedDesignResponse = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert interior designer. Generate a detailed room design based on the given concept. Provide the output as a JSON object with properties for room dimensions, color scheme, furniture list, and special features."
        },
        {
          role: "user",
          content: `Generate a detailed room design based on this concept: ${initialConcept}`
        }
      ],
      model: "mixtral-8x7b-32768",
      max_tokens: 500,
      temperature: 0.7,
    })

    const detailedDesign = gpt4Response.choices[0]?.message?.content
    if (!detailedDesign) {
      throw new Error('No detailed design generated by GPT-4')
    }

    const roomDesign = JSON.parse(detailedDesign.trim())

    return NextResponse.json({
      concept: initialConcept,
      design: roomDesign
    })
    // Return a JSON response with the initial concept and detailed room design
  } catch (error) {
    console.error('Error:', error.message, error.stack)
    return NextResponse.json({ message: 'Failed to generate room design' }, { status: 500 })
  }
}