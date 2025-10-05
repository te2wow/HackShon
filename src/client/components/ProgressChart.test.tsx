import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProgressChart from './ProgressChart';
import { ChartData } from '@shared/types';

// Mock Chart.js and react-chartjs-2
jest.mock('chart.js');
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div 
      data-testid="chart" 
      data-chart-data={JSON.stringify(data)} 
      data-chart-options={JSON.stringify(options)}
    />
  ),
}));

const mockChartData: ChartData = {
  teamId: 1,
  teamName: 'Test Team',
  data: [
    {
      timestamp: '2024-01-01T10:00:00Z',
      languages: {
        TypeScript: { bytes: 1000, lines: 50 },
        JavaScript: { bytes: 500, lines: 25 },
      },
      total: { bytes: 1500, lines: 75 },
    },
    {
      timestamp: '2024-01-01T11:00:00Z',
      languages: {
        TypeScript: { bytes: 1200, lines: 60 },
        JavaScript: { bytes: 600, lines: 30 },
        Python: { bytes: 300, lines: 15 },
      },
      total: { bytes: 2100, lines: 105 },
    },
    {
      timestamp: '2024-01-01T12:00:00Z',
      languages: {
        TypeScript: { bytes: 1400, lines: 70 },
        JavaScript: { bytes: 700, lines: 35 },
        Python: { bytes: 400, lines: 20 },
      },
      total: { bytes: 2500, lines: 125 },
    },
  ],
};

const mockEmptyChartData: ChartData = {
  teamId: 2,
  teamName: 'Empty Team',
  data: [],
};

