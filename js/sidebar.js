// ==================== 共享侧边导航栏 ====================
// 用法：在页面中放置 <div id="sidebar-container"></div>，
// 然后在其后引入本脚本：<script src="js/sidebar.js"></script>
// 本脚本用 innerHTML 注入侧边栏（不依赖 fetch/XHR），
// 因此双击本地 HTML（file:// 协议）也能正常显示侧边栏。
// 支持：点击“收起”按钮折叠侧边栏，点击左上角悬浮按钮展开；
// 折叠状态记忆于 localStorage，刷新后保持；折叠/展开后自动触发图表 resize。

(function () {
  var sidebarHTML =
    '<aside class="sidebar" id="globalSidebar">' +
    '  <div class="flex items-center justify-between px-5 py-6 border-b border-slate-200">' +
    '    <a href="index.html" class="flex items-center gap-3 no-underline">' +
    '      <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style="background:#2563eb;">' +
    '        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
    '          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>' +
    '          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>' +
    '          <line x1="8" y1="7" x2="16" y2="7"/>' +
    '          <line x1="8" y1="11" x2="14" y2="11"/>' +
    '          <line x1="8" y1="15" x2="12" y2="15"/>' +
    '        </svg>' +
    '      </div>' +
    '      <div>' +
    '        <div class="text-sm font-bold text-slate-800 leading-tight">概率论与数理统计</div>' +
    '        <div class="text-xs text-slate-500">可视化平台</div>' +
    '      </div>' +
    '    </a>' +
    '    <button id="sidebarCollapseBtn" class="sidebar-toggle" title="收起侧边栏" aria-label="收起侧边栏">' +
    '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '        <polyline points="15 18 9 12 15 6"/>' +
    '      </svg>' +
    '    </button>' +
    '  </div>' +
    '  <nav class="py-4">' +
    '    <div class="px-5 mb-2">' +
    '      <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">课程章节</span>' +
    '    </div>' +
    '    <a href="index.html" class="sidebar-nav-item"><span class="chapter-num">⌂</span><span>首页</span></a>' +
    '    <a href="chapter1.html" class="sidebar-nav-item"><span class="chapter-num">1</span><span>随机事件及其概率</span></a>' +
    '    <a href="chapter2.html" class="sidebar-nav-item"><span class="chapter-num">2</span><span>一维随机变量及其分布</span></a>' +
    '    <a href="chapter3.html" class="sidebar-nav-item"><span class="chapter-num">3</span><span>二维随机变量及其分布</span></a>' +
    '    <a href="chapter4.html" class="sidebar-nav-item"><span class="chapter-num">4</span><span>随机变量的数字特征</span></a>' +
    '    <a href="chapter5.html" class="sidebar-nav-item"><span class="chapter-num">5</span><span>大数定律及中心极限定理</span></a>' +
    '<a href="chapter6.html" class="sidebar-nav-item"><span class="chapter-num">6</span><span>样本及抽样分布</span></a>' +
    '<a href="chapter7.html" class="sidebar-nav-item"><span class="chapter-num">7</span><span>参数估计</span></a>' +
    '<a href="chapter8.html" class="sidebar-nav-item"><span class="chapter-num">8</span><span>假设检验</span></a>' +
    '    <div class="px-5 mt-4 mb-2">' +
    '      <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">学习工具</span>' +
    '    </div>' +
    '    <a href="mindmap_markmap.html" class="sidebar-nav-item"><span class="chapter-num">🧠</span><span>思维导图</span></a>' +
    '  </nav>' +
    '  <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">' +
    '    <div class="text-xs text-slate-400 text-center">' +
    '      概率论与数理统计<br>交互式可视化平台 v1.0' +
    '    </div>' +
    '  </div>' +
    '</aside>';

  // 注入侧边栏
  var container = document.getElementById('sidebar-container');
  if (container) {
    container.innerHTML = sidebarHTML;
  }

  // 当前页面高亮
  var current = (window.location.pathname.split('/').pop()) || 'index.html';
  var items = document.querySelectorAll('#globalSidebar .sidebar-nav-item');
  for (var i = 0; i < items.length; i++) {
    if (items[i].getAttribute('href') === current) {
      items[i].classList.add('active');
    }
  }

  // ==================== 侧边栏折叠/展开 ====================
  var COLLAPSED_CLASS = 'sidebar-collapsed';
  var OPEN_CLASS = 'sidebar-open';
  var STORAGE_KEY = 'prob-sidebar-collapsed';
  var MOBILE_BP = 768; // 与 CSS 中 767px 保持一致

  function isMobile() {
    return window.innerWidth < MOBILE_BP;
  }

  // 创建遮罩层（移动端点击遮罩关闭侧边栏）
  var overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.addEventListener('click', function () {
    setSidebarOpen(false);
  });
  document.body.appendChild(overlay);

  // 创建悬浮展开按钮（侧边栏收起后显示在屏幕左上角）
  var reopenBtn = document.createElement('button');
  reopenBtn.id = 'sidebarReopenBtn';
  reopenBtn.className = 'sidebar-reopen';
  reopenBtn.title = '展开侧边栏';
  reopenBtn.setAttribute('aria-label', '展开侧边栏');
  reopenBtn.innerHTML =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>' +
    '</svg>';
  document.body.appendChild(reopenBtn);

  // 打开/关闭侧边栏（移动端：覆盖层模式；桌面端：推挤模式）
  function setSidebarOpen(open) {
    if (open) {
      document.body.classList.add(OPEN_CLASS);
      document.body.classList.remove(COLLAPSED_CLASS);
    } else {
      document.body.classList.remove(OPEN_CLASS);
      if (!isMobile()) {
        document.body.classList.add(COLLAPSED_CLASS);
      }
    }
    try { localStorage.setItem(STORAGE_KEY, open ? '0' : '1'); } catch (e) {}
    try { window.dispatchEvent(new Event('resize')); } catch (e) {}
  }

  // 桌面端折叠/展开（推挤模式）
  function setSidebarCollapsed(collapsed) {
    if (collapsed) {
      document.body.classList.add(COLLAPSED_CLASS);
      document.body.classList.remove(OPEN_CLASS);
    } else {
      document.body.classList.remove(COLLAPSED_CLASS);
      document.body.classList.remove(OPEN_CLASS);
    }
    try { localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0'); } catch (e) {}
    try { window.dispatchEvent(new Event('resize')); } catch (e) {}
  }

  // 绑定侧边栏顶部的"收起"按钮
  var collapseBtn = document.getElementById('sidebarCollapseBtn');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', function () {
      setSidebarCollapsed(true);
    });
  }
  // 绑定悬浮"展开"按钮
  reopenBtn.addEventListener('click', function () {
    if (isMobile()) {
      setSidebarOpen(true);
    } else {
      setSidebarCollapsed(false);
    }
  });

  // 移动端：点击侧边栏内的导航链接后自动关闭侧边栏
  var sidebar = document.getElementById('globalSidebar');
  if (sidebar) {
    sidebar.addEventListener('click', function (e) {
      if (isMobile() && e.target.closest('.sidebar-nav-item')) {
        // 延迟关闭，让链接跳转先触发
        setTimeout(function () { setSidebarOpen(false); }, 150);
      }
    });
  }

  // 窗口大小变化时，自动适配模式
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!isMobile()) {
        // 切回桌面端：移除移动端 open 状态
        document.body.classList.remove(OPEN_CLASS);
        // 恢复上次的桌面端折叠状态
        try {
          if (localStorage.getItem(STORAGE_KEY) === '1') {
            document.body.classList.add(COLLAPSED_CLASS);
          } else {
            document.body.classList.remove(COLLAPSED_CLASS);
          }
        } catch (e) {}
      } else {
        // 切到移动端：移除桌面端折叠状态
        document.body.classList.remove(COLLAPSED_CLASS);
      }
    }, 200);
  });

  // 触摸滑动关闭（移动端向右滑动关闭侧边栏）
  var touchStartX = 0;
  if (sidebar) {
    sidebar.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    sidebar.addEventListener('touchmove', function (e) {
      if (!isMobile()) return;
      var dx = e.touches[0].clientX - touchStartX;
      if (dx < -40) {
        setSidebarOpen(false);
      }
    }, { passive: true });
  }

  // 初始状态：移动端默认隐藏侧边栏
  if (isMobile()) {
    document.body.classList.remove(COLLAPSED_CLASS);
    document.body.classList.remove(OPEN_CLASS);
  } else {
    // 桌面端恢复上次的折叠状态
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') {
        document.body.classList.add(COLLAPSED_CLASS);
      }
    } catch (e) {}
  }
})();
