# prob‑web‑spec.md
> 概率论与数理统计交互式可视化教学网站｜完整规格说明书
> 用途：直接复制片段到大模型，分批次生成网站HTML代码；**禁止一次性全部丢入，按公共文件→首页→章节1→章节2…→工具页顺序生成**
> 技术栈：静态网页，无后端；TailwindCSS + KaTeX(公式) + ECharts(2D图表) + Plotly.js(3D曲面/等高线) + 原生Canvas(手绘图与动画) + markmap(思维导图) + d3(v7，知识图谱)；全部依赖本地引入，无外部 CDN 请求
> 目标用户：本科课堂、学生自学；兼顾概念理解 + 应试考点提示

## 页面清单（共12个 HTML 页面 + 1个数据文件）
| 页面 | 类型 | 说明 |
|---|---|---|
| index.html | 首页 | 章节导航 + 核心公式速览 + 应试重点 + 使用说明 |
| chapter1.html | 章节 | 随机事件及其概率（3卡：抛硬币 / 韦恩图 / 贝叶斯） |
| chapter2.html | 章节 | 一维随机变量及其分布（含离散分布专题面板、分布速查表入口与总结表） |
| chapter3.html | 章节 | 二维随机变量及其分布（4卡，含 Plotly 3D 曲面） |
| chapter4.html | 章节 | 随机变量的数字特征（4卡，含性质对照表） |
| chapter5.html | 章节 | 大数定律及中心极限定理（4卡，含切比雪夫与掷骰子动画） |
| chapter6.html | 章节 | 样本及抽样分布（3卡） |
| chapter7.html | 章节 | 参数估计（3卡） |
| chapter8.html | 章节 | 假设检验（4卡） |
| **appendix.html** | **工具（新增）** | 概率论附表：泊松 / 正态 / χ² / F 分布查表（侧边栏「分布速查表」入口指向此页） |
| **mindmap_markmap.html** | **工具（新增）** | 全书思维导图 + 知识图谱双视图（折叠/缩放/右键递归展开/悬停看路径） |
| **bayes_replacer.html** | **工具（新增）** | 贝叶斯/全概率事件替换器，事件名可自定义 + 4个预设场景 |
| **概率论思维导图.md** | **数据（新增）** | 思维导图内容源，被 mindmap 页 fetch 读取 |

## 与初版规格的主要差异（增量说明）
1. **目录结构改为扁平**：取消 `pages/` 子目录，所有 html 与 `css/`、`js/` 同级，`file://` 双击即可运行。
2. **抽出3个公共文件**：`css/sidebar.css`、`js/sidebar.js`、`js/katex-setup.js`。侧边导航成为唯一数据源，不在页面里写死 `<a>`。
3. **侧边栏升级**：分「课程章节 / 学习工具」两组；支持折叠收起，状态存 localStorage；移动端覆盖层 + 滑动关闭；折叠时派发 resize 让图表自适应。
4. **新增3个工具页 + 1个数据文件**（分布速查表、思维导图、事件替换器）。
5. **卡片增加两个可选区块**：🧮实时计算过程折叠面板（把当前参数代入公式逐步推导）、📌核心结论框（点明直觉误区）。
6. **控件规范化**：需要精确输入的参数统一配「滑块 + 数值输入框」双向联动；按钮做视觉分级（蓝色实心=执行，白底描边=重置）。
7. **新增卡片**：chapter2 六大分布总结表、chapter4 期望方差性质表、chapter5 切比雪夫不等式与掷骰子动画、chapter8 单双侧并排对比、index 公式速览与应试重点区。
8. **自测题统一为每页3道**，点击即判分并给解析，允许反复重答，不做计分与持久化。
9. **全站接入 AI 助教**：新增公共文件 `css/coze-widget.css` + `js/coze-widget.js`，每个页面右下角提供「🤖 概率论 AI 助教」可折叠抽屉（Coze Web SDK），详见文末【全站 AI 助教】。

---

## 全局UI&技术规范（所有页面共用）
```
【UI风格】
- 主题：简洁科研教学风，浅色模式为主；主色 #2563eb，强调色 #1d4ed8；应试提示背景 #fef9c3
- 布局：左侧固定侧边导航栏，PC端优先；卡片圆角，合理留白；卡片之间垂直间距24px
- 卡片统一结构：
  1. 卡片标题
  2. 📖知识点文本（简短，教材精简版）
  3. 📐公式折叠面板：点击展开/收起，KaTeX渲染LaTeX
  4. 🎛️可视化区域：图表容器 + 滑块、下拉选择、按钮、重置按钮
  5. 💡应试提示：浅黄色背景，标注考试高频点、易错坑
  6. （可选）🧮实时计算过程面板：折叠面板，把当前控件数值代入公式，逐步展示推导与结果，滑块变动即重新生成LaTeX
  7. （可选）📌核心结论框：浅蓝底 + 蓝色边框，一句话点明该卡片要纠正的直觉误区
- 页面底部：3道单选自测小题（统一为3道，见下方【自测题统一规范】）
- 各页面业务JS写在页面内部<script>标签，完整可直接运行；**公共基础设施抽成本地文件复用**（见下方【公共文件】）
- 头部必须引入的本地依赖（全部放在 `vendor/`，页面零外部请求、离线可用）：
1. TailwindCSS（`vendor/tailwind.min.js`，Play CDN 构建的本地副本，运行时编译，支持 sidebar.js 动态注入的 class）
2. KaTeX（`vendor/katex/`：katex.min.css + katex.min.js + auto-render.min.js，字体在同目录 fonts/ 下）
3. ECharts（`vendor/echarts.min.js`）
4. Plotly.js（`vendor/plotly.min.js`；仅 chapter3 的3D曲面实际使用，其余页面可省略）
```

```html
<!-- 本地依赖 + 公共文件头部模板，每个HTML都复制 -->
<link rel="icon" type="image/png" href="logo.png">

<!-- TailwindCSS + 主题色配置 -->
<script src="vendor/tailwind.min.js"></script>
<script>
tailwind.config = { theme: { extend: { colors: {
  primary: '#2563eb', 'primary-light': '#3b82f6',
  'primary-dark': '#1d4ed8', 'primary-bg': '#eff6ff'
} } } }
</script>

<!-- KaTeX：三件套齐全，auto-render 供正文内联 \(...\) 使用；字体由 katex.min.css 相对引用 -->
<link rel="stylesheet" href="vendor/katex/katex.min.css">
<script src="vendor/katex/katex.min.js"></script>
<script src="vendor/katex/auto-render.min.js"></script>
<script src="js/katex-setup.js"></script>

<script src="vendor/echarts.min.js"></script>
<script src="vendor/plotly.min.js"></script>

<!-- 公共侧边栏样式 -->
<link rel="stylesheet" href="css/sidebar.css">
```

```html
<!-- body 顶部：侧边栏挂载点（sidebar.js 用 innerHTML 注入，file:// 直接双击也能用） -->
<div id="sidebar-container"></div>
<script src="js/sidebar.js"></script>
<main class="main-content"> ... 页面内容 ... </main>
```

【公共文件（新增，所有页面共用，禁止在页面内重复实现）】
```
1. css/sidebar.css   侧边栏样式 + 折叠动画 + 响应式断点
   - .sidebar / .sidebar-nav-item / .sidebar-nav-item.active / .chapter-num
   - .sidebar-toggle（栏内“收起”按钮）、.sidebar-reopen（收起后左上角悬浮展开按钮）
   - body.sidebar-collapsed：侧边栏 translateX(-100%)，.main-content 的 margin-left 归零
   - @media(max-width:767px) 移动端覆盖层模式；768~1023px 中屏适配

2. js/sidebar.js     侧边栏组件（唯一导航来源）
   - 以 innerHTML 注入完整侧边栏，不用 fetch/XHR，兼容 file:// 协议
   - 按 location.pathname 文件名自动给当前页导航项加 .active 高亮
   - 桌面端：点击“收起”推挤折叠，状态存 localStorage（key: prob-sidebar-collapsed），刷新保持
   - 移动端：覆盖层模式 + 遮罩点击关闭 + 向左滑动关闭 + 点击导航项后自动关闭
   - 折叠/展开后 dispatch window resize 事件，让 ECharts 自动 resize，避免图表错位

3. js/katex-setup.js  公式自动渲染
   - 用 renderMathInElement 扫描正文，渲染 \(...\)、\[...\]、$$...$$ 三种定界符
   - MutationObserver + 150ms 防抖，自动渲染后续动态插入的内容（如自测题反馈文本）
   - 跳过 .katex-render / .katex / .katex-display，避免与页面内 renderAllKatex() 重复渲染
   - 对外暴露 window.renderKatexAuto(node)，供页面手动触发

4. js/d3.v7.min.js、js/markmap-lib.js、js/markmap-view.js
   - 仅思维导图页面使用，本地引入（markmap CDN 不稳定）

5. css/coze-widget.css + js/coze-widget.js   AI 助教抽屉（全站共用）
   - 自动注入悬浮按钮 / 遮罩 / 抽屉 DOM，动态加载 Coze Web SDK 并初始化
   - 页面接入仅需两行：head 引 css，body 末尾引 js（详见文末【全站 AI 助教】）
```

【公式渲染的两种写法（页面内必须同时支持）】
```
1. <span class="katex-render" data-expr="P(A|B)=\frac{...}"></span>
   → 由页面内 renderAllKatex() 遍历渲染；折叠面板展开时需重新调用一次。
   → 适用于公式面板、表格单元格等“结构化公式位”，也是动态重建公式的唯一入口
     （改写 data-expr 后再 katex.render 即可）。
2. 正文里直接写 \(f(x)\)
   → 由 js/katex-setup.js 自动渲染，适用于知识点段落、标签、自测题反馈文本。
```

