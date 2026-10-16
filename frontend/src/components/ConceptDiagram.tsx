import type { NodeId } from "../types";

// Original, deliberately simplified relationship diagrams; not textbook figures or geometric solutions.
export function ConceptDiagram({ nodeId }: { nodeId: NodeId }) {
  return (
    <figure className="concept-figure">
      <svg
        viewBox="0 0 440 240"
        role="img"
        aria-label={`${nodeId.toUpperCase()} 概念关系示意，非精确定位图`}
      >
        <defs>
          <pattern
            id={`grid-${nodeId}`}
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M22 0H0V22"
              fill="none"
              stroke="#dfe9f6"
              strokeWidth=".7"
            />
          </pattern>
        </defs>
        <rect
          x="0"
          y="0"
          width="440"
          height="240"
          fill={`url(#grid-${nodeId})`}
        />
        {nodeId === "rss" ? (
          <>
            <text x="44" y="50">
              采集信号特征
            </text>
            <path
              d="M55 169v-40m24 40V92m24 77v-56"
              stroke="#1765db"
              strokeWidth="12"
            />
            <path d="M127 169V70" stroke="#1765db" strokeWidth="12" />
            <path
              d="M167 120h60m-9-7 9 7-9 7"
              fill="none"
              stroke="#7e9ec5"
              strokeWidth="2"
            />
            <rect
              x="259"
              y="70"
              width="132"
              height="100"
              rx="10"
              fill="#e4efff"
              stroke="#99bbed"
            />
            <path
              d="M303 70v100m44-100v100M259 104h132m-132 33h132"
              stroke="#aac5ed"
            />
            <circle cx="325" cy="119" r="10" fill="#1765db" />
            <text x="275" y="204">
              匹配位置指纹
            </text>
          </>
        ) : (
          <>
            {nodeId === "toa" && (
              <>
                <circle
                  cx="88"
                  cy="182"
                  r="178.4"
                  fill="none"
                  stroke="#a9c7ee"
                  strokeDasharray="5 5"
                />
                <circle
                  cx="352"
                  cy="182"
                  r="178.4"
                  fill="none"
                  stroke="#a9c7ee"
                  strokeDasharray="5 5"
                />
              </>
            )}
            <path
              d="M88 182 220 62 352 182"
              fill="none"
              stroke="#1765db"
              strokeWidth="2"
              strokeDasharray={nodeId === "aoa" ? undefined : "6 5"}
            />
            {nodeId === "aoa" && (
              <>
                <path d="M88 182h70m194 0h-70" stroke="#849bb7" />
                <path
                  d="M124 182a36 36 0 0 0-11-25m203 25a36 36 0 0 1 11-25"
                  fill="none"
                  stroke="#1765db"
                  strokeWidth="2"
                />
                <text x="125" y="165">
                  α
                </text>
                <text x="305" y="165">
                  β
                </text>
              </>
            )}
            <rect x="80" y="174" width="16" height="16" rx="3" fill="#57718f" />
            <rect
              x="344"
              y="174"
              width="16"
              height="16"
              rx="3"
              fill="#57718f"
            />
            <circle cx="220" cy="62" r="15" fill="#e5efff" />
            <circle cx="220" cy="62" r="7" fill="#1765db" />
            <text x="197" y="32">
              目标
            </text>
            <text x="51" y="215">
              参考点 A
            </text>
            <text x="314" y="215">
              参考点 B
            </text>
            {nodeId !== "aoa" && (
              <>
                <text x="112" y="114">
                  {nodeId === "toa" ? "传播时间" : "到达时刻 t₁"}
                </text>
                <text x="282" y="114">
                  {nodeId === "toa" ? "传播时间" : "到达时刻 t₂"}
                </text>
              </>
            )}
            {nodeId === "tdoa" && (
              <text x="181" y="177" fill="#1765db">
                比较时间差
              </text>
            )}
          </>
        )}
      </svg>
      <figcaption>模拟图解 · 只表达概念关系，不表示精确位置或比例</figcaption>
    </figure>
  );
}
