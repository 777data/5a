'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type ChartData = {
  date: string;
  [key: string]: number | string;
};

type ExecutionTimeChartProps = {
  data: ChartData[];
};

const COLORS = [
  "#2196F3", // Bleu
  "#4CAF50", // Vert
  "#FFC107", // Jaune
  "#E91E63", // Rose
  "#9C27B0", // Violet
  "#FF5722", // Orange
  "#795548", // Marron
  "#607D8B", // Bleu gris
];

export function ExecutionTimeChart({ data }: ExecutionTimeChartProps) {
  if (!data.length) {
    return <div className="h-[400px] flex items-center justify-center text-gray-500">
      Aucune donnée disponible
    </div>;
  }

  // Récupérer tous les noms d'API uniques
  const apiNames = Object.keys(data[0]).filter(key => key !== 'date');

  // Trier les APIs par collection
  apiNames.sort((a, b) => {
    const collectionA = a.split(' - ')[0];
    const collectionB = b.split(' - ')[0];
    return collectionA.localeCompare(collectionB);
  });

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ 
              value: 'Temps (ms)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' }
            }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              return [`${value}ms`, name.split(' - ')[1]];
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend 
            formatter={(value: string) => {
              const [collection, api] = value.split(' - ');
              return `${collection} - ${api}`;
            }}
          />
          {apiNames.map((apiName, index) => (
            <Line
              key={apiName}
              type="monotone"
              dataKey={apiName}
              name={apiName}
              stroke={COLORS[index % COLORS.length]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 