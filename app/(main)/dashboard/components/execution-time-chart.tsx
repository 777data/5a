'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartData = {
  date: string;
  [key: string]: number | string;
};

type ExecutionTimeChartProps = {
  data: ChartData[];
};

export function ExecutionTimeChart({ data }: ExecutionTimeChartProps) {
  if (!data.length) {
    return <div className="h-[400px] flex items-center justify-center text-gray-500">
      Aucune donnée disponible
    </div>;
  }

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          {Object.keys(data[0])
            .filter((key) => key !== "date")
            .map((apiName, index) => (
              <Line
                key={apiName}
                type="monotone"
                dataKey={apiName}
                stroke={`hsl(${index * 30}, 70%, 50%)`}
                dot={false}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 