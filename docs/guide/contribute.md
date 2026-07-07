# 上传说明

资料上传文件夹在项目根目录：

```text
uploads/
```

## 支持格式

- `.md`：直接生成知识库页面
- `.pdf`：生成可预览的 PDF 页面
- `.docx`：尽量转换成网页内容，并保留原文件下载链接
- `.doc`：生成下载页；建议转成 `.docx` 或 `.pdf`

## 推荐目录

```text
uploads/
├─ 单片机/
├─ ROS/
└─ 开源项目/
```

也可以继续新建子目录，例如 `uploads/单片机/STM32/` 或 `uploads/ROS/ROS2/`。

## 同步到网站

放入文件后运行：

```bash
npm run sync:uploads
```

本地预览：

```bash
npm run docs:dev
```

发布线上网站：

```bash
npm run docs:deploy
```

## 注意事项

- 公开网站不要上传账号、合同、内部隐私或未授权资料。
- Word 文档建议优先保存为 `.docx`，展示效果比 `.doc` 好。
- PDF 能稳定保留排版，适合课件、讲义和实验指导。
