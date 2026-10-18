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
    var seeds = collectSeeds();
    if (!seeds) return;
    var staticHTML = log.innerHTML;

    function copyScopeAttrs(from: Element, to: Element): void {
      for (var i = 0; i < from.attributes.length; i++) {
        var n = from.attributes[i].name;
        if (n.indexOf("data-astro-cid") === 0) to.setAttribute(n, "");
      }
    }

    function collectSeeds(): {
      alice: Element;
      bob: Element;
      next: Element;
    } | null {
      var alice = log.querySelector('.cw-msg[data-author="alice"]');
      if (!alice) return null;
      /* Static SSR may hold only the opening line: derive the missing
         seeds by cloning (scope attributes survive cloning, and addLine
         overwrites avatar/name/text on every use anyway). */
      var bob = log.querySelector('.cw-msg[data-author="bob"]');
      if (!bob) {
        bob = alice.cloneNode(true) as Element;
        bob.setAttribute("data-author", "bob");
      }
      var next = log.querySelector(".cw-next");
      if (!next) {
        next = document.createElement("div");
        next.className = "cw-next";
        copyScopeAttrs(alice, next);
        var line = alice.querySelector(".cw-line");
        if (!line) return null;
        next.appendChild(line.cloneNode(true));
      }
      return { alice: alice, bob: bob, next: next };
    }

    /* Cloned nodes keep the component scope attributes, so scoped
       .cw-msg/.cw-row/.cw-line styles apply to demo messages. */
    function addLine(step: DialogLine, prevFrom: string): Element | null {
      var node: Element;
      if (prevFrom === step.from) {
        node = seeds.next.cloneNode(true) as Element;
        node.setAttribute("data-author", step.from);
        var spans = node.querySelectorAll(".cw-line span");
        if (spans.length < 2) return null;
        spans[1].textContent = step.text;
      } else {
        node = (seeds as Record<string, Element>)[step.from].cloneNode(
          true,
        ) as Element;
        var avatar = node.querySelector(".cw-row img");
        var name = node.querySelector(".cw-name");
        var line = node.querySelectorAll(".cw-line span");
        if (!avatar || !name || line.length < 2) return null;
        avatar.setAttribute("src", authors[step.from].avatar);
        name.textContent = authors[step.from].name;
        line[1].textContent = step.text;
      }
      node.classList.add("demo-in");
      log.appendChild(node);
      return node;
    }

    async function fadeReset(): Promise<void> {
      log.classList.add("is-switching");
      await wait(FADE_MS);
      log.innerHTML = staticHTML;
      log.scrollTop = 0;
      log.classList.remove("is-switching");
    }

    async function playFrom(k: number): Promise<void> {
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
