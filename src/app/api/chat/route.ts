import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const subscription_key = process.env.AZURE_OPENAI_API_KEY;
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const api_version = process.env.AZURE_OPENAI_API_VERSION || "2024-12-01-preview";
const deployment_name = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-5.1-chat";

const system_prompt = `
You are an expert AI Film Director. Your goal is to help users translate their raw ideas into cinematic masterpieces.

CAPABILITIES:
1. Scene Design: Write detailed Scene Descriptions (Visuals, Sound, Atmosphere) based on a director's style.
2. Color Palette: Suggest specific color palettes (e.g., "Muted teals and oranges", "High-contrast monochrome") that fit the mood.
3. Directorial Guidance: Provide 'Director's Notes' on camera angles, lighting, and pacing.

INTERACTION STYLE:
- Be conversational and collaborative.
- If the user provides a premise but the emotional core is unclear, ASK for the emotions or the 'feeling' of the scene.
- Always suggest a color palette as part of your design.
- If specific details (like the director) are missing, ask for them politely to better tailor the advice.
- Format your responses with clear headings.
`;

export async function POST(req: Request) {
    try {
        if (!subscription_key || !endpoint) {
            return NextResponse.json({ error: "The original Azure chat is not configured. Open the CineMind 2.0 workspace for rehearsal mode." }, { status: 503 });
        }
        const client = new OpenAI({
            apiKey: subscription_key,
            baseURL: `${endpoint}/openai/deployments/${deployment_name}`,
            defaultHeaders: { "api-key": subscription_key },
            defaultQuery: { "api-version": api_version },
        });
        const { messages } = await req.json();

        const response = await client.chat.completions.create({
            model: deployment_name,
            messages: [{ role: "system", content: system_prompt }, ...messages],
        });

        return NextResponse.json({ response: response.choices[0].message.content });
    } catch (error: any) {
        console.error("Chat Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
