/**
 * Graph Data Transformer for MineAtlas
 *
 * Converts backend GraphNeighborsResponse models into sanitized,
 * stable Cytoscape.js ElementDefinition nodes and edges.
 *
 * Enforces:
 * - Stable unique node IDs: `${entity_type}:${id}`
 * - Stable unique edge IDs: `${source_type}:${source_id}->${rel}->${target_type}:${target_id}`
 * - Deduplication of nodes and edges
 * - Synthesis of missing endpoints to prevent Cytoscape initialization errors
 * - Sanitized data without raw HTML or unescaped injection
 */

import { ElementDefinition } from 'cytoscape';
import { GraphEdge, GraphNeighborsResponse } from '../../api/types';

export interface CytoscapeNodeData {
  id: string;
  entityId: string;
  entityType: string;
  name: string;
  label: string;
  isRoot: boolean;
  sourceType: string;
  edition: string;
  gameVersion: string | null;
}

export interface CytoscapeEdgeData {
  id: string;
  source: string;
  target: string;
  relationshipType: string;
  label: string;
  sourceType: string;
  metadata: Record<string, unknown> | null;
  explanation: string;
  sourceName: string;
  targetName: string;
  sourceEntityType: string;
  targetEntityType: string;
  sourceEntityId: string;
  targetEntityId: string;
}

/**
 * Formats an uppercase SNAKE_CASE relationship verb into human-friendly title case.
 * e.g., 'SPAWNS_IN' -> 'Spawns in', 'DROPS' -> 'Drops', 'CONTAINS_LOOT' -> 'Contains loot'
 */
