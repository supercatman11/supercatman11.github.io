// =============================================================================
// サイトに表示する内容はすべてこのファイルで管理する。
// TODO と書かれた箇所を自分の情報に書き換えてください。
// =============================================================================

export type Link = {
  label: string;
  href: string;
};

export type SkillGroup = {
  category: string;
  items: string[];
};

export type Project = {
  title: string;
  description: string;
  tech: string[];
  /** 公開 URL(任意) */
  url?: string;
  /** ソースコードの URL(任意) */
  repo?: string;
  /** 制作時期などの補足(任意) */
  period?: string;
};

export const profile = {
  name: 'Kuun0suke',
  /** 肩書き・一言 */
  role: 'Developer', // TODO: 例 "Web Developer" / "学生エンジニア"
  tagline: 'ものづくりが好きな大学院生です。', // TODO
  description:
    'Kuun0suke のポートフォリオサイト。これまでに制作した作品、持っているスキル、連絡先をまとめています。',
  location: 'Japan', // TODO
  /** 自己紹介(段落ごとに配列) */
  bio: [
    'はじめまして、Kuun0suke です。', // TODO
    '情報科学を勉強している大学院生です。バイトでは Web アプリケーションの開発や技術調査を担当しています。', // TODO
    '本サイトはポートフォリオを作ってみたいという動機で試しに作ってみました。', // TODO
  ],
  links: [
    { label: 'GitHub', href: 'https://github.com/supercatman11' }, // TODO: ユーザー名を確認
    // { label: 'X', href: 'https://x.com/xxxx' },
    // { label: 'Zenn', href: 'https://zenn.dev/xxxx' },
  ] satisfies Link[],
  skills: [
    {
      category: 'Languages',
      items: ['TypeScript', 'JavaScript', 'HTML / CSS', 'Python', 'C++'], // TODO
    },
    {
      category: 'Frameworks / Tools',
      items: ['Astro', 'Docker', 'Git / GitHub Actions', 'React', 'Flask'], // TODO
    },
    {
      category: 'Interests',
      items: ['Web セキュリティ', 'UI デザイン','機械学習','アルゴリズム', '計算量理論'], // TODO
    },
  ] satisfies SkillGroup[],
  projects: [
    {
      title: 'Portfolio Site',
      description:
        'このサイト。Astro による完全静的生成、非 root nginx コンテナ、CSP をはじめとするセキュリティヘッダー、依存関係の完全固定といった構成で、近年のセキュリティリスクを最小化しているつもりです。',
      tech: ['Astro', 'TypeScript', 'Docker', 'nginx', 'GitHub Actions'],
      repo: 'https://github.com/supercatman11/portfolio', // TODO
      period: '2026',
    },
    {
      title: 'Sample Project', // TODO: 作品を追加 / 置き換え
      description: 'これから更新予定です。',
      tech: ['TypeScript'],
      url: 'https://example.com',
      period: '2025',
    },
  ] satisfies Project[],
  /** 連絡手段。メールアドレスを直接書くとスパム収集の対象になるため、SNS / GitHub 経由を推奨 */
  contact: {
    message: '相談、質問についてはここからどうぞ。',
  },
} as const;
