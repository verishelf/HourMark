"use client";

import { Badge } from "@/components/ui/badge";
import { gradeVariant } from "@/lib/dealer-scoring";
import type { DealerGrade } from "@/types/database";

export function DealerGradeBadge({ grade, score }: { grade: DealerGrade; score?: number }) {
  return (
    <Badge variant={gradeVariant(grade)} className="font-mono">
      {grade}{score != null ? ` · ${score}` : ""}
    </Badge>
  );
}
