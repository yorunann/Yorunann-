# ⚾ 專業線上棒球電子計分板 (Pro Baseball Scoreboard)

> **給所有棒球迷的禮物** 🎁  
> 專為棒球、壘球賽事與轉播量身打造的現代化網頁版電子計分板系統。

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://yorunann.vercel.app)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-purple?logo=vite)](https://vitejs.dev)

🌐 **線上立即使用**：[https://yorunann.vercel.app](https://yorunann.vercel.app)

---

## 🌟 核心特色

### 1. 📊 即時比分與比賽資訊
- **九局得分矩陣 (Line Score)**：顯示客隊與主隊各局得分、總比分、安打 (H)、失誤 (E)。
- **局數切換**：支援即時上下半局切換與延長賽自動延伸局數。
- **全壘打特效動畫**：敲出全壘打時觸發專屬慶祝橫幅與跑馬動畫。

### 2. ⚾ 專業 BSO 計數與壘包系統
- **好壞球與出局數 (Balls / Strikes / Outs)**：
  - 滿球數自動四壞推壘 / 三振自動記錄出局數。
  - 三出局自動結算半局並換邊守備。
- **動態壘包跑者追蹤**：
  - 支援一二三壘獨立跑者管理。
  - 自動連動得分與打者打點 (RBI) 統計。

### 3. 📺 OBS 實況轉播透明圖層 (OBS Overlay)
- 內建專用 **OBS 瀏覽器來源 (Browser Source)** 模式。
- **全透明背景**：完美疊加於實況直播畫面。
- **多種轉播版面任選**：
  - `broadcast`：電視轉播級右下角/左下角即時比分條 (Scorebug)。
  - `default`：經典電子計分板大版面。
  - `lineup`：先發打序名單卡片。
  - `rhe`：大聯盟風格 R-H-E 簡潔看板。

### 4. 📱 手機 P2P 即時遠端遙控 (Mobile Remote)
- 主控台生成專屬房間代碼與 **QR Code**。
- 球場裁判或記錄員可使用手機掃描進入專用手機遙控介面。
- 採用 **WebRTC P2P (PeerJS)** 技術，毫秒級超低延遲同步，無須安裝額外 App。

### 5. 👥 完整打序陣容與調度管理
- **打線管理**：先發 1～9 棒、板凳球員、背號、姓名、守備位置與打擊率。
- **投手數據追蹤**：記錄球數、三振數 (K)、局數投球。
- **換投與代打**：支援選手交換、代打代跑、換投歷程記錄。
- **名單快速匯入/匯出**：支援文字格式批量貼上名單。

### 6. 📝 逐打席文字紀錄 (Play-by-Play) & 存檔
- 自動生成詳細的比賽歷程（幾局、誰在打擊、出局數、比分變動、打擊結果）。
- 支援本機存檔與歷史比賽回放。

### 7. ⌨️ 鍵盤快速鍵操控
- 支援全局快速鍵單鍵控分，操作行雲流水。
- 內建自訂快速鍵設定介面。

---

## 🚀 本地開發與建置

### 前置需求
- [Node.js](https://nodejs.org/) (建議 v18 以上) 或 [Bun](https://bun.sh/)

### 安裝依賴
```bash
npm install
# 或使用 bun
bun install
```

### 啟動本地開發伺服器
```bash
npm run dev
# 或
bun dev
```
啟動後在瀏覽器開啟 `http://localhost:5173` 即可使用。

### 編譯打包生產版本
```bash
npm run build
```

---

## 🛠️ 技術架構

- **Frontend Core**：[React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling**：[Vite 6](https://vitejs.dev/)
- **Styling**：[TailwindCSS](https://tailwindcss.com/)
- **Icons**：[Lucide React](https://lucide.dev/)
- **Animation**：[Motion (Framer Motion)](https://motion.dev/)
- **Remote P2P Sync**：[PeerJS](https://peerjs.com/) (WebRTC) + [BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)
- **Deployment**：[Vercel](https://vercel.com/)

---

## 📁 專案結構

```
├── components/           # UI 元件 (計分板顯示、控制台、各式設定彈窗、手機端視圖)
├── hooks/                # 自訂 React Hooks (P2P 同步、快捷鍵監聽等)
├── utils/                # 資料編解碼、名單解析、圖片裁切等輔助工具
├── App.tsx               # 主程式入口 (狀態同步整合與畫面路由)
├── constants.ts          # 初始比賽狀態常數
├── reducer.ts            # 比賽規則與狀態機 Reducer
├── types.ts              # TypeScript 型別定義
├── archive/              # 專案歷史補丁腳本留存
└── index.html            # 網頁入口 HTML
```

---

## 📄 授權條款

Made with ❤️ by [Yorunann](https://github.com/yorunann).
給所有熱愛棒球、熱愛運動轉播的朋友們！
