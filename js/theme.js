// ==================== 共享明暗主题切换 ====================
// 用法：在页面 <head> 中引入（建议紧跟在 css/theme.css 之后）：
//   <link rel="stylesheet" href="css/theme.css">
//   <script src="js/theme.js"></script>
// 功能：
//   1. 在 <html> 上添加/移除 class="dark"，配合 css/theme.css 切换暗色主题；
//   2. 读取 localStorage 中记住的主题；未设置时跟随系统 prefers-color-scheme；
//   3. 在页面右上角注入“太阳 / 月亮”图标按钮，点击即切换并持久化；
//   4. 切换时派发 themechange 事件（window.addEventListener('themechange', ...)）。

(function () {
  var STORAGE_KEY = 'prob-theme';           // 'dark' | 'light'
  var root = document.documentElement;

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function setStored(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {}
  }
  function systemPrefersDark() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function isDark() {
    return root.classList.contains('dark');
  }

  // 应用主题（只操作 class，具体颜色由 css/theme.css 决定）
  function apply(theme) {
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  function currentTheme() {
    return isDark() ? 'dark' : 'light';
  }

  // 立即应用（在 <body> 渲染前执行，避免闪现）
  var theme = getStored() || (systemPrefersDark() ? 'dark' : 'light');
  try { apply(theme); } catch (e) {}

  // 未手动选择过主题时，跟随系统变化
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onSystemChange = function (e) {
      if (getStored()) return; // 用户已手动选择，忽略系统变化
      theme = e.matches ? 'dark' : 'light';
      apply(theme);
    };
    if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
    else if (mq.addListener) mq.addListener(onSystemChange);
  }

  // 注入右上角切换按钮
  function injectButton() {
    if (!document.body || document.getElementById('themeToggleBtn')) return;

    var btn = document.createElement('button');
    btn.id = 'themeToggleBtn';
    btn.type = 'button';
    btn.className = 'theme-toggle';
    btn.title = '切换明暗模式';
    btn.setAttribute('aria-label', '切换明暗模式');
    btn.innerHTML =
      // 月亮图标（亮色模式显示）
      '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' +
      '</svg>' +
      // 太阳图标（暗色模式显示）
      '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="4"/>' +
      '<line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>' +
      '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>' +
      '<line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>' +
      '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>' +
      '</svg>';

    btn.addEventListener('click', function () {
      theme = isDark() ? 'light' : 'dark';
      apply(theme);
      setStored(theme);
      try {
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
      } catch (e) {
        try { window.dispatchEvent(new Event('themechange')); } catch (e2) {}
      }
    });

    document.body.appendChild(btn);
  }

  // 注入失败也不应影响页面其它脚本
  function safeInject() {
    try {
      injectButton();
    } catch (e) {
      if (window.console && console.warn) console.warn('[theme] 切换按钮注入失败:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInject);
  } else {
    safeInject();
  }

  // 对外暴露简单 API，便于其他脚本联动
  window.probTheme = {
    get: currentTheme,
    set: function (t) {
      theme = (t === 'dark') ? 'dark' : 'light';
      apply(theme);
      setStored(theme);
    },
    toggle: function () {
      theme = isDark() ? 'light' : 'dark';
      apply(theme);
      setStored(theme);
      try {
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
      } catch (e) {}
      return theme;
    }
  };
})();
