import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import cytoscape, { Core, ElementDefinition } from 'cytoscape';
import { graphStylesheet } from './graphStyles';
import { CytoscapeEdgeData, CytoscapeNodeData } from './graphTransformers';

export interface GraphCanvasHandles {
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
  resetView: () => void;
  runLayout: () => void;
}

interface GraphCanvasProps {
  elements: ElementDefinition[];
  onSelectNode: (nodeData: CytoscapeNodeData) => void;
  onSelectEdge: (edgeData: CytoscapeEdgeData) => void;
  onClearSelection: () => void;
  className?: string;
}

export const GraphCanvas = forwardRef<GraphCanvasHandles, GraphCanvasProps>(
  (
    {
      elements,
      onSelectNode,
      onSelectEdge,
      onClearSelection,
      className = '',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<Core | null>(null);

    // Expose canvas manipulation handles to parent component
    useImperativeHandle(ref, () => ({
      zoomIn: () => {
        if (!cyRef.current) return;
        const currentZoom = cyRef.current.zoom();
        cyRef.current.zoom({
          level: Math.min(3.0, currentZoom * 1.25),
          renderedPosition: {
            x: cyRef.current.width() / 2,
            y: cyRef.current.height() / 2,
          },
        });
      },
      zoomOut: () => {
        if (!cyRef.current) return;
        const currentZoom = cyRef.current.zoom();
        cyRef.current.zoom({
          level: Math.max(0.2, currentZoom * 0.8),
          renderedPosition: {
            x: cyRef.current.width() / 2,
            y: cyRef.current.height() / 2,
          },
        });
      },
      fit: () => {
        if (!cyRef.current) return;
        cyRef.current.fit(undefined, 50);
      },
      resetView: () => {
        if (!cyRef.current) return;
        cyRef.current.fit(undefined, 50);
        cyRef.current.center();
      },
      runLayout: () => {
        if (!cyRef.current) return;
        const layout = cyRef.current.layout({
          name: 'concentric',
          concentric: (node) => (node.data('isRoot') ? 2 : 1),
          levelWidth: () => 1,
          minNodeSpacing: 60,
          fit: true,
          padding: 50,
          animate: false,
        });
        layout.run();
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      // Safe initialization of Cytoscape instance
      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: graphStylesheet,
        layout: {
          name: 'concentric',
          concentric: (node) => (node.data('isRoot') ? 2 : 1),
          levelWidth: () => 1,
          minNodeSpacing: 60,
          fit: true,
          padding: 50,
          animate: false,
        },
        minZoom: 0.2,
        maxZoom: 3.0,
        wheelSensitivity: 0.25,
        boxSelectionEnabled: false,
      });

      cyRef.current = cy;

      // Register interaction event listeners
      cy.on('tap', 'node', (e) => {
        const data = e.target.data() as CytoscapeNodeData;
        onSelectNode(data);
      });

      cy.on('tap', 'edge', (e) => {
        const data = e.target.data() as CytoscapeEdgeData;
        onSelectEdge(data);
      });

      cy.on('tap', (e) => {
        if (e.target === cy) {
          onClearSelection();
        }
      });

      // Handle window resize gracefully
      const handleResize = () => {
        if (cyRef.current) {
          cyRef.current.resize();
        }
      };
      window.addEventListener('resize', handleResize);

      // Clean up instance and listeners on unmount or elements rebuild
      return () => {
        window.removeEventListener('resize', handleResize);
        cy.destroy();
        cyRef.current = null;
      };
    }, [elements, onSelectNode, onSelectEdge, onClearSelection]);

    return (
      <div
        className={`relative w-full h-[520px] md:h-[600px] bg-[#090c0e] rounded-xl border border-mc-border overflow-hidden select-none ${className}`}
      >
        <div ref={containerRef} className="w-full h-full" data-testid="cytoscape-canvas" />

        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-[#090c0e]/80">
            <p className="text-sm text-mc-textMuted font-mono">
              No graph elements to display
            </p>
          </div>
        )}
      </div>
    );
  }
);

GraphCanvas.displayName = 'GraphCanvas';

export default GraphCanvas;
