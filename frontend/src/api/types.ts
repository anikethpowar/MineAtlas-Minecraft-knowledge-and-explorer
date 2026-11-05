/**
 * MineAtlas TypeScript API Models
 *
 * Strongly typed response and parameter definitions matching the Phase 5
 * backend query API and Pydantic schemas.
 */

export interface Provenance {
  source_type: string;
  source_url: string | null;
  edition: string;
  game_version: string | null;
  last_verified_at: string | null;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  filters: Record<string, string | number | boolean | null | undefined>;
}

export interface DetailResponse<T> {
  data: T;
}

// ==================== DATA STATUS ====================
export interface DataStatusResponse {
  status: 'healthy' | 'stale' | 'empty';
  latest_sync_status: 'success' | 'partial_failure' | 'failed' | null;
  latest_sync_started_at: string | null;
  latest_sync_completed_at: string | null;
  cache_freshness_seconds: number | null;
  cache_freshness_human: string | null;
  total_entities: number;
  total_relationship_edges: number;
  cached_counts: Record<string, number>;
  edition: string;
  coverage_summary: string;
}

// ==================== SEARCH ====================
export interface SearchResultItem {
  entity_type: string;
  id: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  source_type: string;
  edition: string;
  game_version: string | null;
}

export interface SearchResponse {
  query: string;
  total_results: number;
  results: SearchResultItem[];
  by_type: Record<string, number>;
}

// ==================== MOBS ====================
export interface MobListItem {
  id: string;
  name: string;
  mob_type: string | null;
  category: string | null;
  hp: number | null;
  tameable: boolean;
  breedable: boolean;
  version_added: string | null;
}

export interface MobDetail {
  id: string;
  name: string;
  mob_type: string | null;
  category: string | null;
  behavior: string | null;
  hp: number | null;
  damage_easy: number | null;
  damage_normal: number | null;
  damage_hard: number | null;
  xp_min: number | null;
  xp_max: number | null;
  spawn_conditions: string | null;
  tameable: boolean;
  taming_method: string | null;
  breedable: boolean;
  breeding_item: string | null;
  version_added: string | null;
  notes: string | null;
  source: Provenance;
  coverage_note: string | null;
}

// ==================== BIOMES ====================
export interface BiomeListItem {
  id: string;
  name: string;
  dimension: string | null;
  category: string | null;
  temperature: number | null;
  precipitation: string | null;
  rarity: string | null;
  version_added: string | null;
}

export interface BiomeDetail {
  id: string;
  name: string;
  dimension: string | null;
  category: string | null;
  temperature: number | null;
  precipitation: string | null;
  rarity: string | null;
  version_added: string | null;
  notes: string | null;
  source: Provenance;
  coverage_note: string | null;
}

// ==================== ITEMS & KEY BLOCKS ====================
export interface ItemListItem {
  id: string;
  name: string;
  category: string | null;
  stack_size: number;
  durability: number | null;
  enchantable: boolean;
  version_added: string | null;
}

export interface ItemDetail {
  id: string;
  name: string;
  category: string | null;
  stack_size: number;
  durability: number | null;
  description: string | null;
  enchantable: boolean;
  food_hunger: number | null;
  food_saturation: number | null;
  fuel_value: number | null;
  version_added: string | null;
  notes: string | null;
  source: Provenance;
  coverage_note: string | null;
}

// ==================== STRUCTURES ====================
export interface StructureListItem {
  id: string;
  name: string;
  dimension: string | null;
  category: string | null;
  rarity: string | null;
  y_min: number | null;
  y_max: number | null;
  version_added: string | null;
}

export interface StructureDetail {
  id: string;
  name: string;
  dimension: string | null;
  category: string | null;
  rarity: string | null;
  y_min: number | null;
  y_max: number | null;
  how_to_find: string | null;
  version_added: string | null;
  notes: string | null;
  source: Provenance;
  coverage_note: string | null;
}

// ==================== GRAPH ====================
export interface GraphRoot {
  entity_type: string;
  entity_id: string;
  name: string;
}

export interface GraphNode {
  entity_type: string;
  id: string;
  name: string;
  source_type: string;
  edition: string;
  game_version: string | null;
}

export interface GraphEdge {
  id: number | null;
  source_entity_type: string;
  source_entity_id: string;
  relationship_type: string;
  target_entity_type: string;
  target_entity_id: string;
  source_type: string;
  metadata: Record<string, unknown> | null;
  explanation: string;
}

export interface GraphMetadata {
  depth: number;
  truncated: boolean;
  available_relationship_types: string[];
  total_nodes: number;
  total_edges: number;
}

export interface GraphNeighborsResponse {
  root: GraphRoot;
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
}

// ==================== CURATED FARM BLUEPRINTS ====================
export interface FarmOutputItem {
  item: string;
  label: string;
  rate: string;
  is_primary: boolean;
  note: string | null;
}

export interface FarmMaterialItem {
  item: string;
  amount: number;
  category: string;
  note: string | null;
}

export interface FarmBuildStep {
  step_number: number;
  title: string;
  description: string;
  why_it_matters: string | null;
}

export interface FarmTroubleshootingItem {
  issue: string;
  likely_cause: string;
  suggested_check: string;
}

export interface FarmDiagramZone {
  id: string;
  label: string;
  color?: string;
}

export interface FarmDiagramData {
  type?: string;
  zones: FarmDiagramZone[];
}

export interface FarmSourceReference {
  title: string;
  url: string | null;
  note: string | null;
}

export interface FarmListItem {
  id: string;
  name: string;
  category: string;
  difficulty: string | null;
  dimension: string;
  estimated_output_per_hour: string | null;
  summary: string | null;
  compatibility_label: string | null;
  source_type: string;
  edition: string;
  last_verified_at: string | null;
}

export interface FarmDetail {
  id: string;
  name: string;
  category: string;
  difficulty: string | null;
  dimension: string;
  summary: string | null;
  description: string | null;
  estimated_output_per_hour: string | null;
  compatibility_label: string | null;
  coverage_note: string | null;
  safety_note: string | null;
  maintenance_summary: string | null;
  notes: string | null;
  outputs: FarmOutputItem[];
  prerequisites: string[];
  materials: FarmMaterialItem[];
  build_steps: FarmBuildStep[];
  troubleshooting: FarmTroubleshootingItem[];
  diagram_data: FarmDiagramData | null;
  source_references: FarmSourceReference[];
  source_type: string;
  source_url: string | null;
  edition: string;
  game_version: string | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

