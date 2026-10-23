# 部署到 GitHub Pages

本游戏的网页和 AI 模型均为静态文件。运行目录是 `dist/`，没有构建、依赖安装、服务器或 API 密钥要求。GitHub Actions 中的 Node.js 仅用于发布前检查，不是游戏运行依赖。

## 手动快速发布：无需插件或自定义工作流

1. 新建仓库，普通免费账号使用公开仓库即可。建议名称为 `weiwu-ai-defense`，默认分支使用 `main`。
2. 解压下载的 ZIP，打开其中的 `weiwu-ai/dist/` 文件夹。
3. 进入 GitHub 仓库的 **Add file → Upload files**，将 `dist/` 里面的 `index.html`、`style.css`、`app.js`、`engine.js`、`ai-model.js` 上传到仓库根目录，提交到 `main`。可以一并上传 `.nojekyll`；不方便选择隐藏文件时，这个纯 HTML 项目也不依赖它。
4. 打开 **Settings → Pages → Build and deployment → Source**，选择 **Deploy from a branch**。
5. 分支选择 `main`，目录选择 `/ (root)`，保存。等待 Pages 页面显示发布成功后，用其实际显示的网址打开。

注意上传的是 `dist/` 里面的文件，而不是 `dist/` 文件夹本身；ZIP 文件也不会自动解压成网站。这个方式只发布可运行游戏。希望把训练代码、报告、测试和自动部署也放到仓库时，改用下面的完整项目方式。

## 完整项目：自动测试和部署

1. 在自己的 GitHub 账号下创建仓库，建议名称 `weiwu-ai-defense`，默认分支使用 `main`。
2. 将本目录的内容放到仓库根目录，保留 `.github/workflows/pages.yml`、`dist/`、`ai/`、`tests/` 与 `package.json` 的相对位置。
3. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
4. 打开 **Actions → Check and deploy game to GitHub Pages**，如首次推送时尚未启用 Pages，可在启用后选择 **Run workflow** 重新运行。
5. 等待 `check` 与 `deploy` 成功，使用 `deploy` 环境返回的真实 Pages 链接访问游戏。

普通项目站点的网址通常位于 `https://账号名.github.io/仓库名/`。应以 GitHub 实际返回的网址为准。游戏使用相对资源路径，支持仓库名作为网址前缀。

GitHub Free 支持从公开仓库发布 Pages；私有仓库的 Pages 支持取决于账号套餐。创建公开仓库会公开源代码；游戏网页的访问范围与代码仓库的可见性需要分别确认。

## 后续更新

推送到 `main` 会自动执行游戏规则测试与 AI 推理校验，通过后重新发布 `dist/`。拉取请求只执行检查，不部署。也可以在 Actions 页面手动触发。

## 本地状态

存档与战绩保存在当前浏览器、当前网站来源的本地存储中。更换托管域名后，原网址的存档不会自动迁移。AI 模型已包含在 `dist/ai-model.js` 中，不需要单独下载或填写密钥。

## 官方参考

- [GitHub Pages 是什么](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [使用 GitHub Actions 发布 Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
