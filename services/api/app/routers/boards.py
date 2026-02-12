from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Board, Card, Narrative
from app.schemas.boards import BoardOut, CardCreate, CardUpdate, CardOut

router = APIRouter(prefix="/api", tags=["boards"])


@router.get("/boards", response_model=list[BoardOut])
def list_boards(db: Session = Depends(get_db)):
    boards = db.query(Board).all()
    results = []
    for b in boards:
        card_count = db.query(Card).filter(Card.board_id == b.id).count()
        results.append(
            BoardOut(id=b.id, name=b.name, created_at=b.created_at, card_count=card_count)
        )
    return results


@router.get("/boards/{board_id}/cards", response_model=list[CardOut])
def list_cards(board_id: int, db: Session = Depends(get_db)):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return db.query(Card).filter(Card.board_id == board_id).order_by(Card.created_at).all()


@router.post("/boards/{board_id}/cards", response_model=CardOut)
def create_card(board_id: int, body: CardCreate, db: Session = Depends(get_db)):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    card = Card(
        board_id=board_id,
        column=body.column,
        title=body.title,
        description=body.description,
        owner=body.owner,
        due_date=body.due_date,
        linked_control_ids=body.linked_control_ids,
        linked_evidence_ids=body.linked_evidence_ids,
        linked_narrative_id=body.linked_narrative_id,
        source_row_id=body.source_row_id,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.put("/cards/{card_id}", response_model=CardOut)
def update_card(card_id: int, body: CardUpdate, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(card, field, value)

    db.commit()
    db.refresh(card)
    return card


@router.post("/controls/{control_id}/create-cards-from-gaps")
def create_cards_from_gaps(
    control_id: str,
    board_id: int = 1,
    db: Session = Depends(get_db),
):
    latest_narrative = (
        db.query(Narrative)
        .filter(Narrative.control_id == control_id)
        .order_by(Narrative.created_at.desc())
        .first()
    )
    if not latest_narrative:
        raise HTTPException(status_code=404, detail="No narrative found for this control")

    remediation_lines = _extract_remediation(latest_narrative.narrative_text)
    if not remediation_lines:
        return {"cards_created": 0, "message": "No remediation items found"}

    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    created = []
    for line in remediation_lines:
        card = Card(
            board_id=board_id,
            column="todo",
            title=line[:200],
            description=f"Auto-generated from {control_id} narrative v{latest_narrative.version}",
            linked_control_ids=[control_id],
            linked_narrative_id=latest_narrative.id,
        )
        db.add(card)
        created.append(line)

    db.commit()
    return {"cards_created": len(created), "items": created}


def _extract_remediation(narrative_text: str) -> list[str]:
    lines = narrative_text.split("\n")
    in_remediation = False
    items = []
    for line in lines:
        stripped = line.strip()
        if "remediation" in stripped.lower() and ("###" in stripped or "##" in stripped):
            in_remediation = True
            continue
        if in_remediation:
            if stripped.startswith("###") or stripped.startswith("##"):
                break
            if stripped.startswith("- ") or stripped.startswith("* "):
                items.append(stripped.lstrip("-* ").strip())
    return items
