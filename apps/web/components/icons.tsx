import type { SVGProps } from "react";

/**
 * Icons exported from the Figma file (frame "10", Copy as SVG). Paths are kept
 * byte-for-byte in the frame's coordinates; each icon only sets a viewBox
 * around its own spot, so stroke widths, caps and proportions match the design.
 */
type P = SVGProps<SVGSVGElement> & { size?: number };

const make =
  (viewBox: string, box: number, body: React.ReactNode) =>
  ({ size = box, ...p }: P) => (
    <svg width={size} height={size} viewBox={viewBox} fill="none" stroke="currentColor" aria-hidden {...p}>
      {body}
    </svg>
  );

export const IconBell = make(
  "232 24 24 24",
  24,
  <path
    d="M241.741 43.1919C242.37 43.6944 243.2 44 244.111 44C245.022 44 245.852 43.6944 246.481 43.1919M237.451 40.606C237.076 40.606 236.867 40.0173 237.094 39.6902C237.62 38.9311 239 37.8179 239 36.4773L239.018 34.5348C239.018 30.9257 240.818 28 244.111 28C247.452 28 249 30.9688 249 34.6311L248.982 36.4773C248.982 37.8271 250.629 38.9464 251.134 39.7058C251.352 40.0337 251.142 40.606 250.772 40.606H237.451Z"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
  />,
);

export const IconHome = make(
  "22 80 24 24",
  24,
  <path
    d="M31.1667 100.5V94.0332C31.1667 93.438 31.6741 92.9554 32.3 92.9554H35.7C36.3259 92.9554 36.8333 93.438 36.8333 94.0332V100.5M33.3432 83.6994L25.9765 88.6812C25.6776 88.8834 25.5 89.2107 25.5 89.5596V98.8833C25.5 99.7762 26.2611 100.5 27.2 100.5H40.8C41.7389 100.5 42.5 99.7762 42.5 98.8833V89.5596C42.5 89.2107 42.3224 88.8834 42.0235 88.6813L34.6568 83.6994C34.2636 83.4335 33.7364 83.4335 33.3432 83.6994Z"
    strokeWidth="1.3"
    strokeLinecap="round"
  />,
);

export const IconCalendar = make(
  "22 122 24 24",
  24,
  <path
    d="M27.002 130.914H41.002M28.8115 125V126.543M39.002 125V126.543M42.002 129.243V140.3C42.002 141.791 40.808 143 39.3353 143H28.6686C27.1959 143 26.002 141.791 26.002 140.3V129.243C26.002 127.752 27.1959 126.543 28.6686 126.543H39.3353C40.808 126.543 42.002 127.752 42.002 129.243Z"
    strokeWidth="1.4625"
    strokeLinecap="round"
    strokeLinejoin="round"
  />,
);

export const IconSidebar = make(
  "22 976 24 24",
  24,
  <path
    d="M31.5 980.5L31.5 995.5M42 983L42 993C42 994.657 40.6569 996 39 996H29C27.3431 996 26 994.657 26 993V983C26 981.343 27.3431 980 29 980L39 980C40.6569 980 42 981.343 42 983Z"
    strokeWidth="1.3"
  />,
);

export const IconChevronLeft = make(
  "318 32 24 24",
  24,
  <path d="M333 49L328 44L333 39" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />,
);

/** Mirror of the design's chevron (the design only has "back"). */
export const IconChevronRight = make(
  "318 32 24 24",
  24,
  <path d="M327 49L332 44L327 39" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />,
);

export const IconSearch = make(
  "334 184 24 24",
  24,
  <path
    d="M350.69 200.8L353.998 204M352.931 195.467C352.931 199.59 349.588 202.933 345.465 202.933C341.341 202.933 337.998 199.59 337.998 195.467C337.998 191.343 341.341 188 345.465 188C349.588 188 352.931 191.343 352.931 195.467Z"
    strokeWidth="1.3"
    strokeLinecap="round"
  />,
);

export const IconPlus = make(
  "1391.5 555 20 20",
  20,
  <path d="M1401.5 559L1401.5 565M1401.5 565L1401.5 571M1401.5 565H1407.5M1401.5 565L1395.5 565" strokeWidth="1.3" strokeLinecap="round" />,
);

/* --- 16px icons of the dark "quick actions" bar --- */

export const IconTemplate = make(
  "954 190 16 16",
  16,
  <path
    d="M961.999 193L961.999 203M956.666 198H966.999M956.666 194.667L956.666 201.333C956.666 202.438 957.561 203.333 958.666 203.333H965.333C966.437 203.333 967.333 202.438 967.333 201.333V194.667C967.333 193.562 966.437 192.667 965.333 192.667L958.666 192.667C957.561 192.667 956.666 193.562 956.666 194.667Z"
    strokeWidth="0.866667"
  />,
);

export const IconTrash = make(
  "1127 190 16 16",
  16,
  <path
    d="M1130.33 194.549H1139.81M1133.89 200.824V197.059M1136.26 200.824V197.059M1137.44 203.333H1132.7C1132.05 203.333 1131.52 202.771 1131.52 202.078V195.176C1131.52 194.83 1131.78 194.549 1132.11 194.549H1138.04C1138.36 194.549 1138.63 194.83 1138.63 195.176V202.078C1138.63 202.772 1138.1 203.333 1137.44 203.333ZM1133.89 194.549H1136.26C1136.59 194.549 1136.85 194.268 1136.85 193.922V193.294C1136.85 192.948 1136.59 192.667 1136.26 192.667H1133.89C1133.56 192.667 1133.29 192.948 1133.29 193.294V193.922C1133.29 194.268 1133.56 194.549 1133.89 194.549Z"
    strokeWidth="0.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  />,
);

export const IconClose = make(
  "1234 190 16 16",
  16,
  <path d="M1245.56 194.444L1242 198M1242 198L1238.44 201.556M1242 198L1245.56 201.556M1242 198L1238.44 194.444" strokeWidth="0.9" strokeLinecap="round" />,
);

/** Not in the design (the "Изменить" action is an addition) — drawn in the same 16px / 0.9 stroke style. */
export const IconPencil = make(
  "0 0 16 16",
  16,
  <path d="M9.6 4.4 11.6 6.4M3.3 12.7l.6-2.6 6.4-6.4a.9.9 0 0 1 1.3 0l.7.7a.9.9 0 0 1 0 1.3L5.9 12.1l-2.6.6Z" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />,
);

/** Filled blue circle with a plus — marker of a selected empty cell. */
export const IconPlusCircle = ({ size = 20, ...p }: P) => (
  <svg width={size} height={size} viewBox="917 314 20 20" fill="none" aria-hidden {...p}>
    <rect x="917" y="314" width="20" height="20" rx="10" fill="#5B7DEC" />
    <path d="M927 319V324M927 324L927 329M927 324H932M927 324L922 324" strokeWidth="1.08333" strokeLinecap="round" stroke="white" />
  </svg>
);
