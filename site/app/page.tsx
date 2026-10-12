import Image from "next/image";
import { HeroMotion } from "./components/motion/hero-motion";
import { PageToolDemo } from "./components/motion/page-tool-demo";
import { ProxyRouteDemo } from "./components/motion/proxy-route-demo";

const repositoryUrl = "https://github.com/hayashiii-ghub/temoto";
const chromeSourceUrl = `${repositoryUrl}/tree/main/browser/temoto-chrome`;
const proxySourceUrl = `${repositoryUrl}/tree/main/browser/temoto-proxy`;
const chromeStoreUrl = "https://chromewebstore.google.com/detail/temoto-for-chrome/gcncgknjklghkoeiapcbdghodepnllid";
const proxyStoreUrl = "https://chromewebstore.google.com/detail/temoto-proxy/hohabmdadcdkifcmbclkgnomhhlllnbb";
const features = [
  ["Color Picker", "Pick a color. Copy HEX, RGB, or HSL and revisit your latest eight colors."],
  ["Screenshot", "Capture the visible area or the full page. Preview at Fit or 100%, then copy or save a PNG."],
  ["CSS", "Inspect size, spacing, fonts, and colors. Copy grouped CSS or a unique selector."],
  ["Video Speed", "Control playback from 0.25× to 5×. Follow each video’s actual rate with popup controls or G/D/S."],
] as const;
const faqs = [
  ["What is temoto?", "temoto is a pair of focused Chrome extensions: four tools for the current page, and a separate manager for development proxy settings."],
  ["Why are there two extensions?", "Chrome's proxy permission changes browser-wide network behavior. Keeping Proxy separate lets you install that permission only when you need it."],
  ["What is included in temoto?", "Color Picker, Screenshot, CSS, and Video Speed."],
  ["Which proxy types are supported?", "HTTP, HTTPS, SOCKS4, SOCKS5, domain routing, generated or existing PAC scripts, and authenticated profiles."],
  ["Does temoto upload page data?", "No. temoto has no accounts, analytics, or telemetry, and it does not send page content or settings to us."],
  ["Are proxy passwords saved?", "Passwords are kept only for the current browser session and are never included in exported profiles."],
  ["Do I need both extensions?", "No. Install the page-testing toolkit, the proxy companion, or both. Each extension works independently."],
  ["Is temoto open source?", "Yes. The source for both extensions and this site is available on GitHub under the MIT License."],
] as const;

function Arrow() {
  return <svg className="link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h16m-7-7 7 7-7 7" /></svg>;
}

function Brand() {
  return <a className="brand" href="#top"><span className="brandMark" aria-hidden="true" />temoto</a>;
}

function StoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="button primary" href={href}><span className="desktop-store-label">{children}</span><span className="mobile-store-label">View in Chrome Web Store</span><Arrow /></a>;
}

