from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
import os
from dotenv import load_dotenv

load_dotenv()

client = SearchClient(
    endpoint=os.getenv("AZURE_SEARCH_ENDPOINT"),
    index_name="university-index",
    credential=AzureKeyCredential(os.getenv("AZURE_SEARCH_KEY"))
)

def upload_docs(docs):
    client.upload_documents(documents=docs)

def search_docs(query, vector):
    results = client.search(
        search_text=query,
        vector={
            "value": vector,
            "k": 5,
            "fields": "embedding"
        }
    )
    return resultss