【自测题统一规范（所有章节页面一致）】
```
- 卡片标题：📝 自测题（单选），每页固定3道
- 选项不用 <input radio>，用 <div class="quiz-option" onclick="selectQuiz('qN', idx, this)">
- 答案与解析集中放在 quizAnswers = {q1:…, q2:…, q3:…} 与 quizFeedback 两个对象里
- 点击即判分（无提交按钮）：
  · 先清除本题所有选项的 selected/correct/wrong 状态（允许反复重答）
  · 答对：所选项加 .correct（绿），反馈区绿色 “✅ …”
  · 答错：所选项加 .wrong（红），同时把正确项标绿，反馈区红色 “❌ …”并说明正确选项
  · 反馈文本可含 \(...\)，判分后调用 renderAllKatex() / window.renderKatexAuto(feedback) 重渲染
- 不做总分统计、不做答题次数限制、不做作答结果持久化
```

【图表通用约定】
```
- 每个页面底部注册 window resize 监听，对本页所有 ECharts 实例调用 .resize()，
  Canvas 图表则重绘（配合侧边栏折叠时派发的 resize 事件）
- 理论值/期望/临界值统一用红色虚线 markLine 标注，并带数值 label
- 模拟类图表：蓝色柱状/散点为模拟结果，红色曲线为理论分布，legend 置底
- 按钮视觉分级：蓝色实心 = ▶ 开始模拟 / 生成样本 / 重新生成；白底描边 = 🔄 重置
- 滑块右侧配等宽字体数值显示；需要精确输入的参数额外配 <input type="number"> 双向联动
```

【侧边导航栏固定内容】
```
顶部品牌区：logo图标 + 「概率论与数理统计 / 可视化平台」（整块可点，链回 index.html）
            右侧「‹」收起按钮（.sidebar-toggle）

分组一：课程章节
0. ⌂ 首页（index.html）
1. 随机事件及其概率（chapter1.html）
2. 一维随机变量及其分布（chapter2.html）
3. 二维随机变量及其分布（chapter3.html）
4. 随机变量的数字特征（chapter4.html）
5. 大数定律及中心极限定理（chapter5.html）
6. 样本及抽样分布（chapter6.html）
7. 参数估计（chapter7.html）
8. 假设检验（chapter8.html）

分组二：学习工具
🧠 思维导图（mindmap_markmap.html）
🔀 贝叶斯事件替换器（bayes_replacer.html）

底部：版本信息「概率论与数理统计 / 交互式可视化平台 v1.0」

- 每项左侧带序号徽标（.chapter-num），首页与工具页用图标代替数字
- 当前所在页面导航项高亮蓝色（.active），由 sidebar.js 比对文件名自动添加
- 导航是**单一数据源**：新增页面只改 js/sidebar.js，不要在各页面写死 <a>
```

【网站目录结构（实际采用扁平结构，便于 file:// 直接双击打开与 GitHub Pages 部署）】
```
website/
├── index.html                  # 首页：课程简介、章节导航、公式速览、应试重点、使用说明
├── chapter1.html               # 随机事件及其概率
├── chapter2.html               # 一维随机变量及其分布
├── chapter3.html               # 二维随机变量及其分布
├── chapter4.html               # 随机变量的数字特征
├── chapter5.html               # 大数定律及中心极限定理
├── chapter6.html               # 样本及抽样分布
├── chapter7.html               # 参数估计
├── chapter8.html               # 假设检验
├── mindmap_markmap.html        # 【新增】全书思维导图（markmap 渲染）
├── bayes_replacer.html         # 【新增】贝叶斯/全概率事件替换器（通用工具页）
├── 概率论思维导图.md            # 【新增】思维导图数据源，被 mindmap_markmap.html fetch
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
│   ├── tailwind.min.js         # TailwindCSS Play CDN 构建的本地副本
│   ├── echarts.min.js          # ECharts 5.4
│   ├── plotly.min.js           # Plotly.js 2.32.0
│   └── katex/                  # KaTeX 0.16.8
│       ├── katex.min.css
│       ├── katex.min.js
│       ├── auto-render.min.js
│       └── fonts/              # 20 个 woff2 字体，被 katex.min.css 相对引用
└── logo.png                    # 站点图标（favicon）

说明：
1. 不使用 pages/ 子目录——所有 html 与 css/、js/、vendor/ 同级，相对路径最短，双击即可运行。
2. 第三方库全部本地化：Tailwind / KaTeX / ECharts / Plotly 在 `vendor/`，markmap / d3 在 `js/`；页面零外部请求，离线可用。
3. 思维导图数据放在独立 .md 文件，改内容不用碰 html。
```

---

# 首页 index.html 规格
## 知识点文本
> 《概率论与数理统计交互式可视化平台》
> 课程分为两大模块：
> 1. 概率论（第1‑5章）：已知概率模型，计算随机事件发生的概率；研究随机变量、分布、数字特征。
> 2. 数理统计（第6‑8章）：由样本数据反推总体信息；参数估计、假设检验。
> 使用说明：
> 1. 左侧导航切换章节；
> 2. 拖动滑块修改参数，观察图表实时变化；
> 3. 折叠面板查看考试公式；
> 4. 每章末尾自测题检验掌握程度。

## 页面组件（自上而下）
1. **Hero 区**：`交互式学习 · 可视化探索` 胶囊标签 + 大标题 + 简介段落 + 两个锚点按钮（→ `#chapters`、`#usage`）；背景带模糊渐变装饰圆
2. **课程介绍**：分别说明概率论模块（1‑5章）与数理统计模块（6‑8章）的定位
3. **两大模块卡片**：模块一 概率论 / 模块二 数理统计，各列出所含章节
4. **课程章节区（`id="chapters"`）**：8个章节跳转卡片，每张含
   - 章节 emoji 图标（🎲 📊 🔗 📐 ♾️ 📋 🎯 ✅）
   - `第N章` 徽标 + 所属模块标签
   - 章节标题 + 一句话描述
   - 3个知识点标签胶囊（如 条件概率 / 贝叶斯公式 / 全概率）
   - 整卡为 `<a>`，hover 上浮，点击进入 `chapterN.html`
5. **【新增】核心公式速览**：4张公式卡（贝叶斯公式、正态分布密度函数、中心极限定理、切比雪夫不等式），用 `.katex-formula[data-expr]` 以 displayMode 渲染
6. **【新增】应试重点提示**：4张浅黄 `exam-tip` 卡（全概率与贝叶斯、正态标准化、极大似然估计步骤、假设检验拒绝域），其中可内嵌 `.katex-inline` 行内公式
7. **网站使用说明（`id="usage"`）**：3步骤图块（选择章节 → 交互探索 → 理解理论）+ 技术说明框（纯静态 CDN、KaTeX 公式、ECharts 2D、Plotly 3D、Tailwind）
8. **页脚**：版权 `© 2026 — 仅供教学使用` + 技术栈署名

## 首页无交互图表
> 首页只做导航与速览，不放模拟图表；ECharts / Plotly 虽在 head 引入但不实例化。
> 唯一需要执行的脚本是 `DOMContentLoaded` 后的 KaTeX 渲染（遍历 `.katex-formula` 与 `.katex-inline` 的 `data-expr`，`throwOnError:false`，失败降级为原始文本）。
> 输出完整 index.html，配合 `js/sidebar.js`，其布局（`.main-content { margin-left:256px }` + `.card` 体系）作为后续所有 chapter 页面的复用基线。

---

# chapter1｜随机事件及其概率
## 本章总述
> 核心：随机试验、样本空间、事件运算、概率公理、古典概型、条件概率、全概率、贝叶斯、独立与互斥。
> 应试重点：德摩根定律、加法公式、条件概率、全概率、贝叶斯；区分独立与互斥。
> 卡片顺序：频率与概率 → 韦恩图 → 条件概率与贝叶斯（先建立"概率是什么"的直觉，再讲运算与推断）。

### 卡片1：频率与概率｜抛硬币模拟
**知识点文本**
频率：重复试验中事件发生的次数 / 总试验次数，随试验改变。
概率：事件固有的理论值；当试验次数很大时，频率依概率收敛到概率。

无公式

**可视化规格**
- 图表：ECharts 折线图（`coinChart`）。X：试验次数 n；Y：累计正面频率；带 `p=0.5` 水平红色虚线 markLine；tooltip 显示当前 n 与频率
- 控件：
  - 滑块 `coinSlider` + 数值输入框 `coinNum`（10 ~ 10000，step 10，默认100）**双向联动**
  - 按钮【▶ 开始模拟】（蓝色实心）、【🔄 重置】（白底描边）
- 实时读数：当前正面次数 `coinHeads`、正面频率 `coinFreq`、理论概率 0.5（三栏并排）
- 交互：点击开始模拟才跑（滑块只改 n，不自动重跑）；n 较小时频率剧烈震荡，n 增大曲线向 0.5 收敛；曲线降采样到约200个点，保证大 n 也流畅
- 页面加载时自动跑一次默认模拟，避免首屏空图

**应试提示**
频率是实验结果，概率是理论常数，不要混淆概念。

### 卡片2：韦恩图 — 事件的运算
**知识点文本**
随机事件可以做交、并、补、差运算；德摩根定律是事件运算重要恒等式。
互斥：$AB=\varnothing$，$A$、$B$ 不可能同时发生。
> ⚠️重要误区：互斥 ≠ 相互独立。

**LaTeX公式**（折叠面板）
```latex
A\cup B,\; A\cap B,\; \overline{A},\; A-B
\overline{A\cup B}=\overline A \cap \overline B
\overline{A\cap B}=\overline A \cup \overline B
```

**可视化规格**
- 图表：**原生 Canvas 2D**（`vennCanvas`，500×320）手绘：样本空间虚线矩形 + 两个圆 + A/B/S 标注 + 按选中项填充对应区域
- 控件：
  - 5个复选框（互斥单选行为：JS 保证最多勾选一个）
    `vennUnion` $A\cup B$、`vennIntersection` $A\cap B$、`vennCompA` $\overline A$、`vennCompB` $\overline B$、`vennDeMorgan` $\overline{A\cup B}$
  - 按钮 `vennDisjointBtn`【互斥模式 ⇄ 相交模式】切换（两圆分离，并画红色虚线分隔）、【🔄 重置】
