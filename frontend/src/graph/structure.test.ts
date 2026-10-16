import { describe, it, expect } from 'vitest';
import { graphNodes, graphLinks } from '../data/graph-structure';
import { createTopology, createSimulation } from './model';
describe('approved 2D teaching graph', () => {
  it('contains exact 1 + 4 + 16 nodes without child assessment or lesson text', () => {
    expect(graphNodes).toHaveLength(21); expect(new Set(graphNodes.map(n => n.id)).size).toBe(21);
    expect(graphNodes.filter(n => n.kind === 'center')).toHaveLength(1);
    for (const id of ['TOA','TDOA','RSS','AOA']) expect(graphNodes.filter(n => n.parentId === id).map(n => n.id)).toEqual([1,2,3,4].map(i => `${id}-${i}`));
    expect(graphNodes.every(n => !('status' in n) && !('level' in n) && !('detail' in n))).toBe(true);
  });
  it('uses only 20 hierarchy edges and the two specified comparisons', () => {
    expect(graphLinks.filter(l => l.type === 'hierarchy')).toHaveLength(20);
    expect(graphLinks.filter(l => l.type === 'comparison').map(l => [l.source, l.target])).toEqual([['TOA-2','TDOA-2'],['TOA-4','TDOA-4']]);
    expect(graphLinks.every(l => l.relationLabel && l.sourcePages.length && graphNodes.some(n => n.id === l.source) && graphNodes.some(n => n.id === l.target))).toBe(true);
  });
  it('uses planar forces, relaxes displaced nodes and cools to rest', () => {
    const graph = createTopology(); const sim = createSimulation(graph); sim.tick(200);
    expect(graph.nodes).toHaveLength(21); expect(graph.nodes.every(n => Number.isFinite(n.x) && Number.isFinite(n.y) && !('z' in n))).toBe(true);
    const n = graph.nodes.find(n => n.id === 'TOA-1')!; n.x += 160; const displaced=n.x; sim.alpha(.5).tick(200);
    expect(n.x).not.toBe(displaced); expect(sim.alpha()).toBeLessThan(sim.alphaMin()); sim.stop();
    for(const a of graph.nodes) for(const b of graph.nodes) if(a!==b) expect(Math.hypot(a.x-b.x,a.y-b.y)).toBeGreaterThan(35);
  });
});
