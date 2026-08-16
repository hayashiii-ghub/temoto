"use client";

import { useEffect, useState } from "react";

const destinations = [
  { id: "top", label: "トップ", shortLabel: "↑" },
  { id: "macos", label: "macOS", shortLabel: "Mac" },
  { id: "chrome", label: "Chrome", shortLabel: "Chrome" },
  { id: "proxy", label: "Proxy", shortLabel: "Proxy" },
] as const;

type DestinationId = (typeof destinations)[number]["id"];

export function ProductNavigation() {
  const [activeId, setActiveId] = useState<DestinationId>("top");

  useEffect(() => {
    const sections = destinations
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveId(visible.target.id as DestinationId);
        }
      },
      { rootMargin: "-28% 0px -58%", threshold: [0, 0.05, 0.2] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <nav className="navLinks" aria-label="製品ナビゲーション">
        {destinations.slice(1).map(({ id, label }) => (
          <a href={`#${id}`} aria-current={activeId === id ? "location" : undefined} key={id}>
            {label}
          </a>
        ))}
      </nav>
      <nav className="mobileProductNav" aria-label="製品を切り替える">
        {destinations.map(({ id, label, shortLabel }) => (
          <a
            href={`#${id}`}
            aria-label={id === "top" ? "ページ上部へ戻る" : `${label}へ移動`}
            aria-current={activeId === id ? "location" : undefined}
            key={id}
          >
            {shortLabel}
          </a>
        ))}
      </nav>
    </>
  );
}
