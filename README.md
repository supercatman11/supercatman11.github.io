# Kuun0suke Portfolio

Kuun0suke のポートフォリオサイト。**完全静的サイト**として生成し、Docker で開発 / テスト / 本番を分離して運用します。

| 項目 | 選定 | 理由 |
| --- | --- | --- |
| サイト生成 | [Astro](https://astro.build) 7(静的出力・JS ゼロ) | サーバーサイドコードも DB も持たないため攻撃面が最小。CSP を最も厳格にできる |
| 言語 | TypeScript(strict) | 型チェックを CI とビルドで強制 |
| 配信 | nginx(`nginxinc/nginx-unprivileged`) | 非 root・非特権ポート(8080)で動作する公式イメージ |
| 本番ホスティング | GitHub Pages(GitHub Actions 経由) | 無料・TLS 自動・運用するサーバーが無い。Docker の prod イメージは VPS 等への自前配信にも使える |
| 依存管理 | npm + `package-lock.json` 完全固定 + Dependabot | 再現性と更新の両立 |

## ディレクトリ構成

```
.
├── src/
│   ├── data/profile.ts        # ★ 表示内容はここだけ編集すれば OK
│   ├── pages/                 # index.astro / 404.astro / robots.txt.ts
│   ├── layouts/BaseLayout.astro
│   ├── components/            # Header / Footer / Section / ProjectCard
│   ├── lib/paths.ts           # BASE_PATH 対応ヘルパー
│   └── styles/global.css      # デザイントークン(ライト/ダーク自動)
├── public/                    # favicon.svg / _headers(Cloudflare Pages 用)
├── docker/
│   ├── nginx/security-headers.conf
│   ├── nginx/production.conf  # 本番用 nginx
│   ├── nginx/test.conf        # テスト用 nginx(noindex)
│   └── dev-entrypoint.sh
├── Dockerfile                 # deps / dev / build / runtime の 4 ステージ
├── compose.yaml               # profiles: dev / test / prod
└── .github/
    ├── workflows/ci.yml       # audit / check / build / Trivy / smoke test
    ├── workflows/deploy-pages.yml
    └── dependabot.yml
```

## 使い方(ホストに Node.js は不要)

すべて Docker 内で動きます。Git Bash から実行する場合は `MSYS_NO_PATHCONV=1` を付けるとパス変換の事故を防げます(PowerShell なら不要)。

| 環境 | コマンド | URL | 用途 |
| --- | --- | --- | --- |
| 開発 | `docker compose --profile dev up --build` | http://localhost:4321 | ホットリロード付き開発サーバー |
| テスト | `docker compose --profile test up --build` | http://localhost:8081 | **本番と同一イメージ構成**で最終確認。`noindex` ヘッダー付き |
| 本番 | `docker compose --profile prod up --build -d` | http://localhost:8080 | 自前サーバーで配信する場合。`.env` で `SITE_URL` を指定 |

停止は `docker compose --profile <name> down`。開発環境の `node_modules` は名前付きボリュームに入るので、依存を変えたときはコンテナを再起動すれば自動で `npm ci` が走ります。

### 依存パッケージの追加

```sh
docker compose --profile dev run --rm dev npm install <package>
```

`.npmrc` の `save-exact=true` により完全固定バージョンで記録されます。

### 内容の編集

`src/data/profile.ts` の `TODO` を書き換えてください。名前・肩書き・自己紹介・スキル・作品・リンクはすべてこのファイルにあります。

## 本番公開(GitHub Pages)

1. GitHub にリポジトリを作成する。
   - `supercatman11.github.io` という名前にすると `https://supercatman11.github.io/` で公開される(推奨)。
   - それ以外の名前なら `https://supercatman11.github.io/<repo>/` になる。ワークフローが自動で `BASE_PATH` を判定する。
2. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にする。
3. `main` に push すると `deploy-pages.yml` がビルドして公開する。
4. 独自ドメインを使う場合は **Settings → Secrets and variables → Actions → Variables** に `SITE_URL`(例 `https://example.com`)と `BASE_PATH`(`/`)を設定する。

### テスト環境をネット上にも置きたい場合

Cloudflare Pages にリポジトリを接続すると、`main` 以外のブランチ / PR ごとに `*.pages.dev` のプレビュー URL が自動発行されます。`public/_headers` が nginx と同じセキュリティヘッダーを適用します(GitHub Pages ではカスタムヘッダーは使えません)。

## セキュリティ設計

### サプライチェーン(npm 経由のマルウェア)対策

- **`ignore-scripts=true`**(`.npmrc`): パッケージの install / postinstall スクリプトを実行しない。npm ワーム(Shai-Hulud 等)の主要な感染経路を遮断する。Astro / esbuild / sharp はプリビルド済みバイナリを `optionalDependencies` で配布するため、この設定でも動作する。
- **`npm ci` + 完全固定バージョン**: lockfile と一致しないインストールは失敗する。
- **Dependabot `cooldown: 7 日`**: 公開直後のバージョンを掴まない。悪意ある版は多くの場合数日以内に取り下げられる。
- **`npm audit --audit-level=high`** を CI で強制。
- 依存は Astro 本体 + sitemap のみ。UI フレームワーク・CSS フレームワーク・外部フォントを使わない。
- `node_modules` はホストと共有しない(名前付きボリューム)。

### コンテナ

- ベースイメージを **sha256 ダイジェストで固定**(タグ乗っ取り対策)。Dependabot が更新する。
- 全ステージ **非 root**(Node: uid 1000 / nginx: uid 101)。
- `read_only: true` + `/tmp` のみ tmpfs、`cap_drop: ALL`、`no-new-privileges`、`pids_limit`、`mem_limit`。
- ポートは `127.0.0.1` にのみ bind。外部公開は TLS 終端のリバースプロキシ(Caddy / Cloudflare)を前段に置く。
- CI で **Trivy** による脆弱性スキャン(CRITICAL / HIGH で失敗)。

### HTTP レスポンス

`docker/nginx/security-headers.conf` と `public/_headers` が同じ内容を持ちます。

- `Content-Security-Policy: default-src 'none'; style-src 'self'; img-src 'self' data:; ...` — JS を一切配信しないので `script-src` は暗黙の `'none'`
- `X-Content-Type-Options: nosniff` / `X-Frame-Options: DENY` / `frame-ancestors 'none'`
- `Referrer-Policy` / `Permissions-Policy` / `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy`
- `server_tokens off`、GET / HEAD 以外は 405、ドットファイルは 404
- HSTS は TLS 終端側(GitHub Pages / Cloudflare / Caddy)で付与する

### CI / CD

- すべての GitHub Actions を **コミット SHA で固定**。
- `GITHUB_TOKEN` は `contents: read` のみ(deploy ジョブだけ `pages: write` / `id-token: write`)。
- `persist-credentials: false` でチェックアウト。
- Docker イメージの起動後に、ヘッダー・404・405 を検証するスモークテスト。

### 運用上の注意

- メールアドレスを HTML に直接書かない(スパム収集対策)。連絡手段は GitHub / SNS を推奨。
- 外部スクリプト(アクセス解析・埋め込みウィジェット)を追加する場合は CSP の `script-src` / `connect-src` を最小限で追加すること。
- `.env` は `.gitignore` 済み。秘密情報はコミットしない。
