export const ACCENT = "#9974F8";

export function Cursor() {
  return <path d="m0 0 5 24 5-8 9-2Z" fill="var(--ink)" stroke="var(--black)" strokeWidth="1.5" />;
}

export function PosterGeometry() {
  return <svg viewBox="0 0 520 510" className="poster-svg" aria-hidden="true">
    <g className="draft-lines"><path d="M20 36h480v444H20ZM270 14v488M0 259h398M392 36v466M392 159h108M20 344a136 136 0 0 1 136 136" /></g>
    <g data-part="circle"><circle cx="237" cy="259" r="162" fill={ACCENT} /></g>
    <g data-part="triangle"><path d="M392 48v111h111Z" fill={ACCENT} /></g>
    <path d="M442 205h42v42h-42Z" className="shape-outline" />
    <path d="M442 268h42v42h-42Z" fill={ACCENT} />
    <path d="M431 345h63M462 329v32M225 259h24M237 247v24" className="shape-outline" />
    <g fill="var(--ink)">{[[20, 36], [500, 36], [20, 480]].map(([x, y]) => <rect key={`${x}-${y}`} x={x - 7} y={y - 7} width="14" height="14" />)}</g>
    <text x="44" y="73" className="poster-label"><tspan x="44">pick</tspan><tspan x="44" dy="28">capture</tspan><tspan x="44" dy="28">inspect</tspan></text>
    <g className="scene-overlay" data-part="pick"><path d="m237 259 67 61h52" className="shape-outline" /><rect x="307" y="320" width="119" height="36" className="readout-box" /><text x="322" y="344" className="svg-label">{ACCENT}</text></g>
    <g className="scene-overlay" data-part="capture"><rect x="58" y="80" width="356" height="368" className="capture-frame" /><path d="M58 102V80h22M392 80h22v22M58 426v22h22M392 448h22v-22" className="capture-corners" /></g>
    <g className="scene-overlay" data-part="inspect"><path d="M442 186h42M442 180v12M484 180v12" className="shape-outline" /><rect x="408" y="135" width="94" height="34" className="readout-box" /><text x="420" y="157" className="svg-label">42 × 42</text></g>
    <g transform="translate(237 259)"><g data-part="cursor" className="scene-overlay"><Cursor /></g></g>
  </svg>;
}

export function WorkbenchGeometry() {
  return <svg viewBox="0 0 960 300" className="workbench-svg" aria-hidden="true">
    <g className="workbench-grid">{Array.from({ length: 13 }, (_, i) => <path key={`v${i}`} d={`M${i * 80} 0v300`} />)}{[50, 100, 150, 200, 250].map((y) => <path key={y} d={`M0 ${y}h960`} />)}</g>
    <path d="M16 35V16h19M925 16h19v19M16 265v19h19M925 284h19v-19" className="shape-outline" />
    <g data-part="circle"><circle cx="190" cy="159" r="60" fill={ACCENT} /></g>
    <rect x="430" y="99" width="120" height="120" className="shape-outline demo-shape" />
    <path d="M790 108v88h88Z" fill={ACCENT} />
    <g data-part="pick" className="scene-overlay pick-overlay"><path d="m190 159 69 63h33" className="shape-outline" /><rect x="270" y="213" width="114" height="32" className="readout-box" /><text x="282" y="235" className="svg-label">{ACCENT}</text></g>
    <g data-part="inspect" className="scene-overlay inspect-overlay"><path d="M130 78h120M130 72v12M250 72v12M110 99v120M104 99h12M104 219h12M430 78h120M430 72v12M550 72v12M573 99v120M567 99h12M567 219h12" className="shape-outline" /><text x="162" y="65" className="svg-label">120 px</text><text x="462" y="65" className="svg-label">120 px</text><text x="37" y="164" className="svg-label">120 px</text><text x="585" y="164" className="svg-label">120 px</text></g>
    <g data-part="selector" className="scene-overlay inspect-overlay"><path d="m550 219 65 36h87" className="shape-outline" /><rect x="702" y="238" width="236" height="34" className="readout-box" /><text x="716" y="261" className="svg-label">Selector: .demo-shape</text></g>
    <g data-part="capture" className="scene-overlay capture-overlay"><rect x="100" y="70" width="494" height="178" className="capture-frame" /><path d="M100 91V70h21M573 70h21v21M100 227v21h21M573 248h21v-21" className="capture-corners" /></g>
    <g data-part="capture-preview" className="scene-overlay capture-overlay"><rect x="685" y="71" width="240" height="178" className="readout-box" /><circle cx="749" cy="145" r="30" fill={ACCENT} /><rect x="823" y="115" width="60" height="60" className="shape-outline" /><text x="702" y="226" className="svg-label">Region captured</text></g>
    <g transform="translate(190 159)"><g data-part="cursor" className="scene-overlay pick-overlay"><Cursor /></g></g>
  </svg>;
}
