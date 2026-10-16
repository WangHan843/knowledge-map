export const comparisons:Record<string,{title:string;summary:string;items:{title:string;text:string}[];source:string}>={
  sync:{title:'同步要求的比较',summary:'TOA 和 TDOA 都使用时间观测，但需要比较的时钟不同。',items:[{title:'TOA · 收发时间同步',text:'直接测单程传播时间时，需要获知发送与接收时刻，并保证两者的时间基准可比较。教材也介绍双信号与往返测距，因此不能把绝对同步视为所有时间测距实现的唯一方案。'},{title:'TDOA · 接收端时钟同步',text:'同一信号的两个接收时刻相减会消去共同的发送时刻，不要求目标与各参考点同步；参考点之间的接收时钟仍需同步。'}],source:'PDF 第8–9页 · 书页033–034 · 3.1.1、3.1.2'},
  geometry:{title:'几何定位方式比较',summary:'两者使用不同的测量约束：一个是距离，一个是距离差。',items:[{title:'TOA · 三边定位',text:'在二维平面中，到某参考点距离固定的目标位于一个圆上。组合多个参考点的圆约束，估计目标位置。'},{title:'TDOA · 双曲线定位',text:'到两个参考点的距离差固定，对应以它们为焦点的双曲线。组合多个距离差约束，估计目标位置。两种方法的实际观测都存在误差。'}],source:'PDF 第9页 · 书页034–035 · 图3-2、图3-3'},
};
