/* Renders the data, tool-use, trajectory and extra-benchmark sections from window.LS_DATA (content.js). */
(function () {
  var D = window.LS_DATA; if (!D) return;

  /* Extra benchmarks. null = still running (shown as TBD). Fill measured numbers only. */
  var MORE_BENCH = {
    vqa: { cols: ["SimpleVQA", "WorldVQA", "FVQA", "InfoSeek"], keys: ["SimpleVQA_EN", "WorldVQA_VDR300", "FVQA_VDR300", "Infoseek_VDR300"] },
    dr:  { cols: ["MM-BrowseComp", "BrowseComp-V3", "VDR-Bench", "HR-MMSearch", "RealX-Bench", "HLE"], keys: ["MMBrowseComp", "BrowseCompV3", "VDRBench", "HRMMSearch", "RealXBench", "hle"] },
    rows: [
      ["Qwen3.5-0.8B", "Direct Answer", {}], ["Qwen3.5-0.8B", "Agent Workflow", { SimpleVQA_EN: 48.67 }], ["LiteSearcher-0.8B", "SFT", { SimpleVQA_EN: 57.00 }],
      ["Qwen3.5-2B", "Direct Answer", {}], ["Qwen3.5-2B", "Agent Workflow", { SimpleVQA_EN: 61.33 }], ["LiteSearcher-2B", "SFT", { SimpleVQA_EN: 65.00 }],
      ["Qwen3.5-4B", "Direct Answer", {}], ["Qwen3.5-4B", "Agent Workflow", { SimpleVQA_EN: 78.67, FVQA_VDR300: 70.33 }], ["LiteSearcher-4B", "SFT", { SimpleVQA_EN: 75.33 }]
    ]
  };

  var TOOL = {
    Text_Search_Tool: ["Text Search", "var(--t-text)"], Image_Search_Tool: ["Image Search", "var(--t-image)"],
    Webpage_Visit_Tool: ["Webpage Visit", "var(--t-web)"], Zoom_In_Tool: ["Zoom In", "var(--t-zoom)"],
    OCR_Tool: ["OCR", "var(--t-ocr)"], Visual_Grounding_Tool: ["Grounding", "var(--t-ground)"], Python_Coding_Agent_Tool: ["Code", "var(--t-code)"]
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function tabs(el, labels, onPick) {
    el.innerHTML = labels.map(function (l, i) { return '<button role="tab" aria-selected="' + (i === 0) + '" data-i="' + i + '">' + esc(l) + "</button>"; }).join("");
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      el.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-selected", x === b); });
      onPick(+b.dataset.i);
    });
    onPick(0);
  }
  function bar(label, pct, val, color) {
    return '<div class="bar-row"><span>' + esc(label) + '</span><div class="track"><span style="width:' + Math.min(100, pct) + "%;background:" + color + '"></span></div><span class="v">' + esc(val) + "</span></div>";
  }
  function fmtArgs(a) {
    if (typeof a === "string") return esc(a);
    return Object.keys(a).map(function (k) { var v = a[k]; return esc(k) + "=" + esc(typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v)); }).join(", ");
  }

  /* ---------- trajectory viewer (shared by data examples and eval rollouts) ---------- */
  function renderTraj(t, head, foot) {
    var h = '<div class="traj"><div class="meta">' + head + '</div><div class="q">' + esc(t.question) + '</div><div class="inimgs">' +
      t.images.map(function (src) { return '<img src="' + src + '" alt="Input image" loading="lazy">'; }).join("") + '</div><ol class="steps">';
    t.steps.forEach(function (s, i) {
      var tc = (TOOL[s.tool] || [s.tool, "var(--blue)"]);
      h += '<li class="step" style="--tc:' + tc[1] + '"><span class="n">' + (i + 1) + "</span>" +
        (s.think ? '<div class="think">“' + esc(s.think) + '”</div>' : "") +
        '<div class="call"><b>' + esc(s.tool) + "</b>(" + fmtArgs(s.args) + ")</div>" +
        (s.result ? '<div class="res">' + esc(s.result) + "</div>" : "") +
        (s.images.length ? '<div class="rimgs">' + s.images.map(function (src) { return '<img src="' + src + '" alt="Tool output image" loading="lazy">'; }).join("") + "</div>" : "") + "</li>";
    });
    return h + "</ol>" + foot + "</div>";
  }

  /* ---------- training data ---------- */
  var ds = D.datastats;
  if ($("ds-hist")) {
    var hmax = Math.max.apply(null, ds.hist.map(function (r) { return r[1]; }));
    $("ds-hist").innerHTML = ds.hist.map(function (r) { return bar(r[0] + (r[0] === 1 ? " call" : " calls"), 100 * r[1] / hmax, r[1].toLocaleString("en-US"), "var(--rule)"); }).join("");
    var cols = { "Text Search": "var(--t-text)", "Webpage Visit": "var(--t-web)", "Image Search": "var(--t-image)", "Zoom In": "var(--t-zoom)", "OCR": "var(--t-ocr)", "Other": "var(--t-code)" };
    $("ds-mix").innerHTML = Object.keys(ds.mix).map(function (k) { return bar(k, ds.mix[k], ds.mix[k].toFixed(1) + "%", cols[k]); }).join("");
    var smax = Math.max.apply(null, Object.values(ds.sources));
    $("ds-src").innerHTML = Object.keys(ds.sources).map(function (k) { return bar(k, 100 * ds.sources[k] / smax, ds.sources[k].toLocaleString("en-US"), "var(--ink-3)"); }).join("");
  }
  if ($("ex-tabs")) tabs($("ex-tabs"), D.examples.map(function (e) { return e.source; }), function (i) {
    var e = D.examples[i];
    $("ex-view").innerHTML = renderTraj(e, "Training trajectory · question from " + esc(e.source),
      '<div class="final"><div class="k">Final answer</div><div class="a">' + esc(e.answer) + "</div></div>");
  });

  /* ---------- eval trajectories ---------- */
  if ($("tr-tabs")) tabs($("tr-tabs"), D.trajectories.map(function (t) { return "LiteSearcher-" + t.size; }), function (i) {
    var t = D.trajectories[i];
    $("tr-view").innerHTML = renderTraj(t, "LiteSearcher-" + t.size + " · " + esc(t.bench) + " #" + esc(t.task) + " · " + t.steps.length + " tool calls",
      '<div class="final"><div class="k">LiteSearcher-' + t.size + " answer · judged correct</div><div class=\"a\">" + esc(t.answer) + "</div>" +
      '<div class="gt">Reference: ' + esc(t.gt) + "</div>" +
      '<div class="base">Base Qwen3.5-' + t.size + " in the same harness (" + t.base_calls + " tool call" + (t.base_calls === 1 ? "" : "s") + "), judged wrong: " + esc(t.base_answer.length > 140 ? t.base_answer.slice(0, 140) + " …" : t.base_answer) + "</div></div>");
  });

  /* ---------- tool-use stats ---------- */
  var BN = [["MMSearchPlus", "MMSearch-Plus"], ["MMSearch", "MMSearch"], ["BrowseCompVL", "BrowseComp-VL"]];
  if ($("ts-tabs")) tabs($("ts-tabs"), BN.map(function (b) { return b[1]; }), function (bi) {
    var b = BN[bi][0], rows = [];
    ["0.8B", "2B", "4B"].forEach(function (s) { ["AW", "SFT"].forEach(function (a) { rows.push([s, a, D.toolstats[s + "|" + a + "|" + b]]); }); });
    var h = "<thead><tr><th>Model</th><th>Calls</th><th>Median</th><th>No tool</th><th>Distinct</th><th>Repeat</th><th>Hit budget</th><th>Invalid</th></tr></thead><tbody>";
    rows.forEach(function (r) {
      var v = r[2], name = r[1] === "SFT" ? "LiteSearcher-" + r[0] : "Qwen3.5-" + r[0] + " AW";
      if (!v) { h += "<tr><td>" + name + '</td><td colspan="7" style="text-align:left"><span class="tbd">TBD</span></td></tr>'; return; }
      h += "<tr" + (r[1] === "SFT" ? ' class="ours"' : "") + "><td>" + name + "</td><td>" + v.mean_calls.toFixed(2) + "</td><td>" + v.median + "</td><td>" + v.zero.toFixed(1) + "%</td><td>" + v.distinct.toFixed(2) + "</td><td>" + v.repeat.toFixed(1) + "%</td><td>" + v.maxiter.toFixed(1) + "%</td><td>" + v.invalid.toFixed(1) + "%</td></tr>";
    });
    $("tbl-tools").innerHTML = h + "</tbody>";
    var order = ["Text_Search_Tool", "Webpage_Visit_Tool", "Image_Search_Tool", "Zoom_In_Tool", "OCR_Tool", "Visual_Grounding_Tool", "Python_Coding_Agent_Tool"];
    $("ts-mix").innerHTML = rows.map(function (r) {
      var v = r[2], name = r[1] === "SFT" ? "LiteSearcher-" + r[0] : "Qwen3.5-" + r[0] + " AW";
      if (!v) return '<div class="bar-row"><span>' + name + '</span><div class="track"></div><span class="v">TBD</span></div>';
      var seg = order.map(function (k) { var p = v.mix[k] || 0; return p ? '<span title="' + TOOL[k][0] + " " + p + '%" style="width:' + p + "%;background:" + TOOL[k][1] + '"></span>' : ""; }).join("");
      var other = 100 - order.reduce(function (a, k) { return a + (v.mix[k] || 0); }, 0);
      if (other > 0.05) seg += '<span title="Invalid tool names ' + other.toFixed(1) + '%" style="width:' + other + '%;background:var(--t-bad)"></span>';
      return '<div class="bar-row"><span>' + name + '</span><div class="track">' + seg + '</div><span class="v">' + v.mean_calls.toFixed(1) + "/ep</span></div>";
    }).join("");
    $("ts-legend").innerHTML = order.map(function (k) { return "<span><i style=\"background:" + TOOL[k][1] + '"></i>' + TOOL[k][0] + "</span>"; }).join("") + '<span><i style="background:var(--t-bad)"></i>Invalid name</span>';
  });

  /* ---------- extra benchmarks ---------- */
  function benchTable(el, grp) {
    var h = "<thead><tr><th>Model</th><th>Setting</th>" + grp.cols.map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr></thead><tbody>";
    MORE_BENCH.rows.forEach(function (r) {
      h += "<tr" + (r[1] === "SFT" ? ' class="ours"' : "") + "><td>" + r[0] + '</td><td style="text-align:left">' + r[1] + "</td>" +
        grp.keys.map(function (k) { var v = r[2][k]; return "<td>" + (v == null ? '<span class="tbd">TBD</span>' : v.toFixed(2)) + "</td>"; }).join("") + "</tr>";
    });
    el.innerHTML = h + "</tbody>";
  }
  if ($("tbl-vqa")) benchTable($("tbl-vqa"), MORE_BENCH.vqa);
  if ($("tbl-dr")) benchTable($("tbl-dr"), MORE_BENCH.dr);
})();
