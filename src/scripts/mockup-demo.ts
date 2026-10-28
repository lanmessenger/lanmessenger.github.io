import type { Authors, DialogLine } from "../data/mockup-dialog";

/* Hero chat demo: continues the SSR-rendered dialogue flow in the mockup.
   Alice's lines are typed into the input, Bob's appear after a beat
   ("the other side is typing"); the log follows new messages like the
   real client. Purely decorative (the window is role="img"); skipped
   entirely with prefers-reduced-motion. No frameworks.
   Loaded lazily via dynamic import() after browser idle — must not
   slow down page load. */
export function playDemo(
  dialog: DialogLine[],
  startAt: number,
  authors: Authors,
): void {
  "use strict";

  var STEPS = dialog;
  var TYPE_MS = 45;
  var BOB_THINK_MS = 900;
  var START_DELAY_MS = 1200;
  var AFTER_TYPE_MS = 600;
  var HOLD_MS = 12000;
  var FADE_MS = 300;

  function wait(ms: number): Promise<void> {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function init(): void {
    var root = document.getElementById("hero-chat-demo");
    if (!root) return;
    var typed = root.querySelector(".cw-input .cw-typed");
    var log = root.querySelector(".cw-log");
    if (!typed || !log) return;
    if (!log.querySelector(".msg")) return;
    var staticHTML = log.innerHTML;
    var ref = log.querySelector(".msg") as Element;
    var scope = scopeNames(ref);
    var timeEl = log.querySelector(".head .time");
    var time = timeEl ? timeEl.textContent || "" : "";

    function scopeNames(ref: Element): string[] {
      var names: string[] = [];
      for (var i = 0; i < ref.attributes.length; i++) {
        var n = ref.attributes[i].name;
        if (n.indexOf("data-astro-cid") === 0) names.push(n);
      }
      return names;
    }

    function paintScope(el: Element, names: string[]): void {
      var k: number;
      for (k = 0; k < names.length; k++) el.setAttribute(names[k], "");
      var kids = el.querySelectorAll("*");
      for (var j = 0; j < kids.length; j++)
        for (k = 0; k < names.length; k++) kids[j].setAttribute(names[k], "");
    }

    function addLine(step: DialogLine, prevFrom: string): Element | null {
      var next = prevFrom === step.from;
      var wrap = document.createElement("div");
      if (step.from === "bob") {
        if (next) {
          wrap.className = "msg in-next demo-in";
          wrap.setAttribute("data-author", "bob");
          wrap.innerHTML = '<div class="bubble"></div>';
          var nb = wrap.querySelector(".bubble");
          if (!nb) return null;
          nb.textContent = step.text;
        } else {
          wrap.className = "msg in demo-in";
          wrap.setAttribute("data-author", "bob");
          wrap.innerHTML =
            '<img alt="" width="28" height="28"/><div class="col"><div class="head">' +
            '<span class="name"></span><span class="time"></span></div>' +
            '<div class="bubble"></div></div>';
          var img = wrap.querySelector("img");
          var nm = wrap.querySelector(".name");
          var tm = wrap.querySelector(".head .time");
          var bb = wrap.querySelector(".bubble");
          if (!img || !nm || !tm || !bb) return null;
          img.setAttribute("src", authors[step.from].avatar);
          nm.textContent = authors[step.from].name;
          tm.textContent = time;
          bb.textContent = step.text;
        }
      } else {
        if (next) {
          wrap.className = "msg out-next demo-in";
          wrap.setAttribute("data-author", "alice");
          wrap.innerHTML = '<div class="bubble"></div>';
          var ob = wrap.querySelector(".bubble");
          if (!ob) return null;
          ob.textContent = step.text;
        } else {
          wrap.className = "msg out demo-in";
          wrap.setAttribute("data-author", "alice");
          wrap.innerHTML =
            '<div class="head"><span class="you">You</span><span class="time"></span></div>' +
            '<div class="bubble"></div>';
          var ot = wrap.querySelector(".head .time");
          var ox = wrap.querySelector(".bubble");
          if (!ot || !ox) return null;
          ot.textContent = time;
          ox.textContent = step.text;
        }
      }
      paintScope(wrap, scope);
      log.appendChild(wrap);
      return wrap;
    }

    async function fadeReset(): Promise<void> {
      log.classList.add("is-switching");
      await wait(FADE_MS);
      log.innerHTML = staticHTML;
      log.scrollTop = 0;
      log.classList.remove("is-switching");
    }

    async function playFrom(k: number): Promise<void> {
      if (k <= 0 || k >= STEPS.length) return;
      var prevFrom = STEPS[k - 1].from;
      for (var s = k; s < STEPS.length; s++) {
        var step = STEPS[s];
        if (step.from === "alice") {
          typed.classList.add("is-typing");
          for (var i = 1; i <= step.text.length; i++) {
            typed.textContent = step.text.slice(0, i);
            await wait(TYPE_MS);
          }
          await wait(AFTER_TYPE_MS);
        } else {
          await wait(BOB_THINK_MS);
        }
        addLine(step, prevFrom);
        prevFrom = step.from;
        /* Real client behavior: follow new messages */
        log.scrollTop = log.scrollHeight;
        typed.textContent = "";
        typed.classList.remove("is-typing");
      }
    }

    async function loop(): Promise<void> {
      var first = true;
      for (;;) {
        await wait(START_DELAY_MS);
        while (document.hidden) await wait(500);
        /* First run continues the SSR-rendered flow, no wipe. */
        if (!first) await fadeReset();
        first = false;
        await playFrom(startAt);
        await wait(HOLD_MS);
      }
    }

    loop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}
