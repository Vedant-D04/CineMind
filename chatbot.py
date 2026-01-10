import random
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

def create_index(palettes):
    model = SentenceTransformer('all-MiniLM-L6-v2')
    descriptions = list(palettes.keys())
    embeddings = model.encode(descriptions)
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(np.array(embeddings).astype('float32'))
    return index, descriptions, model

def get_color_palette(mood, index, descriptions, model, palettes, num_results=3):
    mood_embedding = model.encode([mood]).astype('float32')
    distances, closest = index.search(mood_embedding, num_results)
    results = []
    for i in range(num_results):
        match = descriptions[closest[0][i]]
        similarity_score = 1 - (distances[0][i] / 2)  # Convert distance to similarity (approximate)
        results.append((match, palettes[match], similarity_score))
    return results

def chatbot():
    palettes = {
        "calm": {
            "Primary Colors": ["Soft Blue", "Muted Navy"],
            "Accent Colors": ["Deep Blue", "Off-White", "Soft Red"],
            "Rationale": "Blue tones evoke tranquility and peace, while a touch of red adds warmth without being overwhelming."
        },
        "warm": {
            "Primary Colors": ["Peach", "Coral Red"],
            "Accent Colors": ["Golden Yellow", "Fresh Green", "Deep Blue"],
            "Rationale": "These colors convey coziness and joy, making them perfect for homey or festive environments."
        },
        "cool": {
            "Primary Colors": ["Deep Blue", "Teal"],
            "Accent Colors": ["Ice Blue", "Soft Cyan", "Seafoam Green"],
            "Rationale": "Cool shades symbolize freshness, relaxation, and clarity, ideal for modern aesthetics."
        },
        "nature": {
            "Primary Colors": ["Olive Green", "Earthy Brown"],
            "Accent Colors": ["Soft Cream", "Warm Sand", "Burnt Orange"],
            "Rationale": "Inspired by forests and natural landscapes, these colors bring a grounded, organic feel."
        },
        "sunset": {
            "Primary Colors": ["Orange", "Golden Yellow"],
            "Accent Colors": ["Soft Yellow", "Teal Green", "Sunset Pink"],
            "Rationale": "These hues mimic a setting sun, evoking warmth, romance, and adventure."
        },
        "ocean": {
            "Primary Colors": ["Deep Navy", "Ocean Blue"],
            "Accent Colors": ["Aqua Blue", "Soft Cyan", "Sky Blue"],
            "Rationale": "Reflecting the sea, these colors convey freedom, calmness, and vastness."
        },
        "vibrant": {
            "Primary Colors": ["Magenta", "Electric Purple"],
            "Accent Colors": ["Deep Violet", "Neon Purple", "Intense Indigo"],
            "Rationale": "Bold and high-energy, ideal for making strong, confident statements."
        },
        "pastel": {
            "Primary Colors": ["Soft Pink", "Lavender"],
            "Accent Colors": ["Lilac", "Baby Purple", "Blush Pink"],
            "Rationale": "Light and airy pastels convey gentleness, innocence, and dreamlike aesthetics."
        },
        "mystical": {
            "Primary Colors": ["Deep Purple", "Midnight Blue"],
            "Accent Colors": ["Amethyst", "Silver", "Dark Teal"],
            "Rationale": "These colors evoke mystery and fantasy, perfect for a dreamy or magical setting."
        },
        "futuristic": {
            "Primary Colors": ["Neon Blue", "Metallic Silver"],
            "Accent Colors": ["Electric Green", "Cyber Purple", "Holographic White"],
            "Rationale": "Inspired by sci-fi aesthetics, these colors symbolize innovation and cutting-edge technology."
        },
        "retro": {
            "Primary Colors": ["Mustard Yellow", "Burnt Orange"],
            "Accent Colors": ["Vintage Green", "Rust Red", "Muted Teal"],
            "Rationale": "A nostalgic throwback to the 70s and 80s, combining warm and funky tones."
        },
        "horror": {
            "Primary Colors": ["Blood Red", "Black"],
            "Accent Colors": ["Dark Gray", "Deep Purple", "Bone White"],
            "Rationale": "Dark and eerie colors create a chilling, unsettling atmosphere perfect for horror settings."
        },
        "fantasy": {
            "Primary Colors": ["Royal Blue", "Golden Yellow"],
            "Accent Colors": ["Emerald Green", "Mystic Purple", "Silvery Gray"],
            "Rationale": "Inspired by magical realms, these colors add a sense of wonder and adventure."
        },
        "cyberpunk": {
            "Primary Colors": ["Neon Pink", "Electric Blue"],
            "Accent Colors": ["Cyber Yellow", "Deep Purple", "Glowing Orange"],
            "Rationale": "High-contrast neon tones create a futuristic and edgy cyberpunk aesthetic."
        },
        "gothic": {
            "Primary Colors": ["Deep Black", "Crimson Red"],
            "Accent Colors": ["Dark Violet", "Silver", "Shadow Gray"],
            "Rationale": "Dark, dramatic colors reflect gothic elegance and mystery."
        },
        "desert": {
            "Primary Colors": ["Terracotta", "Sand Beige"],
            "Accent Colors": ["Cactus Green", "Sunbaked Orange", "Clear Sky Blue"],
            "Rationale": "Arid desert landscapes with intense sun and sparse vegetation create a warm, earthy palette."
        },
        "tropical": {
            "Primary Colors": ["Jungle Green", "Vibrant Turquoise"],
            "Accent Colors": ["Coral Pink", "Pineapple Yellow", "Hibiscus Red"],
            "Rationale": "Inspired by lush rainforests and tropical beaches, these bright, saturated colors evoke paradise."
        },
        "winter": {
            "Primary Colors": ["Snow White", "Ice Blue"],
            "Accent Colors": ["Pine Green", "Silver Gray", "Berry Red"],
            "Rationale": "Cold, crisp colors of winter landscapes balanced with warm accents for a cozy feel."
        },
        "autumn": {
            "Primary Colors": ["Maple Red", "Pumpkin Orange"],
            "Accent Colors": ["Golden Yellow", "Forest Green", "Deep Brown"],
            "Rationale": "The rich, warm tones of fall foliage create a cozy and inviting atmosphere."
        },
        "spring": {
            "Primary Colors": ["Cherry Blossom Pink", "Fresh Green"],
            "Accent Colors": ["Daffodil Yellow", "Lavender Purple", "Sky Blue"],
            "Rationale": "Representing new growth and renewal with soft, bright colors full of life and energy."
        },
        "minimalist": {
            "Primary Colors": ["Clean White", "Charcoal Gray"],
            "Accent Colors": ["Soft Black", "Beige", "Muted Blue"],
            "Rationale": "Simple, understated colors focusing on neutrals with subtle accents for a clean, modern look."
        },
        "rustic": {
            "Primary Colors": ["Barn Red", "Weathered Wood Brown"],
            "Accent Colors": ["Mossy Green", "Stone Gray", "Butter Yellow"],
            "Rationale": "Worn, natural colors that evoke countryside charm and traditional craftsmanship."
        },
        "industrial": {
            "Primary Colors": ["Concrete Gray", "Steel Blue"],
            "Accent Colors": ["Rust Orange", "Factory Black", "Copper Brown"],
            "Rationale": "Raw, utilitarian colors inspired by factories and urban environments with exposed materials."
        },
        "ethereal": {
            "Primary Colors": ["Misty White", "Pearl Gray"],
            "Accent Colors": ["Iridescent Blue", "Opal Pink", "Gossamer Purple"],
            "Rationale": "Delicate, translucent colors creating a dreamlike, otherworldly atmosphere."
        },
        "elegant": {
            "Primary Colors": ["Rich Burgundy", "Navy Blue"],
            "Accent Colors": ["Gold", "Cream", "Emerald Green"],
            "Rationale": "Sophisticated, luxurious tones that convey refinement and timeless style."
        },
        "bohemian": {
            "Primary Colors": ["Terracotta", "Mustard Yellow"],
            "Accent Colors": ["Peacock Blue", "Spice Orange", "Plant Green"],
            "Rationale": "Eclectic, free-spirited colors inspired by global patterns and natural dyes."
        },
        "monochrome": {
            "Primary Colors": ["Deep Black", "Soft Gray"],
            "Accent Colors": ["Charcoal", "Silver", "Pure White"],
            "Rationale": "A sophisticated palette using only variations of a single color for subtle depth and contrast."
        },
        "neon": {
            "Primary Colors": ["Hot Pink", "Lime Green"],
            "Accent Colors": ["Electric Blue", "Bright Yellow", "Neon Orange"],
            "Rationale": "Ultra-bright, high-intensity colors that grab attention and create visual energy."
        },
        "vintage": {
            "Primary Colors": ["Faded Denim", "Dusty Rose"],
            "Accent Colors": ["Antique Gold", "Washed Green", "Muted Burgundy"],
            "Rationale": "Weathered, softened colors with a nostalgic feel reminiscent of bygone eras."
        },
        "space": {
            "Primary Colors": ["Deep Space Black", "Nebula Purple"],
            "Accent Colors": ["Star White", "Galaxy Blue", "Asteroid Gray"],
            "Rationale": "Cosmic colors inspired by the mysteries of the universe and celestial bodies."
        },
        "underwater": {
            "Primary Colors": ["Deep Sea Blue", "Algae Green"],
            "Accent Colors": ["Coral Orange", "Pearl White", "Anemone Pink"],
            "Rationale": "Submerged colors that capture the mysterious, filtered light of ocean depths."
        },
        "candy": {
            "Primary Colors": ["Bubblegum Pink", "Cotton Candy Blue"],
            "Accent Colors": ["Lollipop Red", "Lime Green", "Lemon Yellow"],
            "Rationale": "Sweet, playful colors inspired by confectionery that create a fun, cheerful mood."
        },
        "steampunk": {
            "Primary Colors": ["Aged Brass", "Mahogany Brown"],
            "Accent Colors": ["Copper Orange", "Steam White", "Leather Tan"],
            "Rationale": "Victorian-era machinery colors with metallic tones and warm woods for retro-futuristic style."
        },
        "fairy tale": {
            "Primary Colors": ["Enchanted Purple", "Magic Blue"],
            "Accent Colors": ["Storybook Red", "Fairy Dust Gold", "Forest Green"],
            "Rationale": "Whimsical colors that transport to magical kingdoms and enchanted forests."
        },
        # Romantic color palettes
        "romantic": {
            "Primary Colors": ["Rose Pink", "Soft Red"],
            "Accent Colors": ["Blush", "Pearl White", "Deep Burgundy"],
            "Rationale": "Classic romantic colors that evoke passion, tenderness, and affection."
        },
        "valentine": {
            "Primary Colors": ["Ruby Red", "Soft Pink"],
            "Accent Colors": ["Rose Gold", "Marsala", "Cream White"],
            "Rationale": "Traditional valentine colors symbolizing love and devotion with elegant metallic accents."
        },
        "candlelight": {
            "Primary Colors": ["Amber Gold", "Warm Ivory"],
            "Accent Colors": ["Honey Yellow", "Chocolate Brown", "Burgundy"],
            "Rationale": "The warm, intimate glow of candlelight creates a cozy, romantic atmosphere."
        },
        "cherry blossom": {
            "Primary Colors": ["Pale Pink", "White"],
            "Accent Colors": ["Cherry Pink", "Sage Green", "Lavender"],
            "Rationale": "Inspired by the ephemeral beauty of spring cherry blossoms, symbolizing romance and renewal."
        },
        "paris": {
            "Primary Colors": ["French Blue", "Soft Cream"],
            "Accent Colors": ["Eiffel Tower Gray", "Café Brown", "Blush Pink"],
            "Rationale": "The city of love inspires this palette of elegant, timeless Parisian colors."
        },
        "vintage romance": {
            "Primary Colors": ["Dusty Rose", "Antique Ivory"],
            "Accent Colors": ["Faded Lavender", "Muted Sage", "Tea-Stained Beige"],
            "Rationale": "Nostalgic, softened hues that evoke the romance of bygone eras."
        },
        "midnight romance": {
            "Primary Colors": ["Deep Navy", "Plum Purple"],
            "Accent Colors": ["Silver", "Burgundy", "Midnight Blue"],
            "Rationale": "Dramatic, sophisticated dark tones create an intimate, mysterious romantic ambiance."
        },
        "rose garden": {
            "Primary Colors": ["Garden Green", "Rose Pink"],
            "Accent Colors": ["Thorn Brown", "Petal Red", "Morning Dew White"],
            "Rationale": "The classic symbol of romance—roses in a garden setting—inspires this natural palette."
        },
        "sweetheart": {
            "Primary Colors": ["Candy Pink", "Soft Coral"],
            "Accent Colors": ["Heart Red", "Cream", "Light Mauve"],
            "Rationale": "Playful, sweet colors that evoke the light-hearted side of romance and affection."
        },
        "star-crossed": {
            "Primary Colors": ["Twilight Blue", "Starlight Silver"],
            "Accent Colors": ["Cosmic Purple", "Dream Blue", "Celestial White"],
            "Rationale": "Inspired by romantic tales of lovers destined by the stars, creating a dreamy, cosmic feel."
        },
        "ballroom": {
            "Primary Colors": ["Champagne Gold", "Velvet Red"],
            "Accent Colors": ["Crystal White", "Chandelier Gold", "Piano Black"],
            "Rationale": "Elegant, opulent colors reminiscent of grand ballrooms and classical romance."
        },
        "secret garden": {
            "Primary Colors": ["Hidden Green", "Misty Mauve"],
            "Accent Colors": ["Stone Gray", "Secret Blue", "Wild Rose Pink"],
            "Rationale": "Mysterious and enchanted, evoking the romance of a secluded garden sanctuary."
        }
    }
    
    index, descriptions, model = create_index(palettes)
    print("Welcome to the Color Palette Advisor!")
    print("I can suggest color palettes based on your mood, theme, or scene.")
    print("Type 'list' to see all available palettes.")
    print("Type 'random' for a surprise palette.")
    print("Type 'exit' to quit.")
    
    while True:
        user_input = input("\nEnter a mood or scene: ").strip().lower()
        
        if user_input == 'exit':
            print("Thank you for using Color Palette Advisor. Goodbye!")
            break
            
        elif user_input == 'list':
            print("\nAvailable palette themes:")
            themes = sorted(list(palettes.keys()))
            # Print in columns for better readability
            columns = 4
            for i in range(0, len(themes), columns):
                row = themes[i:i+columns]
                print("  ".join(f"{theme}" for theme in row))
            continue
            
        elif user_input == 'random':
            random_theme = random.choice(list(palettes.keys()))
            print(f"\nRandom palette: '{random_theme}'")
            palette = palettes[random_theme]
            print_palette(random_theme, palette)
            continue
        
        # Get multiple results for more options
        results = get_color_palette(user_input, index, descriptions, model, palettes, num_results=3)
        
        print(f"\nTop matches for '{user_input}':\n")
        for i, (theme, palette, similarity) in enumerate(results):
            print(f"Match #{i+1}: '{theme}' (Similarity: {similarity:.2f})")
            print_palette(theme, palette)
            if i < len(results) - 1:
                print("-" * 50)

def print_palette(theme, palette):
    """Helper function to print palette details consistently"""
    print(f"Primary Colors: {', '.join(palette['Primary Colors'])}")
    print(f"Accent Colors: {', '.join(palette['Accent Colors'])}")
    print(f"Rationale: {palette['Rationale']}")
    
    # Display hex codes for better implementation (mock function)
    print("Sample Color Codes:")
    for color_type in ["Primary Colors", "Accent Colors"]:
        for color in palette[color_type]:
            # This is a mock function - in a real implementation, you would map
            # color names to actual hex codes from a predefined dictionary
            hex_code = mock_color_to_hex(color)
            print(f"  {color}: {hex_code}")

def mock_color_to_hex(color_name):
    """Mock function to simulate converting color names to hex codes"""
    # In a real implementation, this would be a dictionary mapping color names to actual hex codes
    # This is just a simplified demonstration
    color_hash = hash(color_name) % 0xFFFFFF
    return f"#{color_hash:06X}"

if __name__ == "__main__":
    chatbot()