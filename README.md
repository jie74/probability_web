<p align="right"><a href="README.en.md">English</a></p>

# 概率论与数理统计 · 交互式可视化教学平台
# Probability & Mathematical Statistics · Interactive Visualization Teaching Platform

一个**纯静态、零依赖外部请求**的概率论与数理统计可视化教学网站。通过滑块交互、实时图表、折叠公式与自测题，帮助本科课堂与自学者直观理解概念、抓住应试考点。

A **fully static, zero external-request** visualization website for Probability & Mathematical Statistics. Slider-driven interactions, live charts, collapsible formulas and self-tests help undergraduate classes and self-learners build intuition and master exam-focused points.

## 特性 / Features

- **完全离线可用**：所有第三方库（Tailwind / KaTeX / ECharts / Plotly）与思维导图依赖（d3 / markmap）均为本地副本，页面不产生任何外部 CDN 请求。
- **12 个页面 + 1 个数据文件**：8 个章节页 + 首页 + 3 个学习工具页 + 思维导图数据源。
- **交互式可视化**：滑块 + 数值输入框双向联动，拖动即见概率分布、密度曲线、3D 曲面、自测模拟实时变化。
- **应试导向**：每章末尾 3 道单选题点击即判分并给解析；卡片内置 💡 应试提示（浅黄）与 📌 核心结论框（纠正直觉误区）。
- **公式渲染**：KaTeX 渲染正文行内公式与结构化公式位，支持动态重写（如贝叶斯「活公式」）。
- **可折叠侧边导航**：分「课程章节 / 学习工具」两组，折叠状态持久化于 localStorage，移动端覆盖层自适应。

## 目录结构

```
website/
├── index.html                  # 首页：课程简介、章节导航、公式速览、应试重点、使用说明
├── chapter1.html               # 随机事件及其概率
├── chapter2.html               # 一维随机变量及其分布
├── chapter3.html               # 二维随机变量及其分布（含 Plotly 3D 曲面）
├── chapter4.html               # 随机变量的数字特征
├── chapter5.html               # 大数定律及中心极限定理
├── chapter6.html               # 样本及抽样分布
├── chapter7.html               # 参数估计
├── chapter8.html               # 假设检验
├── appendix.html               # 工具：概率论附表（泊松 / 正态 / χ² / F 查表）
├── mindmap_markmap.html        # 工具：全书思维导图 + 知识图谱（markmap 渲染）
├── bayes_replacer.html         # 工具：贝叶斯 / 全概率事件替换器
├── 概率论思维导图.md            # 思维导图数据源，被 mindmap 页 fetch 读取
├── css/
│   ├── sidebar.css             # 侧边栏样式 + 折叠动画 + 响应式
│   └── theme.css               # 明暗主题（共享）
├── js/
│   ├── sidebar.js              # 侧边栏组件（导航单一数据源 + 折叠状态持久化）
│   ├── theme.js                # 明暗主题切换
│   ├── katex-setup.js          # KaTeX 自动渲染 + MutationObserver
│   ├── d3.v7.min.js            # 思维导图依赖（本地）
│   ├── markmap-lib.js          # 思维导图依赖（本地）
│   └── markmap-view.js         # 思维导图依赖（本地）
├── vendor/                     # 第三方库本地副本，页面不产生任何外部请求
│   ├── tailwind.min.js         # TailwindCSS 本地副本
│   ├── echarts.min.js          # ECharts 5.4
│   ├── plotly.min.js           # Plotly.js 2.32.0
│   └── katex/                  # KaTeX 0.16
│       ├── katex.min.css
│       ├── katex.min.js
│       ├── auto-render.min.js
│       └── fonts/              # 字体文件，被 katex.min.css 相对引用
└── logo.png                    # 站点图标（favicon）
```

## 本地运行

### 方式一：直接双击（推荐快速预览）

所有 HTML 与 `css/`、`js/`、`vendor/` 同级，扁平结构下可直接双击 `index.html` 以 `file://` 协议打开，章节页、工具页均可正常运行。

> ⚠️ **例外**：`mindmap_markmap.html` 通过 `fetch('./概率论思维导图.md')` 读取数据，浏览器在 `file://` 下会因 CORS 拦截而加载失败（页面会给出红色错误提示）。该页需通过本地 HTTP 服务打开，见方式二。

### 方式二：本地 HTTP 服务（推荐，含思维导图页）

在项目根目录启动任意静态服务器，例如：

```bash
# Python
python -m http.server 8000

# 或 VS Code 扩展 Live Server，右键 index.html → Open with Live Server
```

然后访问 `http://localhost:8000/`。

## 部署

全部页面完成后上传 GitHub，开启 **GitHub Pages** 即可线上访问（走 HTTP，`fetch` 与思维导图页均正常工作）。

## 使用说明

1. 通过左侧导航切换章节 / 学习工具。
2. 拖动滑块修改参数，观察图表实时变化。
3. 展开折叠面板查看考试公式与逐步推导。
4. 每章末尾自测题检验掌握程度（可反复重答，无计分与持久化）。

### 学习工具

- **分布速查表**：泊松 / 正态 / χ² / F 分布查表，侧边栏「分布速查表」入口。
- **思维导图**：全书知识树，支持折叠 / 缩放、右键递归展开、悬停看路径；改内容只编辑 `概率论思维导图.md`。
- **贝叶斯事件替换器**：把疾病检测案例抽象为任意两个事件 A、B，含 4 个预设场景（疾病检测 / 垃圾邮件 / 信用卡欺诈 / 下雨预测），体会贝叶斯的通用推断本质。

## 技术栈

| 能力 | 技术 |
|---|---|
| 样式 | TailwindCSS（本地副本，运行时编译） |
| 公式 | KaTeX 0.16 |
| 2D 图表 | ECharts 5.4 |
| 3D 曲面 / 等高线 | Plotly.js 2.32.0（仅 chapter3 使用） |
| 手绘与逐帧动画 | 原生 Canvas 2D（韦恩图、贝叶斯面积图、掷骰子动画） |
| 思维导图 | markmap + d3 v7（本地引入） |

## 维护与扩展

- **新增页面**：在 `js/sidebar.js` 的导航列表里补一项（导航是唯一数据源，不要在页面里写死 `<a>`）；若是章节页，在 `index.html` 章节卡片区补一张卡；并在本页 `window.resize` 监听中注册新建的 ECharts 实例。
- **修改公式 / 知识点**：正文直接用 `\(...\)`，结构化公式位用 `<span class="katex-render" data-expr="...">`。
- **修改思维导图**：仅编辑 `概率论思维导图.md`，无需触碰 HTML。

> 本平台仅供教学使用 · © 2026
