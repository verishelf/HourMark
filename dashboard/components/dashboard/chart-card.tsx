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

const CHART_MARGIN = { top: 8, right: 4, left: 4, bottom: 0 };

const axisTick = { fontSize: 11, fill: "var(--foreground)" };
const gridStroke = "var(--border)";
const axisStroke = "var(--border)";
const seriesStroke = "var(--foreground)";

function formatValue(value: number, valueFormat: ValueFormat): string {
  return valueFormat === "currency" ? formatCurrency(value) : value.toLocaleString();
}

function ChartTooltip({
  active,
  payload,
  label,
  valueFormat,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
  valueFormat: ValueFormat;
}) {
  if (!active || !payload?.length) return null;

  const value = Number(payload[0]?.value ?? 0);

  return (
    <div
      className="rounded-md border border-border px-3 py-2 text-sm shadow-md"
      style={{ background: "var(--card)", color: "var(--foreground)" }}
    >
      <p className="mb-1 font-medium" style={{ color: "var(--foreground)" }}>
        {label}
      </p>
      <p style={{ color: "var(--foreground)" }}>{formatValue(value, valueFormat)}</p>
    </div>
  );
}

function ChartAxes({
  format,
}: {
  format: (v: number) => string;
}) {
  return (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
      <XAxis
        dataKey="date"
        tick={axisTick}
        stroke={axisStroke}
        tickLine={false}
        axisLine={false}
        dy={8}
      />
      <YAxis
        tick={axisTick}
        stroke={axisStroke}
        tickLine={false}
        axisLine={false}
        tickFormatter={format}
        width={56}
      />
    </>
  );
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
    <Card className="overflow-hidden">
      <CardHeader className="px-6 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-4 pt-0">
        <div className="h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            {type === "bar" ? (
              <BarChart data={data} margin={CHART_MARGIN}>
                <ChartAxes format={format} />
                <Tooltip content={<ChartTooltip valueFormat={valueFormat} />} />
                <Bar dataKey="value" fill={seriesStroke} radius={[2, 2, 0, 0]} />
              </BarChart>
            ) : type === "line" ? (
              <LineChart data={data} margin={CHART_MARGIN}>
                <ChartAxes format={format} />
                <Tooltip content={<ChartTooltip valueFormat={valueFormat} />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={seriesStroke}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            ) : (
              <AreaChart data={data} margin={CHART_MARGIN}>
                <ChartAxes format={format} />
                <Tooltip content={<ChartTooltip valueFormat={valueFormat} />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={seriesStroke}
                  fill={seriesStroke}
                  fillOpacity={0.12}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
