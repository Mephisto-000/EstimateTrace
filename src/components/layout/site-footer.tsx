import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer" data-print="hide">
      <div className="site-footer__inner">
        <div>
          <p className="site-footer__brand">EstimateTrace</p>
          <p className="site-footer__summary">
            公開、免費、可重算的軟體需求成本估算方法展示。
          </p>
        </div>
        <nav aria-label="頁尾導覽">
          <ul className="site-footer__links">
            <li>
              <Link href="/methodology" prefetch={false}>
                公式與定義
              </Link>
            </li>
            <li>
              <Link href="/privacy" prefetch={false}>
                資料與隱私
              </Link>
            </li>
            <li>
              <Link href="/about" prefetch={false}>
                關於
              </Link>
            </li>
          </ul>
        </nav>
        <p className="site-footer__legal">
          本工具僅供決策輔助，不構成正式報價、採購或法律意見。
        </p>
      </div>
    </footer>
  );
}
