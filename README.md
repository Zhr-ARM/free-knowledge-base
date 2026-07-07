# 免费知识库网站

这是一个基于 VitePress、Markdown 和 GitHub Pages 的免费公开知识库模板。

## 本地运行

```bash
npm install
npm run docs:dev
```

## 构建检查

```bash
npm run docs:build
```

## 内容维护

- 首页：`docs/index.md`
- 文章目录：`docs/guide/`
- 站点配置：`docs/.vitepress/config.ts`
- 静态资源：`docs/public/`

新增文章后，需要在 `docs/.vitepress/config.ts` 的 `sidebar` 中添加入口。

## 免费发布到 GitHub Pages

当前仓库使用 `gh-pages` 分支发布静态产物，原因是当前 GitHub CLI 授权没有 `workflow` 权限，不能直接推送 `.github/workflows/` 下的 GitHub Actions 文件。

首次发布：

```bash
npm run docs:deploy
```

然后在 GitHub 仓库 `Settings` -> `Pages` 中确认：

- Source: `Deploy from a branch`
- Branch: `gh-pages`
- Folder: `/ (root)`

发布地址：

```text
https://Zhr-ARM.github.io/free-knowledge-base/
```

如果以后想改成 GitHub Actions 自动部署，先刷新 GitHub CLI 权限：

```bash
gh auth refresh -h github.com -s workflow
```

然后把 `deploy.github-actions.yml.example` 复制为 `.github/workflows/deploy.yml` 并提交。

## 注意

这个版本默认公开只读，不要放账号、合同、内部资料或任何敏感信息。

本项目只发布静态文件。`npm audit` 可能会提示 VitePress 间接依赖里的开发服务器风险；不要把本地开发服务暴露到公网，发布到 GitHub Pages 的静态产物不包含开发服务器。
