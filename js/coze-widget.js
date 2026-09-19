/**
 * Coze 智能体 · 右侧可折叠抽屉（公共脚本，开箱即用）
 * =============================================================
 * 引入方式：在页面底部加入
 *     <link rel="stylesheet" href="css/coze-widget.css">
 *     <script src="js/coze-widget.js"></script>
 * 脚本会自动：注入 DOM → 动态加载 Coze Web SDK → 读取 token → 初始化。
 *
 * 可选配置（放在本脚本之前定义即可覆盖默认值）：
 *   window.CozeWidgetConfig = {
 *     projectId: '7687082916731486217',
 *     title:     '🤖 概率论 AI 助教',
 *     subtitle:  '随时追问知识点、题目与公式',
 *     icon:      'logo.png',
 *     envPath:   '.env',
 *     envKey:    'COZE_TOKEN',
 *     token:     '',       // 直接指定 token（优先于 .env）
 *     sdkSrc:    'https://lf-cdn.coze.cn/obj/unpkg/latest/coze/web-sdk/dist/js-umd/index.min.js',
 *     width:     400,
 *     disabled:  false,    // 置 true 可临时禁用
 *   };
 *
 * token 来源优先级：config.token → window.COZE_TOKEN → .env[envKey] → 空
 * 注意：浏览器无法直接读 .env，脚本用 fetch 读取；file:// 下会被拦截，
 *       此时请用 config.token 或 window.COZE_TOKEN 显式指定。
 */
