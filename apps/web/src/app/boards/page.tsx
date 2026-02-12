"use client";

import { useState } from "react";
import { LayoutDashboard, Plus } from "lucide-react";
import { useBoards, useBoardCards, useCreateCard, useUpdateCard } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { COLUMN_LABELS, COLUMN_COLORS } from "@/lib/types";
import type { Card as CardType } from "@/lib/types";

const COLUMNS = ["todo", "in_progress", "blocked", "review", "done"];

export default function BoardsPage() {
  const { data: boards } = useBoards();
  const [selectedBoardId, setSelectedBoardId] = useState<number>(0);
  const [newCardTitle, setNewCardTitle] = useState("");

  const activeBoardId = selectedBoardId || boards?.[0]?.id || 0;
  const { data: cards } = useBoardCards(activeBoardId);
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();

  const handleCreateCard = async () => {
    if (!newCardTitle.trim() || !activeBoardId) return;
    await createCard.mutateAsync({
      boardId: activeBoardId,
      card: { title: newCardTitle, column: "todo" },
    });
    setNewCardTitle("");
  };

  const handleMoveCard = async (card: CardType, newColumn: string) => {
    await updateCard.mutateAsync({
      cardId: card.id,
      updates: { column: newColumn },
    });
  };

  const cardsByColumn = (col: string) =>
    cards?.filter((c) => c.column === col) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Project Boards</h1>
          <p className="text-sm text-muted-foreground">
            Kanban boards for GovRAMP and SOC 2 tracking
          </p>
        </div>
      </div>

      {/* Board Tabs */}
      <div className="flex gap-2 flex-wrap">
        {boards?.map((b) => (
          <Button
            key={b.id}
            size="sm"
            variant={b.id === activeBoardId ? "default" : "outline"}
            onClick={() => setSelectedBoardId(b.id)}
          >
            <LayoutDashboard className="h-4 w-4 mr-1" />
            {b.name}
            <Badge variant="secondary" className="ml-2 text-[10px]">
              {b.card_count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Add Card */}
      <div className="flex gap-2 max-w-md">
        <Input
          placeholder="New card title..."
          value={newCardTitle}
          onChange={(e) => setNewCardTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateCard()}
        />
        <Button
          size="sm"
          onClick={handleCreateCard}
          disabled={!newCardTitle.trim() || createCard.isPending}
        >
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-5 gap-3">
        {COLUMNS.map((col) => (
          <div key={col} className={`rounded-lg p-3 ${COLUMN_COLORS[col]}`}>
            <h3 className="text-sm font-semibold text-navy mb-3">
              {COLUMN_LABELS[col]}{" "}
              <span className="text-muted-foreground font-normal">
                ({cardsByColumn(col).length})
              </span>
            </h3>
            <div className="space-y-2">
              {cardsByColumn(col).map((card) => (
                <Card key={card.id} className="shadow-sm">
                  <CardContent className="p-3 space-y-2">
                    <p className="text-sm font-medium">{card.title}</p>
                    {card.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {card.description}
                      </p>
                    )}
                    {card.linked_control_ids &&
                      card.linked_control_ids.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {card.linked_control_ids.map((cid) => (
                            <Badge
                              key={cid}
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {cid}
                            </Badge>
                          ))}
                        </div>
                      )}
                    {card.owner && (
                      <p className="text-[10px] text-muted-foreground">
                        Owner: {card.owner}
                      </p>
                    )}
                    {/* Move buttons */}
                    <div className="flex gap-1 pt-1">
                      {COLUMNS.filter((c) => c !== col).map((targetCol) => (
                        <button
                          key={targetCol}
                          onClick={() => handleMoveCard(card, targetCol)}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted-foreground/10 text-muted-foreground"
                          title={`Move to ${COLUMN_LABELS[targetCol]}`}
                        >
                          {COLUMN_LABELS[targetCol].slice(0, 6)}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
