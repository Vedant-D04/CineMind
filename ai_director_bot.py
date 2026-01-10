import os
import sys
from openai import AzureOpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration from environment variables
subscription_key = os.getenv("AZURE_OPENAI_API_KEY")
endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-5.1-chat")

# Check if required configuration is present
if not subscription_key or not endpoint:
    print("\n[!] Error: Azure OpenAI configuration not found.")
    print("Please ensure AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT are set in your .env file.")
    sys.exit(1)

# Initialize Client
client = AzureOpenAI(
    api_version=api_version,
    azure_endpoint=endpoint,
    api_key=subscription_key,
)

# System Prompt defining the persona with new capabilities
SYSTEM_PROMPT = """
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
    """

def get_ai_response(messages):
    try:
        response = client.chat.completions.create(
            model=deployment_name, 
            messages=messages,
            # temperature=1 is default and recommended for o1 series
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error: {str(e)}"

def main():
    print("\n" + "="*60)
    print("🎬 Welcome to the AI Director Assistant (Enhanced)!")
    print("="*60)
    print("\nI'm here to help you design your scene, from colors to composition.")
    print("I'll guide you through the process. Let's start with your vision.\n")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Start the conversation
    print(f"AI Director: Hello! I'm ready to work with you using the '{deployment_name}' model.")
    print("Tell me a bit about the scene you have in mind. What's the simple idea, and is there a director whose style you're drawing inspiration from?")
    
    while True:
        user_input = input("\n👤 You: ").strip()

        if user_input.lower() in ['exit', 'quit', 'bye']:
            print("\n🎬 AI Director: Scene finalized. Good luck with your production, Director!")
            break

        if not user_input:
            continue

        messages.append({"role": "user", "content": user_input})
        
        print("\n🎬 AI Director is thinking...\n")
        ai_msg = get_ai_response(messages)
        
        print("-" * 30)
        print(ai_msg)
        print("-" * 30)
        
        messages.append({"role": "assistant", "content": ai_msg})

if __name__ == "__main__":
    main()
