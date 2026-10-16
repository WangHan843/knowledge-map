# GitHub Pages部署指南

2026-10-16。代码与部署配置已完成；没有替你创建仓库、登录账号、推送代码或更改二维码。

## 1. 创建空仓库

登录自己的GitHub，点击右上角“+” → New repository。建议仓库名knowledge-map，选择Public。不要初始化README、.gitignore或License，以免首次推送产生不必要冲突。创建后记下HTTPS地址。

参考站点的账户/仓库名不自动作为你的目标；可以使用任意仓库名，工作流会计算正确子路径。

## 2. 上传项目

当前目录尚未初始化Git。PowerShell执行：

```powershell
Set-Location D:\knowledge-map
git init
git branch -M main
git add .github frontend backend scripts docs README.md AGENTS.md SPEC.md .gitignore
git status --short
git commit -m "Add standalone static learning platform"
git remote add origin https://github.com/YOUR_USERNAME/knowledge-map.git
git push -u origin main
```

把YOUR_USERNAME替换为自己的GitHub用户名；仓库名也应对应刚创建的仓库。Git提示身份时配置自己的user.name/user.email；需要认证时在自己的浏览器完成GitHub登录，不要把访问令牌写进源码。

提交前查看git status：不应包含.venv、node_modules、dist、dist-server、backend/data、SQLite文件、.env、tmp、output、原始PDF、参考图片或ZIP。已经提供.gitignore；教材页面需要的5张裁图在frontend/src/assets/textbook，会正常提交。

必须包含隐藏目录.github及frontend/package-lock.json。只上传dist不会获得本项目的自动构建工作流。

## 3. 开启Pages

仓库 → Settings → Pages → Build and deployment → Source选择 **GitHub Actions**。

首次推送可能先于Pages启用：开启后到Actions → Deploy learning platform to GitHub Pages → Run workflow → main手动运行一次。如果提示工作流未启用，按仓库界面启用Actions。

工作流依次执行npm ci、单元测试、Vite静态构建、上传frontend/dist、部署。部署任务使用github-pages环境，若仓库配置了环境保护规则，需要按该规则批准。

两项任务均成功后，在Settings / Pages或部署任务中复制实际网址，例如：
https://YOUR_USERNAME.github.io/knowledge-map/

其中测试页：
https://YOUR_USERNAME.github.io/knowledge-map/#/test

这时再在手机浏览器、微信和实际网络下验证。本文没有断言国内网络必然可达；已有二维码目标不会自动改变。

## 4. 后续更新

在项目根目录执行：

```powershell
git add .github frontend backend scripts docs README.md AGENTS.md SPEC.md .gitignore
git diff --cached --stat
git commit -m "Update learning platform"
git push
```

main分支每次推送自动重新部署，也可Actions手动触发。默认站点发布不清除学生localStorage；但修改域名、仓库名或路径会改变记录命名空间。

## 5. 构建路径

默认本地base是/。Actions通过GITHUB_REPOSITORY计算/仓库名/；若仓库为用户名.github.io，则使用/。

手动模拟项目站点：

```powershell
Set-Location D:\knowledge-map\frontend
$env:PAGES_BASE_PATH='/knowledge-map/'
npm.cmd run build
Remove-Item Env:PAGES_BASE_PATH
Set-Location ..
node scripts/serve-static.mjs --base /knowledge-map/ --port 4173
```

打开 http://localhost:4173/knowledge-map/ 。此服务器没有API和SPA回退，错误资源路径会直接404，便于发现Pages问题。保持窗口运行，Ctrl+C停止。手机同Wi-Fi测试可加 --host 0.0.0.0，并访问电脑IPv4:4173/knowledge-map/。

根路径本地版本用npm.cmd run build再npm.cmd run preview。不要用npm.cmd run build:server发布Pages；该命令生成的是需要FastAPI的dist-server。

## 6. 常见问题

- Pages首次404：确认工作流成功、Pages Source为GitHub Actions、访问包含正确仓库名的URL。
- 页面空白/资源404：不要手工修改dist；检查构建base和仓库名称，重新运行工作流。
- 刷新子页404：使用包含#/test的Hash地址，不使用/仓库名/test。
- 刷新后记录不同：检查是否换了浏览器/域名/仓库路径/隐私窗口。静态版不会读取旧SQLite记录。
- localStorage空间不足：页面会保留原数据并报告保存失败；不要把失败提交当作有效成绩。
- Actions失败：在Actions打开失败步骤日志，修复后推送；本地构建成功不能代替账号上的工作流实际运行。

## 官方依据

[Vite GitHub Pages部署说明](https://vite.dev/guide/static-deploy.html#github-pages)说明项目站点base和Actions构建。
[GitHub Pages自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)说明Pages配置、artifact和部署权限。

