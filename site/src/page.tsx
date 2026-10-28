import { LauncherPreview } from "./components/launcher-preview";

const repositoryUrl = "https://github.com/hayashiii-ghub/temoto";
const chromeStoreUrl = "https://chromewebstore.google.com/detail/temoto-for-chrome/gcncgknjklghkoeiapcbdghodepnllid";

export default function Home() {
  return <div className="page" id="top">
    <a className="skip-link" href="#content">Skip to content</a>
    <header className="brand-header">
      <a className="brand" href="#top" aria-label="temoto home">
        <img className="brand-mark" src="/temoto-mark.svg" alt="" width={32} height={32} />
        <span>temoto</span>
      </a>
      <a className="header-link" href={repositoryUrl}>GitHub</a>
    </header>
    <main id="content">
      <div className="hero-layout">
      <section className="hero" aria-labelledby="temoto-title">
        <h1 id="temoto-title"><span>Less friction.</span><span>More doing.</span></h1>
        <p className="hero-description">Color, capture, CSS, video, proxy. All close at hand.</p>
        <a className="store-link" href={chromeStoreUrl}>Add to Chrome</a>
        <p className="hero-meta">Free · Open source · No account</p>
      </section>
      <section className="product" aria-label="Five tools, close at hand">
        <figure className="product-figure">
          <div className="launcher"><LauncherPreview /></div>
          <p className="demo-caption" id="demo-note">Click a tool to try the interactive demo.</p>
        </figure>
      </section>
      </div>
    </main>
    <footer className="footer">
      <a className="footer-brand" href="#top" aria-label="temoto home"><img src="/temoto-mark.svg" alt="" width={24} height={24} /><span>temoto</span></a>
      <nav aria-label="Resources">
        <a href={repositoryUrl}>GitHub</a>
        <a href={`${repositoryUrl}/blob/main/browser/temoto-chrome/PRIVACY.md`}>Privacy</a>
      </nav>
    </footer>
  </div>;
}
