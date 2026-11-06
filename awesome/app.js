/* Renders the Awesome Multimodal Deep Research preview from window.ATLAS (atlas.js). */
(function () {
  var A = window.ATLAS || { items: [], scores: [] }, items = A.items;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pressGroup(el, labels, cur, onPick) {
    el.innerHTML = labels.map(function (l) { return '<button type="button" aria-pressed="' + (l[0] === cur) + '" data-v="' + esc(l[0]) + '">' + esc(l[1]) + "</button>"; }).join("");
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      el.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      onPick(b.dataset.v);
    });
  }

  /* ---------- theme ---------- */
  var root = document.documentElement, tbtn = document.querySelectorAll(".seg button");
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;
  function theme() { return root.getAttribute("data-theme") || (mq && mq.matches ? "light" : "dark"); }
  function syncTheme() { var c = theme(); tbtn.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.set === c); }); }
  tbtn.forEach(function (b) { b.addEventListener("click", function () { root.setAttribute("data-theme", b.dataset.set); try { localStorage.setItem("ls-theme", b.dataset.set); } catch (e) {} syncTheme(); }); });
  if (mq && mq.addEventListener) mq.addEventListener("change", syncTheme);
  syncTheme();
  var bar = $("bar"); window.addEventListener("scroll", function () { bar.classList.toggle("scrolled", window.scrollY > 8); }, { passive: true });

  /* ---------- live star count ---------- */
  function showStars(n) { document.querySelectorAll("[data-stars]").forEach(function (el) { el.textContent = n.toLocaleString("en-US"); }); }
  var cached = null; try { cached = JSON.parse(sessionStorage.getItem("ovh-stars") || "null"); } catch (e) {}
  if (cached && Date.now() - cached.t < 6e5) showStars(cached.n);
  else fetch("https://api.github.com/repos/uclanlp/OpenVLHarness").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (d && typeof d.stargazers_count === "number") { showStars(d.stargazers_count); try { sessionStorage.setItem("ovh-stars", JSON.stringify({ n: d.stargazers_count, t: Date.now() })); } catch (e) {} }
  }).catch(function () {});

  /* ---------- stats ---------- */
  var K = { method: "Methods", dataset: "Training data", benchmark: "Benchmarks", survey: "Surveys" };
  function count(k) { return items.filter(function (i) { return i.kind === k; }).length; }
  var orgs = {}; items.forEach(function (i) { if (i.org) orgs[i.org] = 1; });
  $("stats").innerHTML = [[items.length, "Entries"], [count("method"), "Methods"], [count("dataset"), "Training datasets"], [count("benchmark"), "Benchmarks"], [Object.keys(orgs).length, "Organizations"]]
    .map(function (s) { return '<div class="stat"><div class="num">' + s[0] + '</div><div class="lbl">' + s[1] + "</div></div>"; }).join("");
  $("built").textContent = A.built || "";

  /* ---------- timeline ---------- */
  (function () {
    var COL = { method: "var(--blue)", dataset: "var(--gold)", benchmark: "var(--cyan)", survey: "var(--rose)" };
    var months = {}, minM = "2024-01", early = { method: 0, dataset: 0, benchmark: 0, survey: 0 }, maxM = minM;
    items.forEach(function (i) {
      if (!i.date) return;
      if (i.date < minM) { early[i.kind]++; return; }
      (months[i.date] = months[i.date] || { method: 0, dataset: 0, benchmark: 0, survey: 0 })[i.kind]++;
      if (i.date > maxM) maxM = i.date;
    });
    var keys = [], y = 2024, m = 1;
    while (true) { var k = y + "-" + (m < 10 ? "0" : "") + m; keys.push(k); if (k >= maxM) break; m++; if (m > 12) { m = 1; y++; } }
    var cols = [["≤2023", early]].concat(keys.map(function (k) { return [k, months[k] || { method: 0, dataset: 0, benchmark: 0, survey: 0 }]; }));
    var tot = cols.map(function (c) { var v = c[1]; return v.method + v.dataset + v.benchmark + v.survey; }), mx = Math.max.apply(null, tot.slice(1).concat([1]));
    var W = 1080, H = 240, L = 30, B = 26, T = 10, bw = (W - L) / cols.length;
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Entries per month">';
    for (var g = 0; g <= mx; g += Math.max(2, Math.ceil(mx / 4))) { var gy = H - B - (H - B - T) * g / mx; s += '<line x1="' + L + '" x2="' + W + '" y1="' + gy + '" y2="' + gy + '" stroke="var(--line)"/><text x="' + (L - 6) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="11" fill="var(--ink-3)">' + g + "</text>"; }
    cols.forEach(function (c, ci) {
      var x = L + ci * bw + bw * 0.15, w = bw * 0.7, yy = H - B, v = c[1];
      if (ci === 0) { s += '<text x="' + (x + w / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="var(--ink-3)">≤23</text>'; }
      ["method", "dataset", "benchmark", "survey"].forEach(function (k) {
        if (!v[k]) return; var h = (H - B - T) * Math.min(v[k], mx) / mx;
        if (ci === 0) h = Math.min(h, (H - B - T)); yy -= h;
        s += '<rect x="' + x.toFixed(1) + '" y="' + yy.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2" fill="' + COL[k] + '"><title>' + c[0] + " · " + K[k] + ": " + v[k] + "</title></rect>";
      });
      if (ci > 0 && c[0].slice(5) === "01") s += '<text x="' + (x + w / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="var(--ink-2)" font-weight="600">' + c[0].slice(0, 4) + "</text>";
      else if (ci > 0 && c[0].slice(5) === "07") s += '<text x="' + (x + w / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="var(--ink-3)">Jul</text>';
    });
    $("tl-chart").innerHTML = s + "</svg>";
    $("tl-legend").innerHTML = ["method", "dataset", "benchmark", "survey"].map(function (k) { return '<span><i style="background:' + COL[k] + '"></i>' + K[k] + "</span>"; }).join("") +
      '<span style="margin-left:auto">' + items.filter(function (i) { return !i.date; }).length + " entries without a date are not shown</span>";
  })();

  /* ---------- recipes ---------- */
  function hbars(el, rows, color) {
    var mx = Math.max.apply(null, rows.map(function (r) { return r[1]; }).concat([1]));
    el.innerHTML = '<div style="display:grid;gap:8px">' + rows.map(function (r, i) {
      return '<div style="display:grid;grid-template-columns:120px 1fr 34px;gap:10px;align-items:center;font-size:.86rem;color:var(--ink-2)"><span>' + esc(r[0]) +
        '</span><span style="height:12px;border-radius:6px;background:var(--line);overflow:hidden"><span style="display:block;height:100%;width:' + (100 * r[1] / mx) + "%;background:" + (Array.isArray(color) ? color[i % color.length] : color) +
        '"></span></span><span style="font:0.8rem var(--f-mono);text-align:right;color:var(--ink)">' + r[1] + "</span></div>";
    }).join("") + "</div>";
  }
  var meths = items.filter(function (i) { return i.kind === "method"; });
  var pipe = {}; meths.forEach(function (i) { if (!i.pipeline) return; var p = /training-free/i.test(i.pipeline) ? "Training-free" : i.pipeline.replace(/\s+/g, " "); pipe[p] = (pipe[p] || 0) + 1; });
  hbars($("pipe-chart"), Object.keys(pipe).sort(function (a, b) { return pipe[b] - pipe[a]; }).map(function (k) { return [k, pipe[k]]; }), ["var(--blue)", "var(--gold)", "var(--cyan)", "var(--violet)", "var(--rose)"]);
  function family(s) {
    if (!s) return null; s = String(s);
    if (/Q(wen)?\s?3\.[5-9]/i.test(s)) return "Qwen3.5 / 3.6";
    if (/Q(wen)?\s?3(?![.\d])|Qwen3-VL|Q3VL/i.test(s)) return "Qwen3-VL";
    if (/Q(wen)?\s?2\.5/i.test(s)) return "Qwen2.5-VL";
    if (/Qwen-Image/i.test(s)) return "Qwen-Image";
    if (/bagel|emu/i.test(s)) return "Unified (Bagel, Emu)";
    if (/gpt|gemini|claude/i.test(s)) return "Proprietary API";
    return "Other";
  }
  var fam = {}; meths.forEach(function (i) { var f = family(i.backbone || i.base); if (f) fam[f] = (fam[f] || 0) + 1; });
  hbars($("bb-chart"), Object.keys(fam).sort(function (a, b) { return fam[b] - fam[a]; }).map(function (k) { return [k, fam[k]]; }), "var(--gold)");

  /* ---------- reported results ---------- */
  (function () {
    var S = A.scores || [], BEN = [["2", "MMSearch", 40, 100], ["3", "BrowseComp-VL", 20, 80]], cur = "2", sortK = "y";
    function render() {
      var b = BEN.filter(function (x) { return x[0] === cur; })[0], col = +cur, ymin = b[2], ymax = b[3];
      var pts = S.filter(function (d) { return d[col] != null; }).map(function (d) { return { n: d[0], x: d[1], y: d[col], o: /^LiteSearcher/.test(d[0]) }; });
      var srt = pts.slice().sort(function (a, c) { return a.x - c.x || c.y - a.y; }), best = -1, front = [];
      srt.forEach(function (p) { if (p.y > best) { best = p.y; front.push(p); } });
      var W = 520, H = 360, L = 40, R = 16, T = 18, Bm = 38;
      var lx = function (v) { return L + (W - L - R) * (Math.log(v) - Math.log(0.6)) / (Math.log(45) - Math.log(0.6)); };
      var ly = function (v) { return T + (H - T - Bm) * (1 - (v - ymin) / (ymax - ymin)); };
      var s = '<svg viewBox="0 0 ' + W + " " + H + '" font-size="11" role="img" aria-label="' + b[1] + ' accuracy versus size">';
      for (var t = ymin; t <= ymax; t += 20) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + ly(t) + '" y2="' + ly(t) + '" stroke="var(--line)"/><text x="' + (L - 6) + '" y="' + (ly(t) + 4) + '" text-anchor="end" fill="var(--ink-3)">' + t + "</text>";
      [1, 2, 4, 8, 16, 32].forEach(function (t) { s += '<text x="' + lx(t) + '" y="' + (H - Bm + 16) + '" text-anchor="middle" fill="var(--ink-3)">' + t + "B</text>"; });
      s += '<text x="' + ((L + W - R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" fill="var(--ink-3)">Total parameters (log)</text>';
      var path = ""; front.forEach(function (p, i) { path += i ? " H" + lx(p.x).toFixed(1) + " V" + ly(p.y).toFixed(1) : "M" + lx(p.x).toFixed(1) + " " + ly(p.y).toFixed(1); });
      s += '<path d="' + path + " H" + (W - R) + '" fill="none" stroke="var(--gold)" stroke-width="1.6" stroke-dasharray="5 4"/>';
      pts.filter(function (p) { return !p.o; }).forEach(function (p) { s += '<circle cx="' + lx(p.x) + '" cy="' + ly(p.y) + '" r="4.2" fill="var(--bar-base)"><title>' + esc(p.n) + ": " + p.y + "</title></circle>"; });
      var ours = pts.filter(function (p) { return p.o; });
      s += '<polyline points="' + ours.map(function (p) { return lx(p.x) + "," + ly(p.y); }).join(" ") + '" fill="none" stroke="var(--blue)" stroke-width="2"/>';
      ours.forEach(function (p) { s += '<circle cx="' + lx(p.x) + '" cy="' + ly(p.y) + '" r="5.5" fill="var(--blue)" stroke="var(--bg)" stroke-width="1.5"><title>' + esc(p.n) + ": " + p.y + '</title></circle><text x="' + (lx(p.x) - 6) + '" y="' + (ly(p.y) - 9) + '" text-anchor="middle" fill="var(--blue)" font-weight="600">' + p.n.replace("LiteSearcher-", "") + "</text>"; });
      $("res-chart").innerHTML = s + "</svg>";
      var rows = pts.slice().sort(function (a, c) { return sortK === "x" ? a.x - c.x || c.y - a.y : c.y - a.y; });
      $("res-table").innerHTML = '<thead><tr><th>#</th><th>Agent</th><th class="r" data-k="x">Size</th><th class="r" data-k="y">' + b[1] + "</th></tr></thead><tbody>" +
        rows.map(function (p, i) { return "<tr" + (p.o ? ' class="ours"' : "") + "><td>" + (i + 1) + "</td><td>" + esc(p.n) + '</td><td class="r">' + p.x + 'B</td><td class="r">' + p.y.toFixed(p.o ? 2 : 1) + "</td></tr>"; }).join("") + "</tbody>";
    }
    pressGroup($("res-tabs"), BEN.map(function (b) { return [b[0], b[1]]; }), cur, function (v) { cur = v; render(); });
    $("res-table").addEventListener("click", function (e) { var th = e.target.closest("th[data-k]"); if (th) { sortK = th.dataset.k; render(); } });
    render();
  })();

  /* ---------- open training data ---------- */
  (function () {
    var ds = items.filter(function (i) { return i.kind === "dataset"; }), f = "all";
    var NICE = { "Enclopedia VQA": "Encyclopedic VQA", "DeepEyesv2": "DeepEyesV2", "RedSearcher": "REDSearcher", "AOKVQA": "A-OKVQA", "OKVQA": "OK-VQA", "VDR - RL Demo": "Vision-DeepResearch RL demo", "OpenSearch-VL SFT and RL": "OpenSearch-VL" };
    function size(d) { var m = /^Training Set \((.*)\)$/.exec(d.size || ""); return m ? m[1] : d.size; }
    function stage(d) { return d.stage === "SFT" ? "SFT" : d.stage === "RL" ? "RL" : d.stage === "All" ? "SFT + RL" : "Mixed"; }
    function render() {
      $("data-cards").innerHTML = ds.filter(function (d) { return f === "all" || (f === "gen" ? d.task === "Gen" : f === "under" ? d.task !== "Gen" : stage(d) === f); }).map(function (d) {
        var links = [d.hf && '<a href="' + esc(d.hf.startsWith("http") ? d.hf : "#") + '" target="_blank" rel="noopener">Data</a>', d.url && '<a href="' + esc(d.url) + '" target="_blank" rel="noopener">Paper</a>', d.code && '<a href="' + esc(d.code) + '" target="_blank" rel="noopener">Code</a>'].filter(Boolean).join("");
        return '<div class="dcard"><div class="nm">' + esc(NICE[d.name] || d.name || d.title) + '</div><div class="sz">' + esc(size(d) || "—") + '</div><div><span class="tag g">' + stage(d) + '</span><span class="tag b">' + (d.task === "Gen" ? "Generation" : "Understanding") + "</span>" + (d.org ? '<span class="tag">' + esc(d.org) + "</span>" : "") +
          '</div><div class="t">' + esc(d.title) + '</div><div class="ln">' + links + "</div></div>";
      }).join("");
    }
    pressGroup($("data-chips"), [["all", "All"], ["SFT + RL", "SFT + RL"], ["SFT", "SFT"], ["RL", "RL"], ["under", "Understanding"], ["gen", "Generation"]], f, function (v) { f = v; render(); });
    render();
  })();

  /* ---------- benchmarks ---------- */
  (function () {
    var bm = items.filter(function (i) { return i.kind === "benchmark"; }), f = "all", sk = "date", dir = -1;
    function group(b) { var g = b.bgroup || b.sub || ""; if (/report/i.test(g)) return "Report"; if (/gen/i.test(g)) return "Generation"; if (/video/i.test(g)) return "Video"; if (/^text$/i.test(g)) return "Text"; return "Understanding"; }
    var groups = ["Understanding", "Generation", "Report", "Video", "Text"];
    function render() {
      var rows = bm.filter(function (b) { return f === "all" || group(b) === f; }).sort(function (a, b) {
        var x = sk === "name" ? (a.name || a.title).toLowerCase() : (a[sk] || ""), y = sk === "name" ? (b.name || b.title).toLowerCase() : (b[sk] || "");
        return x < y ? -dir : x > y ? dir : 0;
      });
      $("bm-table").innerHTML = '<thead><tr><th data-k="name">Benchmark</th><th>Type</th><th>Input → Output</th><th data-k="org">Organization</th><th data-k="date">Released</th><th>Links</th></tr></thead><tbody>' +
        rows.map(function (b) {
          var io = (b.inp || []).join(", ") + ((b.inp || b.out) ? " → " : "") + (b.out || []).join(", ");
          var lk = [b.url && '<a href="' + esc(b.url) + '" target="_blank" rel="noopener">Paper</a>', b.data && /^https?:/.test(b.data) && '<a href="' + esc(b.data) + '" target="_blank" rel="noopener">Data</a>', b.code && '<a href="' + esc(b.code) + '" target="_blank" rel="noopener">Code</a>'].filter(Boolean).join(" · ");
          return '<tr><td style="color:var(--ink);font-weight:600;min-width:180px">' + esc(b.name || b.title) + (b.name && b.title && b.title !== b.name ? '<div style="font-weight:400;color:var(--ink-3);font-size:.8rem">' + esc(b.title.length > 90 ? b.title.slice(0, 90) + "…" : b.title) + "</div>" : "") +
            '</td><td><span class="tag">' + group(b) + '</span></td><td style="white-space:nowrap;font-family:var(--f-mono);font-size:.78rem">' + esc(io || "—") + "</td><td>" + esc(b.org || "—") + '</td><td style="white-space:nowrap">' + esc(b.date || "—") + '</td><td style="white-space:nowrap">' + lk + "</td></tr>";
        }).join("") + "</tbody>";
    }
    pressGroup($("bm-chips"), [["all", "All"]].concat(groups.map(function (g) { return [g, g]; })), f, function (v) { f = v; render(); });
    $("bm-table").addEventListener("click", function (e) { var th = e.target.closest("th[data-k]"); if (!th) return; dir = sk === th.dataset.k ? -dir : (th.dataset.k === "date" ? -1 : 1); sk = th.dataset.k; render(); });
    render();
  })();

  /* ---------- explorer ---------- */
  (function () {
    var kind = "all", q = "", shown = 24;
    var list = items.slice().sort(function (a, b) { return (b.date || "0") < (a.date || "0") ? -1 : (b.date || "0") > (a.date || "0") ? 1 : 0; });
    function hit(i) {
      if (kind !== "all" && i.kind !== kind) return false; if (!q) return true;
      return [i.title, i.name, i.org, i.base, i.backbone, i.venue, i.tldr, i.sub].join(" ").toLowerCase().indexOf(q) >= 0;
    }
    function render() {
      var r = list.filter(hit);
      $("count").textContent = r.length + (r.length === 1 ? " entry" : " entries");
      $("list").innerHTML = r.slice(0, shown).map(function (i) {
        var meta = [i.date, i.org, i.venue, (i.backbone || i.base) && "Base: " + (i.backbone || i.base), i.pipeline].filter(Boolean).map(esc).join(" · ");
        var links = [i.url && '<a href="' + esc(i.url) + '" target="_blank" rel="noopener">Paper</a>', i.code && '<a href="' + esc(i.code) + '" target="_blank" rel="noopener">Code</a>',
          i.repo && '<img src="https://img.shields.io/github/stars/' + esc(i.repo) + '?style=social" alt="GitHub stars" loading="lazy">'].filter(Boolean).join(" ");
        return '<article class="p"><div class="h"><span class="tag ' + (i.kind === "method" ? "b" : i.kind === "dataset" ? "g" : "") + '">' + esc(K[i.kind] || i.kind) + (i.sub ? " · " + esc(i.sub) : "") + "</span>" +
          (i.url ? '<a class="ti" href="' + esc(i.url) + '" target="_blank" rel="noopener">' : '<span class="ti">') + esc(i.title) + (i.url ? "</a>" : "</span>") + "</div>" +
          '<div class="m"><span>' + meta + "</span>" + links + "</div>" + (i.tldr ? '<p class="tl">' + esc(i.tldr) + "</p>" : "") + "</article>";
      }).join("");
      $("more").style.display = r.length > shown ? "" : "none";
    }
    pressGroup($("kind-chips"), [["all", "All"], ["method", "Methods"], ["dataset", "Training data"], ["benchmark", "Benchmarks"], ["survey", "Surveys"]], kind, function (v) { kind = v; shown = 24; render(); });
    $("q").addEventListener("input", function (e) { q = e.target.value.trim().toLowerCase(); shown = 24; render(); });
    $("more").addEventListener("click", function () { shown += 24; render(); });
    render();
  })();

  /* ---------- submit dialog + more reading ---------- */
  var dlg = $("submit");
  $("submit-open").addEventListener("click", function () { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); });
  $("submit-close").addEventListener("click", function () { dlg.close ? dlg.close() : dlg.removeAttribute("open"); });
  if (window.OVH_SERIES) OVH_SERIES.render($("more-grid"), "awesome");
})();
