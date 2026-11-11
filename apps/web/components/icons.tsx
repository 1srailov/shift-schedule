import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const Base = ({ size = 24, children, ...p }: P) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.3}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...p}
  >
    {children}
  </svg>
);

export const IconBell = (p: P) => (
  <Base {...p}>
    <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.25 1.5H4.75L6 16.5Z" />
    <path d="M10.25 20.25h3.5" />
  </Base>
);

export const IconHome = (p: P) => (
  <Base {...p}>
    <path d="M4.5 10.2 12 4l7.5 6.2V19a1 1 0 0 1-1 1h-4v-5.5h-5V20h-4a1 1 0 0 1-1-1v-8.8Z" />
  </Base>
);

export const IconCalendar = (p: P) => (
  <Base {...p}>
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <path d="M4 9.5h16M8.5 3v4M15.5 3v4" />
  </Base>
);

export const IconSidebar = (p: P) => (
  <Base {...p}>
    <rect x="4" y="4.5" width="16" height="15" rx="2" />
    <path d="M9.5 4.5v15" />
  </Base>
);

export const IconChevronLeft = (p: P) => (
  <Base {...p}>
    <path d="M14.5 7 9.5 12l5 5" />
  </Base>
);

export const IconChevronRight = (p: P) => (
  <Base {...p}>
    <path d="m9.5 7 5 5-5 5" />
  </Base>
);

export const IconSearch = (p: P) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 3.5 3.5" />
  </Base>
);

export const IconClose = (p: P) => (
  <Base {...p}>
    <path d="m7 7 10 10M17 7 7 17" />
  </Base>
);

export const IconPlus = (p: P) => (
  <Base {...p}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Base>
);

export const IconTemplate = (p: P) => (
  <Base {...p}>
    <rect x="5" y="5" width="14" height="14" rx="2" />
    <path d="M5 12h14M12 5v14" />
  </Base>
);

export const IconPencil = (p: P) => (
  <Base {...p}>
    <path d="m14.5 6.5 3 3M5 19l1-4 9.5-9.5a1.4 1.4 0 0 1 2 0l1 1a1.4 1.4 0 0 1 0 2L9 18l-4 1Z" />
  </Base>
);

export const IconTrash = (p: P) => (
  <Base {...p}>
    <path d="M5.5 7.5h13M10 7.5V5.5h4v2M7 7.5l.8 11a1 1 0 0 0 1 .9h6.4a1 1 0 0 0 1-.9l.8-11M10.5 11v5M13.5 11v5" />
  </Base>
);

/** Filled blue circle with a plus — marker of a selected empty cell. */
export const IconPlusCircle = ({ size = 20, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden {...p}>
    <circle cx="10" cy="10" r="10" fill="#5B7DEC" />
    <path d="M10 5.5v9M5.5 10h9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
