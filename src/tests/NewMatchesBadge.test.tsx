import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NewMatchesBadge from '../components/NewMatchesBadge';
import { countPendingStrategies } from '../services/semanticBridgeService';

vi.mock('../services/semanticBridgeService', () => ({
  countPendingStrategies: vi.fn(),
}));

const renderBadge = () => render(<MemoryRouter><NewMatchesBadge /></MemoryRouter>);

describe('NewMatchesBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('links to the drafts when there are pending strategies', async () => {
    vi.mocked(countPendingStrategies).mockResolvedValue(4);
    renderBadge();

    const badge = await screen.findByTestId('new-matches-badge');
    expect(badge).toHaveAttribute('href', '/strategies');
    expect(screen.getByText('4 New Matches')).toBeInTheDocument();
  });

  it('renders nothing when there are no drafts', async () => {
    vi.mocked(countPendingStrategies).mockResolvedValue(0);
    renderBadge();

    await waitFor(() => expect(countPendingStrategies).toHaveBeenCalled());
    expect(screen.queryByTestId('new-matches-badge')).not.toBeInTheDocument();
  });
});