- 交互：勾选选项，图形高亮对应区域；互斥模式下不再绘制交集填充；对比 $\overline{A\cup B}$ 与 $\overline A\cap\overline B$ 演示德摩根定律两边区域完全等价

**应试提示**
德摩根定律填空选择高频；口诀：杠进去，并变交，交变并。互斥不等于独立，极易混淆。

### 卡片3：条件概率与贝叶斯公式 — 疾病检测案例（`id="bayes-card"`）
**知识点文本**
条件概率：在 $A$ 发生前提下 $B$ 发生的概率；贝叶斯由先验概率求后验概率。
很多人直觉高估后验概率，面积可视化帮助纠正直觉错误。

**卡片结构（比其他卡片多三层教学铺垫，新增）**
1. 标题行右侧放【🔀 事件替换器】按钮，链到 `bayes_replacer.html`（见下方工具页规格）
2. **🎯 情境引入**：blockquote 抛出经典提问——检测准确率95%，阳性者真正患病的概率是多少？先让学生凭直觉猜
3. **📘 概念讲解**：有序列表逐个拆解 先验概率 $P(A)$ / 似然 $P(B|A)$ / 后验概率 $P(A|B)$
4. 📖 知识点
5. 📐 核心公式折叠面板
6. 🎛️ 可视化区
7. **🧮 后验概率公式与计算过程**折叠面板（实时代入）
8. **📌 核心结论**蓝色信息框：直接给出当前后验概率数值，并点明误区根源
9. 💡 应试提示

**LaTeX公式**
```latex
P(B|A)=\frac{P(AB)}{P(A)},\; P(A)>0
P(B)=\sum_i P(A_i)P(B|A_i)
P(A_j|B)=\frac{P(A_j)P(B|A_j)}{\sum_i P(A_i)P(B|A_i)}
```

**可视化规格**
- 图表：**原生 Canvas 2D**（`bayesCanvas`）马赛克面积图——左右两列宽度按先验比例分配（患病 / 健康），每列上下按真阳性率、假阳性率切分，形成 TP / FN / FP / TN 四块，各用独立配色并在块内标注（块高足够时才写字）
- 控件：三组【滑块 + 数值输入框】双向联动，全部 `oninput` 实时更新
  - 先验概率 `priorSlider` / `priorNum`（0.001 ~ 0.3，step 0.001，默认 0.01）
  - 真阳性率 `tprSlider` / `tprNum`（0.5 ~ 1，step 0.01，默认 0.95）
  - 假阳性率 `fprSlider` / `fprNum`（0.001 ~ 0.3，step 0.001，默认 0.05）
  - 【🔄 重置】恢复 0.01 / 0.95 / 0.05
  - 数值框聚焦时不被滑块回写覆盖（避免打断输入）
- 实时读数：`posteriorVal` 大号显示 $P(患病|阳性)$ 百分比；图下方四色图例说明 TP/FN/FP/TN
- **实时计算过程（新增）**：`bayesCalcLatex` 的 `data-expr` 在每次输入时重新拼装 LaTeX，逐行展示"设 A/B → 列出已知 → 写出公式 → 代入数值 → 得到百分比"。滑块的 input 监听独立注册，面板收起时也保持同步，展开即是最新结果

**应试提示**
全概率、贝叶斯为考试大题考点；注意条件概率分母不能丢。当先验概率很低时后验概率仍可能很低——不要把 $P(B|A)$ 当成 $P(A|B)$。

**页面底部自测题（单选3道）**
1. $\overline{A\cup B}=$？（答案 B）
2. $A$、$B$ 互斥，则 $A$、$B$ 是否一定独立？（答案 C）
3. 条件概率 $P(B|A)$ 的分母是什么？（答案 C）

---

# chapter2｜一维随机变量及其分布
## 本章总述
> 核心：离散/连续随机变量；分布律、概率密度、分布函数F(x)；六大常用分布。
> 应试重点：分布函数性质；6大分布记号、期望方差；正态标准化；连续变量概率等于密度下面积。

### 卡片1：离散分布交互式可视化（专题面板模式，新增）
**知识点文本**
离散随机变量取有限/可列无穷个值；分布律描述各个取值的概率。
> 与旧版"一个柱状图切换分布"不同：本卡片为**三个独立专题面板**，每个分布有自己的图表、参数组、实时计算示例，切换时整块替换，知识点文本 `distKnowledge` 也随之替换。

**结构**
- h2 标题行内嵌下拉 `dedicatedDistSelect`：二项分布 B(n,p) / 泊松分布 P(λ) / 几何分布 G(p)
- 三个 `.dist-panel`：`binomialPanel`、`poissonPanel`、`geometricPanel`，同一时刻只显示一个
- `switchDedicatedDist()`：隐藏全部面板 → 显示目标面板 → 替换知识点文本 → 调用目标图表 `.resize()`（面板此前 display:none，宽度为0，必须 resize）→ 重新渲染 KaTeX
- 共用一个折叠公式面板，同时列出三个分布的分布律、期望、方差

**LaTeX公式**
```latex
P(X=x_k)=p_k,\quad \sum p_k =1
B(n,p):\; P(X=k)=C_n^k p^k(1-p)^{n-k},\; E=np,\; D=np(1-p)
P(\lambda):\; P(X=k)=\frac{\lambda^k}{k!}e^{-\lambda},\; E=D=\lambda
G(p):\; P(X=k)=(1-p)^{k-1}p,\; E=\frac1p,\; D=\frac{1-p}{p^2}
```

**可视化规格（每个面板一致的五件套）**
- 图表：ECharts 柱状图（`binomialChart` / `poissonChart` / `geometricChart`，360px），单图叠 4~5 个 series：
  1. 概率柱（选中的 k 高亮绿色；二项分布中 k>n 的柱透明）
  2. 柱顶散点
  3. 灰色虚线平滑拟合曲线（勾勒分布形状）
  4. 红色虚线竖直均值线 + 方框标签（二项/几何标 `E(X)=`，泊松标 `λ=`）
  5. 仅在选中的 k 柱上方显示数值标签
  - xAxis 为 value 类型（`min:-0.5`），保证柱子与整数刻度对齐
- 控件：每个参数都是【滑块 + 数值输入框】**双向联动**（数值框自动夹紧到区间并按 step 取整）
  - 二项：n `binomialNSlider`/`binomialNInput`（1~50）、p `binomialPSlider`/`binomialPInput`（0~1，step 0.01）、k `binomialKSlider`/`binomialKInput`（0~50，且改 n 或 k 时强制 k ≤ n）
  - 泊松：λ `poissonLambdaSlider`/`poissonLambdaInput`（0~30，step 0.1）、k `poissonKSlider`/`poissonKInput`（0~30）
  - 几何：p `geometricPSlider`/`geometricPInput`（0.01~0.99）、k `geometricKSlider`/`geometricKInput`（1~50）
  - 每个面板一个【🔄 重置】
- **实时计算示例（新增）**：`xxxExampleFormula` / `xxxExampleResult` 把当前 n、p、λ、k 代入分布律，显示完整算式与数值结果，滑块一动即刷新
- **图表footer**：一行文字给出"P(X = k) = 数值"，与图中高亮柱呼应

**应试提示**
二项、泊松、几何的期望方差直接背，考试不要现场推导；泊松 $E=D=\lambda$ 是送分点。

### 卡片2：连续分布（均匀、指数、正态）密度与分布函数
**知识点文本**
连续随机变量用概率密度 $f(x)$ 描述；概率是曲线下面积；分布函数 $F(x)=P(X\le x)$。

**LaTeX公式**
```latex
F(x)=P(X\le x),\quad P(a< X \le b)=\int_{a}^{b} f(x)dx
U(a,b),\; E(\lambda),\; N(\mu,\sigma^2)
```

**可视化规格**
- 双图并排：ECharts `contPDFChart`（上，密度 $f(x)$）+ `contCDFChart`（下，分布函数 $F(x)$），各300px，共享 x 轴范围
- 控件：
  - 下拉 `contDistSelect` 切换 正态 / 均匀 / 指数
  - 参数滑块1 `contParam1Slider`（标签 `contParam1Label` 随分布改成 μ / a / λ）
  - 参数滑块2 `contParam2Slider`（σ / b；**指数分布时整组隐藏**）
  - 均匀分布下动态抬高 b 滑块的 min，保证 $b>a$
  - 【🔄 重置】只重置当前分布的参数，不改下拉选择
- **点击取值交互（新增细节）**：`contPDFChart.on('click')` 取点击处 $x_0$ → 密度图填充 $(-\infty,x_0]$ 阴影 → 读数区显示 `contX0Val` 与 `contProbVal = P(X\le x_0)`（由 CDF 直接给出），图上标注"阴影面积 = P(X ≤ x₀)"
- **自适应视窗（新增）**：`CONT_VIEWS` / `getContView` / `getContRange` 按参数量级挑选绘图窗口（如 σ>1.2 自动拉宽），避免曲线挤在角落或跑出画布
- 数学实现：`normalPDF`/`normalCDF`（Abramowitz‑Stegun 近似 `erf`）、`uniformPDF/CDF`、`expPDF/CDF`

**应试提示**
连续型随机变量单点概率 $P(X=x_0)=0$，所以 $P(a<X\le b)$ 与 $P(a\le X\le b)$ 相等。

### 卡片3：正态分布标准化
**知识点文本**
任意正态可以变换为标准正态 $Z \sim N(0,1)$，查表计算概率。

**LaTeX公式**
```latex
Z=\frac{X-\mu}{\sigma}
\Phi(-z)=1-\Phi(z)
```

