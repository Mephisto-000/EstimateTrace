"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-shell state-page" role="alert">
      <p className="eyebrow">發生錯誤</p>
      <h1>目前無法顯示這個頁面</h1>
      <p>
        你的估算內容不會因此傳送到外部服務。請先重新嘗試；若問題持續發生，可返回首頁。
      </p>
      <div className="button-group">
        <button
          className="button button--primary"
          type="button"
          onClick={reset}
        >
          重新嘗試
        </button>
        <Link className="button button--secondary" href="/">
          返回首頁
        </Link>
      </div>
    </div>
  );
}
