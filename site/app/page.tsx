import Image from "next/image";

const repositoryUrl = "https://github.com/hayashiii-ghub/temoto";
const chromeSourceUrl = `${repositoryUrl}/tree/main/browser/temoto-chrome`;
const proxySourceUrl = `${repositoryUrl}/tree/main/browser/temoto-proxy`;
const chromeStoreUrl =
  "https://chromewebstore.google.com/detail/temoto-for-chrome/gcncgknjklghkoeiapcbdghodepnllid";
const proxyStoreUrl =
  "https://chromewebstore.google.com/detail/temoto-proxy/hohabmdadcdkifcmbclkgnomhhlllnbb";
const chromeVersion = "0.2.0";
const proxyVersion = "1.1.0";

const chromeSteps = [
  ["01", "Inspect", "Check color, size, spacing, type, and selectors on the page that is already open."],
  ["02", "Capture", "Take a region, viewport, or full-page screenshot without changing tools."],
  ["03", "Reset", "Clear the current site's local state when a test needs a clean start."],
  ["04", "Compare", "Move the same path between local, staging, and production origins."],
] as const;

const proxySteps = [
  ["01", "Save", "Give every HTTP, HTTPS, SOCKS, domain-routing, or PAC setup a clear name."],
  ["02", "Verify", "See the active route and test it before browser-wide traffic depends on it."],
  ["03", "Restore", "Turn a profile off without leaving behind settings temoto did not create."],
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

function ChromeMark() {
  return <span className="chromeMark" aria-hidden="true" />;
}

function ProxyMark() {
  return <span className="proxyMark" aria-hidden="true" />;
}

function ProductSteps({ items, label }: { items: typeof chromeSteps | typeof proxySteps; label: string }) {
  return (
    <ol className="productSteps" aria-label={label}>
      {items.map(([index, title, body]) => (
        <li key={index}>
          <span>{index}</span>
          <div>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function Home() {
  return (
    <div className="page" lang="en">
      <a className="skipLink" href="#content">Skip to content</a>

      <nav className="topRail" aria-label="Primary">
        <a className="brand" href="#top">temoto</a>
        <a className="navProducts" href="#products">Products</a>
        <a href="#install">Install</a>
        <a href={repositoryUrl}>GitHub</a>
      </nav>

      <main id="content">
        <section className="hero" id="top" aria-labelledby="temoto-title">
          <a className="releaseChip" href={repositoryUrl}>
            <span>Open source</span>
            <span>Two focused Chrome extensions</span>
          </a>
          <h1 id="temoto-title">Test the page.<br />Switch the route.</h1>
          <p className="heroSubtitle">
            temoto keeps page checks and development proxy routes one click from the current tab, so small verifications stay small.
          </p>
          <div className="heroActions">
            <a className="button primary" href="#chrome">Explore page tools</a>
            <a className="button secondary" href="#proxy">Explore proxy profiles</a>
          </div>
          <p className="heroMeta">Free · Open source · No account · Chrome</p>
        </section>

        <section className="productIndex" id="products" aria-labelledby="products-title">
          <div className="productIndexHeading">
            <p className="eyebrow">— Choose your temoto</p>
            <h2 id="products-title">Install only what your browser work needs.</h2>
          </div>
          <div className="productIndexGrid">
            <a className="productIndexCard" href="#chrome">
              <span className="productIndexIcon"><ChromeMark /></span>
              <span className="productIndexCopy">
                <small>01 · Page tools</small>
                <strong>temoto for Chrome</strong>
                <span>Six focused checks for the current page.</span>
              </span>
              <em>{chromeVersion} ↓</em>
            </a>
            <a className="productIndexCard" href="#proxy">
              <span className="productIndexIcon"><ProxyMark /></span>
              <span className="productIndexCopy">
                <small>02 · Proxy profiles</small>
                <strong>temoto Proxy</strong>
                <span>Named routes with visible, reversible state.</span>
              </span>
              <em>{proxyVersion} ↓</em>
            </a>
          </div>
        </section>

        <section className="productChapter chromeChapter" id="chrome" aria-labelledby="chrome-title">
          <div className="chapterInner">
            <div className="chapterIntro">
              <div>
                <p className="eyebrow">— 01 · temoto for Chrome</p>
                <h2 id="chrome-title">Check the page that is already open.</h2>
              </div>
              <div className="chapterSummary">
                <p>Pick a color, capture exactly what you need, change video speed, switch origin, reset site data, or inspect an element from one compact launcher.</p>
                <a className="textLink" href={chromeStoreUrl}>Add temoto for Chrome <span aria-hidden="true">↗</span></a>
              </div>
            </div>

            <figure className="productShot chromeShot">
              <Image
                src="/product-chrome-launcher.jpg"
                alt="temoto for Chrome launcher showing Color Picker, Screenshot, Video Speed, Switch Origin, Site Reset, and Inspect"
                width="1280"
                height="800"
                priority
              />
              <figcaption>Six local page tools in one launcher.</figcaption>
            </figure>

            <ProductSteps items={chromeSteps} label="How temoto for Chrome helps with page checks" />
          </div>
        </section>

        <section className="productChapter proxyChapter" id="proxy" aria-labelledby="proxy-title">
          <div className="chapterInner">
            <div className="chapterIntro">
              <div>
                <p className="eyebrow">— 02 · temoto Proxy</p>
                <h2 id="proxy-title">Know what the browser is routed through.</h2>
              </div>
              <div className="chapterSummary">
                <p>Save development routes by name, see exactly what is active, test the connection, and return Chrome to its previous state without guesswork.</p>
                <a className="textLink" href={proxyStoreUrl}>Add temoto Proxy <span aria-hidden="true">↗</span></a>
              </div>
            </div>

            <div className="proxyGallery" aria-label="temoto Proxy product screenshots">
              <figure className="productShot proxyPopupShot">
                <Image
                  src="/product-proxy-popup.jpg"
                  alt="temoto Proxy popup showing the active Charles local profile and Turn off safely action"
                  width="1280"
                  height="800"
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>Active state stays visible before the next request.</figcaption>
              </figure>
              <figure className="productShot proxyManagerShot">
                <Image
                  src="/product-proxy-manager.png"
                  alt="temoto Proxy manager showing named proxy profiles and the Charles local configuration"
                  width="1280"
                  height="800"
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>Profiles keep route details explicit and reusable.</figcaption>
              </figure>
            </div>

            <ProductSteps items={proxySteps} label="How temoto Proxy manages browser routes" />
          </div>
        </section>

        <section className="section privacy" aria-labelledby="privacy-title">
          <div className="sectionNarrow">
            <p className="eyebrow">— Permissions, plainly</p>
            <h2 id="privacy-title">You choose when temoto touches the page.</h2>
            <ul className="privacyFacts" aria-label="temoto permission and privacy facts">
              <li><strong>Page tools</strong><span>Run on the current tab only when you choose a tool.</span></li>
              <li><strong>Video Speed</strong><span>The only shortcut that remains active on supported pages.</span></li>
              <li><strong>Proxy</strong><span>Changes browser-wide routing only while a profile is active.</span></li>
              <li><strong>Credentials</strong><span>Stay in the current session and are excluded from exports.</span></li>
            </ul>
            <p className="centerCopy">No temoto account, analytics, or telemetry. Page content, settings, and proxy credentials are not sent to us.</p>
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
          <h2 id="final-title">Keep the next check small.</h2>
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
