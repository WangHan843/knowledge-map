import type { CSSProperties } from "react";

export type IconName =
  | "map"
  | "book"
  | "edit"
  | "arrow"
  | "back"
  | "check"
  | "close"
  | "target"
  | "clock"
  | "signal"
  | "angle"
  | "info"
  | "layers"
  | "user";
const paths: Record<IconName, React.ReactNode> = {
  map: (
    <>
      <circle cx="12" cy="5" r="3" />
      <circle cx="5" cy="18" r="3" />
      <circle cx="19" cy="18" r="3" />
      <path d="m10.5 7.5-4 8m7-8 4 8M8 18h8" />
    </>
  ),
  book: (
    <>
      <path d="M12 5C8 2 4 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-2-1-6-2-10 1Zm0 0v15" />
    </>
  ),
  edit: (
    <>
      <path d="M13 4H5a2 2 0 0 0-2 2v14a1 1 0 0 0 1 1h14a2 2 0 0 0 2-2v-8M16 3l5 5M10 14l-1 4 4-1L22 8l-4-4Z" />
    </>
  ),
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  back: <path d="M20 12H4m6-6-6 6 6 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  target: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 1v4m0 14v4M1 12h4m14 0h4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  signal: (
    <>
      <path d="M3 20v-3m6 3v-7m6 7V9m6 11V4" />
    </>
  ),
  angle: (
    <>
      <path d="M3 19h19M4 19 17 4M10 19a6 6 0 0 0-2-5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-11v1" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 10 5-10 5L2 8Zm-9 9 9 5 9-5M3 16l9 5 9-5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
    </>
  ),
};
export function Icon({
  name,
  size = 22,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name]}
    </svg>
  );
}
