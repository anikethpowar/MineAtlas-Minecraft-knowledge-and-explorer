import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import SearchPage from '../pages/SearchPage';
import * as api from '../api/mineatlasApi';
import { SearchResponse } from '../api/types';

describe('SearchPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockSearchResponse: SearchResponse = {
    query: 'zombie',
    total_results: 2,
    results: [
      {
        entity_type: 'mob',
        id: 'zombie',
        name: 'Zombie',
        subtitle: 'Hostile Undead Mob',
        description: 'Common hostile undead mob that attacks players and villagers.',
        source_type: 'astroworld_api',
        edition: 'java',
        game_version: null,
      },
      {
        entity_type: 'item',
        id: 'zombie_head',
        name: 'Zombie Head',
        subtitle: 'Decorative Item Block',
        description: 'Decorative head dropped when a zombie is killed by a charged creeper.',
        source_type: 'astroworld_api',
        edition: 'java',
        game_version: null,
      },
    ],
    by_type: {
      mob: 1,
      item: 1,
    },
  };

  it('renders initial prompt when no query is present', () => {
    render(
      <MemoryRouter initialEntries={['/search']}>
        <SearchPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Global Knowledge Search')).toBeInTheDocument();
    expect(screen.getByText('Search Minecraft Knowledge Graph')).toBeInTheDocument();
  });

  it('executes search query and renders results', async () => {
    vi.spyOn(api, 'searchEntities').mockResolvedValue(mockSearchResponse);

    render(
      <MemoryRouter initialEntries={['/search?q=zombie']}>
        <SearchPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Zombie')).toBeInTheDocument();
      expect(screen.getByText('Zombie Head')).toBeInTheDocument();
    });

    expect(screen.getByTestId('search-result-zombie')).toBeInTheDocument();
    expect(screen.getByTestId('search-result-zombie_head')).toBeInTheDocument();
    expect(screen.getAllByText('View Entity Details').length).toBe(2);
  });

  it('renders empty state when search returns zero results', async () => {
    vi.spyOn(api, 'searchEntities').mockResolvedValue({
      query: 'nonexistent',
      total_results: 0,
      results: [],
      by_type: {},
    });

    render(
      <MemoryRouter initialEntries={['/search?q=nonexistent']}>
        <SearchPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No results found for "nonexistent"')).toBeInTheDocument();
    });
  });

  it('handles search API failure gracefully', async () => {
    vi.spyOn(api, 'searchEntities').mockRejectedValue(new Error('Backend connection refused'));

    render(
      <MemoryRouter initialEntries={['/search?q=crash']}>
        <SearchPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      expect(screen.getByText('Backend connection refused')).toBeInTheDocument();
    });
  });
});
