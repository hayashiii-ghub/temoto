import Image from "next/image";
import { LauncherPreview } from "./components/launcher-preview";

const repositoryUrl = "https://github.com/hayashiii-ghub/temoto";
const chromeStoreUrl = "https://chromewebstore.google.com/detail/temoto-for-chrome/gcncgknjklghkoeiapcbdghodepnllid";

export default function Home() {
  return <div className="page" id="top">
    <a className="skip-link" href="#content">Skip to content</a>
    <header className="brand-header">
      <a className="brand" href="#top" aria-label="temoto home">
        <Image className="brand-mark" src="/temoto-mark.svg" alt="" width={32} height={36} unoptimized />
        <span>temoto</span>
      </a>
    </header>
    <main id="content">
      <section className="hero" aria-labelledby="temoto-title">
        <p className="eyebrow">A small toolkit for Chrome</p>
        <h1 id="temoto-title"><span>Less friction.</span><span>More doing.</span></h1>
        <a className="store-link" href={chromeStoreUrl} aria-describedby="release-note">Add to Chrome</a>
        <p className="hero-meta">Free · Open source · No account</p>
      </section>
      <section className="product" aria-label="Five tools, close at hand">
        <figure className="product-figure">
          <div className="launcher"><LauncherPreview /></div>
          <figcaption>Color, capture, CSS, video, proxy.<br className="mobile-break" /> All close at hand.</figcaption>
        </figure>
      </section>
    </main>
    <footer className="footer">
      <p id="release-note">This is a preview of the next temoto update.<br />The Store link opens the current release.</p>
      <nav aria-label="Resources">
        <a href={repositoryUrl}>GitHub</a>
        <a href={`${repositoryUrl}/blob/main/browser/temoto-chrome/PRIVACY.md`}>Privacy</a>
      </nav>
    </footer>
  </div>;
}
