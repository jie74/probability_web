// ==================== 共享 KaTeX 公式自动渲染 ====================
// 用法：在页面 head 中先加载 katex.min.js 与 contrib/auto-render.min.js，
// 再引入本脚本：<script src="js/katex-setup.js"></script>
// 作用：
//   1. 文档就绪时扫描正文，将 \(...\)、\[...\]、$$...$$ 定界符渲染为 KaTeX 公式；
//   2. 监听后续动态插入的内容（如自测题反馈），自动渲染其中公式。
// 已由各页面 renderAllKatex() 处理的 .katex-render 元素会被跳过，避免重复渲染。

(function () {
  var DELIMITERS = [
    { left: '$$', right: '$$', display: true },
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false }
  ];
  var IGNORED_TAGS = ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'];
  var IGNORED_CLASSES = ['katex-render', 'katex', 'katex-display'];

  function render(root) {
    if (typeof renderMathInElement !== 'function' || typeof katex === 'undefined') return;
    try {
      renderMathInElement(root || document.body, {
        delimiters: DELIMITERS,
        throwOnError: false,
        ignoredTags: IGNORED_TAGS,
        ignoredClasses: IGNORED_CLASSES
      });
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) console.warn('KaTeX auto-render 失败:', e);
    }
  }

  // 对外暴露：动态插入内容后可手动调用 window.renderKatexAuto(node)
  window.renderKatexAuto = render;

  // 快速判断节点是否可能含公式定界符，避免对图表等大节点无谓渲染
  function hasMathMarker(node) {
    if (!node || node.nodeType !== 1) return false;
    var t = node.textContent;
    if (!t) return false;
    return t.indexOf('\\(') >= 0 || t.indexOf('$$') >= 0 || t.indexOf('\\[') >= 0;
  }

  // 监听动态插入的内容（带防抖，避免高频 DOM 变化时性能下降）
  var pending = [];
  var timer = null;
  function schedule(node) {
    if (!node) return;
    pending.push(node);
    if (timer) return;
    timer = setTimeout(function () {
      timer = null;
      var nodes = pending;
      pending = [];
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        // 文本节点取其父元素
        if (el.nodeType === 3) el = el.parentNode;
        if (el && el.nodeType === 1 && hasMathMarker(el)) render(el);
      }
    }, 150);
  }

  function startObserver() {
    if (typeof MutationObserver !== 'function' || !document.body) return;
    var obs = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) schedule(added[j]);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    render(document.body);
    startObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
