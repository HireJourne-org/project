import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CompetitorAnalysis from '../components/CompetitorAnalysis';
import { fetchCompetitors } from '../services/competitorService';

// Mock the competitor service
vi.mock('../services/competitorService', () => ({
  fetchCompetitors: vi.fn()
}));

// Mock toast notifications
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn()
  }
}));

describe('CompetitorAnalysis', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<CompetitorAnalysis />);
    expect(screen.getByTestId('competitor-loading')).toBeInTheDocument();
  });

  it('displays competitors after successful fetch', async () => {
    vi.mocked(fetchCompetitors).mockResolvedValue(mockCompetitors);
    
    render(<CompetitorAnalysis />);
    
    await waitFor(() => {
      expect(screen.getByText('Tesla')).toBeInTheDocument();
      expect(screen.getByText('Lucid Motors')).toBeInTheDocument();
    });
  });

  it('handles error state appropriately', async () => {
    vi.mocked(fetchCompetitors).mockRejectedValue(new Error('Failed to fetch'));
    
    render(<CompetitorAnalysis />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch competitor analysis')).toBeInTheDocument();
    });
  });
});