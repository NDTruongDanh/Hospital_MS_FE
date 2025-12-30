"use client";

import { useMemo } from "react";

interface RevenueChartProps {
  data?: {
    date: string;
    revenue: number;
    expenses?: number;
  }[];
  height?: number;
  onFilterChange?: (filter: string) => void;
  currentFilter?: string;
}

export function RevenueChart({ data = [], height = 300, onFilterChange, currentFilter = "This Week" }: RevenueChartProps) {
  // Use provided data directly, no sample data generation
  const chartData = data;

  const maxValue = chartData.length > 0 ? Math.max(...chartData.map((d) => d.revenue)) : 0;

  return (
    <div className="card-base">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-section">Appointment Overview</h3>
          <p className="text-small mt-1">Daily trend</p>
        </div>
        <select 
          className="dropdown"
          value={currentFilter}
          onChange={(e) => onFilterChange?.(e.target.value)}
        >
          <option>This Week</option>
          <option>Last Week</option>
          <option>This Month</option>
          <option>Last Month</option>
        </select>
      </div>

      {/* Simple Bar Chart */}
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center text-[hsl(var(--muted-foreground))]" style={{ height }}>
          Không có dữ liệu doanh thu
        </div>
      ) : (
      <div className="flex items-end gap-2" style={{ height }}>
        {chartData.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            {/* Bar */}
            <div className="w-full flex flex-col gap-1 flex-1 justify-end relative group">
              {/* Value Label */}
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-semibold text-[hsl(var(--primary))]">{item.revenue}</span>
              </div>
              <div
                className="w-full bg-[hsl(var(--primary))] rounded-t-lg transition-all hover:bg-[hsl(var(--primary-dark))]"
                style={{
                  height: maxValue > 0 ? `${(item.revenue / maxValue) * 100}%` : "0%",
                  minHeight: item.revenue > 0 ? "20px" : "0px",
                }}
                title={`Appointments: ${item.revenue}`}
              />
              {item.expenses && (
                <div
                  className="w-full bg-[hsl(var(--primary-light))] rounded-t-lg"
                  style={{
                    height: `${(item.expenses / maxValue) * 100}%`,
                    minHeight: "2px",
                  }}
                  title={`Expenses: ${item.expenses}M`}
                />
              )}
            </div>
            {/* Label */}
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {item.date}
            </span>
          </div>
        ))}
      </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[hsl(var(--border))]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[hsl(var(--primary))]" />
          <span className="text-small">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[hsl(var(--primary-light))]" />
          <span className="text-small">Expenses</span>
        </div>
      </div>
    </div>
  );
}

// Donut Chart for categories
interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  title: string;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, title, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  let currentAngle = 0;
  const segments = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const segment = {
      ...item,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
    };
    currentAngle += angle;
    return segment;
  });

  return (
    <div className="card-base">
      <h3 className="text-section mb-4">{title}</h3>
      
      <div className="flex items-center gap-6">
        {/* Simple CSS Donut */}
        <div className="relative w-32 h-32">
          <div 
            className="w-full h-full rounded-full"
            style={{
              background: `conic-gradient(${segments
                .map((s) => `${s.color} ${s.startAngle}deg ${s.endAngle}deg`)
                .join(", ")})`,
            }}
          />
          <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center">
            {centerLabel && <span className="text-xs text-[hsl(var(--muted-foreground))]">{centerLabel}</span>}
            {centerValue && <span className="text-lg font-bold">{centerValue}</span>}
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {segments.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm">{item.label}</span>
              </div>
              <span className="text-sm font-medium">{item.percentage.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RevenueChart;
