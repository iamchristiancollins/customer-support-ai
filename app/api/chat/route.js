import { NextResponse } from "next/server"; // Import NextResponse from Next.js for handling responses
import OpenAI from "openai"; // Import OpenAI library for interacting with the OpenAI API
import { signUp, signIn, signOutUser } from "../../../auth";

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = "You should respond with information about me, Christian Collins"; // Use your own system prompt here
// POST function to handle incoming requests
export async function POST(req) {
  const data = await req.json(); // Parse the JSON body of the incoming request

  // Handle authentication actions
  if (data.action === "signup") {
    await signUp(data.email, data.password);
    return NextResponse.json({ message: "Sign up successful" });
  }
  if (data.action === "signin") {
    await signIn(data.email, data.password);
    return NextResponse.json({ message: "Sign in successful" });
  }
  if (data.action === "signout") {
    await signOutUser();
    return NextResponse.json({ message: "Sign out successful" });
  }

  const openai = new OpenAI(); // Create a new instance of the OpenAI client

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: systemPrompt }, ...data], // Include the system prompt and user messages
    model: "gpt-4o-mini", // Specify the model to use
    stream: true, // Enable streaming responses
  });

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content); // Encode the content to Uint8Array
            controller.enqueue(text); // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err); // Handle any errors that occur during streaming
      } finally {
        controller.close(); // Close the stream when done
      }
    },
  });

  return new NextResponse(stream); // Return the stream as the response
}
