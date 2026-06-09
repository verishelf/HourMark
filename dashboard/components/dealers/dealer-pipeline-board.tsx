"use client";

import { useCallback, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DealerGradeBadge } from "@/components/dealers/dealer-grade-badge";
import { DealerLaunchPartnerBadge } from "@/components/dealers/dealer-launch-partner-badge";
import { DEALER_PIPELINE_STATUSES, PIPELINE_LABELS } from "@/lib/dealer-scoring";
import { updatePipelineStatus } from "@/actions/dealers";
import { formatCurrency } from "@/lib/utils";
import type { Dealer, DealerPipelineStatus } from "@/types/database";

function PipelineCard({ dealer }: { dealer: Dealer }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: dealer.id,
    data: { status: dealer.pipeline_status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-md border border-border bg-card p-3 cursor-grab active:cursor-grabbing hover:border-foreground/20 transition-colors"
    >
      <Link href={`/dealers/${dealer.id}`} className="font-medium text-sm hover:underline" onClick={(e) => e.stopPropagation()}>
        {dealer.company_name}
      </Link>
      <p className="text-xs text-muted-foreground mt-0.5">{dealer.contact_name}</p>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <DealerGradeBadge grade={dealer.lead_grade} />
        <span className="text-xs text-muted-foreground">{formatCurrency(dealer.inventory_value)}</span>
        <DealerLaunchPartnerBadge
          isLaunchPartner={dealer.is_launch_partner}
          expiresAt={dealer.launch_partner_expires}
          compact
        />
      </div>
    </div>
  );
}

function PipelineColumn({
  status,
  dealers,
}: {
  status: DealerPipelineStatus;
  dealers: Dealer[];
}) {
  const columnDealers = dealers.filter((d) => d.pipeline_status === status);
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col min-w-[260px] max-w-[280px] shrink-0">
      <Card className={`h-full ${isOver ? "ring-2 ring-foreground/20" : ""}`}>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center justify-between">
            {PIPELINE_LABELS[status]}
            <Badge variant="secondary">{columnDealers.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3" ref={setNodeRef}>
          <SortableContext items={columnDealers.map((d) => d.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 min-h-[80px]">
              {columnDealers.map((dealer) => (
                <PipelineCard key={dealer.id} dealer={dealer} />
              ))}
            </div>
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}

export function DealerPipelineBoard({
  dealers: initialDealers,
  adminId,
}: {
  dealers: Dealer[];
  adminId: string;
}) {
  const [dealers, setDealers] = useState(initialDealers);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const activeDealer = activeId ? dealers.find((d) => d.id === activeId) : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const dealerId = String(active.id);
      const dealer = dealers.find((d) => d.id === dealerId);
      if (!dealer) return;

      let newStatus: DealerPipelineStatus | null = null;
      const overId = String(over.id);

      if (DEALER_PIPELINE_STATUSES.includes(overId as DealerPipelineStatus)) {
        newStatus = overId as DealerPipelineStatus;
      } else {
        const overDealer = dealers.find((d) => d.id === overId);
        if (overDealer) newStatus = overDealer.pipeline_status;
      }

      if (!newStatus || newStatus === dealer.pipeline_status) return;

      setDealers((prev) =>
        prev.map((d) => (d.id === dealerId ? { ...d, pipeline_status: newStatus! } : d))
      );

      const result = await updatePipelineStatus(adminId, dealerId, newStatus);
      if ("error" in result && result.error) {
        setDealers(initialDealers);
        toast.error(result.error);
      }
    },
    [dealers, adminId, initialDealers]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
        {DEALER_PIPELINE_STATUSES.map((status) => (
          <div key={status} id={status} data-status={status}>
            <PipelineColumn status={status} dealers={dealers} />
          </div>
        ))}
      </div>
      <DragOverlay>
        {activeDealer ? (
          <div className="rounded-md border border-foreground/30 bg-card p-3 shadow-lg w-[240px]">
            <p className="font-medium text-sm">{activeDealer.company_name}</p>
            <p className="text-xs text-muted-foreground">{activeDealer.contact_name}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
