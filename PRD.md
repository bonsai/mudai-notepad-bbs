# PRD: 無題メモ帳BBS

**バージョン**: 0.3  
**日付**: 2026-06-10  
**ステータス**: Draft

---

## 概要

匿名・無題の超シンプル掲示板。投稿は20文字まで、スレッドは1000本まで。  
**バックエンドサーバなし・SQLなし。** Firebase Realtime Database (JSON ツリー) を
フロントから直接読み書きし、Firebase Hosting で静的ホスト。

---

## ゴール

- **誰でも即投稿**: アカウント不要、タイトルなし、20文字以内で送信
- **常に最新**: 10秒ポーリングで手動更新不要
- **フロントのみ完結**: Go/Node サーバなし、DB なし、JSON のみ
- **運用コスト最小**: Firebase 無料枠 (Spark プラン) で完結

---

## スコープ外

- バックエンドサーバ (Go / Node / etc.)
- SQL / NoSQL データベース
- ユーザー認証・ログイン
- 画像・ファイル添付
- スレッド内返信のネスト
- 検索機能

---

## ユーザーストーリー

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| 1 | 訪問者 | 最新スレ一覧を見る | 今何が書かれているかわかる |
| 2 | 訪問者 | 20文字以内でスレを立てる | 匿名でメモを残せる |
| 3 | 訪問者 | 10秒ごとに自動更新される | リロード不要で最新状態を見続けられる |
| 4 | 訪問者 | ページ `/0` `/1` で古いスレを遡る | 流れたスレを確認できる |
| 5 | 投稿者 | 999本目を投稿した瞬間に `1.json` が落ちてくる | 削除前のスナップショットを手元に保持できる |
| 6 | 訪問者 | メニューで前後ページや最新へ移動できる | URL を打たずにナビゲートできる |
| 7 | 訪問者 | メニューから任意タイミングで `1.json` をDLできる | 手動でバックアップを取れる |

---

## 機能要件

### FR-1: スレッド投稿
- 本文: 1〜20文字 (Unicode 文字数)
- タイトル・ユーザー名なし
- 投稿時刻は `Date.now()` で自動付与
- 連投制限: 同一ブラウザから 10秒以内は送信ボタン無効 (localStorage で管理)
- 1000本超過時: 最古エントリを Firebase から削除 (FIFO、フロント側で実行)

### FR-5: 999本目投稿トリガー — `1.json` 自動ダウンロード
- 投稿 push 直後にスレッド総数が **999本** になった瞬間、その時点の全スレッドを
  `1.json` としてブラウザに自動ダウンロードさせる
- ファイル内容: `Thread[]` 配列を JSON.stringify (createdAt 昇順)
- ファイル名: `1.json` (固定)
- 実装: Blob + `<a download>` のクリックトリガー (ライブラリなし)
- 目的: 1000本 FIFO 削除が始まる直前のスナップショットをブラウザに保存する
- ダウンロードするのは投稿者のブラウザのみ (他の閲覧者には何も起きない)

```ts
// 999本目トリガーの疑似コード
if (newTotal === 999) {
  const blob = new Blob(
    [JSON.stringify(allThreads.sort((a, b) => a.createdAt - b.createdAt), null, 2)],
    { type: "application/json" }
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "1.json";
  a.click();
  URL.revokeObjectURL(a.href);
}
```

### FR-6: メニュー
- 画面上部に常時表示するシンプルなヘッダーメニュー
- 項目:
  | ラベル | 動作 |
  |--------|------|
  | `[最新]` | `/?page=0` へ遷移 (最新スレ先頭) |
  | `[← 前]` | 現在ページ -1 へ (page=0 なら非活性) |
  | `[次 →]` | 現在ページ +1 へ (最終ページなら非活性) |
  | `[p.N/M]` | 現在ページ / 最終ページ (数字表示のみ、クリック不可) |
  | `[📥 1.json]` | 手動で全スレを `1.json` としてダウンロード (任意タイミング) |
- スタイル: モノスペースフォント、テキストのみ、装飾最小限

### FR-2: スレッド一覧
- 最新順 (投稿時刻降順)
- 1ページ = 50スレッド
- ページ番号 0-indexed (`/0` = 最新)
- クライアント側でスライス: `threads.slice(page*50, page*50+50)`

### FR-3: 自動更新
- `useEffect` + `setInterval(10000)` で Firebase から全件再フェッチ
- 差分があれば一覧を差し替え (全件再描画)

### FR-4: ページネーション
- URL クエリ: `/?page=0`, `/?page=1` …
- Next.js `useRouter` でページ番号を読み取り
- 最大ページ = `Math.floor((total - 1) / 50)`

---

## 非機能要件

| 項目 | 要件 |
|------|------|
| レスポンス | Firebase RTDB 読み取り p95 < 300ms |
| スレッド上限 | 1000本 (超過時 FIFO 削除) |
| 文字数上限 | 20文字 (フロント + Firebase Rules 両方でバリデーション) |
| HTTPS | Firebase Hosting デフォルトで有効 |
| 認証 | なし (匿名投稿) |

