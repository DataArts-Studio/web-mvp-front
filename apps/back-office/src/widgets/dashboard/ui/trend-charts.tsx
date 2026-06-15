'use client';

import type { TrendPoint } from '@/entities/admin-dashboard';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

type ChartProps = {
  data: TrendPoint[];
};

const axisStyle = { fill: '#6b7280', fontSize: 13 };

export function NewProjectsChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={288}>
      <BarChart data={data} margin={{ top: 18, right: 24, left: 0, bottom: 28 }}>
        <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={{ stroke: '#6b7280' }} />
        <YAxis
          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]}
          tick={axisStyle}
          tickLine={false}
          axisLine={{ stroke: '#6b7280' }}
        />
        <Bar dataKey="projects" fill="#155DFC" opacity={0.85} radius={[4, 4, 0, 0]} barSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ActiveUsersChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={288}>
      <LineChart data={data} margin={{ top: 18, right: 20, left: 0, bottom: 28 }}>
        <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={{ stroke: '#6b7280' }} />
        <YAxis
          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]}
          tick={axisStyle}
          tickLine={false}
          axisLine={{ stroke: '#6b7280' }}
        />
        <Line
          type="monotone"
          dataKey="dau"
          name="DAU"
          stroke="#155DFC"
          strokeWidth={4}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="wau"
          name="WAU"
          stroke="#16A34A"
          strokeWidth={3}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="mau"
          name="MAU"
          stroke="#9333ea"
          strokeWidth={3}
          dot={false}
        />
        <Legend verticalAlign="bottom" height={32} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ProductivityChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={288}>
      <AreaChart data={data} margin={{ top: 18, right: 20, left: 0, bottom: 28 }}>
        <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={{ stroke: '#6b7280' }} />
        <YAxis
          domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.1)]}
          tick={axisStyle}
          tickLine={false}
          axisLine={{ stroke: '#6b7280' }}
        />
        <Area
          type="monotone"
          dataKey="milestone"
          name="Milestone"
          fill="#9333ea"
          stroke="#9333ea"
          fillOpacity={0.75}
          strokeWidth={4}
        />
        <Line type="monotone" dataKey="tc" name="TC" stroke="#155DFC" strokeWidth={4} dot={false} />
        <Line
          type="monotone"
          dataKey="suite"
          name="Suite"
          stroke="#2563eb"
          strokeWidth={3}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="run"
          name="Run"
          stroke="#f59e0b"
          strokeWidth={3}
          dot={false}
        />
        <Legend verticalAlign="bottom" height={32} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
