# Sample Data Policy

## 結論

EstimateTrace repository、網站、tests、issues、PR、screenshots、recordings 與文件只能使用明確標示為 `fictional`／`illustrative` 的虛構資料。不得從真實公司、乙方、員工、客戶、系統、報價、合約或 NDA 文件改名、抽樣、等比例調整或去識別後衍生 sample。

Sample 的用途是讓公式與流程容易理解，不是市場 benchmark、rate card、公允價格或特定產業慣例。

## Allowed sample

允許：

- 中性功能名稱，例如「會員資料查詢與匯出」。
- 公開市場概念但不指向任何實體的「公開市場價格批次介接」。
- 由本專案作者從零建立、為測試邊界而選擇的數值。
- `example.com`、`example.org`、`.test` 等保留 domain。
- `192.0.2.0/24`、`198.51.100.0/24`、`203.0.113.0/24` 等文件用 IP。
- 明顯不是真實身份的角色，例如 `Fictional BA`、`Demo Reviewer`。
- 測試專用 UUID、timestamps 與 deterministic identifiers。

每筆 built-in example 的 description 必須包含「虛構／fictional」或「示範／illustrative」，畫面也要說明數字不是市場標準。

## Prohibited data

禁止：

- 真實公司、客戶、乙方、分行、部門、員工或聯絡人名稱。
- 真實 project codename、內部系統、host、IP、URL、architecture diagram 或 repository path。
- 真實 email、電話、地址、統編、帳號、employee ID 或任何個資。
- 真實報價、費率、底價、預算、毛利、合約、SLA、罰則或採購條款。
- Production log、stack trace、database row、browser profile、local storage dump 或完整 imported JSON。
- Token、API key、cookie、certificate、private key、connection string 或 secret-like placeholder。
- NDA、內部簡報、報價書、公司表單、設計稿或受著作權保護內容。
- 由公司歷史案件、rate card、實際工時或內部 coefficient 訓練／校準出的參數。
- 看似匿名但能透過組合欄位、時間、金額或描述重新識別的資料。

`ACME`、`Foo Corp` 等常見 placeholder 仍可能與真實名稱碰撞；優先描述虛構功能，不需要虛構公司或乙方品牌。

## Creation rules

建立 sample 時：

1. 先寫教學目標或 test invariant，例如 tax normalization、P80 ≥ P50 或 import rollback。
2. 從零選擇最小可理解數值，不查閱或改寫任何真實案件。
3. 使用 canonical public parameter set，不把 fixture 變成另一份 production magic number。
4. 名稱只描述通用功能；不要加入產業、地區、客戶或組織可識別線索。
5. 加上 `fictional`／`illustrative` marker 與「非市場標準」說明。
6. Reviewer 逐項套用本文件 checklist，確認 provenance 可說明。

若 sample 需要特定 domain input，測試可覆寫該 scenario 的最小欄位；其餘參數從 production canonical source import，避免 drift。

## Numeric policy

- 金額與工時以教學可讀性、boundary coverage 與 regression stability 為目的。
- 不宣稱平均價格、業界行情、建議費率、公允價或合理 markup。
- 不得把真實金額乘除固定比例、四捨五入或換幣後使用。
- Tax、hourly rate、risk multiplier 與 threshold 都要標明是 public demo default。
- Extreme values 只在 boundary／invalid test 使用，名稱要清楚說明其測試目的。
- Snapshot 需要 deterministic representation，不依賴執行當下匯率、日期或 remote data。

## Tests and fixtures

Fixture 必須：

- 使用保留 domain／IP、固定 clock 與 deterministic UUID。
- 只包含重現測試所需欄位。
- 不記錄 developer machine absolute path、username、browser profile 或 environment variable。
- 不把 complete error payload 寫進 snapshot；只比對 sanitized path／code／message。
- Import security tests 包含 malformed JSON、超過 1 MB、unsupported schema、unknown key、`__proto__`／`constructor`／`prototype` 與 escaped script string。
- Storage failure tests 不使用真實 browser profile。

Test report、Playwright trace、video 與 screenshot 可能包含輸入內容；只能使用虛構資料，產物留在 ignored local／CI artifact，公開前仍需人工檢查。

## Screenshots, demos and documentation

- 截圖前使用 clean browser profile 或清除非 sample local data。
- Browser tab、bookmark、address bar、DevTools、notification 與桌面背景不得露出私人資訊。
- 只使用 public deployment URL 或 `localhost`；不要顯示 internal Preview token。
- Alt text、caption 與周邊 prose 也不能提及真實公司或案件。
- Screen recording 結束前檢查每一 frame、download filename 與 OS metadata。
- JSON example 應縮到必要欄位並加上 fictional marker，不直接貼完整 user export。

## Review checklist

提交 sample／fixture／screenshot 前確認：

- [ ] 名稱、描述、數值與識別碼從零建立，不源自真實資料。
- [ ] 明確標示 fictional／illustrative 與非市場標準。
- [ ] 無公司、乙方、員工、客戶、內部系統或 NDA 線索。
- [ ] 無個資、credential、secret-like value、真實 domain／IP／email／電話。
- [ ] 無真實報價、費率、預算、合約或內部 coefficient。
- [ ] Fixture import canonical parameter source，沒有複製 production magic number。
- [ ] Screenshot／trace／artifact 已人工檢查 metadata 與畫面邊緣。
- [ ] License 與來源可公開、可追蹤。

## Discovery and removal

若發現疑似真實或敏感 sample：

1. 停止分享與 deployment promotion，不在 public issue 重貼內容。
2. 透過 [SECURITY.md](../SECURITY.md) 定義的 private channel 處理；若 channel 尚未啟用，owner 必須先配置。
3. Credential 先 revoke／rotate；刪除檔案或 Git history 不能取代 rotation。
4. 移除 current tree、release artifact、screenshot 與 cache，評估 repository history 與 forks。
5. 以從零建立的 fictional fixture 取代並補 regression／hygiene test。
6. 記錄受影響 commit／deployment 與處置，但不在 postmortem 重現敏感 payload。

公司專用 sample、歷史案件與 rate card 只能存在 approved private repository／environment，不得推回 public upstream。