(function () {
  "use strict";

  var DEFAULTS = {
    projectId: "7687082916731486217",
    title: "🤖 概率论 AI 助教",
    subtitle: "随时追问知识点、题目与公式",
    icon: "logo.png",
    envPath: ".env",
    envKey: "COZE_TOKEN",
    token: "",
    sdkSrc: "https://lf-cdn.coze.cn/obj/unpkg/latest/coze/web-sdk/dist/js-umd/index.min.js",
    width: 400,
    disabled: false,
  };

  function merge(src, base) {
    var out = {};
    for (var k in base) if (Object.prototype.hasOwnProperty.call(base, k)) out[k] = base[k];
    if (src) for (var k2 in src) if (Object.prototype.hasOwnProperty.call(src, k2)) out[k2] = src[k2];
    return out;
  }

  var cfg = merge(window.CozeWidgetConfig, DEFAULTS);
  if (cfg.disabled) return;

  /* ============ 1. 注入 DOM ============ */
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  var backdrop = el("div", "coze-backdrop");

  var drawer = el("aside", "coze-drawer");
  drawer.setAttribute("aria-hidden", "true");
  drawer.setAttribute("aria-label", cfg.title);
  drawer.style.width = (typeof cfg.width === "number" ? cfg.width + "px" : cfg.width);

  var header = el("div", "coze-drawer-header");
  var headText = el("div");
  headText.appendChild(el("div", "coze-drawer-title", cfg.title));
  headText.appendChild(el("div", "coze-drawer-sub", cfg.subtitle));
  var closeBtn = el("button", "coze-drawer-close", "✕");
  closeBtn.type = "button";
  closeBtn.title = "收起";
  closeBtn.setAttribute("aria-label", "收起");
  header.appendChild(headText);
  header.appendChild(closeBtn);

  var container = el("div", "coze-container");
  container.id = "coze-container";

  drawer.appendChild(header);
  drawer.appendChild(container);

  var toggle = el("button", "coze-toggle");
  toggle.type = "button";
  toggle.title = "打开" + cfg.title.replace(/^[^\w\u4e00-\u9fa5]*/, "");
  toggle.setAttribute("aria-label", toggle.title);
  var icon = document.createElement("img");
  icon.src = cfg.icon;
  icon.alt = "";
  icon.className = "coze-toggle-icon";
  toggle.appendChild(icon);

  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);
  document.body.appendChild(toggle);

  /* ============ 2. 抽屉开合逻辑 ============ */
  function isNarrow() { return window.innerWidth < 900; }

  function setOpen(open) {
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    toggle.classList.toggle("is-hidden", open);
    backdrop.classList.toggle("show", open && isNarrow());
  }

  toggle.addEventListener("click", function () { setOpen(true); });
  closeBtn.addEventListener("click", function () { setOpen(false); });
  backdrop.addEventListener("click", function () { setOpen(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer.classList.contains("open")) setOpen(false);
  });
  window.addEventListener("resize", function () {
    backdrop.classList.toggle("show", drawer.classList.contains("open") && isNarrow());
  });

  window.__cozePanel = {
    open: function () { setOpen(true); },
    close: function () { setOpen(false); },
    toggle: function () { setOpen(!drawer.classList.contains("open")); },
  };

  /* ============ 3. 诊断面板 ============ */
  function showNotice(kind, title, lines) {
    var box = document.getElementById("coze-diag");
    if (!box) {
      box = document.createElement("div");
      box.id = "coze-diag";
      box.className = "coze-diag";
      document.body.appendChild(box);
    }
    box.style.borderLeftColor = kind === "error" ? "#dc2626" : kind === "warn" ? "#f59e0b" : "#2563eb";
    box.innerHTML =
      '<div class="coze-diag-title">' + title + "</div>" +
      lines.map(function (t) { return '<div class="coze-diag-line">' + t + "</div>"; }).join("") +
      '<button type="button" class="coze-diag-close">关闭</button>';
    box.querySelector(".coze-diag-close").onclick = function () { box.remove(); };
  }

  function decodeJwtPayload(token) {
    try {
      var part = token.split(".")[1];
      if (!part) return null;
      var b64 = part.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      return JSON.parse(decodeURIComponent(escape(atob(b64))));
    } catch (e) {
      return null;
    }
  }

  function describeToken(token) {
    var p = decodeJwtPayload(token);
    if (!p) return ["令牌不是标准 JWT，无法解析 payload。"];
    var connector = p.session_context && p.session_context.connector_info && p.session_context.connector_info.connector_id;
    var out = [];
    out.push("令牌类型：" + (p.src || p.iss || "未知"));
    if (p.sub) out.push("sub：" + p.sub);
    if (p.aud) out.push("aud：" + (Array.isArray(p.aud) ? p.aud.join(", ") : p.aud));
    if (p.iat) out.push("签发时间：" + new Date(p.iat * 1000).toLocaleString());
    out.push("connector_id：" + (connector ? connector : '<b style="color:#dc2626">缺失</b>'));
    return out;
  }

  function checkList() {
    return [
      "<hr style='border:0;border-top:1px solid #e2e8f0;margin:8px 0'>",
      "自检清单：",
      "1. 检查 token 是否带多余的 <code>czs_</code> 前缀、引号或换行；",
      "2. 确认令牌与该站点、该 projectId 属于同一次部署；",
      "3. 若需调用 <code>api.coze.cn/v1/*</code>（OpenAPI），需另建 PAT；",
      "4. 项目需已部署并<b>开启 Web SDK 渠道</b>。",
    ];
  }

  /* ============ 4. token 读取 ============ */
  function parseEnv(text) {
    var env = {};
    text.split(/\r?\n/).forEach(function (line) {
      var m = /^\s*([\w.-]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (!m) return;
      var value = m[2];
      if ((value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') ||
          (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'")) {
        value = value.slice(1, -1);
      }
      env[m[1]] = value;
    });
    return env;
  }

  function loadEnv() {
    return fetch(cfg.envPath, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(parseEnv)
      .catch(function (err) {
        console.warn("[coze] 未能读取 " + cfg.envPath + "（" + err.message + "）");
        return {};
      });
  }

  /* ============ 5. 动态加载 SDK 并初始化 ============ */
  function loadSdk(src) {
    return new Promise(function (resolve) {
      if (typeof window.cozeWebSDK !== "undefined") { resolve(); return; }
      var s = document.createElement("script");
      s.src = src;
      s.onload = function () { resolve(); };
      s.onerror = function () {
        console.warn("[coze] SDK CDN 加载失败：" + src);
        resolve();
      };
      document.body.appendChild(s);
    });
  }

  function init(token) {
    if (!token || token === "YOUR_TOKEN") {
      showNotice("warn", "Coze 未初始化", [cfg.envPath + " 中<b>没有读到 " + cfg.envKey + "</b>（为空或占位）。"]);
      return;
    }
    if (typeof window.cozeWebSDK === "undefined") {
      showNotice("warn", "Coze SDK 未加载", ["CDN 可能被网络策略拦截。可重写 <code>CozeWidgetConfig.sdkSrc</code>。"]);
      return;
    }

    var reported = false;
    function report(title, lines) {
      if (reported) return;
      reported = true;
      showNotice("error", title, lines);
    }

    var options = {
      projectId: cfg.projectId,
      refreshToken: function () { return Promise.resolve(token); },
      unauthorizedDescription: "鉴权失败（401）",
      onTokenInvalid: function () {
        report("Coze 鉴权失败（401）", describeToken(token).concat(checkList()));
      },
      onTokenExpired: function () {
        report("Coze 令牌已过期", ["请在 Coze 后台重新生成后写入 " + cfg.envPath + "。"]);
      },
      onNetworkError: function () {
        report("Coze 网络异常", ["获取令牌或内部请求失败（超时上限 5000ms）。"]);
      },
      onIframeReady: function () {
        var box = document.getElementById("coze-diag");
        if (box) box.remove();
      },
    };

    // 挂到抽屉容器内联渲染；容器始终有真实尺寸（transform 不影响布局）
    options.container = container;
    options.style = "width:100%;height:100%;border:0;";

    window.cozeWebSDK.init(options);
  }

  loadEnv().then(function (env) {
    var token = cfg.token || window.COZE_TOKEN ||
      env[cfg.envKey] || env[cfg.envKey.toUpperCase()] || env[cfg.envKey.toLowerCase()] || "";
    loadSdk(cfg.sdkSrc).then(function () { init(token); });
  });
})();