export default function Home() {
  return <div className="page" lang="en">
    <a className="skipLink" href="#content">Skip to content</a>
    <nav className="topRail wrap" aria-label="Primary">
      <Brand />
      <div><a href="#chrome">Tools</a><a href="#proxy">Proxy</a><a href="#install">Install</a><a className="nav-github" href={repositoryUrl}>GitHub</a></div>
    </nav>
    <main id="content" className="wrap">
      <section className="hero" id="top" aria-labelledby="temoto-title">
        <div className="hero-copy">
          <h1 id="temoto-title">Browser tools.<br />Close at hand.</h1>
          <p className="heroSubtitle">Four page tools. A separate proxy companion. Built for Chrome.</p>
          <div className="heroActions"><StoreLink href={chromeStoreUrl}>Get temoto for Chrome</StoreLink><a className="textLink" href="#proxy">Explore Proxy <Arrow /></a></div>
          <p className="heroMeta">Free · Open source · No account · Chrome</p>
          <p className="mobile-install-note">Install on desktop Chrome.</p>
        </div>
        <HeroMotion />
      </section>
      <section className="productIndex" id="products" aria-label="Choose your temoto">
        <a href="#chrome"><span className="index-number">01 /</span><span><strong>temoto</strong><span>Four page tools.</span></span></a>
        <a href="#proxy"><span className="index-number">02 /</span><span><strong>temoto Proxy</strong><span>Browser-wide proxy profiles.</span></span></a>
      </section>
      <section className="productChapter chromeChapter" id="chrome" aria-labelledby="chrome-title"><PageToolDemo /></section>
      <section className="section tools-section" aria-labelledby="tools-title">
        <h2 id="tools-title">Four tools, one launcher.</h2>
        <div className="tools-layout">
          <div><dl className="feature-list">{features.map(([name, copy], i) => <div key={name}><span aria-hidden="true">0{i + 1}</span><dt>{name}</dt><dd>{copy}</dd></div>)}</dl><StoreLink href={chromeStoreUrl}>Add temoto for Chrome</StoreLink></div>
          <figure className="productShot launcher-shot"><Image src="/showcase/chrome-launcher.png?v=f3707870e637" alt="temoto launcher with four page tools in a two by two grid" width={416} height={500} loading="lazy" unoptimized /><figcaption>The Chrome launcher.</figcaption></figure>
        </div>
      </section>
      <section className="productChapter proxyChapter" id="proxy" aria-labelledby="proxy-title">
        <p className="eyebrow"><span>02 /</span> temoto Proxy</p>
        <div className="chapterIntro"><h2 id="proxy-title">Choose a route.<br />Know what&apos;s active.</h2><div><p>Save development proxy profiles. See the active route. Clear temoto&apos;s override when you&apos;re done.</p><a className="textLink" href={proxyStoreUrl}>Add temoto Proxy <Arrow /></a></div></div>
        <div className="proxyGallery">
          <figure className="productShot"><Image src="/showcase/proxy-popup.png?v=e330f39fc977" alt="temoto Proxy popup with sample profiles and safe off control" width={416} height={500} loading="lazy" unoptimized /><figcaption>The active profile, at a glance.</figcaption></figure>
          <ProxyRouteDemo />
        </div>
        <p className="muted">Proxy profiles control browser-wide connections. The four page tools work independently.</p>
      </section>
      <section className="section installSection" id="install" aria-labelledby="install-title">
        <h2 id="install-title">Install only what you need.</h2><p className="section-copy">The page tools, the proxy companion, or both. Each works independently.</p>
        <div className="installList">
          <article><div className="installName"><span className="chromeMark" aria-hidden="true" /><div><h3>temoto for Chrome</h3><p>v1 · Chrome 116+</p></div></div><h4>Current-page tools</h4><p>Pick colors, capture the page, inspect CSS, and control video speed. Color history and preferences stay in your browser.</p><StoreLink href={chromeStoreUrl}>Add temoto for Chrome</StoreLink><a className="textLink" href={chromeSourceUrl}>Source &amp; permissions <Arrow /></a></article>
          <article><div className="installName"><span className="proxyMark" aria-hidden="true" /><div><h3>temoto Proxy</h3><p>v1.1 · Chrome 116+</p></div></div><h4>Browser-wide proxy settings</h4><p>Named proxy profiles with active-state and connection checks. Proxy, storage, and authentication permissions; host access supports connection checks and proxy authentication.</p><StoreLink href={proxyStoreUrl}>Add temoto Proxy</StoreLink><a className="textLink" href={proxySourceUrl}>Source &amp; permissions <Arrow /></a></article>
        </div><p className="mobile-install-note">Install on desktop Chrome.</p>
      </section>
      <section className="section privacy" aria-labelledby="privacy-title">
        <h2 id="privacy-title">Permissions, plainly.</h2>
        <dl className="privacyFacts"><div><dt>Page tools</dt><dd>Color, screenshot, and CSS tools act on the current page when you choose them.</dd></div><div><dt>Video Speed</dt><dd>Local shortcuts remain available on supported pages and follow each video’s actual rate.</dd></div><div><dt>Proxy</dt><dd>Active profiles affect browser-wide routing. Turning off clears temoto&apos;s override, not other extensions&apos; settings.</dd></div><div><dt>Credentials</dt><dd>Kept for the current browser session. Never included in exported profiles.</dd></div></dl>
        <p className="section-copy">No temoto account, analytics, or telemetry. Page content, settings, and proxy credentials are not sent to us.</p>
        <div className="privacy-links"><a href={`${repositoryUrl}/blob/main/browser/temoto-chrome/PRIVACY.md`}>Chrome privacy <Arrow /></a><a href={`${repositoryUrl}/blob/main/browser/temoto-proxy/PRIVACY.md`}>Proxy privacy <Arrow /></a></div>
      </section>
      <section className="section faq" aria-labelledby="faq-title"><h2 id="faq-title">FAQ</h2><div>{faqs.map(([question, answer]) => <details className="faqItem" key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
    </main>
    <footer className="footer wrap"><Brand /><p>Free. Open source. Close at hand.</p><div><a href={repositoryUrl}>GitHub</a><a href={`${repositoryUrl}/issues`}>Issues</a><a href="#install">Install</a></div></footer>
  </div>;
}
