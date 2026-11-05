import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../api/mineatlasApi';
import {
  BiomeMatchesResponse,
  PortalConvertResponse,
  SpawnSphereResponse,
  WorldReferenceResponse,
} from '../api/types';
import WorldPage from '../pages/WorldPage';
import PortalConverter from '../components/world/PortalConverter';
import BiomeCriteriaExplorer from '../components/world/BiomeCriteriaExplorer';
import SpawnSphereVisualizer from '../components/world/SpawnSphereVisualizer';

const mockWorldRef: WorldReferenceResponse = {
  title: 'Minecraft Java Edition World Atlas Reference',
  edition: 'java',
  dimensions: [
    {
      id: 'overworld',
      name: 'The Overworld',
      role: 'Primary habitable starting realm with day-night cycle.',
      description: 'The main world realm spanning from Y=-64 to Y=320.',
      coordinate_scale: '1:1 (Baseline)',
      skylight: true,
      bed_safe: true,
      min_y: -64,
      max_y: 320,
      source_type: 'curated',
      edition: 'java',
    },
    {
      id: 'nether',
      name: 'The Nether',
      role: 'Lava-filled subterranean realm used for fast travel.',
      description: 'Subterranean realm with an 8:1 travel ratio.',
      coordinate_scale: '8:1',
      skylight: false,
      bed_safe: false,
      min_y: 0,
      max_y: 256,
      source_type: 'curated',
      edition: 'java',
    },
    {
      id: 'the_end',
      name: 'The End',
      role: 'Floating void islands, home of the Ender Dragon.',
      description: 'A dark, starless dimension hovering over an infinite void.',
      coordinate_scale: 'Separate Realm',
      skylight: false,
      bed_safe: false,
      min_y: 0,
      max_y: 256,
      source_type: 'curated',
      edition: 'java',
    },
  ],
  coordinate_system: {
    x_axis: 'East (+) / West (-): Horizontal axis.',
    y_axis: 'Altitude / Height: Vertical elevation from Y=-64 to Y=320.',
    z_axis: 'South (+) / North (-): Horizontal axis.',
    origin_point: 'The coordinates (X:0, Z:0) represent the world origin.',
    world_border: 'World border located at X/Z ±29,999,984 blocks.',
  },
  dimension_travel_rules: [
    'Overworld & The Nether: Horizontal coordinates scale at an exact 8:1 ratio.',
    'Nether Portals: Nether portal search checks a 128-block radius in the target dimension.',
    'The End: Accessed exclusively via End Portals in Strongholds.',
  ],
  seed_limitation_statement: 'MineAtlas does not analyse arbitrary seeds or locate structures for a seed.',
  provenance: { source_type: 'curated', edition: 'java' },
};

const mockPortalResponse: PortalConvertResponse = {
  result_type: 'Calculated Result',
  source_dimension: 'overworld',
  target_dimension: 'nether',
  source_coordinates: { x: 800, y: 64, z: -1600 },
  target_coordinates: { x: 100, y: 64, z: -200 },
  formula_name: '8:1 Overworld to Nether Horizontal Compression',
  formula_expression: 'target_x = source_x / 8, target_z = source_z / 8',
  formula_explanation: 'Divide Overworld horizontal coordinates by 8.',
  assumptions: ['Direct linkage without obstruction.'],
  limitations: ['Coordinate-scale target only, not guaranteed exact portal link.'],
  provenance: { source_type: 'calculated', edition: 'java' },
};

const mockBiomeMatchesResponse: BiomeMatchesResponse = {
  result_type: 'Calculated Result',
  criteria: { beginner_friendly: true },
  total_matches: 1,
  data: [
    {
      biome: {
        id: 'minecraft:plains',
        name: 'Plains',
        dimension: 'overworld',
        category: 'plains',
        rarity: 'common',
        temperature: 0.8,
        precipitation: 'rain',
      },
      match_reasons: [
        'Located in the Overworld dimension.',
        'Meets beginner-friendly criteria: Overworld, common rarity, and temperate climate.',
      ],
      source: { source_type: 'calculated', edition: 'java' },
    },
  ],
  limitations: [
    'These results identify matching biome types from the MineAtlas cache. They do not locate a biome in your personal Minecraft seed.',
  ],
  provenance: { source_type: 'calculated', edition: 'java' },
};

