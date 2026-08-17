from rag.crawler import crawl_site
from rag.embedder import embed
from rag.search_service import upload_docs
import uuid

# -------------------------------
# 🧠 CATEGORY FUNCTION
# -------------------------------

def get_category(url):
    url = url.lower()

    if "undergraduate" in url:
        return "undergraduate"
    elif "postgraduate" in url:
        return "postgraduate"
    elif "research" in url:
        return "research"
    elif "students" in url:
        return "student_support"
    else:
        return "general"

# -------------------------------
# 🚀 MAIN PIPELINE
# -------------------------------

data = crawl_site()

print("Total pages:", len(data))

docs = []

for item in data:
    url = item["url"]
    text = item["content"]

    # ❌ skip bad pages
    if not text:
        continue

    if "404" in text.lower():
        continue

    if len(text) < 200:
        continue

    if not text or len(text) < 200:
        continue

    # Chunking
    chunks = [text[i:i+500] for i in range(0, len(text), 500)]

    for i, chunk in enumerate(chunks):
        embedding = embed(chunk)

        docs.append({
            "id": str(uuid.uuid4()),
            "content": chunk,
            "url": url,                       # ✅ metadata
            "category": get_category(url),    # ✅ metadata
            "embedding": embedding
        })

print("Total docs:", len(docs))

if docs:
    upload_docs(docs)
    print("✅ Data uploaded to Azure Search")
else:
    print("❌ No documents to upload")