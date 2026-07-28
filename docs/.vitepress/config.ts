import { defineConfig } from 'vitepress'

const base = process.env.VITEPRESS_BASE || '/'

export default defineConfig({
  lang: 'zh-CN',
  title: '开源协会知识库',
  description: '沉淀嵌入式与机器人运动控制资料的公开知识库',
  base,
  cleanUrls: true,
  srcExclude: ['public/**'],
  lastUpdated: true,
  themeConfig: {
    logo: '/association-logo.jpg',
    search: {
      provider: 'local'
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '资料库', link: '/library/' },
      { text: '嵌入式', link: '/guide/embedded' },
      { text: '机器人运动控制', link: '/guide/robot-motion-control' },
      { text: '查找资料', link: '/guide/contribute' }
    ],
    sidebar: [
      {
        text: '开源协会知识库',
        items: [
          { text: '开始使用', link: '/guide/getting-started' },
          { text: '资料库', link: '/library/' },
          { text: '嵌入式', link: '/guide/embedded' },
          { text: '机器人运动控制', link: '/guide/robot-motion-control' },
          { text: '查找资料', link: '/guide/contribute' },
          { text: '常见问题', link: '/guide/faq' },
          { text: '资料分类', link: '/guide/process' },
          { text: '工具资源', link: '/guide/resources' },
          { text: '资料更新', link: '/guide/changelog' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Zhr-ARM/free-knowledge-base' }
    ],
    footer: {
      message: '开源协会知识沉淀与资料共享。',
      copyright: 'Powered by VitePress and GitHub Pages.'
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