const mockSphereResponse: SpawnSphereResponse = {
  result_type: 'Calculated Result',
  measurements: {
    radius: 128,
    diameter: 256,
    circular_area_blocks: 51471.85,
    sphere_volume_blocks: 8784529.76,
    circumference_blocks: 804.25,
    vertical_range: { min_y: -64, max_y: 192 },
  },
  geometric_explanation: 'A planning radius of 128 blocks defines an area of 51,471.85 blocks².',
  formulas_used: {
    diameter: '2 * r',
    circular_area_2d: 'π * r²',
    sphere_volume_3d: '(4/3) * π * r³',
    circumference: '2 * π * r',
  },
  assumptions: ['Euclidean distance.'],
  limitations: ['Geometric planning measurements, not guaranteed spawn simulation.'],
  provenance: { source_type: 'calculated', edition: 'java' },
};

describe('Phase 9: Calculated World Atlas Tools', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'getWorldReference').mockResolvedValue(mockWorldRef);
    vi.spyOn(api, 'convertPortalCoordinates').mockResolvedValue(mockPortalResponse);
    vi.spyOn(api, 'getBiomeMatches').mockResolvedValue(mockBiomeMatchesResponse);
    vi.spyOn(api, 'calculateSpawnSphere').mockResolvedValue(mockSphereResponse);
  });

  it('1. Renders World Atlas overview with curated dimension cards and travel rules', async () => {
    render(
      <MemoryRouter initialEntries={['/world']}>
        <Routes>
          <Route path="/world" element={<WorldPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify main header
    expect(
      screen.getByRole('heading', { level: 1, name: /Calculated World Atlas & Coordinate Tools/i })
    ).toBeInTheDocument();

    // Verify dimension cards load
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'The Overworld' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'The Nether' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'The End' })).toBeInTheDocument();
    });

    // Check bed usability notes
    expect(screen.getByText('Safe to Sleep')).toBeInTheDocument();
    expect(screen.getAllByText('Explodes!')).toHaveLength(2);

    // Verify travel rules rendered
    expect(
      screen.getByText(/Horizontal coordinates scale at an exact 8:1 ratio/i)
    ).toBeInTheDocument();
  });

  it('2. Coordinates diagram renders accessible elements and altitude slices', async () => {
    render(
      <MemoryRouter initialEntries={['/world']}>
        <WorldPage />
      </MemoryRouter>
    );

    // Accessible title & altitude slices
    expect(
      screen.getByRole('img', {
        name: /Minecraft Java Edition Coordinate System and Altitude Diagram/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText('Y = 320')).toBeInTheDocument();
    expect(screen.getByText('Y = 63')).toBeInTheDocument();
    expect(screen.getByText('Y = -64')).toBeInTheDocument();
    expect(screen.getByText(/World Border: X\/Z ±29,999,984/i)).toBeInTheDocument();
  });

  it('3. Portal Converter converts coordinates, toggles direction, and copies target', async () => {
    // Mock navigator.clipboard
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<PortalConverter />);

    expect(
      screen.getByRole('heading', { level: 3, name: /Nether Portal Coordinate Converter/i })
    ).toBeInTheDocument();

    // Fill in coordinates
    const inputX = screen.getByLabelText(/Source X/i);
    const inputY = screen.getByLabelText(/Altitude Y/i);
    const inputZ = screen.getByLabelText(/Source Z/i);

    fireEvent.change(inputX, { target: { value: '800' } });
    fireEvent.change(inputY, { target: { value: '64' } });
    fireEvent.change(inputZ, { target: { value: '-1600' } });

    // Submit calculation
    const calcButton = screen.getByRole('button', { name: /Calculate Coordinates/i });
    fireEvent.click(calcButton);

    await waitFor(() => {
      expect(api.convertPortalCoordinates).toHaveBeenCalledWith({
        source_dimension: 'overworld',
        x: 800,
        y: 64,
        z: -1600,
      });
    });

    // Verify result display
    expect(screen.getByText(/Calculated Target Coordinates/i)).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('-200')).toBeInTheDocument();

    // Click Copy Target Coordinates
    const copyButton = screen.getByRole('button', { name: /Copy Target Coordinates/i });
    fireEvent.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledWith('X: 100, Y: 64, Z: -200');
    expect(screen.getByText(/Copied Coordinates!/i)).toBeInTheDocument();

    // Test direction toggle
    const toggleButton = screen.getByRole('button', { name: /Direction:/i });
    fireEvent.click(toggleButton);

    expect(screen.getByText(/Nether → Overworld/i)).toBeInTheDocument();
  });

  it('4. Biome Criteria Explorer filters biomes and displays deterministic reasons & disclaimer', async () => {
    render(
      <MemoryRouter>
        <BiomeCriteriaExplorer />
      </MemoryRouter>
    );

    // Verify seed disclaimer is always visible
    expect(
      screen.getByText(/MineAtlas does not analyse arbitrary seeds/i)
    ).toBeInTheDocument();

    // Check search results
    await waitFor(() => {
      expect(screen.getByText('Plains')).toBeInTheDocument();
    });

    // Check deterministic match reasons rendered
    expect(
      screen.getByText('Located in the Overworld dimension.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Meets beginner-friendly criteria/i)
    ).toBeInTheDocument();

    // Link to biome detail
    const detailLink = screen.getByRole('link', { name: /Explore Biome/i });
    expect(detailLink).toHaveAttribute('href', '/biomes/minecraft:plains');
  });

  it('5. Biome Criteria Explorer handles empty match state gracefully', async () => {
    vi.spyOn(api, 'getBiomeMatches').mockResolvedValueOnce({
      result_type: 'Calculated Result',
      criteria: {},
      total_matches: 0,
      data: [],
      limitations: ['No seed simulation.'],
      provenance: { source_type: 'calculated', edition: 'java' },
    });

    render(
      <MemoryRouter>
        <BiomeCriteriaExplorer />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No Matching Biomes Found')).toBeInTheDocument();
    });
  });

  it('6. Spawn Sphere Visualizer calculates 2D/3D metrics and responds to preset buttons', async () => {
    render(<SpawnSphereVisualizer />);

    expect(
      screen.getByRole('heading', { level: 3, name: /Spawn Sphere & Despawn Radius Visualizer/i })
    ).toBeInTheDocument();

    // Check geometric disclaimer banner
    expect(
      screen.getByText(/Geometric Planning Model:/i)
    ).toBeInTheDocument();

    // Click 32-block preset
    const preset32 = screen.getByRole('button', { name: /32 Blocks \(Pathfinding Limit\)/i });
    fireEvent.click(preset32);

    await waitFor(() => {
      expect(api.calculateSpawnSphere).toHaveBeenCalledWith({
        radius: 32,
        player_y: 64,
      });
    });

    // Verify formula tags
    expect(screen.getByText('D = 2r')).toBeInTheDocument();
    expect(screen.getByText('Area = πr²')).toBeInTheDocument();
    expect(screen.getByText('Vol = (4/3)πr³')).toBeInTheDocument();

    // Verify SVG diagram element
    expect(
      screen.getByRole('img', { name: /Minecraft Mob Spawn and Despawn Radius Diagram/i })
    ).toBeInTheDocument();
  });

  it('7. Sub-tab navigation switches between Atlas, Portal, Biomes, and Spawn Sphere views', async () => {
    render(
      <MemoryRouter initialEntries={['/world']}>
        <WorldPage />
      </MemoryRouter>
    );

    // Initial Overview tab
    expect(screen.getByRole('button', { name: 'World Atlas & Coordinates' })).toHaveClass('bg-emerald-600');

    // Switch to Portal tab
    const portalTab = screen.getByRole('button', { name: 'Nether Portal Converter' });
    fireEvent.click(portalTab);
    expect(portalTab).toHaveClass('bg-emerald-600');

    // Switch to Biomes tab
    const biomesTab = screen.getByRole('button', { name: 'Biome Criteria Explorer' });
    fireEvent.click(biomesTab);
    expect(biomesTab).toHaveClass('bg-emerald-600');

    // Switch to Sphere tab
    const sphereTab = screen.getByRole('button', { name: 'Spawn Sphere Visualizer' });
    fireEvent.click(sphereTab);
    expect(sphereTab).toHaveClass('bg-emerald-600');
  });
});
