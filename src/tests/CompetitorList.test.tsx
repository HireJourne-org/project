import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CompetitorList from '../components/CompetitorList';

describe('CompetitorList', () => {
  const mockCompetitors = [
    {
      name: 'Tesla',
      description: 'Leading electric vehicle manufacturer known for innovative technology and luxury EVs.'
    },
    {
      name: 'Lucid Motors',
      description: 'Premium electric vehicle company focusing on luxury sedans with advanced technology.'
    }
  ];

  it('renders loading skeleton when loading is true', () => {
    render(<CompetitorList competitors={[]} loading={true} />);
    expect(screen.getAllByTestId('competitor-skeleton')).toHaveLength(5);
  });

  it('renders competitors list when not loading', () => {
    render(<CompetitorList competitors={mockCompetitors} loading={false} />);
    
    expect(screen.getByText('Tesla')).toBeInTheDocument();
    expect(screen.getByText('Lucid Motors')).toBeInTheDocument();
    
    mockCompetitors.forEach(competitor => {
      expect(screen.getByText(competitor.description)).toBeInTheDocument();
    });
  });

  it('renders empty state when no competitors are provided', () => {
    render(<CompetitorList competitors={[]} loading={false} />);
    expect(screen.getByText('No competitors found')).toBeInTheDocument();
  });
});