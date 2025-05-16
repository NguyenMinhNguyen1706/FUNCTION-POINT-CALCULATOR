"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { FPInputs } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltipContent, ChartContainer } from '@/components/ui/chart';

interface FpChartProps {
  data: FPInputs;
}

export function FpChart({ data }: FpChartProps) {
  const chartData = [
    { name: 'EI', value: data.ei, fill: "hsl(var(--chart-1))" },
    { name: 'EO', value: data.eo, fill: "hsl(var(--chart-2))" },
    { name: 'EQ', value: data.eq, fill: "hsl(var(--chart-3))" },
    { name: 'ILF', value: data.ilf, fill: "hsl(var(--chart-4))" },
    { name: 'EIF', value: data.eif, fill: "hsl(var(--chart-5))" },
  ];
  
  const chartConfig = {
    value: {
      label: "Count",
    },
    EI: { label: "External Inputs", color: "hsl(var(--chart-1))" },
    EO: { label: "External Outputs", color: "hsl(var(--chart-2))" },
    EQ: { label: "External Inquiries", color: "hsl(var(--chart-3))" },
    ILF: { label: "Internal Logical Files", color: "hsl(var(--chart-4))" },
    EIF: { label: "External Interface Files", color: "hsl(var(--chart-5))" },
  } satisfies Parameters<typeof ChartContainer>[0]["config"];


  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--foreground))" fontSize={12} allowDecimals={false} />
          <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
