import type { CSSProperties } from "react";

const repositoryUrl = "https://github.com/hayashiii-ghub/temoto";
const chromeSourceUrl = `${repositoryUrl}/tree/main/browser/temoto-chrome`;
const proxySourceUrl = `${repositoryUrl}/tree/main/browser/temoto-proxy`;
const chromeStoreUrl =
  "https://chromewebstore.google.com/detail/temoto-for-chrome/gcncgknjklghkoeiapcbdghodepnllid";
const proxyStoreUrl =
  "https://chromewebstore.google.com/detail/temoto-proxy/hohabmdadcdkifcmbclkgnomhhlllnbb";
const chromeVersion = "0.2.0";
const proxyVersion = "1.1.0";

const chromeTools = [
  {
    name: "Color Picker",
    path: "M222,67.34a33.81,33.81,0,0,0-10.64-24.25C198.12,30.56,176.68,31,163.54,44.18L142.82,65l-.63-.63a22,22,0,0,0-31.11,0l-9,9a14,14,0,0,0,0,19.81l3.47,3.47L53.14,149.1a37.81,37.81,0,0,0-9.84,36.73l-8.31,19a11.68,11.68,0,0,0,2.46,13A13.91,13.91,0,0,0,47.32,222,14.15,14.15,0,0,0,53,220.82L71,212.92a37.92,37.92,0,0,0,35.84-10.07l52.44-52.46,3.47,3.48a14,14,0,0,0,19.8,0l9-9a22.06,22.06,0,0,0,0-31.13l-.66-.65L212,91.85A33.76,33.76,0,0,0,222,67.34Zm-123.61,127a26,26,0,0,1-26,6.47,6,6,0,0,0-4.17.24l-20,8.75a2,2,0,0,1-2.09-.31l9.12-20.9a5.94,5.94,0,0,0,.19-4.31A25.91,25.91,0,0,1,56,166h70.78ZM138.78,154H65.24l48.83-48.84,36.76,36.78Zm64.77-70.59L178.17,108.9a6,6,0,0,0,0,8.47l4.88,4.89a10,10,0,0,1,0,14.15l-9,9a2,2,0,0,1-2.82,0l-60.69-60.7a2,2,0,0,1,0-2.83l9-9a10,10,0,0,1,14.14,0l4.89,4.89a6,6,0,0,0,4.24,1.75h0a6,6,0,0,0,4.25-1.77L172,52.66c8.57-8.58,22.51-9,31.07-.85a22,22,0,0,1,.44,31.57Z",
    previewDescription: "Pick from the page",
  },
  {
    name: "Screenshot",
    path: "M150,40a6,6,0,0,1-6,6H112a6,6,0,0,1,0-12h32A6,6,0,0,1,150,40Zm-6,170H112a6,6,0,0,0,0,12h32a6,6,0,0,0,0-12ZM208,34H184a6,6,0,0,0,0,12h24a2,2,0,0,1,2,2V72a6,6,0,0,0,12,0V48A14,14,0,0,0,208,34Zm8,72a6,6,0,0,0-6,6v32a6,6,0,0,0,12,0V112A6,6,0,0,0,216,106Zm0,72a6,6,0,0,0-6,6v24a2,2,0,0,1-2,2H184a6,6,0,0,0,0,12h24a14,14,0,0,0,14-14V184A6,6,0,0,0,216,178ZM40,150a6,6,0,0,0,6-6V112a6,6,0,0,0-12,0v32A6,6,0,0,0,40,150Zm32,60H48a2,2,0,0,1-2-2V184a6,6,0,0,0-12,0v24a14,14,0,0,0,14,14H72a6,6,0,0,0,0-12ZM72,34H48A14,14,0,0,0,34,48V72a6,6,0,0,0,12,0V48a2,2,0,0,1,2-2H72a6,6,0,0,0,0-12Z",
    previewDescription: "Region, viewport, or full",
  },
  {
    name: "Video Speed",
    path: "M115.76,155.76l96-96a6,6,0,0,1,8.48,8.48l-96,96a6,6,0,0,1-8.48-8.48ZM128,86a65.9,65.9,0,0,1,21.08,3.44,6,6,0,0,0,3.83-11.38,78,78,0,0,0-102.43,82.6,6,6,0,0,0,6,5.34,5.12,5.12,0,0,0,.67,0,6,6,0,0,0,5.3-6.62A69,69,0,0,1,62,152,66.08,66.08,0,0,1,128,86Zm98,15.9a6,6,0,1,0-10.68,5.48,98.35,98.35,0,0,1,5.16,77.25,2,2,0,0,1-1.91,1.37H37.46a2.07,2.07,0,0,1-1.91-1.41A98.23,98.23,0,0,1,128,54h.9a97,97,0,0,1,43.71,10.72A6,6,0,1,0,178.1,54,108.92,108.92,0,0,0,129,42h-1A110.06,110.06,0,0,0,24.23,188.58,14.08,14.08,0,0,0,37.46,198H218.53a14.06,14.06,0,0,0,13.22-9.37A110.34,110.34,0,0,0,226,101.9Z",
    previewDescription: "Control page playback",
  },
  {
    name: "Switch Origin",
    path: "M212.24,171.76a6,6,0,0,1,0,8.48l-32,32a6,6,0,0,1-8.48-8.48L193.51,182H48a6,6,0,0,1,0-12H193.51l-21.75-21.76a6,6,0,0,1,8.48-8.48ZM75.76,116.24a6,6,0,0,0,8.48-8.48L62.49,86H208a6,6,0,0,0,0-12H62.49L84.24,52.24a6,6,0,0,0-8.48-8.48l-32,32a6,6,0,0,0,0,8.48Z",
    previewDescription: "Local, staging, or production",
  },
  {
    name: "Site Reset",
    path: "M222,128a94,94,0,0,1-92.74,94H128a93.43,93.43,0,0,1-64.5-25.65,6,6,0,1,1,8.24-8.72A82,82,0,1,0,70,70l-.19.19L39.44,98H72a6,6,0,0,1,0,12H24a6,6,0,0,1-6-6V56a6,6,0,0,1,12,0V90.34L61.63,61.4A94,94,0,0,1,222,128Z",
    previewDescription: "Clear the current site",
  },
  {
    name: "Inspect",
    path: "M208,94a14,14,0,0,0,14-14V48a14,14,0,0,0-14-14H176a14,14,0,0,0-14,14V58H94V48A14,14,0,0,0,80,34H48A14,14,0,0,0,34,48V80A14,14,0,0,0,48,94H58v68H48a14,14,0,0,0-14,14v32a14,14,0,0,0,14,14H80a14,14,0,0,0,14-14V198h68v10a14,14,0,0,0,14,14h32a14,14,0,0,0,14-14V176a14,14,0,0,0-14-14H198V94ZM174,48a2,2,0,0,1,2-2h32a2,2,0,0,1,2,2V80a2,2,0,0,1-2,2H176a2,2,0,0,1-2-2ZM46,80V48a2,2,0,0,1,2-2H80a2,2,0,0,1,2,2V80a2,2,0,0,1-2,2H48A2,2,0,0,1,46,80ZM82,208a2,2,0,0,1-2,2H48a2,2,0,0,1-2-2V176a2,2,0,0,1,2-2H80a2,2,0,0,1,2,2Zm128-32v32a2,2,0,0,1-2,2H176a2,2,0,0,1-2-2V176a2,2,0,0,1,2-2h32A2,2,0,0,1,210,176Zm-24-14H176a14,14,0,0,0-14,14v10H94V176a14,14,0,0,0-14-14H70V94H80A14,14,0,0,0,94,80V70h68V80a14,14,0,0,0,14,14h10Z",
    previewDescription: "Measure and copy CSS",
  },
];

