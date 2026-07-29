## 變更結論

<!-- 說明這個 PR 解決什麼問題，以及刻意不處理的範圍。 -->

## 規格與可追溯性

- 對應 issue／spec：
- 影響的 use case／Acceptance Criteria：
- 若公式、參數或輸出語意改變，新的 `modelVersion`／`parameterSetVersion`：

## 驗證證據

<!-- 只勾選實際執行且通過的項目；未執行請在下方說明。 -->

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm test:e2e`
- [ ] `pnpm build`
- [ ] Keyboard／mobile／accessibility smoke test（UI 變更時）
- [ ] Production response headers／network inspection（security 或 privacy 變更時）

未執行或失敗項目與原因：

## 安全、隱私與資料

- [ ] 未加入 secret、credential、真實公司／乙方／員工／系統或報價資料。
- [ ] User-generated content 仍以 escaped text 顯示，外部輸入已驗證。
- [ ] 估算內容不會送到 server endpoint、analytics、remote log 或第三方。
- [ ] 新增的 sample／fixture 明確為 fictional／illustrative。
- [ ] 若資料格式改變，已處理 migration、rollback 與既有 snapshot。

## Dependency 變更

<!-- 無 dependency 變更可填「無」。有變更時說明 purpose、exact version、license、安全性、相容性與移除方式。 -->

## 畫面與文件

<!-- UI 變更請附不含敏感資料的 desktop/mobile 截圖；文件與實際設定必須同步。 -->

- [ ] README 與相關 `docs/` 已更新，或本次不需要更新。
- [ ] 所有畫面／fixture／截圖只使用虛構資料。

## Rollback

<!-- 說明 revert 方式；公式或 schema 變更另說明舊案件如何處理。 -->
