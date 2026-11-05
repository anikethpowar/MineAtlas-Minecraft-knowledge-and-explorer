/**
 * Cytoscape Visual Stylesheet for MineAtlas
 *
 * Implements a dark Minecraft-inspired palette with shape-coded entity categories
 * and clear directional relationship edges.
 *
 * NOTE: Strictly original CSS/vector shapes; no copied Minecraft textures or assets.
 */

import { StylesheetStyle } from 'cytoscape';

export const graphStylesheet: StylesheetStyle[] = [
  // ==================== BASE NODE ====================
  {
    selector: 'node',
    style: {
      content: 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      color: '#f1f5f9',
      'font-size': '11px',
      'font-family': 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'font-weight': 600,
      'text-wrap': 'ellipsis',
      'text-max-width': '85px',
      'background-color': '#161b1e',
      'border-width': 2,
      'border-color': '#334155',
      width: 90,
      height: 44,
      padding: '4px',
      'text-outline-color': '#0c0f10',
      'text-outline-width': 2,
      'overlay-opacity': 0,
      'transition-property': 'background-color, border-color, border-width, width, height',
      'transition-duration': 0.15,
    },
  },

  // ==================== SHAPES & COLORS BY ENTITY TYPE ====================
  // Mob: Living entity (Rounded Rectangle, Crimson/Redstone accent)
  {
    selector: 'node[entityType = "mob"]',
    style: {
      shape: 'round-rectangle',
      'border-color': '#ef4444',
      'background-color': '#241014',
    },
  },

  // Biome: World Environment (Hexagon, Emerald/Foliage accent)
  {
    selector: 'node[entityType = "biome"]',
    style: {
      shape: 'hexagon',
      'border-color': '#10b981',
      'background-color': '#09251b',
      width: 96,
      height: 48,
    },
  },

  // Item & Key Block: Resource/Collectible (Diamond, Cyan/Sky accent)
  {
    selector: 'node[entityType = "item"]',
    style: {
      shape: 'diamond',
      'border-color': '#38bdf8',
      'background-color': '#0c2233',
      width: 76,
      height: 76,
    },
  },

  // Structure: World Architecture/Location (Rectangle, Gold/Amber accent)
  {
    selector: 'node[entityType = "structure"]',
    style: {
      shape: 'rectangle',
      'border-color': '#f59e0b',
      'background-color': '#2a1d0d',
      width: 96,
      height: 42,
    },
  },

  // Enchantment: Magical Modifiers (Ellipse, Arcane Purple accent)
  {
    selector: 'node[entityType = "enchantment"]',
    style: {
      shape: 'ellipse',
      'border-color': '#c084fc',
      'background-color': '#221133',
      width: 90,
      height: 46,
    },
  },

  // Version: Release Metadata/Timeline (Compact Tag Rounded Rectangle, Slate)
  {
    selector: 'node[entityType = "version"]',
    style: {
      shape: 'round-rectangle',
      'border-color': '#64748b',
      'background-color': '#131920',
      width: 82,
      height: 34,
      'font-size': '10px',
    },
  },

  // Achievement: Advancement Progression (Star shape, Yellow badge)
  {
    selector: 'node[entityType = "achievement"]',
    style: {
      shape: 'star',
      'border-color': '#eab308',
      'background-color': '#26200a',
      width: 80,
      height: 80,
    },
  },

  // Trade: Commerce/Exchange (Rhomboid / Parallelogram, Teal accent)
  {
    selector: 'node[entityType = "trade"]',
    style: {
      shape: 'rhomboid',
      'border-color': '#2dd4bf',
      'background-color': '#0d2624',
      width: 94,
      height: 40,
    },
  },

  // Villager Profession: Vocation (Rounded Square, Indigo accent)
  {
    selector: 'node[entityType = "villager_profession"]',
    style: {
      shape: 'round-rectangle',
      'border-color': '#818cf8',
      'background-color': '#181b36',
    },
  },

  // Dimension: World Realm (Wide Rounded Container, Portal Violet accent)
  {
    selector: 'node[entityType = "dimension"]',
    style: {
      shape: 'round-rectangle',
      'border-color': '#a855f7',
      'background-color': '#211033',
      width: 104,
      height: 48,
    },
  },

  // ==================== ROOT NODE HIGHLIGHT ====================
  {
    selector: 'node[?isRoot]',
    style: {
      'border-width': 4,
      'border-color': '#10b981',
      'font-size': '12px',
      'font-weight': 800,
      'z-index': 99,
    },
  },

  // ==================== SELECTED NODE ====================
  {
    selector: 'node:selected',
    style: {
      'border-color': '#ffffff',
      'border-width': 4,
      'z-index': 100,
    },
  },

  // ==================== BASE EDGE ====================
  {
    selector: 'edge',
    style: {
      'curve-style': 'bezier',
      'target-arrow-shape': 'triangle',
      'target-arrow-color': '#64748b',
      'line-color': '#334155',
      width: 2,
      'arrow-scale': 1.1,
      label: 'data(label)',
      'font-size': '10px',
      'font-family': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      'text-rotation': 'autorotate',
      'text-margin-y': -8,
      color: '#94a3b8',
      'text-background-color': '#0c0f10',
      'text-background-opacity': 0.88,
      'text-background-padding': '2px',
      'text-background-shape': 'roundrectangle',
      'overlay-opacity': 0,
      'transition-property': 'line-color, target-arrow-color, width, color',
      'transition-duration': 0.15,
    },
  },

  // ==================== SELECTED EDGE ====================
  {
    selector: 'edge:selected',
    style: {
      'line-color': '#10b981',
      'target-arrow-color': '#10b981',
      width: 3.5,
      color: '#34d399',
      'font-weight': 700,
      'z-index': 100,
    },
  },
];