function ChromeMark({ className }: { className?: string }) {
  return <span className={className ? `chromeMark ${className}` : "chromeMark"} aria-hidden="true" />;
}

function ProxyMark({ className }: { className?: string }) {
  return <span className={className ? `proxyMark ${className}` : "proxyMark"} aria-hidden="true" />;
}

function ChromeSettingsMark() {
  return (
    <svg className="chromeSettingsIcon" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
      <path d="M40,86H74.6a30,30,0,0,0,58.8,0H216a6,6,0,0,0,0-12H133.4a30,30,0,0,0-58.8,0H40a6,6,0,0,0,0,12Zm64-24A18,18,0,1,1,86,80,18,18,0,0,1,104,62ZM216,170H197.4a30,30,0,0,0-58.8,0H40a6,6,0,0,0,0,12h98.6a30,30,0,0,0,58.8,0H216a6,6,0,0,0,0-12Zm-48,24a18,18,0,1,1,18-18A18,18,0,0,1,168,194Z" />
    </svg>
  );
}

function ChromeToolIcon({ path }: { path: string }) {
  return (
    <svg className="chromeToolIcon" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function ChromePreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`chromeScene${compact ? " isCompact" : ""}`} role="img" aria-label="temoto for Chrome launcher preview">
      <div className="chromePopup">
        <div className="chromePopupHeader">
          <p>temoto <span className="chromeFor">for Chrome</span></p>
          <span className="chromeSettings" aria-hidden="true"><ChromeSettingsMark /></span>
        </div>
        <div className="chromeGrid">
          {chromeTools.map((tool) => (
            <div className="chromeCell" key={tool.name}>
              <div className="chromeCellHead">
                <ChromeToolIcon path={tool.path} />
                {tool.name === "Video Speed" ? <small>1.5x</small> : null}
              </div>
              <span className="chromeCellCopy">
                <strong>{tool.name}</strong>
                <small>{tool.previewDescription}</small>
              </span>
            </div>
          ))}
        </div>
        <div className="chromeFeedback" aria-hidden="true" />
      </div>
    </div>
  );
}

function ProxyPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`proxyScene${compact ? " isCompact" : ""}`} role="img" aria-label="temoto Proxy popup preview">
      <div className="proxyPopup">
        <div className="proxyPopupHeader">
          <p>temoto <span>Proxy</span></p>
          <span className="proxyPopupSettings" aria-hidden="true"><ChromeSettingsMark /></span>
        </div>
        <div className="proxyPopupStatus">
          <div className="proxyStatusLine"><i /><span>Proxy active</span></div>
          <h3>Charles local</h3>
          <p>HTTP · 127.0.0.1:8080</p>
          <div className="proxyPopupActions"><strong>Turn off safely</strong><span>Test</span></div>
        </div>
        <div className="proxyPopupProfiles">
          <div className="proxyPopupSection"><span>Profiles</span><small>3</small></div>
          <div className="proxyPopupProfile isActive">
            <i style={{ "--profile-color": "#9974f8" } as CSSProperties} />
            <span><strong>Charles local</strong><small>HTTP · 127.0.0.1:8080</small></span>
            <em>ACTIVE</em>
          </div>
          <div className="proxyPopupProfile">
            <i style={{ "--profile-color": "#6ebf93" } as CSSProperties} />
            <span><strong>Staging routes</strong><small>HTTP · 127.0.0.1:8080</small></span>
            <em>ROUTED</em>
          </div>
          <div className="proxyPopupProfile">
            <i style={{ "--profile-color": "#d2a154" } as CSSProperties} />
            <span><strong>Company PAC</strong><small>PAC URL</small></span>
            <em>PAC</em>
          </div>
        </div>
        <div className="proxyPopupFooter"><span>Regular windows only unless explicitly enabled</span><strong>Manage</strong></div>
      </div>
    </div>
  );
}

const features = [
  {
    index: "i. test",
    title: "Test the page that is already open.",
    body: "Pick a color, capture a region or full page, change video speed, switch origin, reset site data, or inspect an element — all from one compact popup.",
    product: "chrome",
    focus: "top",
  },
  {
    index: "ii. stay",
    title: "Keep the tools next to the tab.",
    body: "Only the Video Speed shortcut stays active on HTTP(S) pages. Every other tool touches the current tab only when you choose it.",
    product: "chrome",
    focus: "bottom",
  },
  {
    index: "iii. route",
    title: "Make every proxy route visible.",
    body: "Save named HTTP, HTTPS, SOCKS, domain-routing, PAC, and authenticated profiles. See the active route before you change it.",
    product: "proxy",
    focus: "top",
  },
  {
    index: "iv. return",
    title: "Turn it off without leaving settings behind.",
    body: "temoto detects conflicts before applying a profile and removes only the proxy settings it owns when you turn it off.",
    product: "proxy",
    focus: "bottom",
  },
] as const;

const faqs = [
  ["What is temoto?", "temoto is a pair of focused Chrome extensions: six tools for testing the current page, and a separate companion for development proxy settings."],
  ["Why are there two extensions?", "Chrome's proxy permission changes browser-wide network behavior. Keeping Proxy separate lets you install that permission only when you need it."],
  ["What is included in temoto for Chrome?", "Color Picker, Screenshot, Video Speed, Switch Origin, Site Reset, and Inspect."],
  ["Which proxy types are supported?", "HTTP, HTTPS, SOCKS4, SOCKS5, domain routing, generated or existing PAC scripts, and authenticated profiles."],
  ["Does temoto upload page data?", "No. temoto has no accounts, analytics, or telemetry, and it does not send page content or settings to us."],
  ["Are proxy passwords saved?", "Passwords are kept only for the current browser session and are never included in exported profiles."],
  ["Do I need both extensions?", "No. Install the page-testing toolkit, the proxy companion, or both. Each extension works independently."],
  ["Is temoto open source?", "Yes. The source for both extensions and this site is available on GitHub under the MIT License."],
] as const;

