# 📚 书签管理系统

基于 Cloudflare Pages + D1 + Vue 3 构建的现代化书签管理系统。

## ✨ 功能特性

- 📑 **分类管理**：多级嵌套分类，支持拖拽排序
- 🔖 **书签管理**：添加、编辑、删除书签，支持私密标记
- 🔍 **实时搜索**：按名称、URL 或描述快速搜索
- 📥 **导入导出**：支持 JSON/HTML 格式，导入浏览器书签
- 💾 **云端备份**：备份到 Cloudflare R2，支持恢复（可选）
- ⚡ **批量操作**：批量移动、编辑、删除
- 🤖 **AI 功能**：智能生成描述、分类推荐（支持 OpenAI 兼容 API）
- 🎨 **主题定制**：亮色/暗色主题、自定义壁纸、标题、页脚
- 🌐 **浏览器扩展**：支持 Chrome、Edge、Brave、Firefox

## 🛠️ 技术栈

Vue 3 + Vite + Cloudflare Pages Functions + D1 + R2

## 🚀 快速部署

### 1. 创建 D1 数据库
在 [Cloudflare Dashboard](https://dash.cloudflare.com/) 中：
- `Workers & Pages` > `D1` > `Create database`，名称：`bookmark-db`
- 进入数据库 > `Console`，执行 `schema.sql`

### 2. 部署 Pages 项目
- Fork [本仓库](https://github.com/deerwan/nav) 到 GitHub
- 在 Cloudflare Dashboard 创建 Pages 项目，连接 GitHub 仓库
- 构建设置：构建命令 `npm run build`，输出目录 `dist`

### 3. 配置绑定和变量

**绑定 D1 数据库**：
- Pages 项目 > `Settings` > `Functions` > `D1 database bindings`
- 添加绑定：变量名 `DB`，选择 `bookmark-db`

**配置环境变量**（部署后配置）：
- Pages 项目 > `Settings` > `Variables and Secrets`
- 添加以下变量后，在 `Deployments` 页面重试部署

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `ADMIN_USERNAME` | 管理员用户名 | ✅ |
| `ADMIN_PASSWORD` | 管理员密码 | ✅ |
| `JWT_SECRET` | JWT 密钥（至少32位随机字符串） | ✅ |
| `OPENAI_API_KEY` | OpenAI API Key（AI 功能） | ❌ |
| `OPENAI_BASE_URL` | API 地址（默认：`https://api.openai.com/v1`） | ❌ |
| `OPENAI_MODEL` | 模型名称（默认：`gpt-4o-mini`） | ❌ |

**配置 R2 备份**（可选）：
- `Workers & Pages` > `R2` > `Create bucket`，名称：`bookmark-backups`
- Pages 项目 > `Settings` > `Functions` > `R2 bucket bindings`
- 添加绑定：变量名 `BACKUP_BUCKET`，选择 `bookmark-backups`
- 重试部署

> **提示**：所有配置通过 Dashboard 完成，无需修改代码。`wrangler.toml` 仅用于本地开发（已添加到 `.gitignore`）。

**本地开发**：
```bash
cp wrangler.toml.example wrangler.toml
# 编辑 wrangler.toml，替换 database_id
npm run dev
```

## 🧩 浏览器扩展

**商店下载**：
- [Edge 扩展](https://microsoftedge.microsoft.com/addons/detail/hepnnmnggonihfpkgcpengcaghlmjpkl)
- [Firefox 扩展](https://addons.mozilla.org/en-US/firefox/addon/%E4%B9%A6%E7%AD%BE%E7%AE%A1%E7%90%86%E5%8A%A9%E6%89%8B-bookmark-manager/)

**手动安装**：
在 [Releases](https://github.com/deerwan/nav/releases) 下载扩展：
- Chrome/Edge/Brave: `bookmark-manager-chromium.zip`
- Firefox: `bookmark-manager-firefox.zip`

安装后配置服务器地址和管理员账号即可使用。

## 📖 更多信息

- 📺 [视频教程](https://www.bilibili.com/video/BV1zR2MB6EnW/)
- 📦 [GitHub 仓库](https://github.com/deerwan/nav)

## 💰 请喝咖啡

如果这个项目对你有帮助，欢迎赞助支持！

<table>
  <tr>
    <td align="center">
      <strong>微信</strong><br>
      <img src="images/zsm.jpeg" alt="微信" width="200">
    </td>
    <td align="center">
      <strong>支付宝</strong><br>
      <img src="images/zfb.JPG" alt="支付宝" width="200">
    </td>
    <td align="center">
      <strong>红包码</strong><br>
      <img src="images/hbm.PNG" alt="红包码" width="200">
    </td>
  </tr>
</table>

☕ [查看咖啡列表](https://lllh.de/sponsor/) - 感谢所有支持者！

## 📝 许可证

Apache License 2.0

Made with ❤️ using Vue 3 and Cloudflare
