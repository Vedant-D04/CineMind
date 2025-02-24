from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import json
from typing import List, Dict
import os

class LocalT5Generator:
    def __init__(self):
        print("Initializing LocalT5Generator...")
        self.tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-large")
        self.model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-large")
        if torch.cuda.is_available():
            self.model = self.model.to('cuda')
        print("LocalT5Generator initialized.")
        
    def __call__(self, prompt: str, max_length: int = 1024, temperature: float = 1) -> str:
        print(f"Generating text for prompt: {prompt[:100]}...")
        inputs = self.tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024)
        if torch.cuda.is_available():
            inputs = {k: v.to('cuda') for k, v in inputs.items()}
        
        outputs = self.model.generate(
            **inputs,
            max_length=max_length,
            temperature=temperature,
            do_sample=True,
            num_beams=4,
            no_repeat_ngram_size=2,
            early_stopping=True,
            pad_token_id=self.tokenizer.pad_token_id
        )
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        print("Generated response:", response[:200])
        return response


class EnhancedColorPaletteRAG:
    def __init__(self):
        print("Initializing EnhancedColorPaletteRAG...")
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-mpnet-base-v2"
        )
        
        self.generator = LocalT5Generator()
        
        self.qa_prompt = PromptTemplate(
            template="""Suggest the color palette in detail for this scene: {question}

Context information: {context}

Please provide your recommendation in the following format:

Primary Colors:
1. [First color] - [Purpose/mood it creates]
2. [Second color] - [Purpose/mood it creates]
3. [Third color] - [Purpose/mood it creates]

Accent Colors:
1. [First accent] - [Purpose/mood it creates]
2. [Second accent] - [Purpose/mood it creates]

Lighting Considerations:
- How the colors interact with the scene's lighting

Technical Details:
- Color combinations and their effects
- Any special considerations for the setting

Recommendation:""",
            input_variables=["context", "question"]
        )
        
        self.vector_store = None
        
    def initialize_from_json(self, json_files):
        """Initialize system with enhanced processing of color knowledge"""
        color_knowledge = self._process_enhanced_knowledge(json_files)
        
        self.vector_store = FAISS.from_texts(
            color_knowledge,
            self.embeddings
        )
    print("Vector store initialized with processed knowledge.")
    import json

    def _process_enhanced_knowledge(self, json_files):
        """Process color knowledge with enhanced categorization"""
        documents = []
        
        color_principles = {
            "emotions": {},
            "technical": {},
            "combinations": {},
            "contexts": {}
        }
        
        print(f"Processing {len(json_files)} JSON files...")  # Debugging statement
        
        for file_path in json_files:
            try:
                print(f"Opening file: {file_path}")  # Debugging statement
                with open(file_path, 'r') as f:
                    data = json.load(f)
                
                print(f"Successfully loaded JSON: {file_path}")  # Debugging statement
                print(f"Keys in JSON: {list(data.keys())}")  # Debugging statement
                
                if "training_data" in data:
                    training_data = data["training_data"]
                    
                    if "pure_emotions" in training_data:
                        print(f"Processing emotions from {file_path}")  # Debugging statement
                        for emotion in training_data["pure_emotions"]:
                            emotion_name = emotion.get("emotion", "Unknown")
                            print(f"  - Emotion: {emotion_name}")  # Debugging statement
                            print(f"  - Colors: {emotion['response'].get('colors', {})}")  # Debugging statement
                            
                            color_principles["emotions"][emotion_name] = {
                                "colors": emotion["response"]["colors"],
                                "properties": emotion["response"].get("properties", {})
                            }
                            
                            doc = f"""Color Principle - {emotion_name}:
                            Primary colors: {', '.join(emotion['response']['colors'].get('primary', []))}
                            Effect: {emotion['response']['description']}
                            Key properties: {json.dumps(emotion['response'].get('properties', {}))}
                            """
                            documents.append(doc)
                    
                    if "technical_specifications" in training_data:
                        print(f"Processing technical specifications from {file_path}")  # Debugging statement
                        tech_specs = training_data["technical_specifications"]
                        for category, specs in tech_specs.items():
                            print(f"  - Technical Category: {category}")  # Debugging statement
                            print(f"  - Specs: {json.dumps(specs)}")  # Debugging statement
                            
                            color_principles["technical"][category] = specs
                            
                            doc = f"""Technical Principle - {category}:
                            Details: {json.dumps(specs)}
                            Application: Universal color theory principle
                            """
                            documents.append(doc)
            
            except Exception as e:
                print(f"Error processing {file_path}: {e}")  # Debugging statement
        
        documents.append("""
        Creative Color Combination Guidelines:
        1. Emotional combinations: When mixing emotions, consider dominant and secondary feelings
        2. Context adaptation: Adjust color intensity based on setting (indoor/outdoor, time of day)
        3. Technical balance: Maintain proper contrast and saturation for practical visibility
        4. Harmony principle: Use color wheel relationships (complementary, analogous, triadic)
        5. Flexibility: Colors can serve multiple purposes depending on context and application
        """)
        
        print("Finished processing color knowledge.")
        return documents

    
    def get_recommendation(self, query: str, chat_history: List = None) -> dict:
        """Get creative color recommendation with detailed explanation"""
        print(f"Getting recommendation for query: {query}")
        
        if not self.vector_store:
            print("Error: Vector store is not initialized.")  # Debugging statement
            return {"error": "System not initialized"}
        
        # Analyze query
        print("Analyzing query...")  # Debugging statement
        query_aspects = self._analyze_query(query)
        print(f"Query analysis result: {query_aspects}")  # Debugging statement
        
        # Enhance query based on analysis
        print("Enhancing query...")  # Debugging statement
        enhanced_query = self._enhance_query(query, query_aspects)
        print(f"Enhanced query: {enhanced_query}")  # Debugging statement
        
        # Retrieve relevant documents
        print("Searching for similar documents...")  # Debugging statement
        docs = self.vector_store.similarity_search(enhanced_query, k=3)
        print(f"Number of documents retrieved: {len(docs)}")  # Debugging statement
        if docs:
            print(f"Sample document excerpt: {docs[0].page_content[:200]}")  # Debugging statement
        
        context = "\n".join(doc.page_content for doc in docs)
        
        # Format prompt
        print("Formatting prompt for generator...")  # Debugging statement
        full_prompt = self.qa_prompt.format(
            context=context,
            question=enhanced_query
        )
        print(f"Full prompt (truncated): {full_prompt[:200]}")  # Debugging statement
        test_output = self.generator("What are some warm colors?", max_length=50, temperature=0.7)
        print(f"Test output: {test_output}")

        # Generate response
        print("Generating recommendation...")  # Debugging statement
        recommendation = self.generator(
            full_prompt,
            max_length=384,
            temperature=0.6
        )
        print("Generated recommendation (truncated):", recommendation[:200])  # Debugging statement
        
        return {
            "recommendation": recommendation,
            "query_analysis": query_aspects,
            "source_elements": len(docs)
        }

    
    def _analyze_query(self, query: str) -> dict:
        """Analyze query complexity and components"""
        aspects = {
            "emotions": [],
            "context": None,
            "technical_requirements": [],
            "complexity": "simple"
        }
        
        emotion_keywords = ["happy", "sad", "scary", "angry", "romantic", "nostalgic"]
        context_keywords = ["indoor", "outdoor", "night", "day", "forest", "city"]
        technical_keywords = ["lighting", "contrast", "bright", "dark", "saturated"]
        
        found_emotions = [w for w in emotion_keywords if w in query.lower()]
        if len(found_emotions) > 1:
            aspects["complexity"] = "complex"
        aspects["emotions"] = found_emotions
        
        for context in context_keywords:
            if context in query.lower():
                aspects["context"] = context
                
        aspects["technical_requirements"] = [w for w in technical_keywords if w in query.lower()]
        
        return aspects
    
    def _enhance_query(self, original_query: str, aspects: dict) -> str:
        """Enhance query based on complexity analysis"""
        if aspects["complexity"] == "complex":
            return f"""Create a unique color palette for: '{original_query}'
            Consider these elements:
            - Emotions: {', '.join(aspects['emotions'])}
            - Context: {aspects['context']}
            - Technical aspects: {', '.join(aspects['technical_requirements'])}
            Focus on creating a harmonious combination that addresses all these elements."""
        
        return original_query

def main():
    # Initialize RAG system
    rag = EnhancedColorPaletteRAG()
    
    # Initialize with JSON files
    json_files = [
        "complete-color-palette-training.json",
        "complete-color-palette-training-part2.json",
        "complete-color-palette-training-part3.json",
        "complete-color-palette-training-part4.json"
    ]
    rag.initialize_from_json(json_files)
    
    # Test with a unique query
    unique_query = "What color palette would work for a romantic scene in a vintage cafe at sunset?"
    result = rag.get_recommendation(unique_query)
    
    print(f"Query: {unique_query}\n")
    print("Analysis:", result["query_analysis"])
    print("\nRecommendation:")
    print(result["recommendation"])

if __name__ == "__main__":
    main()