import { defineConfig } from 'vitepress'

const base = process.env.VITEPRESS_BASE || '/'
const siteUrl = 'https://cdut-osa.cn'

export default defineConfig({
  lang: 'zh-CN',
  title: '开源协会',
  description: '成都理工大学开源协会官网与嵌入式、机器人运动控制知识库',
  base,
  sitemap: {
    hostname: siteUrl
  },
  router: {
    prefetchLinks: false
  },
  transformHtml(html) {
    return html.replace(
      /\s*<link rel="preload" href="[^"]*inter-roman-latin\.[^"]+\.woff2" as="font" type="font\/woff2" crossorigin="">/,
      ''
    )
  },
  transformHead({ page, title, description }) {
    const pagePath = page
      .replace(/(^|\/)index\.md$/, '$1')
      .replace(/\.md$/, '')
    const canonicalUrl = new URL(`/${pagePath}`.replace(/\/{2,}/g, '/'), siteUrl).href

    return [
      ['link', { rel: 'canonical', href: canonicalUrl }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:locale', content: 'zh_CN' }],
      ['meta', { property: 'og:site_name', content: '成都理工大学开源协会' }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: canonicalUrl }],
      ['meta', { property: 'og:image', content: `${siteUrl}/association/hero-group.webp` }],
      ['meta', { name: 'twitter:card', content: 'summary' }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }]
    ]
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }],
    ['meta', { name: 'theme-color', content: '#0b7285' }]
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
          const frontmatter = env.frontmatter || {}

          if (relativePath.includes('library/generated/')) {
            const title = frontmatter.searchTitle || frontmatter.title
            if (!title) return ''

            const details = [frontmatter.searchPath, frontmatter.searchType]
              .filter(Boolean)
              .map(String)
              .join(' · ')
            return md.render(`# ${String(title)}\n\n${details}\n`, {})
          }

          return frontmatter.search === false ? '' : html
        }
      }
    },
    nav: [
      { text: '首页', link: '/' },
      {
        text: '协会',
        items: [
          { text: '关于协会', link: '/association/' },
          { text: '项目成果', link: '/association/projects' },
          { text: '活动记录', link: '/association/activities' }
        ]
      },
      {
        text: '技术方向',
        items: [
          { text: '嵌入式', link: '/guide/embedded' },
          { text: '机器人运动控制', link: '/guide/robot-motion-control' }
        ]
      },
      { text: '资料库', link: '/library/' },
    ],
    sidebar: [
      {
        text: '开源协会知识库',
        items: [
          { text: '开始使用', link: '/guide/getting-started' },
          { text: '资料库', link: '/library/' },
          { text: '嵌入式', link: '/guide/embedded' },
          { text: '机器人运动控制', link: '/guide/robot-motion-control' },
          { text: '资料版权与下架', link: '/guide/content-rights' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Zhr-ARM/free-knowledge-base' }
    ],
    footer: {
      message: '开放、平等、共享、协作。',
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