**可视化规格**
- 双图：ECharts `normOrigChart`（原分布 $N(\mu,\sigma^2)$）+ `normStdChart`（标准正态 $N(0,1)$），各300px
- 控件：三个滑块 + 数值读数——μ `normMuSlider`（−3~3）、σ `normSigmaSlider`（0.3~3）、X `normXSlider`（−5~5）；【🔄 重置】
- **X 滑块范围动态跟随（新增）**：随 μ、σ 改变把 X 的 min/max 重算为 $\mu\pm4\sigma$，并把当前 X 夹紧进新区间，避免标记点跑到图外
- 交互：拖动 X → `normZVal` 实时给出 $Z=(X-\mu)/\sigma$；两图同步画红色虚线 markLine 与左侧阴影；原图上方显示 $P(X\le x)$，标准图上方显示 $P(Z\le z)=\Phi(z)$ 的数值——**把"查表"这一步显式可视化**

**应试提示**
正态标准化期末考试必考；记住 $\Phi(-z)=1-\Phi(z)$，负值不用另查表。

### 卡片4：分布函数性质演示
**知识点文本**
$F(x)$ 单调不减；$0\le F(x)\le1$；$F(-\infty)=0,\;F(+\infty)=1$；离散型 $F$ 是右连续阶梯函数，连续型 $F$ 光滑。

无公式面板

**可视化规格**
- 图表：ECharts `ftypeChart`（340px）
- 控件：下拉 `ftypeSelect` 切换 离散型（二项分布 B(10,0.4)）/ 连续型（正态分布 N(0,1)）；【🔄 重置】
- 交互：离散型用 `step:'end'` 画阶梯 CDF，连续型画光滑 CDF；两种模式都画 $F=0$ 与 $F=1$ 两条水平虚线 markLine，标签写 `F(-∞)=0`、`F(+∞)=1`，直观呈现取值上下界

**应试提示**
分布函数四条性质，选择题高频；离散型的阶梯跳跃高度就是该点的概率。

### 卡片5：六大常用分布总结（纯表格，新增）
- 无 JS，`overflow-x-auto` 包裹的 HTML 表格，6行：0‑1 分布、二项、泊松、均匀、指数、正态
- 列：分布名称 / 记号 / 分布律或概率密度 / 分布函数 F(x)
- 所有单元格用 `.katex-render[data-expr]` 渲染，行 hover 高亮
- 下方 exam-tip 提示这张表是考前速记核心

**底部自测3道单选**（答案 B / C / C；反馈文本含 LaTeX，判分后需重渲染）

---

# chapter3｜二维随机变量及其分布
## 本章总述
> 核心：联合分布、边缘分布、条件分布；二维正态；随机变量独立性。
> 应试重点：会求边缘分布；独立判定；二维正态相关系数$\rho$含义。

### 卡片1：二维离散联合分布热力图
**知识点文本**
联合分布 $P(X=x_i,Y=y_j)$；对行求和得到 Y 边缘分布；对列求和得到 X 边缘分布。
> ⚠️误区：仅知道边缘分布，不能推出联合分布（除独立情形）。

**LaTeX公式**（折叠面板）
```latex
P(X=x_i)=\sum_j P(X=x_i,Y=y_j)
P(Y=y_j)=\sum_i P(X=x_i,Y=y_j)
P(Y=y_j|X=x_i)=\frac{P(X=x_i,Y=y_j)}{P(X=x_i)}
P(X=x_i,Y=y_j)=P(X=x_i)P(Y=y_j)\quad(\text{独立})
```

**可视化规格**
- 图表：ECharts heatmap（`jointHeatmap`，400px），4×3 固定联合概率矩阵（12个数，和为1），x 轴 `x₁~x₄`，y 轴 `y₁~y₃`
- `visualMap` 横向置底、可拖拽筛选，渐变 `#eff6ff → #2563eb`；每格显示概率数值，hover 有阴影强调
- 按钮：【📊 计算边缘分布】`calcMarginal()`、【🔄 重置】`resetJoint()`
- 交互：点击"计算边缘分布"后，**在热力图网格内直接追加一行 `P(X)` 与一列 `P(Y)`**，把行和、列和显示为新格子；重置恢复原始矩阵
- 移动端 `.heatmap-wrapper` 允许横向滚动（`#jointHeatmap` 最小宽度 500px）
- 数据固定不可调（本卡目的是演示求和方向，不是调参）

**应试提示**
大题经常考由联合求边缘：X 的边缘 = 沿 Y 方向求和（按列汇总），别记反。

### 卡片2：二维正态 3D曲面 & 等高线
**知识点文本**
二维连续联合密度，可用三维曲面表示；相关系数 $\rho$ 刻画线性关联。

**LaTeX公式**（折叠面板）
```latex
(X,Y)\sim N(\mu_1,\mu_2,\sigma_1^2,\sigma_2^2,\rho)
f(x,y)=\frac{1}{2\pi\sigma_1\sigma_2\sqrt{1-\rho^2}}\exp\{\cdots\}
```

**可视化规格**
- **本站唯一使用 Plotly 的卡片**：
  - `bivar3D`：`Plotly.newPlot` surface 曲面，colorscale `Blues`，在 z 轴投影等高线（`contours.z.show` + `usecolormap`），`displayModeBar:false`
  - `bivarContour`：2D contour 图，`contours.coloring:'heatmap'`，`ncontours:15`
  - 各380px，网格 50×50 采样于 $[-3,3]^2$
- 控件：三个滑块 + 数值读数，`oninput` 实时重绘
  - ρ `rhoSlider`（−0.95~0.95，step 0.05）
  - σ₁ `sigma1Slider`（0.5~2.5，step 0.1）
  - σ₂ `sigma2Slider`（0.5~2.5，step 0.1）
  - 【🔄 重置】ρ=0，σ₁=σ₂=1
- 交互：改变 ρ 观察曲面倾斜与等高线由圆变斜椭圆；ρ=0 时等高线为正圆（对应独立）；σ 改变胖瘦
- 注意：Plotly 实例不在 window resize 回调里重绘（与 ECharts 不同），侧边栏折叠后如需精确适配可手动刷新

**应试提示**
二维正态：$\rho=0 \iff X,Y$ 独立；一般分布只能推出"不线性相关"，不能推独立。

### 卡片3：二维概率积分区域
**知识点文本**
$P\{(X,Y)\in D\}$ 是联合密度在区域 $D$ 上的二重积分。

**可视化规格**
- 图表：ECharts `integralChart`（380px）——用带颜色的散点阵列近似等高线密度底图，叠加红色虚线矩形边框（`symbolSize:0` + lineStyle 的散点系列），再用第二次 `setOption` 追加 `markArea` 红色半透明矩形填充
- 控件：四个滑块 + 数值读数，定义矩形区域 $D=[x_{min},x_{max}]\times[y_{min},y_{max}]$
  - `xMinSlider`（−3~2）、`xMaxSlider`（−1~3）、`yMinSlider`（−3~2）、`yMaxSlider`（−1~3），默认 $[-1,1]^2$
  - 【🔄 重置】回到 $[-1,1]\times[-1,1]$
  - 说明：滑块之间不做交叉夹紧，允许出现 min>max（此时概率为0，可作为反例讨论）
- **数值积分（新增）**：对标准二维正态（ρ=0，σ₁=σ₂=1）做 80×80 中点法二重 Riemann 求和，实时输出 `integralProb`，形如 `P{(X,Y)∈D} ≈ 0.4661`
- 交互：拖动四个边界，红色区域与概率数值同步变化，直观建立"区域越大概率越大""积分限决定结果"的认知

**应试提示**
考试二重积分求概率，注意积分上下限与积分次序；先画区域图再定限，几乎不会错。

### 卡片4：二维独立判定演示
**知识点文本**
连续：$f(x,y)=f_X(x)f_Y(y)$；离散：$P(X=x_i,Y=y_j)=P(X=x_i)P(Y=y_j)$。

**可视化规格**
- 双图：ECharts `indepScatter`（联合散点，320px）+ `indepMarginal`（X、Y 边缘直方图叠放，320px）
- 控件：
  - 下拉 `indepSelect`：独立样本（ρ=0）/ 不独立样本（ρ=0.7）
  - 按钮【▶ 生成样本】（蓝色实心，每次点击**重新抽一组随机样本**）、【🔄 重置】（回到独立并重抽）
- 实现：`boxMuller()` 生成标准正态，`y = ρ·z₁ + √(1−ρ²)·z₂` 构造指定相关性的300个点
- 右图把 X、Y 各分30个 bin 做**密度归一化**（count/n/binW）柱状图，两色对照（`#2563eb` / `#93c5fd`）
- 交互：ρ=0 时散点呈圆形云、两条边缘几乎一致；ρ=0.7 时散点沿对角线拉伸，但边缘直方图形状几乎不变——**说明边缘相同、联合可以完全不同**

**应试提示**
独立要求"联合 = 边缘乘积"对所有取值都成立；不相关只是 $\rho=0$，比独立弱。

**底部自测3道单选**（答案均为 B；反馈为纯文本，无 LaTeX）

---

# chapter4｜随机变量的数字特征
## 本章总述
> 核心：期望、方差、协方差、相关系数；性质公式。
> 应试重点：期望方差性质；协方差；相关系数含义；$\rho=0$不代表独立。

### 卡片1：期望 — 概率重心
**知识点文本**
期望是加权平均，物理上相当于概率分布的重心，不一定是随机变量可以取到的值。

**LaTeX公式**（折叠面板）
```latex
E(X)=\sum x_i p_i \quad(离散)
E(X)=\int_{-\infty}^{+\infty} x f(x) dx \quad(连续)
E(aX+b)=aE(X)+b
E(X+Y)=E(X)+E(Y)
```

