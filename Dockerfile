# syntax=docker/dockerfile:1.7
# =============================================================================
# supercatman11 Portfolio - マルチステージ Dockerfile
#
#   deps    : 依存解決(lockfile 厳守・install スクリプト無効)
#   dev     : 開発サーバー(ホットリロード)      -> compose profile "dev"
#   build   : 型チェック + 静的ビルド
#   runtime : 非 root nginx で dist/ を配信      -> compose profile "test" / "prod"
#
# ベースイメージはタグではなく sha256 ダイジェストで固定し、
# タグの差し替え(タグ乗っ取り)による改ざんを防ぐ。更新は Dependabot が PR を出す。
# =============================================================================

ARG NODE_IMAGE=node:24-alpine@sha256:a34ab6d7f6f4813f4d0c5469d74685604b962fbdbf5793a7bc7b4998ecb867c8
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:stable-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03

# ---------------------------------------------------------------- base -------
FROM ${NODE_IMAGE} AS base
ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    CI=true
WORKDIR /app
RUN chown node:node /app
# 以降は非 root ユーザー(uid 1000)で実行
USER node

# ---------------------------------------------------------------- deps -------
FROM base AS deps
COPY --chown=node:node package.json package-lock.json .npmrc ./
# npm ci           : package-lock.json と完全一致しない場合は失敗(再現性の保証)
# --ignore-scripts : .npmrc でも設定しているが、明示して二重に防ぐ
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 \
    npm ci --ignore-scripts

# ---------------------------------------------------------------- dev --------
FROM deps AS dev
ENV NODE_ENV=development
COPY --chown=node:node docker/dev-entrypoint.sh /usr/local/bin/dev-entrypoint.sh
EXPOSE 4321
ENTRYPOINT ["/usr/local/bin/dev-entrypoint.sh"]
CMD ["npm", "run", "dev"]

# ---------------------------------------------------------------- build ------
FROM deps AS build
ARG SITE_URL=https://supercatman11.github.io
ARG BASE_PATH=/
ENV SITE_URL=${SITE_URL} \
    BASE_PATH=${BASE_PATH} \
    NODE_ENV=production
COPY --chown=node:node . .
RUN npm run check && npm run build

# ---------------------------------------------------------------- runtime ----
FROM ${NGINX_IMAGE} AS runtime
# APP_ENV=production | test   (test は noindex ヘッダーと robots.txt 全拒否を付ける)
ARG APP_ENV=production

# nginx-unprivileged: uid 101 (nginx) で動作し 8080 を listen。root 権限・特権ポート不要。
COPY docker/nginx/security-headers.conf /etc/nginx/includes/security-headers.conf
COPY docker/nginx/${APP_ENV}.conf       /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:8080/ || exit 1
