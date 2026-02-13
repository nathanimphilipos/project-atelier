"use client";

import { useState, useCallback } from "react";
import { LayoutDashboard, Plus, GripVertical } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useBoards, useBoardCards, useCreateCard, useUpdateCard } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { COLUMN_LABELS, COLUMN_COLORS } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";

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

  const cardsByColumn = useCallback(
    (col: string) => cards?.filter((c) => c.column === col) || [],
    [cards]
  );

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { draggableId, destination } = result;
      if (!destination) return;
      const newColumn = destination.droppableId;
      const cardId = parseInt(draggableId, 10);
      const card = cards?.find((c) => c.id === cardId);
      if (!card || card.column === newColumn) return;
      await updateCard.mutateAsync({
        cardId: card.id,
        updates: { column: newColumn },
      });
    },
    [cards, updateCard]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Project Boards"
        description="Kanban boards for GovRAMP and SOC 2 tracking — drag cards between columns"
      />

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

      {/* Kanban Columns with Drag & Drop */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-5 gap-3">
          {COLUMNS.map((col) => (
            <Droppable droppableId={col} key={col}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`rounded-lg p-3 min-h-[200px] transition-colors ${
                    COLUMN_COLORS[col]
                  } ${snapshot.isDraggingOver ? "ring-2 ring-navy/30" : ""}`}
                >
                  <h3 className="text-sm font-semibold text-navy mb-3">
                    {COLUMN_LABELS[col]}{" "}
                    <span className="text-muted-foreground font-normal">
                      ({cardsByColumn(col).length})
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {cardsByColumn(col).map((card, index) => (
                      <Draggable
                        key={card.id}
                        draggableId={String(card.id)}
                        index={index}
                      >
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                          >
                            <Card
                              className={`shadow-sm transition-shadow ${
                                dragSnapshot.isDragging
                                  ? "shadow-lg ring-2 ring-navy/20"
                                  : ""
                              }`}
                            >
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-start gap-1.5">
                                  <div
                                    {...dragProvided.dragHandleProps}
                                    className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-navy"
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">
                                      {card.title}
                                    </p>
                                    {card.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                        {card.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
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
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
