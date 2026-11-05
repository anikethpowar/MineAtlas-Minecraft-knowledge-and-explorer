import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../api/mineatlasApi';
import { FarmDetail, FarmListItem } from '../api/types';
import { FarmDetailPage } from '../pages/FarmDetailPage';
import { FarmsPage } from '../pages/FarmsPage';

const mockFarmsList: FarmListItem[] = [
  {
    id: 'iron-farm',
    name: 'Iron Golem Farm (Panic Chamber)',
    category: 'iron',
    difficulty: 'Intermediate',
    dimension: 'Overworld',
    estimated_output_per_hour: '~300–330 Iron Ingots/hour',
    summary: 'A compact single-cell Overworld iron farm utilizing 3 panicked villagers.',
    compatibility_label: 'Minecraft Java Edition 1.14 - 1.21+',
    source_type: 'curated',
    edition: 'java',
    last_verified_at: '2026-11-05T00:00:00Z',
  },
  {
    id: 'raid-farm',
    name: 'Bad Omen Raid Farm (Ocean / High-Altitude)',
    category: 'mob',
    difficulty: 'Advanced',
    dimension: 'Overworld',
    estimated_output_per_hour: 'High yield of Emeralds & Totems of Undying',
    summary: 'An elevated Overworld raid farm that isolates raid mob spawns over deep ocean water.',
    compatibility_label: 'Minecraft Java Edition 1.14 - 1.21+ (Requires Ominous Bottle in 1.21+)',
    source_type: 'curated',
    edition: 'java',
    last_verified_at: '2026-11-05T00:00:00Z',
  },
  {
    id: 'villager-breeder',
    name: 'Automatic Villager Breeder (Gap & Chute)',
    category: 'villager',
    difficulty: 'Beginner',
    dimension: 'Overworld',
    estimated_output_per_hour: 'Continuous baby villagers',
    summary: 'A simple, humane villager breeding cell utilizing 2 adult villagers.',
    compatibility_label: 'Minecraft Java Edition 1.14 - 1.21+',
    source_type: 'curated',
    edition: 'java',
    last_verified_at: '2026-11-05T00:00:00Z',
  },
];

const mockFarmDetail: FarmDetail = {
  id: 'iron-farm',
  name: 'Iron Golem Farm (Panic Chamber)',
  category: 'iron',
  difficulty: 'Intermediate',
  dimension: 'Overworld',
  summary: 'A compact single-cell Overworld iron farm utilizing 3 panicked villagers.',
  description: 'This design relies on Minecraft Java Edition panic mechanics.',
  estimated_output_per_hour: '~300–330 Iron Ingots/hour',
  compatibility_label: 'Minecraft Java Edition 1.14 - 1.21+',
  coverage_note: 'Curated Java Edition guide. Unverified on Bedrock Edition.',
  safety_note: 'Install a lightning rod at least 15 blocks away from villagers.',
  maintenance_summary: 'Check storage hoppers periodically for backlogs.',
  notes: 'Clear perimeter within 16 blocks.',
  outputs: [
    {
      item: 'iron_ingot',
      label: 'Iron Ingot',
      rate: '300-330 / hour',
      is_primary: true,
      note: 'Collected via hoppers below lava blade.',
    },
    {
      item: 'poppy',
      label: 'Poppy',
      rate: '70-80 / hour',
      is_primary: false,
      note: 'Composted for bone meal.',
    },
  ],
  prerequisites: [
    'Access to at least 3 villagers.',
    '1 hostile mob with a Name Tag.',
  ],
  materials: [
    {
      item: 'Solid Building Blocks',
      amount: 64,
      category: 'Building',
      note: 'Walls and platform.',
    },
    {
      item: 'Beds',
      amount: 3,
      category: 'Villager',
      note: 'Placed near villagers.',
    },
  ],
  build_steps: [
    {
      step_number: 1,
      title: 'Perimeter Clearance & Foundation Pillar',
      description: 'Pillar up 10-12 blocks above ground.',
      why_it_matters: 'Prevents golems from spawning on surrounding terrain.',
    },
    {
      step_number: 2,
      title: 'Villager Pod & Bed Placement',
      description: 'Place 3 beds in a 3x3 glass room.',
      why_it_matters: 'Villagers must access beds to reset their sleep timer.',
    },
  ],
  troubleshooting: [
    {
      issue: 'No Iron Golems are spawning.',
      likely_cause: 'Villagers have unbroken line-of-sight and have never slept.',
      suggested_check: 'Ensure the zombie bobs below eye level.',
    },
  ],
  diagram_data: {
    type: 'schematic',
    zones: [
      { id: 'villager_pod', label: 'Villager Pod (3 Beds)' },
      { id: 'zombie_tube', label: 'Zombie Bobbing Tube' },
      { id: 'spawn_platform', label: 'Golem Spawning Platform' },
    ],
  },
  source_references: [
    {
      title: 'Minecraft Java Edition Iron Golem Spawning Mechanics',
      url: 'https://minecraft.wiki/w/Iron_Golem',
      note: 'Panic behavior verification.',
    },
  ],
  source_type: 'curated',
  source_url: 'https://minecraft.wiki/w/Iron_Golem',
  edition: 'java',
  game_version: '1.21+',
  last_verified_at: '2026-11-05T00:00:00Z',
  created_at: '2026-11-05T00:00:00Z',
  updated_at: '2026-11-05T00:00:00Z',
};

