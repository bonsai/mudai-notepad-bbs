# 無題メモ帳BBS — worklog

## Done

- [x] PRD 作成 (openapi /0 /1)
- [x] Next.js 静的エクスポート構築
- [x] Firebase Realtime Database 設定 (JSON のみ、サーバ不要)
- [x] Firebase Hosting デプロイ → mudai-notepad-bbs.web.app
- [x] RTDB ルール (`".indexOn": ["createdAt"]`)
- [x] 10秒ポーリング自動更新
- [x] 20文字制限バリデーション
- [x] 1000スレ上限 + FIFO 削除
- [x] 999件目で 1.json 自動ダウンロード
- [x] 10秒クールダウン (localStorage)
- [x] Aero glass UI (dark blue, backdropFilter blur)
- [x] メニューバー (開く / 保存 / 情報)
- [x] ステータスバー → 情報タブに統合
- [x] 送信ボタン削除 → Enter のみ
- [x] 投稿を昇順表示 (古い→新しい、下が最新)
- [x] タイムスタンプ非表示 (UI); JSON は ISO 文字列で保持
- [x] 設定・情報タブを統合 → 「情報」タブ
- [x] 編集タブ削除
- [x] 過去行と入力行を同一スタイル (plain notepad)
- [x] 情報タブに README 内容 (MIT, philosophy, github.com/bonsai, Sponsors)
- [x] downloadJson → `{body, at}` の ISO 形式

## In Progress

- [x] GitHub push → bonsai/mudai-notepad-bbs

## Backlog

- [ ] スキン (ローカルのみ): Dark / White / Psychedelic / Rainbow (localStorage)
- [ ] 操作は add + download のみ — del/edit は存在しない (設計原則として明示)
- [ ] ページネーション UX 改善検討
- [ ] モバイル対応確認
