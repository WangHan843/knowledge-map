import { describe, expect, it, vi } from 'vitest';
import { GraphGestures } from './gestures';
const setup = () => { const c = { pan:vi.fn(),transform:vi.fn(),tap:vi.fn(),dragStart:vi.fn(),dragMove:vi.fn(),dragEnd:vi.fn() }; return {c,g:new GraphGestures(c)}; };
describe('2D touch input', () => {
  it('distinguishes click from direct node drag without a hold', () => {
    const {g,c}=setup();g.down(1,{x:10,y:10},'TOA-1');g.up(1);expect(c.tap).toHaveBeenCalledWith('TOA-1');c.tap.mockClear();
    g.down(1,{x:10,y:10},'ROOT');g.move(1,{x:40,y:30});g.up(1);
    expect(c.dragStart).toHaveBeenCalledWith('ROOT',{x:10,y:10});expect(c.dragMove).toHaveBeenCalled();expect(c.dragEnd).toHaveBeenCalledOnce();expect(c.tap).not.toHaveBeenCalled();
  });
  it('pans blank space and does not treat a dragged comparison as a click', () => {
    const {g,c}=setup();g.down(1,{x:0,y:0},'relation:sync');g.move(1,{x:30,y:10});g.up(1);
    expect(c.pan).toHaveBeenCalledWith(30,10);expect(c.tap).not.toHaveBeenCalled();expect(c.dragStart).not.toHaveBeenCalled();
  });
  it('pinches around the centroid, interrupts node drag and suppresses clicks', () => {
    const {g,c}=setup();g.down(1,{x:0,y:0},'RSS');g.move(1,{x:20,y:0});g.down(2,{x:120,y:0});
    expect(c.dragEnd).toHaveBeenCalledOnce();g.move(2,{x:220,y:0});expect(c.transform).toHaveBeenCalledWith({x:70,y:0},{x:120,y:0},2);
    g.up(2);g.up(1);expect(c.tap).not.toHaveBeenCalled();
  });
  it('cancels active drag and accepts the next touch', () => {
    const {g,c}=setup();g.down(1,{x:0,y:0},'AOA');g.move(1,{x:30,y:20});g.cancel();g.up(1);
    expect(c.dragEnd).toHaveBeenCalledOnce();g.down(2,{x:1,y:1},'AOA-3');g.up(2);expect(c.tap).toHaveBeenCalledWith('AOA-3');
  });
});
