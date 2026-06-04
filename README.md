<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 先见志明｜潘志明个人作品集

这是 `panzhiming.com` 的个人主页项目，前端使用 Vite + React，内容通过 Vercel Serverless API 从 Notion 读取。

## 本地预览

直接打开根目录的 `index.html` 不会正常工作，因为这是源码入口，不是构建后的页面。

### 方式一：查看静态预览

```bash
npm install
npm run build
```

然后打开：

```text
dist/index.html
```

静态预览会使用演示数据，因为 `file://` 环境不能运行 Vercel 的 `/api` 函数。

### 方式二：预览真实 Notion 数据

复制 `.env.example` 为 `.env.local`，填入 Vercel 中同名的环境变量：

```bash
cp .env.example .env.local
```

必填：

```text
NOTION_API_KEY
NOTION_PROFILE_DB_ID
NOTION_GALLERY_DB_ID
NOTION_THOUGHTS_DB_ID
NOTION_BLOG_DB_ID
```

留言功能还需要：

```text
NOTION_CONTACT_DB_ID
```

如果要在本地完整模拟 Vercel API，建议使用 Vercel CLI：

```bash
vercel dev
```

如果只看前端样式，可以使用：

```bash
npm run start
```

## Notion 内容没有及时更新

线上接口会先读 Vercel KV / CDN 缓存，默认缓存约 55 分钟。修改 Notion 后，如果想立刻刷新缓存，可以访问：

```text
https://panzhiming.com/api/portfolio?fresh=1
```

或者：

```text
https://panzhiming.com/api/refresh-cache
```

然后再刷新首页。缓存时间可以通过环境变量调整：

```text
PORTFOLIO_CACHE_TTL_SECONDS=3300
PAGE_CACHE_TTL_SECONDS=3300
```

详情页内容也支持强制刷新。比如文章页：

```text
https://panzhiming.com/blog/364fc869-e6ca-808f-86c8-f4d79268ce15?fresh=1
```

对应接口也可以单独刷新：

```text
https://panzhiming.com/api/get-page-content?pageId=364fc869-e6ca-808f-86c8-f4d79268ce15&fresh=1
https://panzhiming.com/api/page-images?pageId=364fc869-e6ca-808f-86c8-f4d79268ce15&fresh=1
```
