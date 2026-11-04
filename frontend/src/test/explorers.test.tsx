import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import MobsPage from '../pages/MobsPage';
import BiomesPage from '../pages/BiomesPage';
import ItemsPage from '../pages/ItemsPage';
import StructuresPage from '../pages/StructuresPage';
import CoverageNote from '../components/common/CoverageNote';
import PaginationControls from '../components/common/PaginationControls';
import * as api from '../api/mineatlasApi';

describe('Explorers Listing and Common Controls', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders CoverageNote with explicit 100 representative items disclaimer', () => {
    render(<CoverageNote entityType="item" />);
    expect(screen.getByText(/Items & Key Blocks Explorer/i)).toBeInTheDocument();
    expect(screen.getByText(/currently indexing 100 key representative items/i)).toBeInTheDocument();
    expect(screen.getByText(/does not claim full block registry coverage/i)).toBeInTheDocument();
  });

  it('renders PaginationControls with accurate bounds and buttons', () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        pagination={{
          page: 2,
          page_size: 20,
          total_items: 76,
          total_pages: 4,
        }}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByText('21')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('76')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders MobsPage with cached mobs and combat stats', async () => {
    vi.spyOn(api, 'getMobs').mockResolvedValue({
      data: [
        {
          id: 'creeper',
          name: 'Creeper',
          mob_type: 'hostile',
          category: 'monster',
          hp: 20,
          tameable: false,
          breedable: false,
          version_added: '1.0',
        },
      ],
      pagination: {
        page: 1,
        page_size: 20,
        total_items: 1,
        total_pages: 1,
      },
      filters: {},
    });

    render(
      <MemoryRouter initialEntries={['/mobs']}>
        <MobsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Creeper')).toBeInTheDocument();
      expect(screen.getByText('creeper')).toBeInTheDocument();
      expect(screen.getByText('20 HP (10 ♥)')).toBeInTheDocument();
    });
  });

  it('renders ItemsPage with representative items and stack sizes', async () => {
    vi.spyOn(api, 'getItems').mockResolvedValue({
      data: [
        {
          id: 'diamond_sword',
          name: 'Diamond Sword',
          category: 'combat',
          stack_size: 1,
          durability: 1561,
          enchantable: true,
          version_added: '1.0',
        },
      ],
      pagination: {
        page: 1,
        page_size: 20,
        total_items: 1,
        total_pages: 1,
      },
      filters: {},
    });

    render(
      <MemoryRouter initialEntries={['/items']}>
        <ItemsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Diamond Sword')).toBeInTheDocument();
      expect(screen.getByText('1561 uses')).toBeInTheDocument();
      expect(screen.getByText('Enchantable')).toBeInTheDocument();
    });
  });

  it('renders BiomesPage with dimension and temperature', async () => {
    vi.spyOn(api, 'getBiomes').mockResolvedValue({
      data: [
        {
          id: 'plains',
          name: 'Plains',
          dimension: 'overworld',
          category: 'temperate',
          temperature: 0.8,
          precipitation: 'rain',
          rarity: 'common',
          version_added: '1.0',
        },
      ],
      pagination: {
        page: 1,
        page_size: 20,
        total_items: 1,
        total_pages: 1,
      },
      filters: {},
    });

    render(
      <MemoryRouter initialEntries={['/biomes']}>
        <BiomesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Plains', level: 3 })).toBeInTheDocument();
      expect(screen.getByText('0.8°C')).toBeInTheDocument();
      expect(screen.getByText('rain')).toBeInTheDocument();
    });
  });

  it('renders StructuresPage with altitude ranges', async () => {
    vi.spyOn(api, 'getStructures').mockResolvedValue({
      data: [
        {
          id: 'village',
          name: 'Village',
          dimension: 'overworld',
          category: 'settlement',
          rarity: 'common',
          y_min: 60,
          y_max: 120,
          version_added: '1.0',
        },
      ],
      pagination: {
        page: 1,
        page_size: 20,
        total_items: 1,
        total_pages: 1,
      },
      filters: {},
    });

    render(
      <MemoryRouter initialEntries={['/structures']}>
        <StructuresPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Village')).toBeInTheDocument();
      expect(screen.getByText('Y: 60 to 120')).toBeInTheDocument();
    });
  });
});
