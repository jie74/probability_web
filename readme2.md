# 概率论可视化平台 · 开发者指南

> 本文档面向二次开发与维护者，补充 [`README.md`](README.md)（面向使用者）未覆盖的开发约定、文件职责与常见改动流程。

## 快速上手

```bash
# 推荐：本地 HTTP 服务（思维导图页需要 fetch，file:// 会 CORS 失败）
python -m http.server 8000
# 访问 http://localhost:8000/
```

## 页面清单

| 文件 | 类型 | 说明 |
| :--- | :--- | :--- |
| index.html | 首页 | 课程简介、章节导航卡、公式速览、应试重点 |
| chapter1.html | 章节 | 随机事件及其概率 |
| chapter2.html | 章节 | 一维随机变量及其分布 |
| chapter3.html | 章节 | 二维随机变量及其分布（含 Plotly 3D 曲面） |
| chapter4.html | 章节 | 随机变量的数字特征 |
| chapter5.html | 章节 | 大数定律及中心极限定理 |
| chapter6.html | 章节 | 样本及抽样分布 |
| chapter7.html | 章节 | 参数估计 |
| chapter8.html | 章节 | 假设检验 |
| appendix.html | 工具 | 概率论附表（泊松 / 正态 / χ² / F 查表） |
| mindmap_markmap.html | 工具 | 全书思维导图（markmap 渲染） |
| bayes_replacer.html | 工具 | 贝叶斯 / 全概率事件替换器 |

## 资源目录

| 路径 | 职责 |
| :--- | :--- |
| css/sidebar.css | 侧边栏样式、折叠动画、响应式 |
| css/theme.css | 明暗主题共享样式 |
| css/coze-widget.css | AI 助教抽屉样式 |
| js/sidebar.js | 侧边栏组件（导航单一数据源 + 折叠状态持久化） |
| js/theme.js | 明暗主题切换 |
| js/katex-setup.js | KaTeX 自动渲染 + MutationObserver |
| js/coze-widget.js | Coze 智能体抽屉注入 |
| js/d3.v7.min.js / markmap-lib.js / markmap-view.js | 思维导图依赖（本地副本） |
| vendor/tailwind.min.js | TailwindCSS 本地副本（运行时编译） |
| vendor/echarts.min.js | ECharts 5.4 |
| vendor/plotly.min.js | Plotly.js 2.32.0（仅 chapter3 使用） |
| vendor/katex/ | KaTeX 0.16 + 字体 |
| images/ | README 截图（fig1~fig6） |
| logo.png | 站点 favicon |
| 概率论思维导图.md | 思维导图数据源，被 mindmap 页 fetch 读取 |

## 开发约定

### 1. 导航是唯一数据源

新增 / 调整页面时，**只改 `js/sidebar.js` 的导航列表**，不要在各页面里写死 `<a>`。侧边栏分「课程章节 / 学习工具」两组，折叠状态持久化于 localStorage。

### 2. 公式渲染

- 正文行内公式：`\(...\)`
- 结构化公式位：`<span class="katex-render" data-expr="...">`
- 动态重写（如贝叶斯「活公式」）由 `js/katex-setup.js` 的 MutationObserver 自动重渲染

### 3. 图表实例注册

每个章节页在 `window.resize` 监听中注册本页新建的 ECharts 实例，确保响应式自适应。

### 4. 配色主题

各页通过 `tailwind.config` 扩展 `primary` 蓝色系（`primary` / `primary-light` / `primary-dark` / `primary-bg`），用 `text-primary`、`bg-primary-bg` 等类名引用，保持全站视觉统一。

### 5. 离线优先

所有第三方库必须放 `vendor/` 本地引入，**禁止引入任何 CDN**，确保 `file://` 与离线环境可用。

## 常见改动

| 需求 | 操作 |
| :--- | :--- |
| 新增章节页 | ① `js/sidebar.js` 补导航项 ② 新建 HTML ③ `index.html` 章节卡片区补一张卡 |
| 修改思维导图 | 仅编辑 `概率论思维导图.md`，无需碰 HTML |
| 新增自测题 | 在章节末尾自测区块按现有结构复制一道单选题 |
| 调整 n 范围等参数 | 同步修改滑块/输入框的 `min`/`max` 及对应 clamp 逻辑 |

## 部署

上传至 GitHub 仓库 `jie74/probability_web`，开启 GitHub Pages 即可线上访问。

```bash
git add . && git commit -m "update chapter2" && git push
```

> 本平台仅供教学使用 · © 2026
