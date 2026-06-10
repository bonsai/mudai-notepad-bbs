# 無題メモ帳BBS — 引き継ぎ文書

作成日: 2026-06-10

---

## プロジェクト概要

匿名・20文字限定・1000スレ上限の超シンプル掲示板。

- **URL**: https://mudai-notepad-bbs.web.app
- **GitHub**: https://github.com/bonsai/mudai-notepad-bbs
- **Firebase Project**: mudai-notepad-bbs

### 設計哲学

> みんなが平等に操作できる。データは自由に活用できる。

- 操作は **追加** と **ダウンロード** のみ。削除・編集は存在しない
- サーバ不要・バックエンド不要。フロントのみで完結
- JSON が唯一の永続形式。1.json でいつでも全データをエクスポート可能

---

## スタック

| 層 | 技術 |
|----|------|
| フロント | Next.js 16.2.7 (App Router, `output: "export"` 静的エクスポート) |
| DB | Firebase Realtime Database (JSON ツリー、クライアント SDK のみ) |
| ホスティング | Firebase Hosting |
| テスト | Vitest 4.x + jsdom |
| CI/CD | GitHub Actions |

---

## ディレクトリ構成

```
mudai-notepad-bbs/
├── .github/
│   └── workflows/
│       ├── ci.yml          # PR/push: typecheck → test → build
│       └── deploy.yml      # master push → Firebase Hosting 自動デプロイ
├── frontend/
│   ├── app/
│   │   ├── globals.css     # CSS変数 + 4テーマ定義
│   │   ├── layout.tsx      # ThemeProvider ラップ
│   │   └── page.tsx        # メインページ (BBS コンポーネント)
│   ├── components/
│   │   ├── Menu.tsx        # 5タブメニュー (開く/編集/保存/設定/情報)
│   │   ├── PostForm.tsx    # 入力欄 (Enter のみ送信、クールダウン)
│   │   ├── ThreadList.tsx  # スレ一覧 (昇順、plain text)
│   │   └── ThemeProvider.tsx  # テーマ Context
│   ├── lib/
│   │   ├── firebase.ts     # Firebase SDK 初期化
│   │   ├── threads.ts      # 全ビジネスロジック
│   │   ├── threads.test.ts # Vitest テスト 16件
│   │   └── theme.ts        # テーマ定義・localStorage 操作
│   ├── database.rules.json # RTDB セキュリティルール
│   ├── firebase.json       # Firebase Hosting + Database 設定
│   └── .env.local          # Firebase 設定 (git 管理外)
├── KANBAN.md               # 作業ログ
├── HANDOVER.md             # 本文書
└── PRD.md                  # 要件定義
```

---

## 主要ロジック (`lib/threads.ts`)

| 関数 | 役割 |
|------|------|
| `fetchAllThreads()` | RTDB から全スレを `createdAt` 昇順で取得 |
| `postThread(body)` | スレ追加 → 1000件超なら古い順に FIFO 削除 |
| `downloadJson(threads, filename)` | `{body, at}` 形式の ISO タイムスタンプ付き JSON をDL |
| `getPage(threads, page)` | page 0 = 最新 50件 (昇順)、page 1 = その前の 50件 |
| `maxPage(total)` | ページ数上限 |

### ページネーション方向

- **page 0** = 最新 50件（開くメニューの「最新を開く」）
- **page + 1** = 古いページ（「前のページ」）
- ページ内は常に昇順（古い→新しい、最新が一番下）

---

## テーマシステム (`lib/theme.ts`)

| テーマ | 特徴 | `data-theme` 値 |
|--------|------|-----------------|
| Dark | デフォルト dark blue Aero glass | `dark` |
| White | 白背景ライトモード | `white` |
| Psychedelic | 紫/マゼンタ/緑グラデーション | `psychedelic` |
| Rainbow | スレ行ごと虹色 + 背景アニメーション | `rainbow` |

- `applyTheme(name)` で `<html data-theme="...">` を切り替え
- localStorage キー: `mudai_theme`
- 設定タブのスキンボタンで即時切り替え

---

## 開発手順

```powershell
# 環境変数 (.env.local は git 管理外なので手動作成が必要)
# frontend/.env.local に以下を記載:
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mudai-notepad-bbs.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://mudai-notepad-bbs-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mudai-notepad-bbs
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mudai-notepad-bbs.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=740324384566
NEXT_PUBLIC_FIREBASE_APP_ID=1:740324384566:web:cc3e97664746b7533f5d97

cd frontend
npm install
npm run dev      # 開発サーバ (localhost:3000)
npm test         # Vitest 16件
npm run build    # 静的ビルド → out/
```

### デプロイ (手動)

```powershell
# Windows 環境では SSL 証明書の問題で NODE_OPTIONS が必要
$env:NODE_OPTIONS = "--use-system-ca"
npx firebase deploy --only hosting   # ホスティングのみ
npx firebase deploy --only database  # RTDB ルールのみ
```

### デプロイ (CI/CD)

master へ push すると `deploy.yml` が自動実行される。
ただし GitHub Secrets の登録が必要 → **issue #4 参照**。

---

## Firebase 設定メモ

- **RTDB URL**: `https://mudai-notepad-bbs-default-rtdb.firebaseio.com`
  - ⚠️ Asia Southeast ではなく `firebaseio.com` ドメインに注意
- **RTDB ルール**: `.indexOn: ["createdAt"]` が必須（ないと orderByChild クエリがエラー）
- **ロケーション**: us-central1

---

## 既知の問題・未解決 issue

| # | タイトル | 優先度 |
|---|----------|--------|
| [#2](https://github.com/bonsai/mudai-notepad-bbs/issues/2) | 操作は add+download のみ（設計原則の明示） | low |
| [#3](https://github.com/bonsai/mudai-notepad-bbs/issues/3) | postThread 非アトミック race condition | medium |
| [#4](https://github.com/bonsai/mudai-notepad-bbs/issues/4) | GitHub Secrets 登録 → deploy CI 有効化 | high |

### issue #3 詳細（race condition）

`postThread` は `push` → `fetchAllThreads` → `delete` の3ステップで非アトミック。
同時投稿時に 1001 件超えや誤削除が起きる可能性がある。
現状は投稿頻度が低いため許容。将来的には Firebase Transaction で対応予定。

### issue #4 対応手順

GitHub リポジトリの Settings → Secrets → Actions に以下を登録:
- `NEXT_PUBLIC_FIREBASE_*` (7種) → Firebase Console のプロジェクト設定から
- `FIREBASE_SERVICE_ACCOUNT` → Firebase Console → サービスアカウント → 鍵生成 (JSON)

---

## コミット履歴

```
d1f866d feat: スキン実装 Dark/White/Psychedelic/Rainbow closes #1
d9b1175 ui: メニュー5タブ再配分 (開く/編集/保存/設定/情報) closes #5
98d5a9d test: Vitest 16件 + CI/CD + bugfix 2件
03cb791 docs: mark GitHub push done in KANBAN
7622d38 init: 無題メモ帳BBS — anonymous notepad BBS
```

---

## 次のステップ（バックログ）

1. **issue #4**: GitHub Secrets 登録 → CI 自動デプロイを有効化
2. **issue #3**: postThread を Firebase Transaction でアトミックに
3. ページネーション UX の改善（現在のラベル「前のページ（古い）」が直感的でない可能性）
4. モバイル対応の確認・調整
5. スキンのさらなる洗練（Psychedelic の配色調整など）
