import { LauncherPreview } from "./components/launcher-preview";

const repositoryUrl = "https://github.com/hayashiii-ghub/temoto";
const chromeStoreUrl = "https://chromewebstore.google.com/detail/temoto-for-chrome/gcncgknjklghkoeiapcbdghodepnllid";

export default function Home() {
  return <div className="page" id="top">
    <a className="skip-link" href="#content">Skip to content</a>
    <header className="brand-header">
      <a className="brand" href="#top" aria-label="temoto home">
        <img className="brand-mark" src="/temoto-mark.svg" alt="" width={32} height={36} />
        <span>temoto</span>
      </a>
    </header>
    <main id="content">
      <section className="hero" aria-labelledby="temoto-title">
        <p className="eyebrow">A small toolkit</p>
        <h1 id="temoto-title"><span>Less friction.</span><span>More doing.</span></h1>
        <a className="store-link" href={chromeStoreUrl}>Add to Chrome</a>
        <p className="hero-meta">Free · Open source · No account</p>
      </section>
      <section className="product" aria-label="Five tools, close at hand">
        <figure className="product-figure">
          <div className="launcher"><LauncherPreview /></div>
          <figcaption>Color, capture, CSS, video, proxy.<br className="mobile-break" /> All close at hand.</figcaption>
          <p className="demo-caption" id="demo-note">Click a tool to try the interactive demo.</p>
        </figure>
      </section>
    </main>
    <footer className="footer">
      <nav aria-label="Resources">
        <a href={repositoryUrl}>GitHub</a>
        <a href={`${repositoryUrl}/blob/main/browser/temoto-chrome/PRIVACY.md`}>Privacy</a>
      </nav>
    </footer>
  </div>;
}
