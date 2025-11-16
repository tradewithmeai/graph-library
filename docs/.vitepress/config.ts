import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'SolVX Graph Engine',
  description: 'A high-performance charting library for financial and data visualization',
  base: '/',

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'Architecture', link: '/architecture-overview' },
      { text: 'GitHub', link: 'https://github.com/solvx/graph-engine' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is SolVX?', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
        ],
      },
      {
        text: 'Architecture',
        items: [{ text: 'Overview', link: '/architecture-overview' }],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/solvx/graph-engine' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 SolVX',
    },
  },
});
