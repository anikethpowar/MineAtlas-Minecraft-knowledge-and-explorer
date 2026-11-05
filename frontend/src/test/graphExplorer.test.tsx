import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../api/mineatlasApi';
import { GraphNeighborsResponse, SearchResponse } from '../api/types';
import GraphExplorer from '../components/graph/GraphExplorer';

// Mock cytoscape for JSDOM environment so canvas tests run smoothly
vi.mock('cytoscape', () => {
  return {
    default: vi.fn(() => ({
      on: vi.fn(),
      destroy: vi.fn(),
      resize: vi.fn(),
      fit: vi.fn(),
      center: vi.fn(),
      zoom: vi.fn(() => 1),
      width: vi.fn(() => 800),
      height: vi.fn(() => 600),
      layout: vi.fn(() => ({ run: vi.fn() })),
    })),
  };
});

describe('GraphExplorer Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockBeeGraph: GraphNeighborsResponse = {
    root: {
      entity_type: 'mob',
      entity_id: 'bee',
      name: 'Bee',
    },
    nodes: [
      {
        entity_type: 'mob',
        id: 'bee',
        name: 'Bee',
        source_type: 'astroworld_api',
        edition: 'java',
        game_version: '1.15',
      },
      {
        entity_type: 'biome',
        id: 'plains',
        name: 'Plains',
        source_type: 'astroworld_api',
        edition: 'java',
        game_version: null,
      },
    ],
    edges: [
      {
        id: 1,
        source_entity_type: 'mob',
        source_entity_id: 'bee',
        relationship_type: 'SPAWNS_IN',
        target_entity_type: 'biome',
        target_entity_id: 'plains',
        source_type: 'calculated',
        metadata: { chance: 0.05, condition: 'Near bee nests' },
        explanation: 'Bee spawns naturally near Bee Nests in Plains biome.',
      },
    ],
    metadata: {
      depth: 1,
      truncated: false,
      available_relationship_types: ['SPAWNS_IN'],
      total_nodes: 2,
      total_edges: 1,
    },
  };

  it('renders initial empty prompt when no entity is specified in the URL', () => {
    render(
      <MemoryRouter initialEntries={['/graph']}>
        <GraphExplorer />
      </MemoryRouter>
    );

    expect(screen.getByText('Knowledge Graph Explorer')).toBeInTheDocument();
    expect(screen.getByTestId('graph-initial-prompt')).toBeInTheDocument();
    expect(
      screen.getByText('Select an Entity to Explore Connections')
    ).toBeInTheDocument();
  });

  it('allows choosing a root entity via search autocomplete', async () => {
    const mockSearchRes: SearchResponse = {
      query: 'bee',
      total_results: 1,
      results: [
        {
          entity_type: 'mob',
          id: 'bee',
          name: 'Bee',
          subtitle: 'neutral | arthropod',
          description: 'Neutral flying mob that pollinates crops.',
          source_type: 'astroworld_api',
          edition: 'java',
          game_version: '1.15',
        },
      ],
      by_type: { mob: 1 },
    };

    vi.spyOn(api, 'searchEntities').mockResolvedValue(mockSearchRes);
    vi.spyOn(api, 'getGraphNeighbors').mockResolvedValue(mockBeeGraph);

    render(
      <MemoryRouter initialEntries={['/graph']}>
        <GraphExplorer />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(
      /Search for a mob, biome, item, or structure to begin exploring/i
    );
    fireEvent.change(searchInput, { target: { value: 'bee' } });

    await waitFor(() => {
      expect(screen.getByTestId('search-suggestions-dropdown')).toBeInTheDocument();
    });

    const dropdown = screen.getByTestId('search-suggestions-dropdown');
    const suggestionBtn = within(dropdown).getByRole('button');
    fireEvent.click(suggestionBtn);

    await waitFor(() => {
      expect(api.getGraphNeighbors).toHaveBeenCalledWith('mob', 'bee', 1);
    });
  });

  it('loads graph data and emphasizes root node from URL query parameters', async () => {
    vi.spyOn(api, 'getGraphNeighbors').mockResolvedValue(mockBeeGraph);

    render(
      <MemoryRouter initialEntries={['/graph?type=mob&id=bee&depth=1']}>
        <GraphExplorer />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.getGraphNeighbors).toHaveBeenCalledWith('mob', 'bee', 1);
      expect(screen.getByTestId('cytoscape-canvas')).toBeInTheDocument();
      expect(screen.getByText('Visual Legend & Entity Shapes')).toBeInTheDocument();
    });
  });

  it('handles API error state with retry action', async () => {
    vi.spyOn(api, 'getGraphNeighbors').mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter initialEntries={['/graph?type=mob&id=error_entity&depth=1']}>
        <GraphExplorer />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('safely corrects invalid depth values to depth 1', async () => {
    vi.spyOn(api, 'getGraphNeighbors').mockResolvedValue(mockBeeGraph);

    render(
      <MemoryRouter initialEntries={['/graph?type=mob&id=bee&depth=999']}>
        <GraphExplorer />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Depth 999 is safely clamped to 1
      expect(api.getGraphNeighbors).toHaveBeenCalledWith('mob', 'bee', 1);
    });
  });

  it('requests depth 2 when depth 2 is selected', async () => {
    vi.spyOn(api, 'getGraphNeighbors').mockResolvedValue({
      ...mockBeeGraph,
      metadata: { ...mockBeeGraph.metadata, depth: 2 },
    });

    render(
      <MemoryRouter initialEntries={['/graph?type=mob&id=bee&depth=2']}>
        <GraphExplorer />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.getGraphNeighbors).toHaveBeenCalledWith('mob', 'bee', 2);
    });
  });

  it('displays truncated warning banner when backend reports truncated: true', async () => {
    vi.spyOn(api, 'getGraphNeighbors').mockResolvedValue({
      ...mockBeeGraph,
      metadata: { ...mockBeeGraph.metadata, truncated: true },
    });

    render(
      <MemoryRouter initialEntries={['/graph?type=mob&id=bee&depth=1']}>
        <GraphExplorer />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('truncated-warning')).toBeInTheDocument();
      expect(screen.getByText(/Neighborhood exceeded 50 relationship edges/i)).toBeInTheDocument();
    });
  });

  it('switches between Visual Graph and Accessible Relationship List', async () => {
    vi.spyOn(api, 'getGraphNeighbors').mockResolvedValue(mockBeeGraph);

    render(
      <MemoryRouter initialEntries={['/graph?type=mob&id=bee&depth=1']}>
        <GraphExplorer />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('cytoscape-canvas')).toBeInTheDocument();
    });

    // Click "Relationship List" toggle button
    const listToggleBtn = screen.getByRole('button', { name: /Relationship List/i });
    fireEvent.click(listToggleBtn);

    expect(screen.getByTestId('graph-accessibility-view')).toBeInTheDocument();
    expect(screen.getByText(/Bee spawns naturally near Bee Nests in Plains biome/i)).toBeInTheDocument();
  });

  it('displays edge details and deterministic explanation when selected', async () => {
    vi.spyOn(api, 'getGraphNeighbors').mockResolvedValue(mockBeeGraph);

    render(
      <MemoryRouter initialEntries={['/graph?type=mob&id=bee&depth=1']}>
        <GraphExplorer />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('graph-details-panel')).toBeInTheDocument();
    });

    // Switch to list view to select the edge row easily
    const listToggleBtn = screen.getByRole('button', { name: /Relationship List/i });
    fireEvent.click(listToggleBtn);

    const edgeArticle = screen.getByRole('article');
    fireEvent.click(edgeArticle);

    // Selected edge details should be displayed in the Details Panel
    await waitFor(() => {
      const detailsPanel = screen.getByTestId('graph-details-panel');
      expect(within(detailsPanel).getByText('Why Connected?')).toBeInTheDocument();
      expect(
        within(detailsPanel).getByText(/Bee spawns naturally near Bee Nests in Plains biome/i)
      ).toBeInTheDocument();
      expect(within(detailsPanel).getByText('Relationship Metadata')).toBeInTheDocument();
      expect(within(detailsPanel).getByText('5.0% (0.05)')).toBeInTheDocument();
    });
  });

  it('renders graceful empty state for entities with zero relationships', async () => {
    vi.spyOn(api, 'getGraphNeighbors').mockResolvedValue({
      root: { entity_type: 'mob', entity_id: 'zombie', name: 'Zombie' },
      nodes: [
        {
          entity_type: 'mob',
          id: 'zombie',
          name: 'Zombie',
          source_type: 'astroworld_api',
          edition: 'java',
          game_version: null,
        },
      ],
      edges: [],
      metadata: {
        depth: 1,
        truncated: false,
        available_relationship_types: [],
        total_nodes: 1,
        total_edges: 0,
      },
    });

    render(
      <MemoryRouter initialEntries={['/graph?type=mob&id=zombie&depth=1']}>
        <GraphExplorer />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/No derived relationships recorded for "Zombie"/i)
      ).toBeInTheDocument();
    });
  });
});
