// New: PriorityBarChart visualization
export function PriorityBarChart({ tasks }) {
  const byPriority = { low: 0, medium: 0, high: 0 };
  tasks.forEach(t => {
    const p = t.priority || 'medium';
    byPriority[p] = (byPriority[p] || 0) + 1;
  });
  const data = [
    { name: 'Low', value: byPriority.low, fill: COLORS.low },
    { name: 'Medium', value: byPriority.medium, fill: COLORS.medium },
    { name: 'High', value: byPriority.high, fill: COLORS.high },
  ];
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis dataKey="name" stroke="#64748b" fontSize={15} tickLine={false} axisLine={{ stroke: COLORS.grid }} />
          <YAxis allowDecimals={false} stroke="#64748b" fontSize={15} tickLine={false} axisLine={{ stroke: COLORS.grid }} />
          <Tooltip
            contentStyle={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', border: 'none' }}
            labelStyle={{ fontWeight: 600, color: '#333' }}
            formatter={(value, name) => [`${value} tasks`, name]}
          />
          <Bar dataKey="value" radius={[8,8,0,0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-bar-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
// Task progress over time area chart (matches reference image)
export function TaskProgressBar({ tasks }) {
  // Group tasks by completion date (only 'Done' tasks)
  const dateCounts = {};
  tasks.filter(t => t.status === 'Done' && t.completedAt).forEach(t => {
    const d = new Date(t.completedAt?.seconds ? t.completedAt.seconds * 1000 : t.completedAt)
      .toISOString().slice(0, 10); // YYYY-MM-DD
    dateCounts[d] = (dateCounts[d] || 0) + 1;
  });
  // Sort dates chronologically
  const sortedDates = Object.keys(dateCounts)
    .map(d => ({ date: new Date(d), label: d }))
    .sort((a, b) => a.date - b.date)
    .map(d => d.label);
  // Build cumulative data
  let cumulative = 0;
  const data = sortedDates.map(date => {
    cumulative += dateCounts[date];
    return { date, completed: cumulative };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-blue-600">{payload[0].value} tasks completed</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="date" stroke="#3b5fc6" fontSize={14} tickLine={false} axisLine={{ stroke: '#bcd2fa' }} />
        <YAxis stroke="#3b5fc6" fontSize={14} tickLine={false} axisLine={{ stroke: '#bcd2fa' }} domain={[0, 'dataMax']} />
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="completed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCompleted)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
// Temporary stub to fix missing export error
export function ActivityLine() {
  return null;
}
import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, CartesianGrid, XAxis, YAxis, RadialBarChart, RadialBar, PolarAngleAxis, BarChart, Bar } from 'recharts'

// Enhanced color palette with gradients
const COLORS = {
  todo: '#fbbf24',        // Amber
  inProgress: '#38bdf8',  // Sky
  done: '#22c55e',        // Green
  low: '#a3e635',         // Lime
  medium: '#f472b6',      // Pink
  high: '#f43f5e',        // Rose
  bar: {
    start: '#3b82f6',    // Blue
    end: '#60a5fa'        // Light blue
  },
  grid: '#e2e8f0'         // Slate 200
}


export function CompletionPie({ tasks }) {
  // Enhanced color palette and modern UI
  const byStatus = { 'To Do': 0, 'In Progress': 0, 'Done': 0 };
  tasks.forEach(t => {
    const status = t.status || 'To Do';
    byStatus[status] = (byStatus[status] || 0) + 1;
  });
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0) || 1;
  const data = [
    { name: 'Done', value: byStatus['Done'], color: COLORS.done },
    { name: 'In Progress', value: byStatus['In Progress'], color: COLORS.inProgress },
    { name: 'To Do', value: byStatus['To Do'], color: COLORS.todo },
  ];
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.08) return null;
    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={16}
        fontWeight="bold"
        filter="drop-shadow(0 1px 2px #0008)"
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={100}
            innerRadius={60}
            dataKey="value"
            isAnimationActive={true}
            stroke="#fff"
            strokeWidth={3}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            iconType="circle"
            formatter={(value, entry, i) => (
              <span style={{ color: data[i].color, fontWeight: 600, fontSize: 15 }}>{value}</span>
            )}
          />
          <Tooltip
            contentStyle={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', border: 'none' }}
            labelStyle={{ fontWeight: 600, color: '#333' }}
            formatter={(value, name) => [`${value} tasks`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// New: PriorityDoughnut visualization
export function PriorityDoughnut({ tasks }) {
  const byPriority = { low: 0, medium: 0, high: 0 };
  tasks.forEach(t => {
    const p = t.priority || 'medium';
    byPriority[p] = (byPriority[p] || 0) + 1;
  });
  const data = [
    { name: 'Low', value: byPriority.low, fill: COLORS.low },
    { name: 'Medium', value: byPriority.medium, fill: COLORS.medium },
    { name: 'High', value: byPriority.high, fill: COLORS.high },
  ];
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <ResponsiveContainer width="100%" height={260}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="100%"
          barSize={24}
          data={data}
        >
          <PolarAngleAxis type="category" dataKey="name" tick={false} />
          <RadialBar
            minAngle={15}
            background
            clockWise
            dataKey="value"
            cornerRadius={12}
            label={{ position: 'inside', fill: '#fff', fontWeight: 600, fontSize: 14 }}
          />
          <Legend
            iconType="circle"
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            formatter={(value, entry, i) => (
              <span style={{ color: data[i].fill, fontWeight: 600, fontSize: 15 }}>{value}</span>
            )}
          />
          <Tooltip
            contentStyle={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', border: 'none' }}
            labelStyle={{ fontWeight: 600, color: '#333' }}
            formatter={(value, name) => [`${value} tasks`, name]}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}

  // Render label inside the pie slice, matching the reference image
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null;
    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={14}
        fontWeight="bold"
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  }
