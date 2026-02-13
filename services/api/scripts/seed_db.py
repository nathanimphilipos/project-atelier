#!/usr/bin/env python3
"""Seed the database with NIST 800-53 controls and default boards."""
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import engine, SessionLocal, Base
from app.models import Control, Board, GovRAMPProgress

BOARDS = [
    "Progressing Snapshot",
    "GovRAMP Ready",
    "GovRAMP Core",
    "GovRAMP Authorized (Moderate)",
    "SOC 2",
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    csv_path = Path(__file__).resolve().parents[1] / "resources" / "nist_80053.csv"
    if not csv_path.exists():
        print(f"ERROR: CSV not found at {csv_path}")
        sys.exit(1)

    existing = db.query(Control).count()
    if existing > 0:
        print(f"Controls already seeded ({existing} rows). Skipping control seed.")
    else:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                control = Control(
                    control_id=row["control_id"].strip(),
                    family=row["family"].strip(),
                    title=row["title"].strip(),
                    control_text=row["control_text"].strip(),
                    discussion=row.get("discussion", "").strip(),
                    enhancements=row.get("enhancements", "").strip(),
                    status="not_started",
                )
                db.add(control)
                count += 1
            db.commit()
            print(f"Seeded {count} NIST 800-53 controls.")

    existing_boards = db.query(Board).count()
    if existing_boards > 0:
        print(f"Boards already seeded ({existing_boards}). Skipping board seed.")
    else:
        for name in BOARDS:
            db.add(Board(name=name))
        db.commit()
        print(f"Seeded {len(BOARDS)} boards.")

    existing_tiers = db.query(GovRAMPProgress).count()
    if existing_tiers > 0:
        print(f"GovRAMP tiers already seeded ({existing_tiers}). Skipping.")
    else:
        tiers = [
            GovRAMPProgress(tier="ps", total_controls=40, completed_controls=0, completion_pct=0.0),
            GovRAMPProgress(tier="ready", total_controls=80, completed_controls=0, completion_pct=0.0),
            GovRAMPProgress(tier="core", total_controls=60, completed_controls=0, completion_pct=0.0),
            GovRAMPProgress(tier="authorized", total_controls=319, completed_controls=0, completion_pct=0.0),
        ]
        for t in tiers:
            db.add(t)
        db.commit()
        print(f"Seeded {len(tiers)} GovRAMP progress tiers.")

    db.close()
    print("Seed complete.")


if __name__ == "__main__":
    seed()
