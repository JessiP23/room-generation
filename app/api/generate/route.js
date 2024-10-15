// app/api/generate/route.js
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request) {
  try {
    const { prompt } = await request.json()

    // Use OpenAI's GPT-3.5 or GPT-4 to interpret the prompt and generate structure dimensions
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // or "gpt-4" if you have access
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates dimensions for structures based on prompts. Respond with a JSON object containing width, height, and depth in meters."
        },
        {
          role: "user",
          content: `Generate dimensions for a ${prompt}.`
        }
      ],
      max_tokens: 60,
    })

    const structureData = JSON.parse(completion.choices[0].message.content.trim())

    return NextResponse.json(structureData)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'Failed to generate structure' }, { status: 500 })
  }
}