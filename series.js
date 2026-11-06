/* Shared "More reading" list for the OpenVLHarness family of pages on threesr.github.io.
   Any page can include <script src="/series.js"></script> and call
   OVH_SERIES.render(containerElement, "<own id>") to list the other entries.
   To add or update an entry, edit ITEMS below; href: null renders the card as "Coming soon". */
(function () {
  var ITEMS = [
    { id: "openvlharness", kind: "Framework", title: "OpenVLHarness",
      blurb: "A training-free harness that gives multimodal LLMs a capability layer and persistent multimodal memory.",
      href: "https://openvlharness.github.io/", art: "harness" },
    { id: "unisearcher", kind: "Paper", title: "UniSearcher",
      blurb: "One visual agent for search-augmented understanding and generation.",
      href: null, art: "unisearcher" },
    { id: "toolsmith", kind: "Paper", title: "ToolSmith",
      blurb: "A multimodal search agent grows its own verified, reusable Python tools from its failures.",
      href: "https://threesr.github.io/toolsmith/", art: "toolsmith" },
    { id: "awesome", kind: "Paper list", title: "Awesome Multimodal Deep Research",
      blurb: "A living map of multimodal deep research: methods, open training data, benchmarks and reported results.",
      href: "https://threesr.github.io/awesome/", art: "awesome" },
    { id: "litesearcher", kind: "Release", title: "LiteSearcher",
      blurb: "Multimodal search agents at 0.8B, 2B and 4B, with open training data and trajectories.",
      href: "https://threesr.github.io/litesearcher/", art: "litesearcher" }
  ];

  /* Small line-art motifs, drawn in currentColor so they follow each page's theme. */
  var ART = {
    harness: '<g fill="none" stroke="currentColor" stroke-width="1.2" opacity=".7"><rect x="70" y="30" width="60" height="60" rx="10"/><path d="M100 30V12M100 108V90M70 60H40M160 60H130"/></g><g fill="currentColor"><circle cx="100" cy="10" r="4"/><circle cx="100" cy="110" r="4"/><circle cx="38" cy="60" r="4"/><circle cx="162" cy="60" r="4"/><circle cx="100" cy="60" r="7"/></g>',
    unisearcher: '<g fill="none" stroke="currentColor" stroke-width="1.2" opacity=".75"><circle cx="84" cy="60" r="34"/><circle cx="116" cy="60" r="34"/></g><path d="M100 33a34 34 0 0 1 0 54a34 34 0 0 1 0-54z" fill="currentColor" opacity=".35"/>',
    toolsmith: '<g fill="none" stroke="currentColor" stroke-width="1.2" opacity=".7"><path d="M100 22l33 19v38l-33 19-33-19V41z"/><path d="M100 22v38l33 19M100 60L67 79"/></g><circle cx="100" cy="60" r="5" fill="currentColor"/>',
    awesome: '<g fill="none" stroke="currentColor" stroke-width="1.2" opacity=".7"><rect x="48" y="22" width="104" height="76" rx="8"/><path d="M62 42h50M62 58h76M62 74h40"/></g><g fill="currentColor"><circle cx="138" cy="42" r="5"/><circle cx="116" cy="74" r="4"/></g>',
    litesearcher: '<g fill="none" stroke="currentColor" stroke-width="1.2" opacity=".6"><path d="M40 94H164M40 94V20"/><path d="M58 80L98 58L142 30" stroke-dasharray="3 4"/></g><g fill="currentColor"><circle cx="58" cy="80" r="4"/><circle cx="98" cy="58" r="6"/><circle cx="142" cy="30" r="8"/></g>'
  };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function render(el, selfId) {
    if (!el) return;
    el.innerHTML = ITEMS.filter(function (it) { return it.id !== selfId; }).map(function (it) {
      var tag = it.href ? "a" : "div";
      var attrs = it.href ? ' href="' + esc(it.href) + '"' : ' aria-disabled="true"';
      return "<" + tag + ' class="mr-card' + (it.href ? "" : " soon") + '"' + attrs + ">" +
        '<div class="mr-art mr-' + esc(it.art) + '"><svg viewBox="0 0 200 120" aria-hidden="true">' + (ART[it.art] || "") + "</svg></div>" +
        '<div class="mr-body"><div class="mr-kind">' + esc(it.kind) + (it.href ? "" : " · Coming soon") + "</div>" +
        '<div class="mr-title">' + esc(it.title) + '</div><p class="mr-blurb">' + esc(it.blurb) + "</p>" +
        (it.href ? '<span class="mr-go" aria-hidden="true">Read →</span>' : "") + "</div></" + tag + ">";
    }).join("");
  }

  window.OVH_SERIES = { items: ITEMS, render: render };
})();
