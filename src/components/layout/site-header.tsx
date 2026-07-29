import Link from "next/link";

import { siteConfig } from "@/config/site";

function NavigationLinks() {
  return (
    <ul className="navigation-list">
      {siteConfig.navigation.map((item) => (
        <li key={item.href}>
          <Link className="navigation-link" href={item.href} prefetch={false}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header" data-print="hide">
      <div className="site-header__inner">
        <Link
          className="brand"
          href="/"
          prefetch={false}
          aria-label="EstimateTrace 首頁"
        >
          <span className="brand__mark" aria-hidden="true">
            ET
          </span>
          <span>EstimateTrace</span>
        </Link>

        <nav className="desktop-navigation" aria-label="主要導覽">
          <NavigationLinks />
        </nav>

        <details className="mobile-navigation">
          <summary>
            <span>選單</span>
            <span className="mobile-navigation__icon" aria-hidden="true">
              ☰
            </span>
          </summary>
          <nav aria-label="行動版主要導覽">
            <NavigationLinks />
          </nav>
        </details>
      </div>
    </header>
  );
}