**可视化规格**
- 图表：ECharts 柱状图（`expChart`，340px），蓝色概率柱 + **红色虚线 markLine 标记期望重心**，tooltip 显示 `X=… P=…`
- 控件：
  - 下拉 `expDistSelect`：二项分布 B(n,p) / 泊松分布 P(λ) / **非对称离散分布**
  - **单滑块随分布改变语义（新增）**：`expParamSlider` 在切换分布时由 JS 重写 label / min / max / step / 默认值
    · 二项 → `p =`，0.1~0.9
    · 泊松 → `λ =`，0.5~10
    · 非对称 → `偏度 =`，0~1（在左偏与右偏两组概率向量之间插值）
  - 数值读数 `expParamVal`（2位小数）、【🔄 重置】按当前分布恢复默认参数
- 实时读数：`expVal` 显示 $E(X)$；图下方注明"红色竖线标记期望位置"
- 实现细节：类目轴上用 `getMarkLineIndex()` 把连续的期望值换算成小数索引，让重心线能落在两根柱子之间

**应试提示**
期望线性性质永远成立，不要求独立；$E(X)$ 常常不是 X 的可能取值（如掷骰子 3.5）。

### 卡片2：方差 — 离散程度
**知识点文本**
方差衡量随机变量取值波动大小。

**LaTeX公式**（折叠面板）
```latex
D(X)=E\left[(X-E(X))^2\right]=E(X^2)-[E(X)]^2
D(aX+b)=a^2D(X)
D(X\pm Y)=D(X)+D(Y)\quad(X,Y\ \text{独立})
```

**可视化规格**
- 图表：ECharts 折线 + 渐变填充的正态曲线（`varChart`，340px），μ±4σ 区间上采样200点
- 标注：μ 处红色虚线 markLine；**μ±σ 两侧各画一条琥珀色虚线竖带**（`silent` 系列，不进 tooltip），直观呈现"一个标准差"的宽度
- 控件：μ `varMuSlider`（−3~3，step 0.1）、σ `varSigmaSlider`（0.3~3，step 0.1）+ 数值读数；【🔄 重置】（μ=0，σ=1）
- 实时读数：`varVal` = $D(X)=\sigma^2$、`stdVal` = $\sigma$
- 交互：固定 μ 调 σ，观察曲线由高瘦变矮胖，但曲线下总面积恒为1

**应试提示**
$D(aX+b)$ 的系数是 $a^2$，很多学生写成 $a$，高频错误；常数 b 不影响方差。

### 卡片3：协方差与相关系数 — 散点模拟
**知识点文本**
协方差衡量 X、Y 协同变化；相关系数 $\rho\in[-1,1]$ 只刻画**线性**相关。
> ⚠️ $\rho=0$：不线性相关，**不代表相互独立**。

**LaTeX公式**（折叠面板）
```latex
Cov(X,Y)=E[(X-EX)(Y-EY)]=E(XY)-E(X)E(Y)
\rho_{XY}=\frac{Cov(X,Y)}{\sqrt{D(X)}\sqrt{D(Y)}}
D(X+Y)=D(X)+D(Y)+2Cov(X,Y)
```

**可视化规格（双图并排对照，新增）**
- 左图 `corrLinearChart`（蓝色，"线性相关样本"）：Box–Muller 生成指定 ρ 的相关正态样本
- 右图 `corrNonLinearChart`（红色，"非线性相关（ρ≈0 但不独立）"）：$Y=0.5X^2+\text{噪声}$ 抛物线样本
- 两图各340px，`tooltip.trigger:'item'`
- 控件：
  - ρ 滑块 `corrRhoSlider`（−0.95~0.95，step 0.05，默认0.7）+ 数值读数
  - 样本量下拉 `corrNSlider`（100 / 300 / 500，默认300）※ id 沿用了 Slider 命名但实际是 select
  - 按钮【▶ 生成样本】（重抽随机样本）、【🔄 重置】（ρ=0.7，N=300）
- 实时读数：`corrCov`、`corrRho` 给出样本协方差与样本相关系数（3位小数）
- 教学落点：右图 $\rho$ 算出来接近0，但散点明显呈抛物线——**同一张卡片里同时看到"相关系数为0"与"显然不独立"**

**应试提示**
填空选择题高频考点：独立 ⇒ 不相关，反之不成立（二维正态是唯一等价的常见例外）。

### 卡片4：六大常用分布性质表（纯表格，新增）
- 无 JS 交互，HTML `<table>`「期望与方差对照表」
- 列：属性 \ 分布 | 0‑1分布 | 二项分布 | 泊松分布 | 均匀分布 | 指数分布 | 正态分布
- 行：分布记号 / $E(X)$ / $D(X)$；全部单元格用 `.katex-render[data-expr]` 渲染，行 hover 高亮
- 附带折叠面板「📐 记忆技巧与补充说明」（5条记忆口诀，文字与行内公式混排）
- exam-tip 重点标出：泊松 $E=D=\lambda$；指数 $D(X)=[E(X)]^2=1/\lambda^2$

**底部自测3道单选**（答案 B / C / C）

---

# chapter5｜大数定律及中心极限定理
## 本章总述
> 切比雪夫不等式：用期望与方差给出概率的上/下界，是大数定律的证明工具；
> 大数定律：样本均值收敛于理论期望；
> 中心极限定理CLT：大量独立同分布样本均值近似服从正态分布，**原始总体不需要正态**。
> 应试重点：切比雪夫不等式估界、中心极限定理大题。
> 卡片顺序：切比雪夫不等式 → 大数定律 → 掷骰子实验 → 中心极限定理。

### 卡片0：切比雪夫不等式（新增，本章第一张卡）
**知识点文本**
只要知道期望与方差，就能给出"偏离期望超过 ε"的概率上界，与具体分布无关——代价是这个界通常很松。

**LaTeX公式（实时重写，面板默认展开）**
```latex
P\{|X-\mu|\ge \varepsilon\}\le \frac{\sigma^2}{\varepsilon^2}
P\{|X-\mu|< \varepsilon\}\ge 1-\frac{\sigma^2}{\varepsilon^2}
```
> 与其他卡片不同：这个公式面板 **默认 `.open`/`.show` 展开**，且 `chebDynamicFormula` 的 LaTeX 每次滑块变动都用当前 σ、ε 与百分比重新拼装（含彩色数值），属于"活公式"。

**可视化规格**
- 图表：ECharts `chebyshevChart`（400px）
  - 蓝色正态密度曲线
  - 半透明**蓝色区域** = $|X-\mu|<\varepsilon$ 的内部，**红色区域** = 两侧尾部
  - μ−ε 与 μ+ε 处红色虚线 markLine，label 显示当前数值；μ 处灰色实线
  - 4个 `graphic` 文字浮层：实际内部/外部概率百分比（彩色），以及切比雪夫给出的 ≤ / ≥ 界（大号数字）
- 控件：
  - σ 滑块 `chebSigmaSlider`（0.3~3，step 0.1，默认1）+ **只读数值框** `chebSigmaValue`
  - ε 滑块 `chebEpsilonSlider`（0.3~6，step 0.1，默认2）+ **只读数值框** `chebEpsilonValue`
  - **预设按钮组（新增）** `.cheb-preset[data-multiple=2|3|5]`：一键把 ε 设为 2σ / 3σ / 5σ（上限夹到6）
  - 【🔄 重置】`chebResetButton`（σ=1，ε=2）
- 计算：切比雪夫界 $\sigma^2/\varepsilon^2$（夹紧到 ≤1）；真实概率用有理逼近的标准正态 CDF `normalCDFStandard`
- 读数：`chebUpperExplanation`（$P\ge\varepsilon$ 的上界）、`chebLowerExplanation`（$P<\varepsilon$ 的下界）
- 教学落点：切到 ε=3σ 时切比雪夫说"至少88.9%"，正态真实值是99.7%——**看见"界很松但永远成立"**

**应试提示**
切比雪夫不等式对任意分布成立，所以结论必然保守；题目问"至少多少概率"时用它，问"精确概率"时不能用。

### 卡片1：大数定律模拟
**知识点文本**
n 增大，样本算术平均值趋近总体数学期望。

**可视化规格**
- 图表：ECharts 折线（`llnChart`，340px）——X 为样本量 n，Y 为累计样本均值；红色水平虚线 markLine 标理论期望
- 控件：
  - 下拉 `llnDistSelect`：均匀分布 U(0,1) / 指数分布 E(1) / 二项分布 B(1,0.5)（切换即重置）
  - 滑块 `llnSlider`（n：10~5000，step 10，默认1000）+ 数值读数
  - 【▶ 开始模拟】`runLLN()`、【🔄 重置】`resetLLN()`（读数回到"—"）
- 实时读数：`llnMean`（本次样本均值）、`llnTheory`（理论期望）
- 实现：累计均值序列降采样到约300个绘图点；页面加载自动跑一次
- 交互：小 n 段剧烈抖动，大 n 段贴住红线不再离开

### 卡片2：掷骰子验证中心极限定理（动画模拟，新增）
**知识点文本**
每次掷 n 颗骰子求点数和，$E(S_n)=3.5n$，$Var(S_n)=\frac{35}{12}n$；重复几万次后，点数和的分布从"平顶"变成钟形。

**可视化规格**
- 图表：**原生 Canvas 2D**（`diceCanvas`，包在 `.dice-canvas-wrap` 里保持 16:9），本站唯一的**逐帧动画**图表
  - 手绘坐标轴、按 bin 绘制柱列（`hsla` 色相渐变填充）、x 轴刻度标签
  - 粉色虚线标"理论均值 3.5n"，并实时显示实际均值
  - 按 `devicePixelRatio` 缩放（`resizeDiceCanvas`），高分屏不模糊
- 控件：
  - 骰子数 n 滑块 `diceNumSlider`（1~10，默认3）+ 数值读数
  - 总投掷次数 `diceTotalInput`（number，默认50000，100~2000000，step 1000）
  - 每帧投掷次数 `diceBatchInput`（number，默认500，1~50000，step 100）
  - **动画速度滑块** `diceSpeedSlider`（1~100，默认50）→ 帧间延时 `max(1, 51-speed)` ms
  - 按钮【▶ 开始模拟】`diceRunBtn`、【⏹ 停止】`diceStopBtn`（仅运行时显示）、【🔄 重置】
