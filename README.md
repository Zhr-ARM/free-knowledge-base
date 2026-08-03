# 开源协会知识库

这是一个基于 VitePress、Markdown 和 GitHub Pages 的公开知识库，用来沉淀协会的嵌入式、机器人运动控制、ROS 和开源项目资料。

线上地址：

```text
https://cdut-osa.cn/
```

## 本地运行

```bash
npm install
npm run docs:dev
```

## 上传资料

把资料放入根目录的 `uploads/` 文件夹，推荐按主题分类：

```text
uploads/
├─ 嵌入式/（也兼容单片机/）
├─ 机器人运动控制/
├─ ROS/
└─ 开源项目/
```

支持格式：

- `.md`：转换为知识库页面
- `.pdf`：生成网页预览页
- `.docx`：尽量转换为网页内容，并保留原文件下载链接
- `.doc`：生成下载页，建议转成 `.docx` 或 `.pdf`
- `.zip`、`.xmind`、`.xls`、`.xlsx`、`.csv`、`.txt`：生成受限的网页预览

分类及其源目录统一维护在 `config/library-categories.json`。即使某个分类没有资料，资料库仍会显示“暂无资料”。隐藏目录、可执行文件、异常压缩包和超过安全上限的预览内容不会进入自动转换流程。

新增或替换资料后，先更新逐文件版权和哈希清单：

```bash
npm run content:update
```

然后补充 `content-rights.json` 中的来源、权利方和再分发依据。详细规则见 `CONTENT_RIGHTS.md`。

同步资料：

```bash
npm run sync:uploads
```

构建检查：

```bash
npm run docs:build
```

发布线上网站：

```bash
npm run docs:deploy
```

`docs:dev`、`docs:build` 和 `docs:deploy` 都会自动先同步 `uploads/`。

## 内容维护

- 首页：`docs/index.md`
- 固定栏目：`docs/guide/`
- 上传资料源文件：`uploads/`
- 自动生成资料页：`docs/library/` 和 `docs/public/uploads/`
- 站点配置：`docs/.vitepress/config.ts`

`docs/library/` 下的资料页和 `docs/public/uploads/` 下的文件是自动生成的，不需要手动编辑。

## 发布方式

当前仓库使用 `gh-pages` 分支发布静态产物。主分支推送后，GitHub Actions 会先执行内容清单、单元测试、构建、断链检查和浏览器测试，通过后自动更新 `gh-pages`。发布地址：

```text
https://cdut-osa.cn/
```

需要手动发布时仍可运行 `npm run docs:deploy`。

## 注意

这是公开网站，不要上传账号、合同、内部隐私或未授权资料。单个文件上限为 100 MB；当仓库或发布站点接近 GitHub Pages 容量限制时，应将大型资料迁移到对象存储或 CDN，并保留稳定下载地址。

本项目只发布静态文件。本地开发和预览命令默认只监听本机，不要把开发服务暴露到公网。VitePress 间接依赖中的开发服务器安全公告不会进入 GitHub Pages 静态产物，但仍需通过 Dependabot 跟进官方稳定版升级。
