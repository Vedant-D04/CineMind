import faiss
from sentence_transformers import SentenceTransformer
from transformers import T5ForConditionalGeneration, T5Tokenizer

class RAGColorRecommendation:
    def __init__(self):
        # Load embedding model
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")  

        # Initialize FAISS
        self.dimension = self.embedder.get_sentence_embedding_dimension()
        self.index = faiss.IndexFlatL2(self.dimension)  
        self.vector_store = None  

        # Load T5 Generator
        self.tokenizer = T5Tokenizer.from_pretrained("google/flan-t5-large")
        self.generator = T5ForConditionalGeneration.from_pretrained("google/flan-t5-large")

        # Sample color knowledge base
        self.knowledge_base = [
            {"text": "Warm colors like red and orange create a romantic atmosphere."},
            {"text": "Dark hues like deep purples and blacks add mystery for horror themes."},
            {"text": "Soft pinks and faded browns give a vintage aesthetic."},
            {"text": "Sunset lighting works well with warm tones like gold, peach, and soft purple."}
        ]

        # Populate FAISS Index
        self._populate_vector_store()

    def _populate_vector_store(self):
        """ Embeds the knowledge base and stores it in FAISS. """
        texts = [item["text"] for item in self.knowledge_base]
        embeddings = self.embedder.encode(texts, convert_to_numpy=True)
        self.index.add(embeddings)
        self.vector_store = self.index
        print(f"Vector Store Initialized with {len(self.knowledge_base)} documents.")

    def _analyze_query(self, query):
        """ Extracts key elements from the query. """
        if "romantic" in query.lower():
            emotion = "romantic"
        elif "horror" in query.lower():
            emotion = "horror"
        else:
            emotion = "neutral"
        
        return {"emotions": [emotion], "context": None, "technical_requirements": [], "complexity": "simple"}

    def get_recommendation(self, query):
        """ Generates a color recommendation based on the input query. """

        # Step 1: Query Analysis
        analysis = self._analyze_query(query)
        print(f"Query Analysis: {analysis}")

        # Step 2: Vector Search
        query_embedding = self.embedder.encode(query, convert_to_numpy=True)
        D, I = self.index.search(query_embedding.reshape(1, -1), k=3)
        retrieved_docs = [self.knowledge_base[i]["text"] for i in I[0] if i != -1]
        print(f"Retrieved Docs: {retrieved_docs}")

        if not retrieved_docs:
            return "No relevant information found."

        # Step 3: Prompt Generation
        context = " ".join(retrieved_docs)
        full_prompt = f"Context: {context}\n\nUser Query: {query}\n\nRecommendation:"
        print(f"Generated Prompt: {full_prompt}")

        # Step 4: T5 Text Generation
        input_ids = self.tokenizer.encode(full_prompt, return_tensors="pt", truncation=True, max_length=512)
        output_ids = self.generator.generate(input_ids, max_length=100, temperature=0.7, top_p=0.9)
        recommendation = self.tokenizer.decode(output_ids[0], skip_special_tokens=True)

        return recommendation if recommendation.strip() else "Unable to generate a recommendation."

# Test the system
rag_system = RAGColorRecommendation()
query = "What colors would work for a romantic horror scene in a vintage cafe at sunset?"
output = rag_system.get_recommendation(query)
print("Recommendation:", output)
