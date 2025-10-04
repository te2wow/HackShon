import React from 'react';
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

export default function ProgressChart({ data }: ProgressChartProps) {
  const languages = Array.from(
    new Set(data.data.flatMap(d => Object.keys(d.languages)))
  );

  const colors = [
    'rgb(255, 99, 132)',
    'rgb(54, 162, 235)',
    'rgb(255, 205, 86)',
    'rgb(75, 192, 192)',
    'rgb(153, 102, 255)',
    'rgb(255, 159, 64)',
  ];

  const chartData = {
    labels: data.data.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Total',
        data: data.data.map(d => d.total.bytes),
        borderColor: 'rgb(0, 0, 0)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 2,
      },
      ...languages.map((lang, index) => ({
        label: lang,
        data: data.data.map(d => d.languages[lang]?.bytes || 0),
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
      <div className="mb-4">
        <h3 className="text-lg font-medium text-white flex items-center">
          <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></div>
          {data.teamName} - Code Progress
        </h3>
      </div>
      <div className="bg-slate-900/30 rounded-lg p-4" style={{ height: '400px' }}>
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
}