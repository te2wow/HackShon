import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ChartData } from '@shared/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ProgressChartProps {
  data: ChartData;
}

type TimeInterval = '1h' | '6h' | '24h' | '7d' | '30d' | 'all';

const TIME_INTERVALS = [
  { value: '1h' as TimeInterval, label: '1時間' },
  { value: '6h' as TimeInterval, label: '6時間' },
  { value: '24h' as TimeInterval, label: '24時間' },
  { value: '7d' as TimeInterval, label: '7日' },
  { value: '30d' as TimeInterval, label: '30日' },
  { value: 'all' as TimeInterval, label: '全期間' },
];

function filterDataByTimeInterval(data: ChartData, interval: TimeInterval): ChartData {
  if (interval === 'all') return data;
  
  const now = new Date();
  let cutoffTime: Date;
  
  switch (interval) {
    case '1h':
      cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '6h':
      cutoffTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      break;
    case '24h':
      cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return data;
  }
  
  const filteredData = data.data.filter(d => new Date(d.timestamp) >= cutoffTime);
  
  return {
    ...data,
    data: filteredData
  };
}

export default function ProgressChart({ data }: ProgressChartProps) {
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>('24h');
  
  const filteredData = filterDataByTimeInterval(data, selectedInterval);
  const languages = Array.from(
    new Set(filteredData.data.flatMap(d => Object.keys(d.languages)))
  );

  const colors = [
    'rgb(255, 99, 132)',
    'rgb(54, 162, 235)',
    'rgb(255, 205, 86)',
    'rgb(75, 192, 192)',
    'rgb(153, 102, 255)',
    'rgb(255, 159, 64)',
  ];

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (selectedInterval === '1h' || selectedInterval === '6h') {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } else if (selectedInterval === '24h') {
      return date.toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    }
  };

  const chartData = {
    labels: filteredData.data.map(d => formatTimestamp(d.timestamp)),
    datasets: [
      {
        label: 'Total',
        data: filteredData.data.map(d => d.total.bytes),
        borderColor: 'rgb(0, 0, 0)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 2,
      },
      ...languages.map((lang, index) => ({
        label: lang,
        data: filteredData.data.map(d => d.languages[lang]?.bytes || 0),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.5)'),
      })),
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e2e8f0',
          font: {
            size: 12,
            weight: 500,
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(71, 85, 105, 0.3)',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11,
          },
          callback: function(value) {
            return (Number(value) / 1000).toFixed(0) + 'K';
          },
        },
        title: {
          display: true,
          text: 'Code Size',
          color: '#cbd5e1',
          font: {
            size: 12,
            weight: 500,
          },
        },
      },
      x: {
        grid: {
          color: 'rgba(71, 85, 105, 0.2)',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11,
          },
          maxTicksLimit: 8,
        },
        title: {
          display: true,
          text: 'Time',
          color: '#cbd5e1',
          font: {
            size: 12,
            weight: 500,
          },
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 8,
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
      line: {
        tension: 0.2,
        borderWidth: 3,
      },
    },
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-2xl">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white flex items-center">
          <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></div>
          {data.teamName} - Code Progress
        </h3>
        <div className="flex gap-1 p-1 bg-slate-700/50 rounded-lg border border-slate-600/50">
          {TIME_INTERVALS.map((interval) => (
            <button
              key={interval.value}
              onClick={() => setSelectedInterval(interval.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                selectedInterval === interval.value
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
              }`}
            >
              {interval.label}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-slate-900/30 rounded-lg p-4" style={{ height: '400px' }}>
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
}