---

## データ構造 (Firebase Realtime Database JSON)

```json
{
  "threads": {
    "-OQabc123": {
      "body": "テスト投稿",
      "createdAt": 1749513600000
    },
    "-OQdef456": {
      "body": "hello world",
      "createdAt": 1749513610000
    }
  }
}
```

- キー: Firebase `push()` が自動生成する時系列ソート可能なキー (`-O...`)
- `body`: string, 1〜20文字
- `createdAt`: Unix ms (number)

### Firebase Realtime Database Rules

```json
{
  "rules": {
    "threads": {
      ".read": true,
      ".write": true,
      "$threadId": {
        ".validate": "newData.hasChildren(['body','createdAt'])
          && newData.child('body').isString()
          && newData.child('body').val().length >= 1
          && newData.child('body').val().length <= 20
          && newData.child('createdAt').isNumber()"
      }
    }
  }
}
```

---

## API 仕様 (OpenAPI — フロントが Firebase SDK 経由で呼ぶ論理操作)

バックエンドサーバは存在しないため、REST API は Firebase SDK の操作として定義する。

```yaml
openapi: 3.1.0
info:
  title: 無題メモ帳BBS (Firebase RTDB 操作)
  version: 0.2.0
  description: |
    サーバなし。フロントが Firebase Realtime Database SDK を直接呼び出す。
    以下は論理 API として定義する。

paths:

  /threads/{page}:
    get:
      summary: スレッド一覧取得 (ページ)
      description: |
        Firebase: ref("threads").orderByChild("createdAt").limitToLast(1000)
        → クライアントで降順ソート → page×50 ～ (page+1)×50 をスライス
      parameters:
        - name: page
          in: path
          required: true
          schema:
            type: integer
            minimum: 0
          examples:
            latest: { value: 0, summary: "最新50件" }
            second: { value: 1, summary: "次の50件" }
      responses:
        "200":
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ThreadPage"
        "404":
          description: ページが存在しない (page > maxPage)

  /threads:
    post:
      summary: スレッド投稿
      description: |
        Firebase: ref("threads").push({ body, createdAt: Date.now() })
        1000超過時: ref("threads").orderByChild("createdAt").limitToFirst(1) で最古を削除
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ThreadInput"
      responses:
        "201":
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Thread"
        "400":
          description: 文字数バリデーションエラー
        "429":
          description: 連投制限 (localStorage で 10秒クールダウン)

components:
  schemas:

    Thread:
      type: object
      properties:
        id:        { type: string, description: "Firebase push key" }
        body:      { type: string, minLength: 1, maxLength: 20 }
        createdAt: { type: integer, description: "Unix ms" }

    ThreadInput:
      type: object
      required: [body]
      properties:
        body:
          type: string
          minLength: 1
          maxLength: 20

    ThreadPage:
      type: object
      properties:
        page:    { type: integer }
        total:   { type: integer }
        threads: { type: array, items: { $ref: "#/components/schemas/Thread" } }
```

---

## アーキテクチャ

```
ブラウザ
├── Next.js (Static Export)
│   ├── pages/index.tsx
│   │   ├── useEffect → setInterval(fetch, 10000)
│   │   ├── POST: push() → 20文字チェック → 1000超過時削除
│   │   └── GET: orderByChild("createdAt") → slice by page
│   └── components/
│       ├── Menu.tsx       (最新/前/次/ページ表示/手動ダウンロード)
│       ├── ThreadList.tsx
│       ├── PostForm.tsx   (連投制限: localStorage, 999本トリガー)
│       └── Pager.tsx
│
└── Firebase SDK (client-side)
    ├── Realtime Database  ← データ永続化 (JSON)
    └── Hosting            ← 静的ファイル配信
        URL: mudai-notepad-bbs.web.app
```

**サーバプロセス: ゼロ**

---

## ディレクトリ構成

```
mudai-notepad-bbs/
├── PRD.md
├── openapi.yaml          ← OpenAPI 3.1 完全版 (別ファイル化)
└── frontend/
    ├── package.json
    ├── next.config.ts     (output: "export")
    ├── firebase.json
    ├── .firebaserc
    ├── lib/
    │   └── firebase.ts    ← Firebase SDK 初期化
    ├── pages/
    │   └── index.tsx      ← 一覧 + 投稿フォーム + ポーリング
    └── components/
        ├── Menu.tsx        ← ヘッダーメニュー + 手動ダウンロードボタン
        ├── ThreadList.tsx
        ├── PostForm.tsx    ← 999本トリガーを含む
        └── Pager.tsx
```

---

## マイルストーン

| フェーズ | 内容 | ステータス |
|---------|------|-----------|
| M0 | PRD + OpenAPI 確定 | ✅ 本ドキュメント |
| M1 | Firebase プロジェクト作成 + RTDB Rules 設定 | TBD |
| M2 | Next.js 実装 (投稿・一覧・ポーリング・ページング) | TBD |
| M3 | Firebase Hosting デプロイ (mudai-notepad-bbs.web.app) | TBD |
| M4 | 動作確認 | TBD |
