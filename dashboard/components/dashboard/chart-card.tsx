"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { ChartDataPoint } from "@/types/database";

type ChartType = "area" | "bar" | "line";
type ValueFormat = "number" | "currency";

function formatValue(value: number, valueFormat: ValueFormat): string {
  return valueFormat === "currency" ? formatCurrency(value) : value.toLocaleString();
}

export function ChartCard({
  title,
  data,
  type = "area",
  valueFormat = "number",
}: {
  title: string;
  data: ChartDataPoint[];
  type?: ChartType;
  valueFormat?: ValueFormat;
}) {
  const format = (v: number) => formatValue(v, valueFormat);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {type === "bar" ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={format} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  formatter={(value) => [format(Number(value)), "Value"]}
                />
                <Bar dataKey="value" fill="hsl(var(--foreground))" radius={[2, 2, 0, 0]} />
              </BarChart>
            ) : type === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={format} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  formatter={(value) => [format(Number(value)), "Value"]}
                />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} />
              </LineChart>
            ) : (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={format} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  formatter={(value) => [format(Number(value)), "Value"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--foreground))"
                  fill="hsl(var(--foreground))"
                  fillOpacity={0.1}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