describe('Curated Farm Blueprint Hub', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. renders Farm Hub list page with farm cards from mocked backend data', async () => {
    vi.spyOn(api, 'getFarms').mockResolvedValue({
      data: mockFarmsList,
      pagination: { page: 1, page_size: 20, total_items: 3, total_pages: 1 },
      filters: {},
    });

    render(
      <MemoryRouter initialEntries={['/farms']}>
        <FarmsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading curated Minecraft Java farm guides/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Farm Blueprint Hub')).toBeInTheDocument();
      expect(screen.getByText('Iron Golem Farm (Panic Chamber)')).toBeInTheDocument();
      expect(screen.getByText('Bad Omen Raid Farm (Ocean / High-Altitude)')).toBeInTheDocument();
      expect(screen.getByText('Automatic Villager Breeder (Gap & Chute)')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Intermediate').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Advanced').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Beginner').length).toBeGreaterThanOrEqual(1);
  });

  it('2. supports search and difficulty filter interactions', async () => {
    const getFarmsSpy = vi.spyOn(api, 'getFarms').mockResolvedValue({
      data: [mockFarmsList[0]],
      pagination: { page: 1, page_size: 20, total_items: 1, total_pages: 1 },
      filters: { search: 'Iron' },
    });

    render(
      <MemoryRouter initialEntries={['/farms']}>
        <FarmsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search farm guides/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search farm guides/i);
    fireEvent.change(searchInput, { target: { value: 'Iron' } });
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));

    await waitFor(() => {
      expect(getFarmsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Iron' })
      );
    });
  });

  it('3. renders empty state and error state correctly', async () => {
    // Empty state
    vi.spyOn(api, 'getFarms').mockResolvedValueOnce({
      data: [],
      pagination: { page: 1, page_size: 20, total_items: 0, total_pages: 0 },
      filters: {},
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={['/farms']}>
        <FarmsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No farm guides found')).toBeInTheDocument();
    });

    unmount();

    // Error state
    vi.spyOn(api, 'getFarms').mockRejectedValueOnce(new Error('Connection lost to local SQLite.'));

    render(
      <MemoryRouter initialEntries={['/farms']}>
        <FarmsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Connection lost to local SQLite/i)).toBeInTheDocument();
    });
  });

  it('4. Farm detail page renders curated, source, and compatibility warnings', async () => {
    vi.spyOn(api, 'getFarmBySlug').mockResolvedValue(mockFarmDetail);

    render(
      <MemoryRouter initialEntries={['/farms/iron-farm']}>
        <Routes>
          <Route path="/farms/:farmSlug" element={<FarmDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Iron Golem Farm \(Panic Chamber\)/i })).toBeInTheDocument();
    });

    // Check badges and warning banner
    const warning = screen.getByTestId('compatibility-warning');
    expect(warning).toHaveTextContent(/Compatibility Notice: Minecraft Java Edition 1.14 - 1.21+/i);
    expect(warning).toHaveTextContent(/Curated Java Edition guide/i);
    expect(screen.getByText(/Install a lightning rod at least 15 blocks away/i)).toBeInTheDocument();
  });

  it('5. Interactive checklist allows checking and resetting items', async () => {
    vi.spyOn(api, 'getFarmBySlug').mockResolvedValue(mockFarmDetail);

    render(
      <MemoryRouter initialEntries={['/farms/iron-farm']}>
        <Routes>
          <Route path="/farms/:farmSlug" element={<FarmDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('materials-checklist')).toBeInTheDocument();
    });

    expect(screen.getByText('0 of 2 gathered')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(2);

    // Check first material
    fireEvent.click(checkboxes[0]);
    expect(screen.getByText('1 of 2 gathered')).toBeInTheDocument();

    // Reset button appears
    const resetButton = screen.getByRole('button', { name: /Reset Checklist/i });
    expect(resetButton).toBeInTheDocument();

    // Click reset
    fireEvent.click(resetButton);
    expect(screen.getByText('0 of 2 gathered')).toBeInTheDocument();
  });

  it('6. Build process steps render in order with "Why this step matters"', async () => {
    vi.spyOn(api, 'getFarmBySlug').mockResolvedValue(mockFarmDetail);

    render(
      <MemoryRouter initialEntries={['/farms/iron-farm']}>
        <Routes>
          <Route path="/farms/:farmSlug" element={<FarmDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Perimeter Clearance & Foundation Pillar')).toBeInTheDocument();
      expect(screen.getByText('Villager Pod & Bed Placement')).toBeInTheDocument();
    });

    expect(screen.getByText(/Prevents golems from spawning on surrounding terrain/i)).toBeInTheDocument();
    expect(screen.getByText(/Villagers must access beds to reset their sleep timer/i)).toBeInTheDocument();
  });

  it('7. Schematic diagram provides accessible labels and text descriptions', async () => {
    vi.spyOn(api, 'getFarmBySlug').mockResolvedValue(mockFarmDetail);

    render(
      <MemoryRouter initialEntries={['/farms/iron-farm']}>
        <Routes>
          <Route path="/farms/:farmSlug" element={<FarmDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('farm-schematic-diagram')).toBeInTheDocument();
    });

    expect(screen.getByRole('img', { name: /Iron Golem Farm Elevation Schematic/i })).toBeInTheDocument();
    expect(screen.getByText('Villager Pod (3 Beds)')).toBeInTheDocument();
    expect(screen.getByText('Zombie Bobbing Tube')).toBeInTheDocument();
    expect(screen.getByText('Golem Spawning Platform')).toBeInTheDocument();
  });

  it('8. "Explore this farm\'s connections" creates the correct graph URL', async () => {
    vi.spyOn(api, 'getFarmBySlug').mockResolvedValue(mockFarmDetail);

    render(
      <MemoryRouter initialEntries={['/farms/iron-farm']}>
        <Routes>
          <Route path="/farms/:farmSlug" element={<FarmDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Explore this farm's connections/i })).toBeInTheDocument();
    });

    const graphLink = screen.getByRole('link', { name: /Explore this farm's connections/i });
    expect(graphLink).toHaveAttribute('href', '/graph?type=farm&id=iron-farm&depth=1');
  });
});
