(() => {
  if (window.__weblitePageGuardInstalled) return;
  window.__weblitePageGuardInstalled = true;

  const root = () => document.documentElement;
  const mediaActive = () => root()?.dataset.webliteMedia === "1";
  const motionMode = () => root()?.dataset.webliteMotion || "none";
  const mediaAllowed = (el) => el?.dataset?.webliteAllowOnce === "1";

  // Stop scripted play() calls while WebLite media control is active, except
  // media the user explicitly chose with “Load once”.
  try {
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      if (mediaActive() && !mediaAllowed(this)) {
        try { this.pause(); } catch {}
        return Promise.resolve();
      }
      return originalPlay.apply(this, args);
    };
  } catch {}

  // Stop Web Animations API animations when Motion Shield is active.
  try {
    const originalAnimate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = originalAnimate.apply(this, args);
      if (motionMode() === "freeze") {
        try { animation.cancel(); } catch {}
      }
      return animation;
    };
  } catch {}

  // Many product pages use requestAnimationFrame for scroll/canvas effects.
  try {
    const originalRAF = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = function (callback) {
      if (motionMode() === "freeze") return originalRAF(() => {});
      return originalRAF(callback);
    };
  } catch {}

  // Suppress page-level scroll animation handlers only in Freeze mode.
  // Native scrolling still works; the page's decorative scroll reactions do not.
  try {
    const originalAdd = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (!listener || !["scroll", "wheel", "touchmove"].includes(String(type))) {
        return originalAdd.call(this, type, listener, options);
      }
      const wrapped = function (...args) {
        if (motionMode() === "freeze") return;
        if (typeof listener === "function") return listener.apply(this, args);
        return listener?.handleEvent?.apply(listener, args);
      };
      try { Object.defineProperty(wrapped, "__webliteOriginal", { value: listener }); } catch {}
      return originalAdd.call(this, type, wrapped, options);
    };
  } catch {}

  // Prefer reduced-motion where sites consult matchMedia dynamically.
  try {
    const originalMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = function (query) {
      const base = originalMatchMedia(query);
      if (!/prefers-reduced-motion/i.test(query)) return base;
      return new Proxy(base, {
        get(target, prop) {
          if (prop === "matches" && motionMode() !== "none") return /reduce/i.test(query);
          const value = Reflect.get(target, prop, target);
          return typeof value === "function" ? value.bind(target) : value;
        }
      });
    };
  } catch {}
})();