- **进度条** `diceProgress`：蓝色渐变，宽度 = 已投掷/总数
- **4个统计块**：`diceStatRolls` 投掷次数、`diceStatTheory` 理论均值（3.5n）、`diceStatActual` 实际均值、`diceStatN` 骰子数 n
- 运行控制：`diceRunning` 标志防重复启动，`diceStopFlag` 支持中途停止；未开始时画布显示占位提示"点击「开始模拟」掷骰子"
- 交互：n=1 时是均匀的平顶分布，n=3 已明显中间高，n≥6 几乎是标准钟形——**动画过程本身就是"大量重复试验"的具象化**

### 卡片3：中心极限定理【王牌可视化】
**知识点文本**
无论原来总体是什么分布，独立同分布、n 足够大，样本均值近似正态。

**LaTeX公式**（折叠面板）
```latex
\frac{\overline X -\mu}{\sigma/\sqrt{n}} \stackrel{近似}{\sim} N(0,1)
\sum_{i=1}^{n}X_i \stackrel{近似}{\sim} N(n\mu,\; n\sigma^2)
\frac{B(n,p)-np}{\sqrt{np(1-p)}}\stackrel{近似}{\sim}N(0,1)\quad(\text{棣莫弗-拉普拉斯})
```

**可视化规格**
- 图表：ECharts `cltChart`（380px）——蓝色**样本均值直方图**（32个密度 bin）+ 红色**理论正态曲线** $N(\mu,\sigma^2/n)$ 叠加，legend 置底，`animationDuration:260`
- 控件：
  - 下拉 `cltDistSelect`：均匀 U(0,1) / 指数 E(1) / 二项 B(1,0.3)（切换即重跑）
  - 样本容量 n 滑块 `cltNSlider`（1~50，默认5）+ 数值读数（改动即重跑）
  - 模拟次数滑块 `cltSimSlider`（200~5000，step 100，默认1000）+ 数值读数（改动即重跑）
  - 【🔄 重置】
- 实现：按分布取理论 μ、σ²（指数分布做 `Number.EPSILON` 保护），x 轴定义域按总体支撑集裁剪；页面加载自动跑一次
- 交互：n=1 时直方图就是原总体形状（指数分布明显右偏）；n 增大直方图逐步贴合红色钟形曲线

**应试提示**
期末考试大题高频；记住：是**样本均值/和**趋近正态，不是原始数据；用 CLT 前先算清 μ 与 $\sigma^2/n$。

**底部自测3道单选**（答案 B / C / C；q3 反馈含行内 LaTeX，需重渲染）

---

# chapter6｜样本及抽样分布
## 本章总述
> 样本、统计量；样本均值、样本方差；三大抽样分布$\chi^2、t、F$；分位数。
> 应试重点：三大分布形态、自由度；上 $\alpha$ 分位数含义。

### 卡片1：样本生成器 — 总体 vs 样本
**知识点文本**
总体参数是常数；样本统计量是随机变量，每抽一次都会变。

**可视化规格**
- 图表：ECharts 直方图（`sampleChart`，320px），bin 数自适应为 $3.5\sqrt n$；红色虚线 markLine 标本次样本均值，label 写 `x̄=数值`
- 控件：
  - 下拉 `sampleDistSelect`：正态分布 N(0,1) / 均匀分布 U(0,1) / 指数分布 E(1)
  - 滑块 `sampleNSlider`（n：5~200，step 5，默认30）+ 数值读数 `sampleNVal`
  - 【🔄 重置】`resetSampling()`（回到正态、n=30）
- **4个统计块对照**：`sampleMean` 样本均值 $\bar X$、`sampleVar` 样本方差 $S^2$、`samplePopMean` 总体 $E(X)$、`samplePopVar` 总体 $D(X)$
- 实现：正态用 Box–Muller
- 交互：反复重抽，$\bar X$、$S^2$ 每次都不同但围绕总体值波动；n 越大波动越小

**应试提示**
样本方差分母是 $n-1$（为了无偏），不是 $n$；总体参数不带随机性，统计量才带。

### 卡片2：三大抽样分布交互式曲线
**知识点文本**
$\chi^2(n)$、$t(n)$、$F(n_1,n_2)$；自由度改变分布形态。

**LaTeX公式**（折叠面板）
```latex
\chi^2(n)=\sum_{i=1}^{n}X_i^2,\quad X_i\sim N(0,1)
t(n)=\frac{X}{\sqrt{Y/n}},\quad X\sim N(0,1),\ Y\sim\chi^2(n)
F(n_1,n_2)=\frac{U/n_1}{V/n_2},\quad U\sim\chi^2(n_1),\ V\sim\chi^2(n_2)
```

**可视化规格**
- 图表：ECharts 折线（`sampDistChart`，380px）——蓝色渐变填充的密度曲线 + **红色半透明上侧尾部阴影** + 红色虚线竖直分位数线（带数值 label）
- 控件：
  - 下拉 `sampDistSelect`：χ² / t / F
  - 自由度滑块1 `sampDf1Slider`（1~30，默认5）+ 读数；**label `sampDf1Label` 在选 F 时由「自由度 n =」改为「n₁ =」**
  - 自由度滑块2 `sampDf2Slider`（1~30，默认10）+ 读数；**整组 `sampDf2Group` 仅在选 F 时显示**
  - α 滑块 `sampAlphaSlider`（0.01~0.20，step 0.01，默认0.05）+ 读数
  - 【🔄 重置】
- **分位数计算（查表的可视化替代）**：对密度做数值积分反解**上 α 分位数**，把从分位点到 xMax 的尾部涂红，并在读数区显示 `上α分位数 ≈ 数值`
- 数学实现：`chisqPDF`、`tPDF`、`fPDF`，配 Stirling 近似的 `logGamma`；t 用闭式
- 交互：
  1. χ²：自由度增大，右偏减弱逐渐趋向正态
  2. t：自由度越小尾部越厚，大自由度逼近标准正态
  3. F：恒右偏，两个自由度分别影响峰位与尾长

**应试提示**
上 α 分位数就是考试查表要查的那个临界值，是后续参数估计、假设检验的基础；注意 t 分布的对称性可省一半查表。

### 卡片3：样本均值抽样分布模拟
**知识点文本**
固定 n 反复抽样，把每组的 $\bar X$ 收集起来画直方图，得到的就是"抽样分布"。

**可视化规格**
- 图表：ECharts（`repChart`，340px）——样本均值的密度直方图 + 红色理论正态曲线 $N(0,\;1/30)$ 叠加，legend 置底
- 控件：模拟组数滑块 `repSimSlider`（200~5000，step 100，默认1000）+ 读数；【🔄 重置】
- 实现：每组抽 n=30 个标准正态样本，取均值入桶；页面加载自动跑一次
- 交互：组数越多直方图越平滑、越贴合红色理论曲线；直方图宽度明显比总体窄（方差缩小为 $\sigma^2/n$）

**底部自测3道单选**（答案 C / B / B）

---

# chapter7｜参数估计
## 本章总述
> 点估计（矩估计、极大似然估计）；无偏性；区间估计、置信区间。
> 应试重点：置信区间含义；正态总体区间估计。

### 卡片1：点估计模拟 — 有偏与无偏
**知识点文本**
点估计：用样本算出一个数值作为总体参数估计；无偏：估计量的期望等于真实参数。

**LaTeX公式**（折叠面板）
```latex
E(\hat\theta)=\theta \quad(\text{无偏性})
E(\overline X)=\mu,\qquad E(S^2)=\sigma^2
\hat\theta_{MLE}=\arg\max_{\theta} L(\theta)
```

**可视化规格**
- 图表：ECharts 散点（`pointEstChart`，340px）——横轴为试验序号，纵轴为该组样本给出的估计值；**红色水平实线 markLine 标真值 μ=0**
- 控件：
  - 下拉 `peEstSelect`：无偏估计（样本均值）/ 有偏估计（取第一个样本值）
  - 模拟组数滑块 `peSimSlider`（20~200，step 10，默认50）——**只更新标签 `peSimVal`，不自动重绘**
  - 【▶ 重新生成】`runPointEst()`（蓝色实心，按当前设置重抽）、【🔄 重置】
- 读数行：`真实参数 μ = 0（红色竖线） | 估计值均值 = peMean`
- 实现：每组抽 n=20 个 N(0,1) 样本；"有偏估计"故意只取第一个样本值，方差极大但其实仍无偏——若要演示真正偏移可换成除以 n 的方差估计
- 交互：无偏估计的散点紧密围绕红线且均值贴近0；有偏/低效估计散点散得很开

**应试提示**
无偏是"估计量的期望等于真值"，不是"每一次估计都等于真值"；MLE 的方差估计除以 n，是有偏的。

### 卡片2：置信区间模拟（教学神器）
**知识点文本**
95% 置信区间含义：大量重复抽样构造区间，大约95%的区间包含真实总体参数。
> ⚠️**关键误区**（红色高亮框）：不是"参数以95%的概率落在某一个已经算出来的固定区间里"。参数是常数，随机的是区间。

**可视化规格**
- 图表：ECharts（`ciChart`，420px）——每组样本画一条**水平线段**代表其置信区间，线段中点加小散点标记；**蓝色 = 覆盖真值，红色 = 未覆盖**；一条贯穿全图高度的红色竖线标 μ=0（`z:10` 压在最上层）；tooltip 指明是第几号区间
- 控件：
  - 下拉 `ciLevelSelect`：90% / 95%（默认）/ 99%
  - 模拟组数滑块 `ciSimSlider`（10~100，step 5，默认30）——**只更新标签，不自动重绘**
  - 【▶ 重新生成】`runCI()`、【🔄 重置】
