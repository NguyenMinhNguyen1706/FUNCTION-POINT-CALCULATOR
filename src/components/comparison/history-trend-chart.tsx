
'use client';

import { Line, LineChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartTooltipContent, ChartContainer } from '@/components/ui/chart';

interface ChartDataPoint {
  timestamp: number;
  date: string; // Formatted date string for X-axis
  value: number;
}

interface HistoryTrendChartProps {
  data: ChartDataPoint[];
  valueLabel: string;
  tooltipLabel: string;
  lineColor: string;
}

export function HistoryTrendChart({ data, valueLabel, tooltipLabel, lineColor }: HistoryTrendChartProps) {
  const chartConfig = {
    value: {
      label: tooltipLabel,
      color: lineColor,
    },
  };

  if (!data || data.length < 2) {
    return <p className="text-center text-muted-foreground p-4">Not enough data to display trend.</p>;
  }
  
  // Determine Y-axis domain dynamically to ensure 0 is included if all values are positive
  // and to provide some padding.
  const values = data.map(d => d.value);
  const minY = Math.min(...values);
  const maxY = Math.max(...values);
  
  // Add padding to Y-axis, ensure it includes 0 if relevant
  const yAxisMin = minY > 0 ? 0 : minY - (maxY - minY) * 0.1; 
  const yAxisMax = maxY + (maxY - minY) * 0.1;

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: 5, // Increased left margin for Y-axis label
            bottom: 20, // Increased bottom margin for X-axis label
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            stroke="hsl(var(--foreground))"
            fontSize={12}
            angle={-35} // Angle labels to prevent overlap
            textAnchor="end"
            height={50} // Allocate more space for angled labels
             // Show fewer ticks if there are many data points
            interval={data.length > 10 ? Math.floor(data.length / 10) : 0}
          />
          <YAxis
            stroke="hsl(var(--foreground))"
            fontSize={12}
            tickFormatter={(value) => value.toFixed(0)} // Adjust formatting as needed
            label={{ value: valueLabel, angle: -90, position: 'insideLeft', offset: -0, style: {fontSize: '12px', fill: 'hsl(var(--foreground))'} }}
            domain={[yAxisMin, yAxisMax]}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                indicator="line"
                labelKey="date"
                nameKey="value"
                formatter={(value, name, props) => {
                  return (
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{props.payload?.date}</span>
                      <span style={{ color: lineColor }}>
                        {chartConfig.value.label}: {Number(value).toFixed(2)}
                      </span>
                    </div>
                  );
                }}
              />
            }
          />
          <Line
            dataKey="value"
            type="monotone"
            stroke={lineColor}
            strokeWidth={2}
            dot={{
              fill: lineColor,
              r: data.length <= 20 ? 3 : 0, // Show dots if few points
            }}
            activeDot={{
              r: 6,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

