from openai import AzureOpenAI
import os
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from azure.search.documents.models import VectorizedQuery
from dotenv import load_dotenv

# Load env
load_dotenv()

# -------------------------------
# 🔧 CONFIG
# -------------------------------

AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")

AZURE_SEARCH_ENDPOINT = os.getenv("AZURE_SEARCH_ENDPOINT")
AZURE_SEARCH_KEY = os.getenv("AZURE_SEARCH_KEY")

EMBEDDING_MODEL = "text-embedding-3-large"
CHAT_MODEL = "gpt-4o"

# -------------------------------
# 🤖 CLIENTS
# -------------------------------

client = AzureOpenAI(
    api_key=AZURE_OPENAI_API_KEY,
    api_version=AZURE_OPENAI_API_VERSION,
    azure_endpoint=AZURE_OPENAI_ENDPOINT
)

search_client = SearchClient(
    endpoint=AZURE_SEARCH_ENDPOINT,
    index_name="university-index",
    credential=AzureKeyCredential(AZURE_SEARCH_KEY)
)

# -------------------------------
# 🧠 STEP 1: EMBEDDING
# -------------------------------

def get_embedding(text):
    try:
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print("Embedding Error:", e)
        return None

# -------------------------------
# 🔍 STEP 2: VECTOR SEARCH
# -------------------------------

def search_documents(embedding):
    try:
        vector_query = VectorizedQuery(
            vector=embedding,
            k_nearest_neighbors=5,
            fields="embedding"
        )

        results = search_client.search(
            search_text=None,
            vector_queries=[vector_query]
        )

        docs = []
        for r in results:
            if "content" in r:
                docs.append(r["content"])

        return docs

    except Exception as e:
        print("Search Error:", e)
        return []

# -------------------------------
# 🤖 STEP 3: GENERATE ANSWER
# -------------------------------

def generate_answer(question, context):
    try:
        response = client.chat.completions.create(
            model=CHAT_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert university assistant. "
                        "Answer clearly, structured, and ONLY from provided context. "
                        "If answer is not in context, say 'Not available'."
                    )
                },
                {
                    "role": "user",
                    "content": f"Context:\n{context}\n\nQuestion: {question}"
                }
            ],
            temperature=0.3
        )

        return response.choices[0].message.content

    except Exception as e:
        print("LLM Error:", e)
        return "⚠️ Error generating answer."

# -------------------------------
# 🚀 MAIN FUNCTION (FOR UI)
# -------------------------------

def get_answer(question):
    if not question:
        return "Please enter a valid question."

    # Step 1: Embed
    embedding = get_embedding(question)
    if not embedding:
        return "⚠️ Failed to process question."

    # Step 2: Search
    docs = search_documents(embedding)

    if not docs:
        return "No relevant information found."

    # Step 3: Build context
    context = "\n\n".join(docs[:5])

    # Step 4: Generate answer
    answer = generate_answer(question, context)

    return answer

# -------------------------------
# 🧪 TEST MODE (CLI)
# -------------------------------

if __name__ == "__main__":
    while True:
        q = input("\nAsk: ")
        if q.lower() in ["exit", "quit"]:
            break

        ans = get_answer(q)
        print("\nAnswer:\n", ans)