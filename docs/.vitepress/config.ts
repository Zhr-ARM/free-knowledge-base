import { defineConfig } from 'vitepress'

const base = process.env.VITEPRESS_BASE || '/'

export default defineConfig({
  lang: 'zh-CN',
  title: '开源协会知识库',
  description: '沉淀单片机、ROS、嵌入式与开源项目资料的公开知识库',
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
      { text: '资料库', link: '/library/' },
      { text: '单片机', link: '/guide/mcu' },
      { text: 'ROS', link: '/guide/ros' },
      { text: '上传说明', link: '/guide/contribute' }
    ],
    sidebar: [
      {
        text: '开源协会知识库',
        items: [
          { text: '开始使用', link: '/guide/getting-started' },
          { text: '资料库', link: '/library/' },
          { text: '单片机', link: '/guide/mcu' },
          { text: 'ROS', link: '/guide/ros' },
          { text: '上传说明', link: '/guide/contribute' },
          { text: '常见问题', link: '/guide/faq' },
          { text: '流程规范', link: '/guide/process' },
          { text: '工具资源', link: '/guide/resources' },
          { text: '更新记录', link: '/guide/changelog' }
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
