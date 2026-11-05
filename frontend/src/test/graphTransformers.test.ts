import { describe, expect, it } from 'vitest';
import {
  buildEdgeId,
  buildNodeId,
  formatRelationshipLabel,
  transformGraphResponse,
  truncateLabel,
} from '../components/graph/graphTransformers';
import { GraphNeighborsResponse } from '../api/types';

describe('graphTransformers', () => {
  it('formats relationship labels from SNAKE_CASE to title case', () => {
    expect(formatRelationshipLabel('SPAWNS_IN')).toBe('Spawns in');
    expect(formatRelationshipLabel('DROPS')).toBe('Drops');
    expect(formatRelationshipLabel('CONTAINS_LOOT')).toBe('Contains loot');
    expect(formatRelationshipLabel('BREEDS_WITH')).toBe('Breeds with');
    expect(formatRelationshipLabel('')).toBe('');
  });

  it('truncates labels longer than max length', () => {
    expect(truncateLabel('Zombie', 18)).toBe('Zombie');
    expect(truncateLabel('Very Long Entity Name Exceeding Bounds', 15)).toBe('Very Long Enti…');
  });

  it('generates stable deterministic node and edge IDs', () => {
    expect(buildNodeId('mob', 'Zombie')).toBe('mob:zombie');
    expect(buildNodeId('BIOME', 'Plains')).toBe('biome:plains');
    expect(buildEdgeId('mob', 'zombie', 'DROPS', 'item', 'rotten_flesh')).toBe(
      'mob:zombie->DROPS->item:rotten_flesh'
    );
    expect(buildEdgeId('mob', 'zombie', 'DROPS', 'item', 'rotten_flesh', 42)).toBe(
      'edge-42'
    );
  });

  const mockGraphResponse: GraphNeighborsResponse = {
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
      {
        entity_type: 'item',
        id: 'honey_bottle',
        name: 'Honey Bottle',
        source_type: 'astroworld_api',
        edition: 'java',
        game_version: '1.15',
      },
    ],
    edges: [
      {
        id: 101,
        source_entity_type: 'mob',
        source_entity_id: 'bee',
        relationship_type: 'SPAWNS_IN',
        target_entity_type: 'biome',
        target_entity_id: 'plains',
        source_type: 'calculated',
        metadata: { chance: 0.05 },
        explanation: 'Bee spawns naturally near Bee Nests in Plains biome.',
      },
      {
        id: 102,
        source_entity_type: 'mob',
        source_entity_id: 'bee',
        relationship_type: 'DROPS',
        target_entity_type: 'item',
        target_entity_id: 'honey_bottle',
        source_type: 'calculated',
        metadata: null,
        explanation: 'Bee produces Honey Bottle when harvested with glass bottle.',
      },
    ],
    metadata: {
      depth: 1,
      truncated: false,
      available_relationship_types: ['DROPS', 'SPAWNS_IN'],
      total_nodes: 3,
      total_edges: 2,
    },
  };

  it('transforms backend graph response into Cytoscape element definitions', () => {
    const elements = transformGraphResponse(mockGraphResponse);

    // 3 nodes + 2 edges = 5 elements
    expect(elements.length).toBe(5);

    const nodes = elements.filter((el) => el.group === 'nodes');
    const edges = elements.filter((el) => el.group === 'edges');

    expect(nodes.length).toBe(3);
    expect(edges.length).toBe(2);

    const rootNode = nodes.find((n) => n.data.id === 'mob:bee');
    expect(rootNode).toBeDefined();
    expect(rootNode?.data.isRoot).toBe(true);
    expect(rootNode?.classes).toContain('is-root');

    const plainsNode = nodes.find((n) => n.data.id === 'biome:plains');
    expect(plainsNode).toBeDefined();
    expect(plainsNode?.data.isRoot).toBe(false);

    const spawnEdge = edges.find((e) => e.data.id === 'edge-101');
    expect(spawnEdge).toBeDefined();
    expect(spawnEdge?.data.source).toBe('mob:bee');
    expect(spawnEdge?.data.target).toBe('biome:plains');
    expect(spawnEdge?.data.relationshipType).toBe('SPAWNS_IN');
    expect(spawnEdge?.data.label).toBe('Spawns in');
  });

  it('filters edges according to active relationship types', () => {
    // Only allow 'DROPS'
    const activeRelTypes = new Set(['DROPS']);
    const elements = transformGraphResponse(mockGraphResponse, activeRelTypes);

    const edges = elements.filter((el) => el.group === 'edges');
    expect(edges.length).toBe(1);
    expect(edges[0].data.relationshipType).toBe('DROPS');

    // Plains node is not connected to any active edge, so only root (bee) and honey_bottle remain
    const nodes = elements.filter((el) => el.group === 'nodes');
    expect(nodes.length).toBe(2);
    expect(nodes.some((n) => n.data.id === 'biome:plains')).toBe(false);
    expect(nodes.some((n) => n.data.id === 'item:honey_bottle')).toBe(true);
  });

  it('deduplicates duplicate nodes and edges safely', () => {
    const duplicateData: GraphNeighborsResponse = {
      root: { entity_type: 'mob', entity_id: 'bee', name: 'Bee' },
      nodes: [
        {
          entity_type: 'mob',
          id: 'bee',
          name: 'Bee',
          source_type: 'astroworld_api',
          edition: 'java',
          game_version: null,
        },
        {
          entity_type: 'mob',
          id: 'bee',
          name: 'Bee',
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
          metadata: null,
          explanation: 'Bee spawns in Plains.',
        },
        {
          id: 1,
          source_entity_type: 'mob',
          source_entity_id: 'bee',
          relationship_type: 'SPAWNS_IN',
          target_entity_type: 'biome',
          target_entity_id: 'plains',
          source_type: 'calculated',
          metadata: null,
          explanation: 'Bee spawns in Plains.',
        },
      ],
      metadata: {
        depth: 1,
        truncated: false,
        available_relationship_types: ['SPAWNS_IN'],
        total_nodes: 1,
        total_edges: 1,
      },
    };

    const elements = transformGraphResponse(duplicateData);
    const nodes = elements.filter((el) => el.group === 'nodes');
    const edges = elements.filter((el) => el.group === 'edges');

    // mob:bee and synthesized biome:plains = 2 nodes, 1 unique edge
    expect(nodes.length).toBe(2);
    expect(edges.length).toBe(1);
  });

  it('synthesizes missing endpoint nodes if omitted from backend nodes array', () => {
    const missingNodeResponse: GraphNeighborsResponse = {
      root: { entity_type: 'mob', entity_id: 'bee', name: 'Bee' },
      nodes: [],
      edges: [
        {
          id: 1,
          source_entity_type: 'mob',
          source_entity_id: 'bee',
          relationship_type: 'SPAWNS_IN',
          target_entity_type: 'biome',
          target_entity_id: 'plains',
          source_type: 'calculated',
          metadata: null,
          explanation: 'Bee spawns in Plains.',
        },
      ],
      metadata: {
        depth: 1,
        truncated: false,
        available_relationship_types: ['SPAWNS_IN'],
        total_nodes: 0,
        total_edges: 1,
      },
    };

    const elements = transformGraphResponse(missingNodeResponse);
    const nodes = elements.filter((el) => el.group === 'nodes');
    expect(nodes.some((n) => n.data.id === 'mob:bee')).toBe(true);
    expect(nodes.some((n) => n.data.id === 'biome:plains')).toBe(true);
  });
});

