import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings, get_abs_path

_client: chromadb.ClientAPI | None = None
COLLECTION_NAME = "nist_controls"


def get_chroma_client() -> chromadb.ClientAPI:
    global _client
    if _client is None:
        persist_dir = get_abs_path(settings.CHROMA_DIR)
        _client = chromadb.PersistentClient(
            path=persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _client


def get_controls_collection():
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


def query_control_chunks(control_id: str, n_results: int = 5) -> list[dict]:
    collection = get_controls_collection()
    results = collection.query(
        query_texts=[control_id],
        n_results=n_results,
        where={"control_id": control_id},
    )
    chunks = []
    if results and results["documents"]:
        for i, doc in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i] if results["metadatas"] else {}
            chunks.append({"text": doc, "metadata": meta})
    return chunks


def query_related_controls(query_text: str, n_results: int = 3, exclude_id: str = "") -> list[dict]:
    collection = get_controls_collection()
    results = collection.query(
        query_texts=[query_text],
        n_results=n_results + 5,
    )
    chunks = []
    if results and results["documents"]:
        for i, doc in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i] if results["metadatas"] else {}
            if meta.get("control_id") != exclude_id:
                chunks.append({"text": doc, "metadata": meta})
            if len(chunks) >= n_results:
                break
    return chunks
