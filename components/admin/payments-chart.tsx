"use client"

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { cn } from "@/lib/utils";

type TimeFilter = 'today' | '7days' | '30days' | '3months';

interface ChartData {
  name: string;
  amount: number;
}

function ChartSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    </Card>
  );
}

export function PaymentsChart() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TimeFilter>('today');
  const [data, setData] = useState<ChartData[]>([]);
  const { user } = useAuth();

  // Modified function to generate empty hourly data with current time
  const generateEmptyHourlyData = () => {
    const currentHour = new Date().getHours();
    const data = [];
    for (let i = 0; i <= currentHour; i++) {
      data.push({
        name: `${i.toString().padStart(2, '0')}:00`,
        amount: 0,
        count: 0 // Add count for number of payments
      });
    }
    return data;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const token = await user.getIdToken();
        const response = await fetch(`/api/admin/fetch-payment-stats?filter=${filter}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch payment stats');
        }

        const { data: responseData } = await response.json();
        
        let chartData;
        if (filter === 'today') {
          // Initialize with empty hourly data up to current hour
          const hourlyData = generateEmptyHourlyData();
          const hourlyMap = new Map(hourlyData.map(item => [item.name, item]));

          // Process each payment
          Object.entries(responseData).forEach(([timestamp, amount]) => {
            const hour = timestamp.split(':')[0];
            const hourKey = `${hour}:00`;
            
            if (hourlyMap.has(hourKey)) {
              const existingData = hourlyMap.get(hourKey)!;
              existingData.amount += Number(amount);
              existingData.count += 1;
            }
          });

          chartData = Array.from(hourlyMap.values());
        } else {
          chartData = Object.entries(responseData).map(([name, amount]) => ({
            name,
            amount: Number(amount),
            count: 1 // Default count for other views
          }));
        }

        setData(chartData);
      } catch (error) {
        console.error('Error fetching payment stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, filter]);

  if (loading) return <ChartSkeleton />;

  return (
    <Card className="p-4 md:p-6">
      <div className="space-y-4 md:space-y-6">
        {/* Chart Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-base md:text-lg font-semibold">Payment Statistics</h3>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {(['today', '7days', '30days', '3months'] as TimeFilter[]).map((timeFilter) => (
              <Button
                key={timeFilter}
                variant={filter === timeFilter ? "default" : "outline"}
                onClick={() => setFilter(timeFilter)}
                size="sm"
                className={cn(
                  "flex-1 sm:flex-none transition-colors h-7 px-2 text-xs",
                  filter === timeFilter && "bg-primary hover:bg-primary/90 text-white"
                )}
              >
                {timeFilter === 'today' ? 'Today' :
                 timeFilter === '7days' ? '7D' :
                 timeFilter === '30days' ? '30D' :
                 '3M'}
              </Button>
            ))}
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `$${value}`}
                width={50}
              />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => {
                  const dataPoint = props.payload;
                  if (filter === 'today') {
                    return [
                      `$${value} (${dataPoint.count} payment${dataPoint.count !== 1 ? 's' : ''})`,
                      'Amount'
                    ];
                  }
                  return [`$${value}`, 'Amount'];
                }}
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{ fontSize: '12px' }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
} 