- **覆盖率读数（教学核心）**：`ciCoverage` 显示 `覆盖率: XX.X% (覆盖数/总数)`，与名义置信水平对比
- 实现：每组抽 n=30 正态样本，用近似 t 分位数函数 `tQuantile(alpha, df)`（分段 z 值 + Cornish‑Fisher 修正）构造区间
- 交互：置信水平越高线段越长、红色越少；30组里通常恰好有1~2条红线——**"95%"是长期频率，不是单个区间的性质**

**应试提示**
置信区间概念选择题高频坑：先问"随机的是谁"，答案永远是区间不是参数。

### 卡片3：正态总体区间估计对比（Z 区间 vs t 区间）
**知识点文本**
σ 已知用 Z 分位数，σ 未知用样本标准差 + t 分位数；后者因为多估了一个参数，区间更宽。

**可视化规格**
- 图表：ECharts **横向堆叠柱**（`ztChart`，320px）——两行（Z区间 / t区间），每行用"透明占位柱 + 彩色宽度柱"表示区间的位置与长度（Z 用 `#2563eb`，t 用 `#93c5fd`），共享 μ 轴，legend 置底
- 控件：
  - 样本量 n 滑块 `ztNSlider`（5~100，step 1，默认15）+ 读数
  - 置信水平下拉 `ztLevelSelect`：90% / 95%（默认）/ 99%
  - 【🔄 重置】
- 计算：Z 临界值查内置表 {1.645, 1.96, 2.576}；t 临界值用 Cornish‑Fisher 近似 $z\left(1+\frac{z^2+1}{4(n-1)}\right)$；固定样本均值 0.5，$SE=0.6/\sqrt n$
- 读数：`ztZInterval`、`ztTInterval` 分别给出两个区间的数值端点
- 交互：n 很小时 t 区间明显更宽；n 增大到几十以后两条几乎重合——直观说明"大样本下 t 趋近 Z"

**应试提示**
σ 已知 → Z，σ 未知 → t，且 t 区间更宽；自由度是 $n-1$，别写成 n。

**底部自测3道单选**（答案均为 B）

---

# chapter8｜假设检验
## 本章总述
> 原假设$H_0$，备择假设$H_1$；显著性水平$\alpha$；拒绝域；p‑value；两类错误。
> 应试重点：拒绝域、p值与 $\alpha$ 比较；一类错误二类错误；单侧双侧检验。

### 卡片1：拒绝域可视化
**知识点文本**
给定显著性水平 $\alpha$，分布尾部为拒绝域；统计量落入拒绝域，则拒绝原假设。

**LaTeX公式**（折叠面板）
```latex
W=\{|T|>z_{\alpha/2}\}\quad(\text{双侧})
p=P\{|T|>|t_0|\ \big|\ H_0\}
p<\alpha \Rightarrow \text{拒绝}\ H_0
```

**可视化规格**
- 图表：ECharts 折线（`rejectionChart`，340px）——标准正态 $N(0,1)$ 密度曲线（蓝色渐变填充）+ **红色尾部阴影拒绝域** + 红色虚线临界值竖线；观测统计量位置画一个**菱形散点标记**，落入拒绝域时为红色 `#ef4444`，否则为绿色 `#16a34a`
- 控件：
  - 下拉 `rejTypeSelect`：双侧检验 / 左侧检验 / 右侧检验
  - α 滑块 `rejAlphaSlider`（0.01~0.15，step 0.01，默认0.05）+ 读数
  - 观测统计量滑块 `rejStatSlider`（−3~3，step 0.05，默认1.5）+ 读数
  - 【🔄 重置】
- 临界值：用数值反解 `normalCDF`（Abramowitz‑Stegun 型近似）求得，按检验方向决定涂单尾还是双尾
- **结论徽标**：`rejConclusion` 胶囊实时切换——红底 `✕ 拒绝 H₀（统计量落入拒绝域）` / 绿底 `✓ 不拒绝 H₀（统计量未落入拒绝域）`

### 卡片2：P‑value 可视化
**知识点文本**
p 值：原假设成立时，观测到当前以及更极端样本的概率；若 $p<\alpha$ 拒绝 $H_0$。

**可视化规格**
- 图表：ECharts 折线（`pvalueChart`，340px）——$N(0,1)$ 曲线 + **琥珀色双尾阴影** `rgba(245,158,11,0.4)`（从 $\pm|z|$ 向两端），并在 $\pm z$ 处放两个琥珀色菱形标记
- 本卡**只涂 p 值区域、不涂 α 拒绝域**，与卡片1形成对照：一个看"临界值划界"，一个看"观测值有多极端"
- 控件：α 滑块 `pvAlphaSlider`（0.01~0.15，step 0.01）+ 读数、观测 |z| 滑块 `pvZSlider`（0~3，step 0.05，默认1.8）+ 读数、【🔄 重置】
- 计算与读数：双侧 $p=2(1-\Phi(z))$，`pvResult` 显示 p 值、`pvAlphaDisp` 显示 α，`pvDecision` 用红/绿文字给出 `拒绝 H₀` / `不拒绝 H₀`

**应试提示**
p 值不是"$H_0$ 成立的概率"，而是"假设 $H_0$ 成立时看到这么极端数据的概率"。

### 卡片3：两类错误模拟
**知识点文本**
第一类错误（弃真）：$H_0$ 为真却拒绝 $H_0$，概率为 $\alpha$。
第二类错误（取伪）：$H_1$ 为真却接受 $H_0$，概率为 $\beta$。
> 固定样本量时，二者不能同时减小。

**可视化规格**
- 图表：ECharts（`errorsChart`，340px）——**两条分布曲线叠放**：蓝色 $H_0: N(0,1)$ 与红色 $H_1: N(\mu_1,1)$
  - 临界值右侧的蓝色阴影 = α（$H_0$ 下的弃真概率）
  - 临界值左侧的红色阴影 = β（$H_1$ 下的取伪概率）
  - 黑色虚线临界值竖线，label 写「临界值」；legend 置底
- 控件：α 滑块 `errAlphaSlider`（0.01~0.20，step 0.01，默认0.05）+ 读数、真实 μ₁ 滑块 `errMuSlider`（0.2~2，step 0.1，默认0.8）+ 读数、【🔄 重置】
- 计算：右侧单侧检验 $H_0:\mu=0$ vs $H_1:\mu=\mu_1$；临界值由 `normalCDF` 反解，$\beta=\Phi(z_{crit}-\mu_1)$
- **两个统计块**：红色 `errType1` = α%（弃真）、橙色 `errType2` = β%（取伪）
- 交互：调小 α → 临界值右移 → 蓝色阴影缩小但红色阴影变大；把 μ₁ 拉远 → 两分布分离 → β 自然变小（相当于效应量变大）

**应试提示**
α↑ 则 β↓，反之亦然；想同时降低两者只能加大样本量。口诀：一类错误"冤枉好人"，二类错误"放过坏人"。

### 卡片4：单侧检验 vs 双侧检验对比（左右并排，新增）
**可视化规格**
- **两个 ECharts 实例并排**（2列网格，各300px）：
  - 左 `sideTwoChart`：双侧检验，两侧各涂 α/2，标题注 `双侧检验：H₁: μ≠μ₀`
  - 右 `sideRightChart`：右侧检验，单尾涂满 α，标题注 `右侧检验：H₁: μ>μ₀`
- 控件：共用一个 α 滑块 `sideAlphaSlider`（0.01~0.15，step 0.01，默认0.05）+ 读数、【🔄 重置】
- 交互：同一个 α 下，双侧的临界值比单侧更远——直观看出**单侧检验更容易拒绝 $H_0$**

**应试提示**
单侧检验临界值更靠内，更容易拒绝；但方向必须在看数据之前根据题意确定，不能事后挑对自己有利的方向。

**底部自测3道单选**（答案均为 B）

---

# 【新增页面】mindmap_markmap.html｜全书思维导图

## 页面定位
把八章知识点组织成一张可折叠的树，用于**总复习与查漏**：先看结构，再决定回哪一章看细节。侧边栏归入「学习工具」分组。

## 数据源分离
- 内容写在同目录的 `概率论思维导图.md`（标准 Markdown 多级标题 + 列表，支持 `$...$` 公式）
- 页面用 `fetch('./概率论思维导图.md')` 读取后交给 markmap 渲染
- **改内容只改 .md，不动 HTML**
- ⚠️ 因为用了 fetch，本页需要通过 HTTP 打开（Live Server / GitHub Pages）；直接双击 `file://` 会被浏览器 CORS 拦截，此时页面在容器底部插入红色 `.error` 提示框说明失败原因

## 技术选型
- `markmap-lib`（Markdown → 树）+ `markmap-view`（SVG 渲染）+ `d3.v7`
- 这三个库**本地引入**（`js/` 目录下），因为 markmap 的 CDN 不稳定；KaTeX 仍走 CDN，用于渲染节点里的公式
- 布局：沿用 `css/sidebar.css`，`.main-content { margin-left:256px }`，容器高 95vh 占满一屏

## 交互规格
- **顶部按钮组**（`[data-expand-level]`，绝对定位在容器右上角）：
  【全部收起】level 0 ｜【全部展开】level −1 ｜【展开到 1 级】｜【展开到 2 级】｜【展开到 3 级】
  实现：`mindmap.setData(getRoot(), { initialExpandLevel: level })` 后 `fit()`
- **左键点击节点**：只展开/收起该节点自身（`toggleRecursively: false`），不影响后代
- **右键菜单**（`#mindmap-context-menu`，`role="menu"`）：
  【展开所有子主题】/【折叠所有子主题】——递归设置该节点及全部后代的 `payload.fold`，再 `renderData()`
  关闭方式：点击菜单外任意处、按 Esc