export default function Home() {
  return (
    <div className="page" lang="en">
      <a className="skipLink" href="#content">Skip to content</a>

      <nav className="topRail" aria-label="Primary">
        <a className="brand" href="#top">temoto</a>
        <a className="navHow" href="#how">How it works</a>
        <a href="#install">Install</a>
        <a href={repositoryUrl}>GitHub</a>
      </nav>

      <main id="content">
        <section className="hero" id="top" aria-labelledby="temoto-title">
          <a className="releaseChip" href={repositoryUrl}>
            <span>Open source</span>
            <span>Built for Chrome</span>
          </a>
          <h1 id="temoto-title">Keep browser work<br />close at hand.</h1>
          <p className="heroSubtitle">
            temoto keeps six page-testing tools and a proxy profile manager in two focused Chrome extensions, ready for the next check or switch.
          </p>
          <div className="heroActions">
            <a className="button primary" href="#install">Choose a tool</a>
            <a className="button secondary" href={repositoryUrl}>View on GitHub</a>
          </div>
          <p className="heroMeta">Free · Open source · local settings · Chrome</p>
        </section>

        <section className="showcaseSection" aria-label="temoto in the browser">
          <div className="showcase">
            <div className="showcaseFrame">
              <div className="showcaseProduct">
                <div className="showcaseLabel"><ChromeMark /><span>temoto for Chrome</span><em>{chromeVersion}</em></div>
                <ChromePreview compact />
              </div>
              <div className="showcaseProduct">
                <div className="showcaseLabel"><ProxyMark /><span>temoto Proxy</span><em>{proxyVersion}</em></div>
                <ProxyPreview compact />
              </div>
            </div>
          </div>
        </section>

        <section className="section features" id="how" aria-label="How temoto works">
          {features.map((feature, index) => (
            <article className={`featureRow${index % 2 ? " flip" : ""}`} key={feature.index}>
              <div className="featureCopy">
                <p className="eyebrow">— {feature.index}</p>
                <h2>{feature.title}</h2>
                <p>{feature.body}</p>
              </div>
              <div className={`featureVisual is-${feature.product} focus-${feature.focus}`}>
                {feature.product === "chrome" ? <ChromePreview compact /> : <ProxyPreview compact />}
              </div>
            </article>
          ))}
        </section>

        <section className="section privacy" aria-labelledby="privacy-title">
          <div className="sectionNarrow">
            <p className="eyebrow">— Privacy</p>
            <h2 id="privacy-title">Local-first, because browser work is still your work.</h2>
            <ul className="privacyMarks" aria-label="temoto privacy properties">
              <li>No temoto account</li>
              <li>No analytics</li>
              <li>Local extension storage</li>
              <li>Session-only credentials</li>
            </ul>
            <p className="centerCopy">
              temoto does not send page content, settings, or proxy credentials to us. Chrome keeps extension settings locally, and proxy passwords stay only for the browser session and are excluded from exports.
            </p>
          </div>
        </section>

        <section className="section installSection" id="install" aria-labelledby="install-title">
          <div className="sectionNarrow">
            <p className="eyebrow">— Install</p>
            <h2 id="install-title">Two extensions. Install only what you need.</h2>
            <p className="centerCopy">Add the page-testing toolkit, the proxy companion, or both.</p>
            <div className="installList">
              <div className="installBar">
                <div className="installName"><ChromeMark /><span><strong>temoto for Chrome</strong><small>{chromeVersion} · Chrome 116+</small></span></div>
                <a className="button primary" href={chromeStoreUrl}>Add to Chrome <span aria-hidden="true">↗</span></a>
              </div>
              <div className="installBar">
                <div className="installName"><ProxyMark /><span><strong>temoto Proxy</strong><small>{proxyVersion} · Chrome 116+</small></span></div>
                <a className="button secondary" href={proxyStoreUrl}>Add to Chrome <span aria-hidden="true">↗</span></a>
              </div>
            </div>
            <p className="installNote">
              Source, permissions, and privacy details are available for <a href={chromeSourceUrl}>temoto for Chrome</a> and <a href={proxySourceUrl}>temoto Proxy</a> on GitHub.
            </p>
          </div>
        </section>

        <section className="section faq" aria-labelledby="faq-title">
          <div className="sectionNarrow">
            <p className="eyebrow">— FAQ</p>
            <h2 id="faq-title">Questions, answered plainly.</h2>
            <div className="faqList">
              {faqs.map(([question, answer]) => (
                <details className="faqItem" key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="finalCta" aria-labelledby="final-title">
          <h2 id="final-title">Keep browser work close at hand.</h2>
          <div className="heroActions">
            <a className="button primary" href={chromeStoreUrl}>Add temoto for Chrome <span aria-hidden="true">↗</span></a>
            <a className="button secondary" href={proxyStoreUrl}>Add temoto Proxy <span aria-hidden="true">↗</span></a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footerMeta"><span>temoto</span><span className="dot" /><span>Open source</span></div>
        <div className="footerLinks">
          <a href={repositoryUrl}>GitHub</a>
          <a href={`${repositoryUrl}/issues`}>Issues</a>
          <a href={chromeStoreUrl}>Chrome</a>
          <a href={proxyStoreUrl}>Proxy</a>
        </div>
      </footer>
    </div>
  );
}
