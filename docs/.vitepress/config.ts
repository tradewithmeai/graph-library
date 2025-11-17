import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'SolVX Graph Engine',
  description: 'High-performance charting library for financial and data visualization',
  base: '/graph-library/',

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'API Reference', link: '/api-reference' },
      { text: 'Examples', link: '/examples' },
      { text: 'GitHub', link: 'https://github.com/tradewithmeai/graph-library' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is SolVX Graph Engine?', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
        ],
      },
      {
        text: 'Core Concepts',
        items: [
          { text: 'Architecture Overview', link: '/architecture-overview' },
          { text: 'Core Concepts', link: '/core-concepts' },
          { text: 'Plugins & Extensions', link: '/plugins-and-extensions' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'API Reference', link: '/api-reference' },
          { text: 'Examples', link: '/examples' },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/tradewithmeai/graph-library' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 SolVX',
    },

    search: {
      provider: 'local',
    },
  },
});
