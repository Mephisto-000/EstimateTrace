"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-TW">
      <body>
        <main id="main-content">
          <div className="page-shell state-page" role="alert">
            <p className="eyebrow">系統錯誤</p>
            <h1>EstimateTrace 暫時無法使用</h1>
            <p>
              請再試一次，或稍後再回來。這個錯誤畫面不會把案件名稱、描述、金額或匯入內容傳到外部服務。
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
        </main>
      </body>
    </html>
  );
}
