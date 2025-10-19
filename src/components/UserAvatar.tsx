import type { CSSProperties } from "react";

type Props = {
  src?: string | null;
  name?: string | null;
  size?: number; // px
};

export default function UserAvatar({ src, name, size = 28 }: Props) {
  const initials = (name?.trim()?.[0] ?? "?").toUpperCase();

  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    objectFit: "cover",
    display: "inline-block",
    background: "#e9ecef",
    color: "#495057",
    fontSize: Math.max(12, Math.floor(size * 0.45)),
    fontWeight: 700,
    lineHeight: `${size}px`,
    textAlign: "center",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name} 프로필` : "프로필"}
        width={size}
        height={size}
        style={{ ...style }}
        onError={(e) => {
          const el = e.currentTarget;
          el.onerror = null;
          el.style.display = "none";
          const next = el.nextElementSibling as HTMLElement | null;
          if (next) next.style.display = "inline-block";
        }}
      />
    );
  }
  return <span style={style}>{initials}</span>;
}
