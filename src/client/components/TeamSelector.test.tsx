import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TeamSelector from './TeamSelector';
import { TeamWithRepos } from '@shared/types';

// Mock the types import
jest.mock('@shared/types', () => ({}));

const mockTeams: TeamWithRepos[] = [
  {
    id: 1,
    name: 'Team Alpha',
    created_at: '2024-01-01T00:00:00Z',
    repositories: [
      {
        id: 1,
        team_id: 1,
        owner: 'alpha',
        name: 'project1',
        url: 'https://github.com/alpha/project1',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        team_id: 1,
        owner: 'alpha',
        name: 'project2',
        url: 'https://github.com/alpha/project2',
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
  },
  {
    id: 2,
    name: 'Team Beta',
    created_at: '2024-01-01T00:00:00Z',
    repositories: [
      {
        id: 3,
        team_id: 2,
        owner: 'beta',
        name: 'app',
        url: 'https://github.com/beta/app',
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
  },
  {
    id: 3,
    name: 'Team Gamma',
    created_at: '2024-01-01T00:00:00Z',
    repositories: [],
  },
];

const mockOnSelectTeam = jest.fn();

describe('TeamSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render team selector with teams', () => {
    render(
      <TeamSelector
        teams={mockTeams}
        selectedTeamId={null}
        onSelectTeam={mockOnSelectTeam}
      />
    );

    expect(screen.getByText('Select Team')).toBeInTheDocument();
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
    expect(screen.getByText('Team Gamma')).toBeInTheDocument();
  });

  it('should display repository count for each team', () => {
    render(
      <TeamSelector
        teams={mockTeams}
        selectedTeamId={null}
        onSelectTeam={mockOnSelectTeam}
      />
    );

    expect(screen.getByText('(2 repos)')).toBeInTheDocument(); // Team Alpha
    expect(screen.getByText('(1 repo)')).toBeInTheDocument();  // Team Beta
    expect(screen.getByText('(0 repos)')).toBeInTheDocument(); // Team Gamma
  });

  it('should handle singular and plural repository text correctly', () => {
    render(
      <TeamSelector
        teams={mockTeams}
        selectedTeamId={null}
        onSelectTeam={mockOnSelectTeam}
      />
    );

    // Check for proper singular/plural handling
    const repoTexts = screen.getAllByText(/\(\d+ repos?\)/);
    expect(repoTexts).toHaveLength(3);
    
    // Verify specific text exists
    expect(screen.getByText('(1 repo)')).toBeInTheDocument();
    expect(screen.getByText('(2 repos)')).toBeInTheDocument();
    expect(screen.getByText('(0 repos)')).toBeInTheDocument();
  });

  it('should call onSelectTeam when a team is clicked', () => {
    render(
      <TeamSelector
        teams={mockTeams}
        selectedTeamId={null}
        onSelectTeam={mockOnSelectTeam}
      />
    );

    const teamAlphaButton = screen.getByRole('button', { name: /Team Alpha/ });
    fireEvent.click(teamAlphaButton);

    expect(mockOnSelectTeam).toHaveBeenCalledWith(1);
    expect(mockOnSelectTeam).toHaveBeenCalledTimes(1);
  });

  it('should highlight selected team', () => {
    render(
      <TeamSelector
        teams={mockTeams}
        selectedTeamId={2}
        onSelectTeam={mockOnSelectTeam}
      />
    );

    const teamBetaButton = screen.getByRole('button', { name: /Team Beta/ });
    
    // Check if the selected team has the active styling
    expect(teamBetaButton).toHaveClass('from-cyan-500', 'to-blue-500');
  });

  it('should apply inactive styling to non-selected teams', () => {
    render(
      <TeamSelector
        teams={mockTeams}
        selectedTeamId={2}
        onSelectTeam={mockOnSelectTeam}
      />
    );

    const teamAlphaButton = screen.getByRole('button', { name: /Team Alpha/ });
    
    // Check if non-selected teams have inactive styling
    expect(teamAlphaButton).toHaveClass('bg-slate-700/50', 'text-slate-300');
  });

  it('should handle multiple team selections', () => {
    render(
      <TeamSelector
        teams={mockTeams}
        selectedTeamId={null}
        onSelectTeam={mockOnSelectTeam}
      />
    );

    // Click multiple teams
    fireEvent.click(screen.getByRole('button', { name: /Team Alpha/ }));
    fireEvent.click(screen.getByRole('button', { name: /Team Beta/ }));
    fireEvent.click(screen.getByRole('button', { name: /Team Gamma/ }));

    expect(mockOnSelectTeam).toHaveBeenCalledTimes(3);
    expect(mockOnSelectTeam).toHaveBeenNthCalledWith(1, 1);
    expect(mockOnSelectTeam).toHaveBeenNthCalledWith(2, 2);
    expect(mockOnSelectTeam).toHaveBeenNthCalledWith(3, 3);
  });

  it('should render with empty teams array', () => {
    render(
      <TeamSelector
        teams={[]}
        selectedTeamId={null}
        onSelectTeam={mockOnSelectTeam}
      />
    );

    expect(screen.getByText('Select Team')).toBeInTheDocument();
    // Should not have any team buttons
    expect(screen.queryByRole('button', { name: /Team/ })).not.toBeInTheDocument();
  });

  it('should handle team with very long name', () => {
    const teamsWithLongName: TeamWithRepos[] = [
      {
        id: 1,
        name: 'This is a very long team name that might cause layout issues',
        created_at: '2024-01-01T00:00:00Z',
        repositories: [],
      },
    ];

    render(
      <TeamSelector
        teams={teamsWithLongName}
        selectedTeamId={null}
        onSelectTeam={mockOnSelectTeam}
      />
    );

    expect(screen.getByText('This is a very long team name that might cause layout issues')).toBeInTheDocument();
  });

  it('should maintain accessibility attributes', () => {
    render(
      <TeamSelector
        teams={mockTeams}
        selectedTeamId={1}
        onSelectTeam={mockOnSelectTeam}
      />
    );

    const teamButtons = screen.getAllByRole('button');
    
    // All team buttons should be accessible
    teamButtons.forEach(button => {
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveAttribute('disabled');
    });
  });

  it('should handle teams with special characters in names', () => {
    const teamsWithSpecialChars: TeamWithRepos[] = [
      {
        id: 1,
        name: 'Team α/β & γ',
        created_at: '2024-01-01T00:00:00Z',
        repositories: [],
      },
      {
        id: 2,
        name: 'Team <script>alert(\"xss\")</script>',
        created_at: '2024-01-01T00:00:00Z',
        repositories: [],
      },
    ];

    render(
      <TeamSelector
        teams={teamsWithSpecialChars}
        selectedTeamId={null}
        onSelectTeam={mockOnSelectTeam}
      />
    );

    expect(screen.getByText('Team α/β & γ')).toBeInTheDocument();
    expect(screen.getByText('Team <script>alert(\"xss\")</script>')).toBeInTheDocument();
  });

  it('should re-render when teams prop changes', () => {
    const { rerender } = render(
      <TeamSelector
        teams={[mockTeams[0]]}
        selectedTeamId={null}
        onSelectTeam={mockOnSelectTeam}
      />
    );

    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Team Beta')).not.toBeInTheDocument();

    rerender(
      <TeamSelector
        teams={mockTeams}
        selectedTeamId={null}
        onSelectTeam={mockOnSelectTeam}
      />
    );

    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
    expect(screen.getByText('Team Gamma')).toBeInTheDocument();
  });

  it('should re-render when selectedTeamId changes', () => {
    const { rerender } = render(
      <TeamSelector
        teams={mockTeams}
        selectedTeamId={1}
        onSelectTeam={mockOnSelectTeam}
      />
    );

    const teamAlphaButton = screen.getByRole('button', { name: /Team Alpha/ });
    expect(teamAlphaButton).toHaveClass('from-cyan-500', 'to-blue-500');

    rerender(
      <TeamSelector
        teams={mockTeams}
        selectedTeamId={2}
        onSelectTeam={mockOnSelectTeam}
      />
    );

    const teamBetaButton = screen.getByRole('button', { name: /Team Beta/ });
    expect(teamBetaButton).toHaveClass('from-cyan-500', 'to-blue-500');
  });

  it('should handle rapid successive clicks', () => {
    render(
      <TeamSelector
        teams={mockTeams}
        selectedTeamId={null}
        onSelectTeam={mockOnSelectTeam}
      />
    );

    const teamButton = screen.getByRole('button', { name: /Team Alpha/ });
    
    // Simulate rapid clicks
    fireEvent.click(teamButton);
    fireEvent.click(teamButton);
    fireEvent.click(teamButton);

    expect(mockOnSelectTeam).toHaveBeenCalledTimes(3);
    expect(mockOnSelectTeam).toHaveBeenCalledWith(1);
  });

  describe('Visual styling', () => {
    it('should apply correct hover styles', () => {
      render(
        <TeamSelector
          teams={mockTeams}
          selectedTeamId={null}
          onSelectTeam={mockOnSelectTeam}
        />
      );

      const teamButton = screen.getByRole('button', { name: /Team Alpha/ });
      
      // Check for hover-related classes
      expect(teamButton).toHaveClass('hover:scale-105', 'hover:shadow-xl');
    });

    it('should have proper spacing and layout classes', () => {
      render(
        <TeamSelector
          teams={mockTeams}
          selectedTeamId={null}
          onSelectTeam={mockOnSelectTeam}
        />
      );

      // Check for layout container
      const container = screen.getByText('Select Team').closest('div');
      expect(container).toHaveClass('space-y-6');
    });
  });
});