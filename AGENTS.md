# EstimateTrace Agent Instructions

本專案以 `estimate-trace-project-spec.md` 為產品與驗收的 source of truth。

- 使用繁體中文撰寫產品文案與文件；專有名詞、API 與程式碼保留 English。
- Runtime 為 Node.js 24 LTS，package manager 為 `pnpm@10.34.5`。
- 只允許一份 `pnpm-lock.yaml`，不得加入其他 package manager lock file。
- 所有 dependencies、cache、browser 與 build artifacts 必須留在 repo 內或被
  `.gitignore` 排除；不得安裝 global dependency。
- Domain engine 必須 deterministic、pure，且不得依賴 React、Next.js、
  browser storage、clock、UUID 或 network。
- 估算資料只能留在 browser，不得新增接收案件內容的 Route Handler、
  Server Action、analytics 或 third-party tracker。
- 所有外部輸入（form、localStorage、JSON import）皆視為 untrusted。
- 公開內容與 sample data 不得包含真實公司、乙方、人員、內部系統、報價或
  credential。
- 變更公式、parameter、schema 或 privacy boundary 時，同步更新 tests、
  methodology、docs 與 release note。
- 實作以 Clean Architecture、SOLID、DRY、accessibility 與最小依賴為原則，
  不做 spec 之外的過度設計。
