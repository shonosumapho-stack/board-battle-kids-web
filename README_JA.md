# 対戦ゲーム（Web）

Android アプリ `board_battle_kids` のブラウザ版です。2人対戦・CPU対戦のボードゲーム5種をハッシュルーティングで遊べます。

## 起動

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:5175/#/` を開きます。

## ビルド

```bash
npm run build
npm run preview
```

## ルート例

- `#/` ホーム
- `#/align` / `#/align/play?...`
- `#/nim` / `#/nim/play?...`
- 他ゲームも同様（connect4, variant, dots）

## Vercel で公開

1. リポジトリ [shonosumapho-stack/board-battle-kids-web](https://github.com/shonosumapho-stack/board-battle-kids-web) に push
2. [Vercel](https://vercel.com) で Import（Root Directory は空＝リポジトリ直下）
3. Framework: **Vite**（`vercel.json` あり）

ローカル開発は **5175**（算数ゲーム 5174、ピタゴラ 5173）。
