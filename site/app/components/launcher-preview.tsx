import Image from "next/image";
import "./launcher-preview.css";

const tools = [
  { label: "Color Picker", icon: "eyedropper" },
  { label: "Screenshot", icon: "scan" },
  { label: "CSS", icon: "brackets-curly" },
  { label: "Video Speed", icon: "gauge", detail: "1.5×" },
  { label: "Proxy", icon: "arrows-left-right" },
] as const;

export function LauncherPreview() {
  return (
    <div className="launcher-preview" role="group" aria-label="temoto’s five tools">
      <div className="launcher-preview__surface">
        <p className="launcher-preview__brand">temoto</p>
        <ul className="launcher-preview__tools">
          {tools.map((tool) => (
            <li className="launcher-preview__row" key={tool.label}>
              <Image
                className="launcher-preview__icon"
                src={`/tools/${tool.icon}.svg`}
                alt=""
                width={22}
                height={22}
                unoptimized
              />
              <span className="launcher-preview__label">{tool.label}</span>
              {"detail" in tool ? (
                <span className="launcher-preview__detail">{tool.detail}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
