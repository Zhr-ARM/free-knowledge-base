import { defineConfig } from 'vitepress'

const base = process.env.VITEPRESS_BASE || '/'

export default defineConfig({
  lang: 'zh-CN',
  title: '开源协会知识库',
  description: '沉淀嵌入式与机器人运动控制资料的公开知识库',
  base,
  router: {
    prefetchLinks: false
  },
  transformHtml(html) {
    return html.replace(
      /\s*<link rel="preload" href="[^"]*inter-roman-latin\.[^"]+\.woff2" as="font" type="font\/woff2" crossorigin="">/,
      ''
    )
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }]
  ],
  cleanUrls: true,
  srcExclude: ['public/**'],
  lastUpdated: true,
  themeConfig: {
    logo: '/association-logo.jpg',
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索资料'
          },
          modal: {
            displayDetails: '显示详细结果',
            resetButtonTitle: '清除搜索',
            backButtonTitle: '关闭搜索',
            noResultsText: '没有找到相关资料',
            footer: {
              selectText: '打开',
              selectKeyAriaLabel: '回车键',
              navigateText: '切换',
              navigateUpKeyAriaLabel: '向上键',
              navigateDownKeyAriaLabel: '向下键',
              closeText: '关闭',
              closeKeyAriaLabel: 'Esc 键'
            }
          }
        },
        _render(src, env, md) {
          const relativePath = env.relativePath.replace(/\\/g, '/')
          const html = md.render(src, env)

          if (relativePath.includes('library/generated/')) {
            const title = env.frontmatter.searchTitle || env.frontmatter.title
            if (!title) return ''

            const details = [env.frontmatter.searchPath, env.frontmatter.searchType]
              .filter(Boolean)
              .map(String)
              .join(' · ')
            return md.render(`# ${String(title)}\n\n${details}\n`, {})
          }

          return env.frontmatter.search === false ? '' : html
        }
      }
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '资料库', link: '/library/' },
      { text: '嵌入式', link: '/guide/embedded' },
      { text: '机器人运动控制', link: '/guide/robot-motion-control' }
    ],
    sidebar: [
      {
        text: '开源协会知识库',
        items: [
          { text: '开始使用', link: '/guide/getting-started' },
          { text: '资料库', link: '/library/' },
          { text: '嵌入式', link: '/guide/embedded' },
          { text: '机器人运动控制', link: '/guide/robot-motion-control' }
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
