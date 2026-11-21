// services/analytics/tracker.js
// 跟踪器脚本：ES5 / IE7+ 兼容，每次请求重新生成（随机变量名）。

const TRACKER_NAMES = [
  "script",
  "scripts",
  "i",
  "s",
  "src",
  "dataToken",
  "queryToken",
  "m",
  "token",
  "a",
  "origin",
  "endpoint",
  "domain",
  "winW",
  "sid",
  "tp",
  "out",
  "j",
  "useXhr",
  "lastPath",
  "send",
  "jsonEsc",
  "pageview",
  "hist",
  "push",
  "body",
  "xhr",
  "img",
  "href",
  "name",
];

const TRACKER_TEMPLATE = `(function(){"use strict";
  var @@script@@ = document.currentScript;
  if (!@@script@@) {
    var @@scripts@@ = document.getElementsByTagName('script');
    for (var @@i@@ = @@scripts@@.length - 1; @@i@@ >= 0; @@i@@--) {
      var @@s@@ = @@scripts@@[@@i@@];
      if (@@s@@.src && @@s@@.src.indexOf('analytics.js') !== -1) {
        @@script@@ = @@s@@;
        break;
      }
    }
  }
  if (!@@script@@) return;
  var @@src@@ = @@script@@.src || '';
  var @@dataToken@@ = @@script@@.getAttribute('data-token');
  var @@queryToken@@ = null;
  var @@m@@ = @@src@@.match(/[?&]token=([^&]+)/);
  if (@@m@@) {
    try { @@queryToken@@ = decodeURIComponent(@@m@@[1]); }
    catch (e) { @@queryToken@@ = @@m@@[1]; }
  }
  if (@@dataToken@@ && @@queryToken@@ && @@dataToken@@ !== @@queryToken@@) return;
  var @@token@@ = @@dataToken@@ || @@queryToken@@;
  if (!@@token@@) return;
  var @@a@@ = document.createElement('a');
  @@a@@.href = @@src@@;
  var @@origin@@ = (@@a@@.protocol || 'https:') + '//' + (@@a@@.host || location.host);
  var @@endpoint@@ = @@origin@@ + '/api/event';
  var @@domain@@ = @@script@@.getAttribute('data-domain') || location.hostname;
  var @@winW@@ = window.innerWidth
    || (document.documentElement && document.documentElement.clientWidth)
    || (document.body && document.body.clientWidth)
    || 0;
  var @@sid@@ = '';
  for (var @@j@@ = 0; @@j@@ < 12; @@j@@++) {
    @@sid@@ += Math.floor(Math.random() * 16).toString(16);
  }
  var @@tp@@ = 0;
  try { @@tp@@ = navigator.maxTouchPoints || 0; } catch (e) {}
  var @@useXhr@@ = false;
  if (typeof window.XDomainRequest === 'undefined'
      && typeof window.XMLHttpRequest !== 'undefined') {
    try {
      @@useXhr@@ = 'withCredentials' in new XMLHttpRequest();
    } catch (e) { @@useXhr@@ = false; }
  }
  var @@lastPath@@ = null;
  function @@jsonEsc@@(@@s@@) {
    @@s@@ = String(@@s@@);
    var out = '';
    for (var i = 0; i < @@s@@.length; i++) {
      var c = @@s@@.charAt(i);
      var code = @@s@@.charCodeAt(i);
      if (c === '"') out += '\\\\"';
      else if (c === '\\\\') out += '\\\\\\\\';
      else if (c === '\\n') out += '\\\\n';
      else if (c === '\\r') out += '\\\\r';
      else if (c === '\\t') out += '\\\\t';
      else if (code < 32 || code === 0x2028 || code === 0x2029) {
        var hex = code.toString(16);
        while (hex.length < 4) hex = '0' + hex;
        out += '\\\\u' + hex;
      } else out += c;
    }
    return out;
  }
  function @@send@@(@@name@@) {
    var @@href@@ = location.href;
    if (@@href@@.length > 500) @@href@@ = @@href@@.slice(0, 500);
    if (@@useXhr@@) {
      var @@body@@ = '{"n":"' + @@jsonEsc@@(@@name@@)
        + '","t":"' + @@jsonEsc@@(@@token@@)
        + '","d":"' + @@jsonEsc@@(@@domain@@)
        + '","u":"' + @@jsonEsc@@(@@href@@)
        + '","r":"' + @@jsonEsc@@(document.referrer || '')
        + '","w":"' + @@jsonEsc@@(String(@@winW@@))
        + '","s":"' + @@jsonEsc@@(@@sid@@)
        + '","tp":' + @@tp@@ + '}';
      try {
        var @@xhr@@ = new XMLHttpRequest();
        @@xhr@@.open('POST', @@endpoint@@, true);
        @@xhr@@.setRequestHeader('Content-Type', 'application/json');
        @@xhr@@.send(@@body@@);
      } catch (e) {}
      return;
    }
    try {
      var @@img@@ = new Image();
      @@img@@.src = @@endpoint@@
        + '?n=' + encodeURIComponent(@@name@@)
        + '&t=' + encodeURIComponent(@@token@@)
        + '&d=' + encodeURIComponent(@@domain@@)
        + '&u=' + encodeURIComponent(@@href@@)
        + '&r=' + encodeURIComponent(document.referrer || '')
        + '&w=' + encodeURIComponent(String(@@winW@@))
        + '&s=' + encodeURIComponent(@@sid@@)
        + '&tp=' + encodeURIComponent(String(@@tp@@));
    } catch (e) {}
  }
  function @@pageview@@() {
    if (location.pathname === @@lastPath@@) return;
    @@lastPath@@ = location.pathname;
    @@send@@('pageview');
  }
  window.ayAnalytics = function(n) { @@send@@(String(n || 'event')); };
  var @@hist@@ = window.history;
  if (@@hist@@ && @@hist@@.pushState) {
    var @@push@@ = @@hist@@.pushState;
    @@hist@@.pushState = function() {
      @@push@@.apply(this, arguments);
      @@pageview@@();
    };
    if (window.addEventListener) {
      window.addEventListener('popstate', @@pageview@@);
    } else if (window.attachEvent) {
      window.attachEvent('onpopstate', @@pageview@@);
    }
  }
  if (document.visibilityState === 'prerender') {
    if (window.addEventListener) {
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') @@pageview@@();
      });
    }
  } else {
    @@pageview@@();
  }
})();`;

function randomId() {
  return "_" + Math.random().toString(16).substring(2, 8).padEnd(6, "f");
}

/** 生产环境每次请求随机变量名；DEBUG 环境回填可读名字，方便断点 */
export function buildTrackerScript(env) {
  let js = TRACKER_TEMPLATE;

  if (env.DEBUG) {
    for (const name of TRACKER_NAMES) {
      js = js.split("@@" + name + "@@").join(name);
    }
    return js;
  }

  const used = new Set();
  for (const name of TRACKER_NAMES) {
    let id;
    do {
      id = randomId();
    } while (used.has(id));
    used.add(id);
    js = js.split("@@" + name + "@@").join(id);
  }
  return js.replace(/\n\s*/g, "");
}
