import { defineConfig } from 'vitepress'

const base = process.env.VITEPRESS_BASE || '/'

export default defineConfig({
  lang: 'zh-CN',
  title: '知识库',
  description: '一个零成本、公开只读、基于 Markdown 的知识库',
  base,
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    logo: '/logo.svg',
    search: {
      provider: 'local'
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '开始使用', link: '/guide/getting-started' },
      { text: '更新记录', link: '/guide/changelog' }
    ],
    sidebar: [
      {
        text: '知识库',
        items: [
          { text: '开始使用', link: '/guide/getting-started' },
          { text: '常见问题', link: '/guide/faq' },
          { text: '流程规范', link: '/guide/process' },
          { text: '工具资源', link: '/guide/resources' },
          { text: '更新记录', link: '/guide/changelog' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/' }
    ],
    footer: {
      message: 'Powered by VitePress and GitHub Pages.',
      copyright: '免费托管，Markdown 维护。'
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    outline: {
      label: '本页目录',
      level: [2, 3]
    },
    lastUpdated: {
      text: '最后更新'
    },
    darkModeSwitchLabel: '外观',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
    langMenuLabel: '切换语言',
    externalLinkIcon: true
  }
})
