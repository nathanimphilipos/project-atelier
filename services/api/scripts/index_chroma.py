#!/usr/bin/env python3
"""Index NIST 800-53 controls into ChromaDB for RAG retrieval."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal
from app.models import Control
from app.rag.chroma_store import get_controls_collection


def chunk_text(text: str, max_len: int = 1000) -> list[str]:
    if not text or len(text) <= max_len:
        return [text] if text else []
    chunks = []
    words = text.split()
    current = []
    current_len = 0
    for word in words:
        if current_len + len(word) + 1 > max_len and current:
            chunks.append(" ".join(current))
            current = []
            current_len = 0
        current.append(word)
        current_len += len(word) + 1
    if current:
        chunks.append(" ".join(current))
    return chunks


def index():
    db = SessionLocal()
    collection = get_controls_collection()

    existing = collection.count()
    if existing > 0:
        print(f"Collection already has {existing} documents. Deleting and re-indexing...")
        client = collection._client
        client.delete_collection("nist_controls")
        collection = get_controls_collection()

    controls = db.query(Control).all()
    print(f"Indexing {len(controls)} controls...")

    doc_ids = []
    documents = []
    metadatas = []

    for control in controls:
        full_text = f"{control.control_id}: {control.title}\n\n"
        full_text += f"Control Text: {control.control_text}\n\n"
        if control.discussion:
            full_text += f"Discussion: {control.discussion}\n\n"
        if control.enhancements:
            full_text += f"Enhancements: {control.enhancements}"

        chunks = chunk_text(full_text, max_len=800)
        for i, chunk in enumerate(chunks):
            doc_id = f"{control.control_id}_chunk_{i}"
            doc_ids.append(doc_id)
            documents.append(chunk)
            metadatas.append({
                "control_id": control.control_id,
                "family": control.family,
                "title": control.title,
                "chunk_index": i,
            })

    batch_size = 100
    for start in range(0, len(doc_ids), batch_size):
        end = min(start + batch_size, len(doc_ids))
        collection.add(
            ids=doc_ids[start:end],
            documents=documents[start:end],
            metadatas=metadatas[start:end],
        )

    print(f"Indexed {len(doc_ids)} chunks from {len(controls)} controls.")
    db.close()


if __name__ == "__main__":
    index()