- **自动适配视口**：包装 `mindmap.toggleNode`，在其后用双层 `requestAnimationFrame` 延迟调用 `fit()`——因为 markmap 内部的点击路径不会自动 fit，逐级展开时容易把内容顶出视口
- **KaTeX 字体异步加载补偿**：`await document.fonts.ready` 后重新 `setData()` + `fit()`。首次测量若发生在字体加载完成前，长公式的 `foreignObject` 宽度会偏小，字体到位后公式尾部被裁掉
- 初始展开层级 1，`autoFit:false`（改由上述逻辑控制）
- 节点分层样式：depth 0 深色 22px 粗体；depth 1 蓝色 `#2b6cb0` 17px 半粗；其余 `#2d3748` 14px

## 失败降级
`fetch` 失败、markmap 未加载、md 解析异常，统统 `catch` 后在容器内追加 `.error` 红框显示 `error.message`，不留白屏。

---

# 【新增页面】bayes_replacer.html｜贝叶斯和全概率公式事件替换器

## 页面定位
chapter1 卡片3 的**通用化扩展工具**。把疾病检测案例里写死的"患病/阳性"抽象成任意两个事件 A、B，让学生把公式套到自己关心的场景上，体会"贝叶斯不是医学公式，是通用推断规则"。

## 入口
1. chapter1 卡片3（`#bayes-card`）标题行的【🔀 事件替换器】按钮
2. 侧边栏「学习工具」分组
3. 本页顶部有**返回按钮**，链回 `chapter1.html#bayes-card`（配合 `scroll-mt-6` 精确定位到那张卡）

## 核心机制：事件名占位替换
```
- 4个文本输入框：eventA / eventNotA / eventB / eventNotB
- 页面所有需要显示事件名的位置，写成占位 span：
  <span class="ev-A"></span> / .ev-notA / .ev-B / .ev-notB
- refreshEventSpans() 用 querySelectorAll 批量写入 textContent
- 输入框 oninput 即触发全量刷新：标签、滑块说明、图例、结论文案、LaTeX 公式同步更新
- 空输入回退为 'A' / '¬A' / 'B' / '¬B'，不会出现空白标签
```

## 预设场景按钮（一键载入事件名 + 三个概率）
| 按钮 | A | ¬A | B | ¬B | P(A) | P(B\|A) | P(B\|¬A) |
|---|---|---|---|---|---|---|---|
| 💉 疾病检测 | 患病 | 健康 | 阳性 | 阴性 | 0.01 | 0.95 | 0.05 |
| 📧 垃圾邮件 | 是垃圾邮件 | 正常邮件 | 被标记 | 未标记 | 0.02 | 0.90 | 0.03 |
| 💳 信用卡欺诈 | 是欺诈 | 正常交易 | 触发警报 | 未触发 | 0.005 | 0.92 | 0.04 |
| 🌧️ 下雨预测 | 明天下雨 | 不下雨 | 今天阴天 | 今天晴朗 | 0.05 | 0.80 | 0.20 |

## 可视化与控件
- 图表：**原生 Canvas 2D**（`bayesCanvas`，560×220）与 chapter1 同款马赛克面积图，但四块的图例文字随事件名变化（仍标注 TP / FN / FP / TN 术语对照）
- 三组【滑块 + 数值输入框】双向联动，范围统一放宽到 0.001~1（比 chapter1 宽，方便试极端情形）：
  `priorSlider`/`priorNum`、`tprSlider`/`tprNum`、`fprSlider`/`fprNum`
- 【🔄 重置】只重置三个概率数值，**保留当前事件名**
- 读数：`posteriorVal` 大号显示 $P(A|B)$ 百分比

## 动态公式与结论
- `renderBayesFormula()`：把事件名塞进 `\text{}` 重建贝叶斯公式的 LaTeX，所以公式里显示的是"P(患病|阳性)"而不是抽象的 P(A|B)
- `renderBayesCalc()`：多行 LaTeX 展示「设 A/¬A/B → 列已知 → 加粗公式 → 代入数值 → 分数化简 → 百分比」
- `updateConclusion()`：改写核心结论框文案——"观察到 {B}，实际发生 {A} 的概率只有 X%"，并指出误区根源是忽略先验（大量 {¬A} 产生的"假 {B}"拉高了 {B} 的总数）
- 事件名可能含特殊字符，KaTeX 统一 `throwOnError:false`，渲染失败降级为原始文本

## 页面结构
返回按钮 → 「工具」徽标 + 标题 + 说明 → 事件名输入区（靛蓝底卡片）→ 🎯情境引入 → 📘概念讲解 → 📖知识点 → 📐核心公式折叠面板 → 🎛️可视化 → 🧮计算过程折叠面板 → 📌核心结论 → 💡应试提示

## 复用约定
本页不含自测题（它是工具而非章节），但完全沿用 `.card` / `.formula-panel` / `.exam-tip` / `.slider-input` / `.num-input` 视觉体系与侧边栏，视觉上与章节页一致。

---

# 【新增】全站 AI 助教｜右侧可折叠抽屉（Coze 智能体）

## 功能定位
全站统一的 AI 答疑入口：右下角悬浮按钮 → 右侧滑出抽屉 → 内嵌 Coze 智能体对话。学生可随时追问知识点、题目与公式（如「贝叶斯和全概率公式的关系，有什么区别？」），回答支持 LaTeX 公式渲染。适用于任意页面（首页 / 章节页 / 工具页），不打断当前阅读。

## 接入方式
- 公共文件：`css/coze-widget.css`（抽屉 / 遮罩 / 悬浮按钮样式）、`js/coze-widget.js`（注入 DOM → 动态加载 SDK → 读取 token → 初始化）
- 每个页面只需两行：head 里 `<link rel="stylesheet" href="css/coze-widget.css">`，body 末尾 `<script src="js/coze-widget.js"></script>`
- **已接入**：index.html、chapter1~8.html、appendix.html、bayes_replacer.html、mindmap_markmap.html

## 可配置项（`window.CozeWidgetConfig`，写在脚本之前即可覆盖默认值）
| 字段 | 默认值 | 说明 |
|---|---|---|
| projectId | 7687082916731486217 | Coze 项目 ID |
| title / subtitle | 🤖 概率论 AI 助教 / 随时追问知识点、题目与公式 | 抽屉标题与副标题 |
| icon | logo.png | 悬浮按钮图标 |
| envPath / envKey | .env / COZE_TOKEN | token 所在文件与键名 |
| token | 空 | 直接指定 token（优先级最高） |
| sdkSrc | lf-cdn.coze.cn 的 coze web-sdk UMD 地址 | Coze Web SDK 地址 |
| width / disabled | 400 / false | 抽屉宽度（px）、临时禁用开关 |

## token 来源与运行约束
- 优先级：`config.token` → `window.COZE_TOKEN` → `.env[envKey]` → 构建时注入的 `js/env.js`
- 本地在 `.env` 写 `COZE_TOKEN=pat_xxx`，脚本用 `fetch(envPath)` 读取（`cache: "no-store"`）
- ⚠️ **浏览器在 `file://` 下无法 fetch 本地文件**，因此含 AI 助教的页面必须通过 HTTP 打开（本地静态服务器或 GitHub Pages）；部署环境没有 `.env` 时，可改为构建时生成 `js/env.js`（内容形如 `window.COZE_TOKEN = "pat_xxx";`）
- 鉴权失败（401）/ 令牌过期 / 网络异常时，页面右下角弹出诊断面板（解析 JWT 给出 token 类型与 `connector_id`，附自检清单）；SDK 就绪后自动移除
- `.env` 里是访问令牌，**不要提交到公开仓库**：应加入 `.gitignore`，仓库内只保留占位符

## 效果
![AI 助教](images/fig6_agent.png)

---

# AI 生成提示词使用守则（写在spec末尾）
1. ❌ 禁止一次性把全部8个章节丢给 AI，代码过长，bug 爆炸。
2. ✅ 生成顺序：
   1）先落地公共文件：`css/sidebar.css`、`js/sidebar.js`、`js/katex-setup.js`。这三个是所有页面的地基，必须先跑通。
   2）复制【全局UI&技术规范】+【首页index.html规格】→ 生成 index.html，本地 Live Server 跑通，确认侧边导航与高亮正常。
   3）依次生成 chapter1 ~ chapter8：每次复制【全局UI&技术规范】+【侧边导航栏固定内容】+**单章完整规格**，生成单页面。
   4）最后生成两个工具页：`mindmap_markmap.html`（连带 `概率论思维导图.md`）与 `bayes_replacer.html`。
   5）每生成一页，本地调试：滑块、数值输入框、按钮、图表、折叠面板、公式、自测题全部点一遍，修复 bug 再继续下一页。
3. 新增页面时的收尾动作（容易漏）：
   - 在 `js/sidebar.js` 的导航列表里加一项（导航是单一数据源，不要在页面里写死 `<a>`）
   - 如果是章节页，在 `index.html` 的章节卡片区补一张卡
   - 检查 `window.addEventListener('resize', ...)` 里有没有漏掉本页新建的 ECharts 实例
4. Bug 修复提示词模板：
```
当前网页出现bug：【描述现象】
基于上面完整代码修复该问题，输出完整可运行的全部HTML。
```
5. 已知遗留问题（生成新页面时不要照抄）：
   - 多数页面在 head 引入了 Plotly，但只有 chapter3 真正用到，其余可删
   - ~~index.html 与 chapter 页的 KaTeX / ECharts 版本号不一致~~ → 已统一为 `katex@0.16` + `echarts@5.4`；新页面必须沿用这两个版本号，不要写具体补丁号
   - `mindmap_markmap.html` 的 KaTeX 仍是 `0.16.8`（markmap 节点公式渲染），如需彻底统一可一并改为 `0.16`
   - index.html 里留有大段注释掉的 ECharts 演示代码与对应 JS（有 `if (!chartDom) return;` 保护，不报错），可作模板参考，但正式版应清理
   - chapter3 卡片4 的 legend 声明了"X正态理论""Y正态理论"两条曲线，实际没有绘制
6. 部署：全部页面完成后上传 GitHub，开启 GitHub Pages。注意思维导图页依赖 fetch，必须走 HTTP 而非 file://。

---
