'use client';

import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  // Récupérer tous les noms d'API uniques
  const apiNames = data.length ? Object.keys(data[0]).filter(key => key !== 'date') : [];

  // Récupérer toutes les collections uniques
  const collections = useMemo(() => {
    const uniqueCollections = new Set(
      apiNames.map(apiName => apiName.split(' - ')[0])
    );
    return Array.from(uniqueCollections);
  }, [apiNames]);

  // État pour les collections sélectionnées
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(
    new Set(collections)
  );

  // Filtrer les API en fonction des collections sélectionnées
  const filteredApiNames = apiNames.filter(apiName => 
    selectedCollections.has(apiName.split(' - ')[0])
  );

  const toggleCollection = (collection: string) => {
    const newSelected = new Set(selectedCollections);
    if (newSelected.has(collection)) {
      newSelected.delete(collection);
    } else {
      newSelected.add(collection);
    }
    setSelectedCollections(newSelected);
  };

  const toggleAll = () => {
    if (selectedCollections.size === collections.length) {
      setSelectedCollections(new Set());
    } else {
      setSelectedCollections(new Set(collections));
    }
  };

  if (!data.length) {
    return <div className="h-[400px] flex items-center justify-center text-gray-500">
      Aucune donnée disponible
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-md p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Checkbox 
            id="all-collections"
            checked={selectedCollections.size === collections.length}
            onCheckedChange={toggleAll}
          />
          <label 
            htmlFor="all-collections"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Toutes les collections
          </label>
        </div>
        <ScrollArea className="h-[100px]">
          <div className="space-y-2">
            {collections.map((collection) => (
              <div key={collection} className="flex items-center space-x-2">
                <Checkbox 
                  id={collection}
                  checked={selectedCollections.has(collection)}
                  onCheckedChange={() => toggleCollection(collection)}
                />
                <label 
                  htmlFor={collection}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {collection}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

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
            {filteredApiNames.map((apiName, index) => (
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
    </div>
  );
} 