export function formatRelationshipLabel(rel: string): string {
  if (!rel) return '';
  const lower = rel.toLowerCase().replace(/_/g, ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Truncates node display label if it exceeds max length to keep canvas readable.
 */
export function truncateLabel(text: string, maxLength: number = 18): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

/**
 * Builds a deterministic, stable node identifier for Cytoscape.
 */
export function buildNodeId(entityType: string, entityId: string): string {
  return `${entityType.toLowerCase().trim()}:${entityId.toLowerCase().trim()}`;
}

/**
 * Builds a deterministic, stable edge identifier for Cytoscape.
 */
export function buildEdgeId(
  sourceType: string,
  sourceId: string,
  relType: string,
  targetType: string,
  targetId: string,
  edgeDbId?: number | null
): string {
  if (edgeDbId) {
    return `edge-${edgeDbId}`;
  }
  const s = buildNodeId(sourceType, sourceId);
  const t = buildNodeId(targetType, targetId);
  return `${s}->${relType.toUpperCase().trim()}->${t}`;
}

/**
 * Transforms a GraphNeighborsResponse into a Cytoscape ElementDefinition array.
 *
 * @param response The backend graph neighbors payload.
 * @param activeRelTypes Optional set of enabled relationship types. When provided,
 *                       only edges matching an enabled type (and their connected nodes)
 *                       are included.
 * @returns Array of ElementDefinition ready for Cytoscape.
 */
export function transformGraphResponse(
  response: GraphNeighborsResponse,
  activeRelTypes?: Set<string>
): ElementDefinition[] {
  if (!response || !response.root) {
    return [];
  }

  const rootType = response.root.entity_type.toLowerCase();
  const rootId = response.root.entity_id.toLowerCase();
  const rootNodeId = buildNodeId(rootType, rootId);

  const elements: ElementDefinition[] = [];
  const registeredNodeIds = new Set<string>();
  const nodeNameMap = new Map<string, string>();

  // 1. Filter edges according to active relationship types
  const filteredEdges: GraphEdge[] = [];
  const includedNodeIds = new Set<string>([rootNodeId]);

  for (const edge of response.edges || []) {
    const relUpper = edge.relationship_type.toUpperCase().trim();
    if (activeRelTypes && activeRelTypes.size > 0 && !activeRelTypes.has(relUpper)) {
      continue;
    }
    filteredEdges.push(edge);
    includedNodeIds.add(buildNodeId(edge.source_entity_type, edge.source_entity_id));
    includedNodeIds.add(buildNodeId(edge.target_entity_type, edge.target_entity_id));
  }

  // 2. Register all returned nodes that should be visible
  for (const node of response.nodes || []) {
    const nId = buildNodeId(node.entity_type, node.id);
    if (!includedNodeIds.has(nId)) {
      continue;
    }
    if (registeredNodeIds.has(nId)) {
      continue;
    }

    const isRoot = nId === rootNodeId;
    const nodeData: CytoscapeNodeData = {
      id: nId,
      entityId: node.id,
      entityType: node.entity_type.toLowerCase(),
      name: node.name || node.id,
      label: truncateLabel(node.name || node.id),
      isRoot,
      sourceType: node.source_type || 'astroworld_api',
      edition: node.edition || 'java',
      gameVersion: node.game_version || null,
    };

    registeredNodeIds.add(nId);
    nodeNameMap.set(nId, nodeData.name);

    elements.push({
      group: 'nodes',
      data: nodeData as unknown as Record<string, unknown>,
      classes: `node-${nodeData.entityType}${isRoot ? ' is-root' : ''}`,
    });
  }

  // Ensure root node exists even if backend nodes array omitted it
  if (!registeredNodeIds.has(rootNodeId)) {
    const rootData: CytoscapeNodeData = {
      id: rootNodeId,
      entityId: response.root.entity_id,
      entityType: rootType,
      name: response.root.name || response.root.entity_id,
      label: truncateLabel(response.root.name || response.root.entity_id),
      isRoot: true,
      sourceType: 'astroworld_api',
      edition: 'java',
      gameVersion: null,
    };
    registeredNodeIds.add(rootNodeId);
    nodeNameMap.set(rootNodeId, rootData.name);
    elements.push({
      group: 'nodes',
      data: rootData as unknown as Record<string, unknown>,
      classes: `node-${rootType} is-root`,
    });
  }

  // 3. Register edges, synthesizing missing endpoint nodes if necessary
  const registeredEdgeIds = new Set<string>();

  for (const edge of filteredEdges) {
    const sId = buildNodeId(edge.source_entity_type, edge.source_entity_id);
    const tId = buildNodeId(edge.target_entity_type, edge.target_entity_id);

    // Fallback: If source or target node wasn't in response.nodes, synthesize it
    if (!registeredNodeIds.has(sId)) {
      const synthData: CytoscapeNodeData = {
        id: sId,
        entityId: edge.source_entity_id,
        entityType: edge.source_entity_type.toLowerCase(),
        name: edge.source_entity_id,
        label: truncateLabel(edge.source_entity_id),
        isRoot: sId === rootNodeId,
        sourceType: edge.source_type || 'astroworld_api',
        edition: 'java',
        gameVersion: null,
      };
      registeredNodeIds.add(sId);
      nodeNameMap.set(sId, synthData.name);
      elements.push({
        group: 'nodes',
        data: synthData as unknown as Record<string, unknown>,
        classes: `node-${synthData.entityType}`,
      });
    }

    if (!registeredNodeIds.has(tId)) {
      const synthData: CytoscapeNodeData = {
        id: tId,
        entityId: edge.target_entity_id,
        entityType: edge.target_entity_type.toLowerCase(),
        name: edge.target_entity_id,
        label: truncateLabel(edge.target_entity_id),
        isRoot: tId === rootNodeId,
        sourceType: edge.source_type || 'astroworld_api',
        edition: 'java',
        gameVersion: null,
      };
      registeredNodeIds.add(tId);
      nodeNameMap.set(tId, synthData.name);
      elements.push({
        group: 'nodes',
        data: synthData as unknown as Record<string, unknown>,
        classes: `node-${synthData.entityType}`,
      });
    }

    const edgeId = buildEdgeId(
      edge.source_entity_type,
      edge.source_entity_id,
      edge.relationship_type,
      edge.target_entity_type,
      edge.target_entity_id,
      edge.id
    );

    if (registeredEdgeIds.has(edgeId)) {
      continue;
    }
    registeredEdgeIds.add(edgeId);

    const edgeData: CytoscapeEdgeData = {
      id: edgeId,
      source: sId,
      target: tId,
      relationshipType: edge.relationship_type.toUpperCase(),
      label: formatRelationshipLabel(edge.relationship_type),
      sourceType: edge.source_type || 'astroworld_api',
      metadata: edge.metadata || null,
      explanation: edge.explanation || `${edge.source_entity_id} ${formatRelationshipLabel(edge.relationship_type).toLowerCase()} ${edge.target_entity_id}`,
      sourceName: nodeNameMap.get(sId) || edge.source_entity_id,
      targetName: nodeNameMap.get(tId) || edge.target_entity_id,
      sourceEntityType: edge.source_entity_type,
      targetEntityType: edge.target_entity_type,
      sourceEntityId: edge.source_entity_id,
      targetEntityId: edge.target_entity_id,
    };

    elements.push({
      group: 'edges',
      data: edgeData as unknown as Record<string, unknown>,
      classes: `edge-${edge.relationship_type.toLowerCase().replace(/_/g, '-')}`,
    });
  }

  return elements;
}
