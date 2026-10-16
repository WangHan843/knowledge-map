import type { KnowledgeNode, NodeId } from "../types";

// UI prototype only. These short summaries and original diagrams await teacher review.
export const nodes: KnowledgeNode[] = [
  {
    id: "toa",
    name: "到达时间定位",
    english: "Time of Arrival",
    measure: "测量传播时间",
    summary:
      "从信号传播所用的时间出发，估计目标与参考点的距离，再结合参考点的位置确定目标位置。",
    concepts: [
      {
        title: "时间与距离",
        text: "已知信号传播速度时，可以用传播时间估计距离。不同测量方式需要相应的时钟或往返时间处理。",
      },
      {
        title: "已知参考点",
        text: "结合多个已知位置的参考点与距离信息，缩小目标位置的范围。",
      },
      {
        title: "关注测量误差",
        text: "时钟误差和传播条件会影响测距结果。示意图只表达关系，不代表精确解。",
      },
    ],
    application:
      "想象一台设备向已知位置的参考点发送信号。测量传播时间，可以为寻找设备的位置提供距离线索。",
    source: "PDF 扫描第 8—9 页 · 3.1.1",
    level: "unassessed",
    review_status: "mock",
  },
  {
    id: "tdoa",
    name: "到达时间差定位",
    english: "Time Difference of Arrival",
    measure: "比较到达时间差",
    summary:
      "比较同一信号到达不同参考点的时间差，将时间差转化为距离差，再推算目标位置。",
    concepts: [
      {
        title: "同一信号，多个接收点",
        text: "同一信号沿不同路径到达参考点；记录到达时刻，比较它们的差值。",
      },
      {
        title: "距离差约束",
        text: "时间差对应目标到两个参考点的距离之差，不是某一条路径的绝对距离。",
      },
      {
        title: "参考点同步",
        text: "接收参考点之间仍需要时钟同步。无需目标与参考点同步，不等于所有设备都无需同步。",
      },
    ],
    application:
      "多个固定接收点共同接收一个移动设备的信号，通过到达时刻的差别形成定位线索。",
    source: "PDF 扫描第 9 页 · 3.1.2",
    level: "unassessed",
    review_status: "mock",
  },
  {
    id: "rss",
    name: "接收信号强度定位",
    english: "Received Signal Strength",
    measure: "识别信号强度特征",
    summary:
      "利用不同位置的接收信号强度特征进行定位。室内环境中，可以将多路信号强度与预先采集的位置指纹进行比较。",
    concepts: [
      {
        title: "信号强度",
        text: "接收信号的强弱与传播距离、遮挡和环境有关，不能简单将强度当作精确距离。",
      },
      {
        title: "位置指纹",
        text: "多个参考点的信号强度可以共同构成位置特征，用于和指纹数据库比较。",
      },
      {
        title: "环境会变化",
        text: "室内多径与环境变化会影响信号特征，指纹地图需要采集和维护。",
      },
    ],
    application:
      "在室内不同位置采集 Wi-Fi 信号强度特征，再把当前测量与位置指纹比较，是一种可讨论的定位情境。",
    source: "PDF 扫描第 9—11 页 · 3.1.3",
    level: "unassessed",
    review_status: "mock",
  },
  {
    id: "aoa",
    name: "到达角度定位",
    english: "Angle of Arrival",
    measure: "测量信号到达方向",
    summary:
      "通过接收信号估计其到达角度，再结合多个参考点的位置与方向信息推算目标位置。",
    concepts: [
      {
        title: "从哪里来",
        text: "到达角度描述信号相对于参考方向的角度，提供目标所在方向的线索。",
      },
      {
        title: "多个方向共同定位",
        text: "结合多个已知位置参考点的方向信息，可以估计目标位置。",
      },
      {
        title: "天线阵列",
        text: "教材通过天线阵列接收信号的差异说明角度测量；实际精度受设备与传播环境影响。",
      },
    ],
    application:
      "在固定参考点上测量信号来自哪个方向，再综合不同参考点的方向信息寻找目标。",
    source: "PDF 扫描第 11 页 · 3.1.4",
    level: "unassessed",
    review_status: "mock",
  },
];
export const getNode = (id: string | undefined) =>
  nodes.find((node) => node.id === id);
export const nodeName = (id: NodeId) => id.toUpperCase();