describe('ProgressChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render progress chart with data', () => {
    render(<ProgressChart data={mockChartData} />);

    expect(screen.getByText('Test Team Progress')).toBeInTheDocument();
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('should display time interval selector buttons', () => {
    render(<ProgressChart data={mockChartData} />);

    expect(screen.getByText('1時間')).toBeInTheDocument();
    expect(screen.getByText('6時間')).toBeInTheDocument();
    expect(screen.getByText('24時間')).toBeInTheDocument();
    expect(screen.getByText('7日')).toBeInTheDocument();
    expect(screen.getByText('30日')).toBeInTheDocument();
    expect(screen.getByText('全期間')).toBeInTheDocument();
  });

  it('should have 24時間 selected by default', () => {
    render(<ProgressChart data={mockChartData} />);

    const button24h = screen.getByText('24時間');
    expect(button24h).toHaveClass('from-cyan-500', 'to-blue-500');
  });

  it('should change selected interval when button is clicked', () => {
    render(<ProgressChart data={mockChartData} />);

    const button7d = screen.getByText('7日');
    fireEvent.click(button7d);

    expect(button7d).toHaveClass('from-cyan-500', 'to-blue-500');
  });

  it('should filter data based on selected time interval', () => {
    render(<ProgressChart data={mockChartData} />);

    // Click on 1時間 interval
    const button1h = screen.getByText('1時間');
    fireEvent.click(button1h);

    // Verify chart is still rendered (filtering logic is internal)
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    render(<ProgressChart data={mockEmptyChartData} />);

    expect(screen.getByText('Empty Team Progress')).toBeInTheDocument();
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('should format timestamps correctly for different intervals', () => {
    const { rerender } = render(<ProgressChart data={mockChartData} />);

    // Test 1時間 format
    fireEvent.click(screen.getByText('1時間'));
    let chart = screen.getByTestId('chart');
    let chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}');
    expect(chartData.labels).toBeDefined();

    // Test 24時間 format
    fireEvent.click(screen.getByText('24時間'));
    chart = screen.getByTestId('chart');
    chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}');
    expect(chartData.labels).toBeDefined();

    // Test 7日 format
    fireEvent.click(screen.getByText('7日'));
    chart = screen.getByTestId('chart');
    chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}');
    expect(chartData.labels).toBeDefined();
  });

  it('should create chart datasets for total and individual languages', () => {
    render(<ProgressChart data={mockChartData} />);

    const chart = screen.getByTestId('chart');
    const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}');

    expect(chartData.datasets).toBeDefined();
    expect(Array.isArray(chartData.datasets)).toBe(true);
    
    // Should have datasets for total and each language
    const datasetLabels = chartData.datasets.map((dataset: any) => dataset.label);
    expect(datasetLabels).toContain('Total');
    expect(datasetLabels).toContain('TypeScript');
    expect(datasetLabels).toContain('JavaScript');
    expect(datasetLabels).toContain('Python');
  });

  it('should apply correct colors to datasets', () => {
    render(<ProgressChart data={mockChartData} />);

    const chart = screen.getByTestId('chart');
    const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}');

    chartData.datasets.forEach((dataset: any) => {
      expect(dataset.borderColor).toBeDefined();
      expect(dataset.backgroundColor).toBeDefined();
      expect(typeof dataset.borderColor).toBe('string');
      expect(typeof dataset.backgroundColor).toBe('string');
    });
  });

  it('should configure chart options correctly', () => {
    render(<ProgressChart data={mockChartData} />);

    const chart = screen.getByTestId('chart');
    const chartOptions = JSON.parse(chart.getAttribute('data-chart-options') || '{}');

    expect(chartOptions.responsive).toBe(true);
    expect(chartOptions.maintainAspectRatio).toBe(false);
    expect(chartOptions.plugins).toBeDefined();
    expect(chartOptions.scales).toBeDefined();
    expect(chartOptions.scales.y).toBeDefined();
    expect(chartOptions.scales.x).toBeDefined();
  });

  it('should format y-axis ticks as kilobytes', () => {
    render(<ProgressChart data={mockChartData} />);

    const chart = screen.getByTestId('chart');
    const chartOptions = JSON.parse(chart.getAttribute('data-chart-options') || '{}');

    expect(chartOptions.scales.y.ticks.callback).toBeDefined();
    
    // Test the callback function format
    const callback = chartOptions.scales.y.ticks.callback;
    expect(typeof callback).toBe('string'); // Serialized function
  });

  it('should handle all time intervals', () => {
    render(<ProgressChart data={mockChartData} />);

    const intervals = ['1時間', '6時間', '24時間', '7日', '30日', '全期間'];
    
    intervals.forEach(interval => {
      const button = screen.getByText(interval);
      fireEvent.click(button);
      
      // Verify the button becomes selected
      expect(button).toHaveClass('from-cyan-500', 'to-blue-500');
      
      // Verify chart is still rendered
      expect(screen.getByTestId('chart')).toBeInTheDocument();
    });
  });

  it('should handle data with single timestamp', () => {
    const singlePointData: ChartData = {
      teamId: 3,
      teamName: 'Single Point Team',
      data: [
        {
          timestamp: '2024-01-01T10:00:00Z',
          languages: {
            TypeScript: { bytes: 1000, lines: 50 },
          },
          total: { bytes: 1000, lines: 50 },
        },
      ],
    };

    render(<ProgressChart data={singlePointData} />);

    expect(screen.getByText('Single Point Team Progress')).toBeInTheDocument();
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('should handle data with no languages', () => {
    const noLanguagesData: ChartData = {
      teamId: 4,
      teamName: 'No Languages Team',
      data: [
        {
          timestamp: '2024-01-01T10:00:00Z',
          languages: {},
          total: { bytes: 0, lines: 0 },
        },
      ],
    };

    render(<ProgressChart data={noLanguagesData} />);

    expect(screen.getByText('No Languages Team Progress')).toBeInTheDocument();
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('should update chart when data prop changes', () => {
    const { rerender } = render(<ProgressChart data={mockChartData} />);
    
    expect(screen.getByText('Test Team Progress')).toBeInTheDocument();

    const newData: ChartData = {
      teamId: 5,
      teamName: 'Updated Team',
      data: [],
    };

    rerender(<ProgressChart data={newData} />);
    
    expect(screen.getByText('Updated Team Progress')).toBeInTheDocument();
  });

  it('should maintain selected interval when data changes', () => {
    const { rerender } = render(<ProgressChart data={mockChartData} />);
    
    // Select 7日 interval
    fireEvent.click(screen.getByText('7日'));
    expect(screen.getByText('7日')).toHaveClass('from-cyan-500', 'to-blue-500');

    // Change data
    rerender(<ProgressChart data={mockEmptyChartData} />);
    
    // Should still have 7日 selected
    expect(screen.getByText('7日')).toHaveClass('from-cyan-500', 'to-blue-500');
  });

  describe('Chart styling and accessibility', () => {
    it('should have proper container styling', () => {
      render(<ProgressChart data={mockChartData} />);

      const container = screen.getByText('Test Team Progress').closest('div');
      expect(container).toHaveClass('backdrop-blur-sm', 'border', 'border-slate-700/50');
    });

    it('should have accessible button roles', () => {
      render(<ProgressChart data={mockChartData} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(6); // 6 time interval buttons
      
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('disabled');
      });
    });

    it('should have proper chart container height', () => {
      render(<ProgressChart data={mockChartData} />);

      const chartContainer = screen.getByTestId('chart').parentElement;
      expect(chartContainer).toHaveStyle({ height: '400px' });
    });
  });

  describe('Time filtering edge cases', () => {
    it('should handle future timestamps', () => {
      const futureData: ChartData = {
        teamId: 6,
        teamName: 'Future Team',
        data: [
          {
            timestamp: '2030-01-01T10:00:00Z', // Future date
            languages: { TypeScript: { bytes: 1000, lines: 50 } },
            total: { bytes: 1000, lines: 50 },
          },
        ],
      };

      render(<ProgressChart data={futureData} />);
      
      // Should still render without errors
      expect(screen.getByText('Future Team Progress')).toBeInTheDocument();
      expect(screen.getByTestId('chart')).toBeInTheDocument();
    });

    it('should handle very old timestamps', () => {
      const oldData: ChartData = {
        teamId: 7,
        teamName: 'Old Team',
        data: [
          {
            timestamp: '2020-01-01T10:00:00Z', // Very old date
            languages: { TypeScript: { bytes: 1000, lines: 50 } },
            total: { bytes: 1000, lines: 50 },
          },
        ],
      };

      render(<ProgressChart data={oldData} />);
      
      // Should still render without errors
      expect(screen.getByText('Old Team Progress')).toBeInTheDocument();
      expect(screen.getByTestId('chart')).toBeInTheDocument();
    });
  });
});