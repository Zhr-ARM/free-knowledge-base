# 开源协会知识库

这是一个基于 VitePress、Markdown 和 GitHub Pages 的免费公开知识库，用来沉淀协会的单片机、ROS、嵌入式、机器人和开源项目资料。

线上地址：

```text
https://zhr-arm.github.io/free-knowledge-base/
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
├─ 单片机/
├─ ROS/
└─ 开源项目/
```

支持格式：

- `.md`：转换为知识库页面
- `.pdf`：生成网页预览页
- `.docx`：尽量转换为网页内容，并保留原文件下载链接
- `.doc`：生成下载页，建议转成 `.docx` 或 `.pdf`

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

当前仓库使用 `gh-pages` 分支发布静态产物。发布地址：

```text
https://zhr-arm.github.io/free-knowledge-base/
```

如果以后想改成 GitHub Actions 自动部署，先刷新 GitHub CLI 权限：

```bash
gh auth refresh -h github.com -s workflow
```

然后把 `deploy.github-actions.yml.example` 复制为 `.github/workflows/deploy.yml` 并提交。

## 注意

这是公开网站，不要上传账号、合同、内部隐私或未授权资料。

本项目只发布静态文件。`npm audit` 可能会提示 VitePress 间接依赖里的开发服务器风险；不要把本地开发服务暴露到公网，发布到 GitHub Pages 的静态产物不包含开发服务器。
