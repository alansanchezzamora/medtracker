const symbols = {
  grid: "dashboard",
  people: "group",
  pill: "pill",
  history: "history",
  settings: "settings",
  chevron: "expand_more",
  plus: "add",
  upload: "upload",
  check: "check",
  bell: "notifications",
  more: "more_horiz",
  arrow: "arrow_forward",
  calendar: "calendar_month",
  phone: "phone",
  edit: "edit",
} as const;

export type IconName = keyof typeof symbols;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <span className="material-symbols-rounded" style={{ fontSize: size }} aria-hidden="true">{symbols[name]}</span>;
}
