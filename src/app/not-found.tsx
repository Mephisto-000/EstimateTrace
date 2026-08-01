import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="page-shell state-page">
      <p className="eyebrow">404</p>
      <h1>找不到這個頁面</h1>
      <p>
        網址可能已變更，或這筆估算不在目前瀏覽器裡。案件資料不會從伺服器載入。
      </p>
      <div className="button-group">
        <Link className="button button--primary" href="/">
          返回首頁
        </Link>
        <Link className="button button--secondary" href="/estimates">
          查看我的估算
        </Link>
      </div>
    </div>
  );
}
