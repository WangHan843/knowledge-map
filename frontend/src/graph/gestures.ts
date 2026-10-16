export interface Point{x:number;y:number;}
interface Contact{point:Point;start:Point;target?:string;}
interface Callbacks{pan(dx:number,dy:number):void;transform(previous:Point,next:Point,scale:number):void;tap(id:string):void;dragStart(id:string,p:Point):void;dragMove(p:Point):void;dragEnd():void;}
export class GraphGestures{
  private contacts=new Map<number,Contact>();private moved=false;private blocked=false;private dragging=false;
  constructor(private callbacks:Callbacks){}
  down(id:number,point:Point,target?:string){
    if(!this.contacts.size){this.moved=false;this.blocked=false;}
    this.contacts.set(id,{point:{x:point.x,y:point.y},start:{x:point.x,y:point.y},target});
    if(this.contacts.size>1){this.blocked=true;if(this.dragging){this.callbacks.dragEnd();this.dragging=false;}}
  }
  move(id:number,next:Point){
    const c=this.contacts.get(id);if(!c)return;const old=c.point;
    if(this.contacts.size>=2){
      const [a,b]=[...this.contacts.values()];const previous={x:(a.point.x+b.point.x)/2,y:(a.point.y+b.point.y)/2};const distance=Math.hypot(a.point.x-b.point.x,a.point.y-b.point.y);
      c.point={x:next.x,y:next.y};const d=Math.hypot(a.point.x-b.point.x,a.point.y-b.point.y);
      this.callbacks.transform(previous,{x:(a.point.x+b.point.x)/2,y:(a.point.y+b.point.y)/2},distance>8&&d>8?d/distance:1);return;
    }
    c.point={x:next.x,y:next.y};
    if(!this.moved&&Math.hypot(next.x-c.start.x,next.y-c.start.y)<=8)return;
    if(!this.moved&&c.target&&!c.target.startsWith('relation:')&&!this.blocked){this.dragging=true;this.callbacks.dragStart(c.target,c.start);}
    if(this.dragging)this.callbacks.dragMove(next);
    else this.callbacks.pan(next.x-(this.moved?old.x:c.start.x),next.y-(this.moved?old.y:c.start.y));
    this.moved=true;
  }
  up(id:number){
    const c=this.contacts.get(id);if(!c)return;
    if(this.dragging){this.callbacks.dragEnd();this.dragging=false;}
    else if(!this.blocked&&!this.moved&&this.contacts.size===1&&c.target)this.callbacks.tap(c.target);
    this.contacts.delete(id);
    if(this.contacts.size===1){const remaining=[...this.contacts.values()][0];remaining.start=remaining.point;remaining.target=undefined;this.moved=false;}
  }
  cancel(){if(this.dragging)this.callbacks.dragEnd();this.dragging=false;this.contacts.clear();this.blocked=true;}
}
