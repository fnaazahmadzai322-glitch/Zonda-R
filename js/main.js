/* ============================================================
   PAGANI DUBAI — Zonda R Private Showroom
   Lenis + GSAP ScrollTrigger cinematic interactions
   ============================================================ */
(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------
     LOADER
  --------------------------------------------------------- */
  var loader = document.getElementById("loader");
  var loaderProgress = document.getElementById("loaderProgress");
  var heroVideo = document.getElementById("heroVideo");

  function finishLoader() {
    if (!loader) return;
    loaderProgress.style.width = "100%";
    setTimeout(function () {
      loader.classList.add("is-hidden");
      document.body.style.overflow = "";
      playHeroIntro();
    }, 260);
  }

  (function fakeProgress() {
    var p = 0;
    var iv = setInterval(function () {
      p += Math.random() * 18;
      if (p >= 92) { p = 92; clearInterval(iv); }
      loaderProgress.style.width = p + "%";
    }, 140);
    var done = false;
    function markReady() {
      if (done) return;
      done = true;
      clearInterval(iv);
      finishLoader();
    }
    if (heroVideo) {
      if (heroVideo.readyState >= 3) markReady();
      else heroVideo.addEventListener("canplaythrough", markReady, { once: true });
    }
    setTimeout(markReady, 2200);
  })();

  /* ---------------------------------------------------------
     LENIS SMOOTH SCROLL <-> SCROLLTRIGGER
  --------------------------------------------------------- */
  var lenis = new Lenis({
    duration: 1.15,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    smoothWheel: true,
    touchMultiplier: 1.1
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add(function (time) {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  /* ---------------------------------------------------------
     NAV
  --------------------------------------------------------- */
  var nav = document.getElementById("siteNav");
  ScrollTrigger.create({
    start: 40,
    end: "max",
    onUpdate: function (self) {
      nav.classList.toggle("is-scrolled", self.scroll() > 40);
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -70, duration: 1.4 });
    });
  });

  var burger = document.getElementById("navBurger");
  if (burger) {
    burger.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
    nav.querySelectorAll(".nav__links a, .nav__mark").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("is-open"); });
    });
  }

  /* ---------------------------------------------------------
     HERO INTRO
  --------------------------------------------------------- */
  function playHeroIntro() {
    var tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.from(".hero__topbar", { y: -24, opacity: 0, duration: 0.9 }, 0.1)
      .from(".hero__car", { opacity: 0, scale: 1.08, filter: "brightness(0.4)", duration: 1.4, ease: "power3.out" }, 0.15)
      .from(".hero__title .reveal-line", {
        yPercent: 120, opacity: 0, duration: 1.1, stagger: 0.12
      }, 0.5)
      .from(".hero__tagline", { y: 16, opacity: 0, duration: 0.8 }, 0.85)
      .from(".hero__scroll-cue", { opacity: 0, duration: 0.8 }, 1.0)
      // clearProps is required: a lingering transform on .nav would become the
      // containing block for the position:fixed mobile menu, clipping it to the header.
      .from(".nav", { y: -20, opacity: 0, duration: 0.7, clearProps: "transform" }, 0.2);
  }

  // Fallback in case JS runs before load event races
  window.addEventListener("load", function () {
    if (loader && !loader.classList.contains("is-hidden")) finishLoader();
  });

  /* Hero parallax on scroll */
  gsap.to(".hero__car-wrap", {
    yPercent: 12,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });
  gsap.to(".hero__video", {
    yPercent: 10,
    scale: 1.12,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });
  gsap.to(".hero__title-block", {
    yPercent: -18,
    opacity: 0.2,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });

  /* ---------------------------------------------------------
     SECTION HEAD REVEALS (generic)
  --------------------------------------------------------- */
  document.querySelectorAll(".section-eyebrow, .section-title, .section-lede").forEach(function (el) {
    if (el.closest(".hero") || el.closest(".reveal")) return;
    gsap.from(el, {
      y: 34, opacity: 0, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true }
    });
  });

  /* ---------------------------------------------------------
     COLLECTION — image parallax + stat counters
  --------------------------------------------------------- */
  gsap.from("#collectionImage", {
    scale: 1.18, duration: 1.4, ease: "power2.out",
    scrollTrigger: { trigger: "#collectionImageWrap", start: "top 80%", once: true }
  });
  gsap.to("#collectionImage", {
    yPercent: -8, ease: "none",
    scrollTrigger: { trigger: "#collectionImageWrap", start: "top bottom", end: "bottom top", scrub: true }
  });

  function animateCount(el, target, decimals) {
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: "power2.out",
      onUpdate: function () {
        el.firstChild.nodeValue = decimals ? obj.v.toFixed(decimals) : Math.round(obj.v);
      }
    });
  }

  document.querySelectorAll(".stat-card").forEach(function (card) {
    var valueEl = card.querySelector(".stat-card__value");
    var target = parseFloat(card.dataset.value);
    var decimals = card.dataset.decimals ? parseInt(card.dataset.decimals, 10) : 0;
    ScrollTrigger.create({
      trigger: card, start: "top 85%", once: true,
      onEnter: function () {
        gsap.from(card, { y: 24, opacity: 0, duration: 0.7, ease: "power3.out" });
        animateCount(valueEl, target, decimals);
      }
    });
  });

  document.querySelectorAll(".perf-metric__value").forEach(function (el) {
    var target = parseFloat(el.dataset.count);
    var decimals = (el.dataset.count.indexOf(".") > -1) ? 2 : 0;
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: function () { animateCount(el, target, decimals); }
    });
  });

  /* ---------------------------------------------------------
     3D REVEAL — video scrubbed by scroll + callouts
  --------------------------------------------------------- */
  var revealVideo = document.getElementById("revealVideo");
  var revealCallouts = gsap.utils.toArray(".reveal__callout");
  var revealProgressBar = document.getElementById("revealProgressBar");

  // Progress bar + callouts are pure scroll-math and must work the instant
  // the section is on screen. Video scrubbing is a progressive enhancement
  // layered on top once the browser actually has duration/metadata — it
  // must never gate the rest of the section on a network/codec event.
  ScrollTrigger.create({
    trigger: ".reveal",
    start: "top top",
    end: "bottom bottom",
    scrub: 0.4,
    onUpdate: function (self) {
      var progress = self.progress;
      if (revealVideo && revealVideo.duration) {
        try { revealVideo.currentTime = progress * revealVideo.duration; } catch (e) {}
      }
      revealProgressBar.style.width = (progress * 100) + "%";
      revealCallouts.forEach(function (c) {
        var at = parseFloat(c.dataset.at);
        c.classList.toggle("is-active", progress >= at && progress < at + 0.22);
      });
    }
  });

  if (revealVideo && revealVideo.readyState < 1) {
    revealVideo.load();
  }

  /* ---------------------------------------------------------
     PERFORMANCE — driving video autoplay in view + sparks
  --------------------------------------------------------- */
  var perfVideo = document.getElementById("perfVideo");
  var perfSection = document.querySelector(".performance");
  var sparkHost = document.getElementById("perfSparks");
  var sparkInterval = null;

  function spawnSpark() {
    var s = document.createElement("span");
    s.className = "spark";
    var x = 40 + Math.random() * 55;
    var drift = (Math.random() - 0.5) * 140;
    var rise = 160 + Math.random() * 260;
    var size = 1.5 + Math.random() * 2.5;
    s.style.left = x + "%";
    s.style.width = size + "px";
    s.style.height = size + "px";
    sparkHost.appendChild(s);
    gsap.fromTo(s,
      { y: 0, opacity: 1 },
      {
        y: -rise, x: drift, opacity: 0, duration: 1.1 + Math.random() * 0.8, ease: "power1.out",
        onComplete: function () { s.remove(); }
      }
    );
  }

  ScrollTrigger.create({
    trigger: perfSection, start: "top 70%", end: "bottom 30%",
    onEnter: function () {
      if (perfVideo) perfVideo.play().catch(function(){});
      if (!sparkInterval) sparkInterval = setInterval(spawnSpark, 90);
    },
    onLeave: function () {
      if (sparkInterval) { clearInterval(sparkInterval); sparkInterval = null; }
    },
    onEnterBack: function () {
      if (perfVideo) perfVideo.play().catch(function(){});
      if (!sparkInterval) sparkInterval = setInterval(spawnSpark, 90);
    },
    onLeaveBack: function () {
      if (sparkInterval) { clearInterval(sparkInterval); sparkInterval = null; }
    }
  });

  gsap.to(".performance__video", {
    scale: 1.1, ease: "none",
    scrollTrigger: { trigger: perfSection, start: "top bottom", end: "bottom top", scrub: true }
  });

  /* ---------------------------------------------------------
     SHOWROOM map subtle parallax
  --------------------------------------------------------- */
  gsap.from(".showroom__map", {
    opacity: 0, scale: 0.92, duration: 1.1, ease: "power3.out",
    scrollTrigger: { trigger: ".showroom__map", start: "top 85%", once: true }
  });

  /* ---------------------------------------------------------
     STORY reveal
  --------------------------------------------------------- */
  gsap.from(".story__lead", {
    opacity: 0, y: 24, duration: 1, ease: "power3.out",
    scrollTrigger: { trigger: ".story__grid", start: "top 82%", once: true }
  });
  gsap.from(".story__col", {
    opacity: 0, y: 24, duration: 0.9, stagger: 0.15, ease: "power3.out",
    scrollTrigger: { trigger: ".story__columns", start: "top 82%", once: true }
  });

  /* ---------------------------------------------------------
     CONSULTATION FORM
  --------------------------------------------------------- */
  var form = document.getElementById("consultForm");
  var success = document.getElementById("consultSuccess");
  var resetBtn = document.getElementById("consultReset");

  function validateField(field) {
    var input = field.querySelector("input, textarea");
    if (!input.hasAttribute("required")) return true;
    var valid = input.checkValidity() && input.value.trim() !== "";
    field.classList.toggle("is-invalid", !valid);
    return valid;
  }

  if (form) {
    form.querySelectorAll(".field input, .field textarea").forEach(function (input) {
      input.setAttribute("placeholder", " ");
      input.addEventListener("blur", function () { validateField(input.closest(".field")); });
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field.classList.contains("is-invalid")) validateField(field);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fields = form.querySelectorAll(".field");
      var allValid = true;
      fields.forEach(function (f) { if (!validateField(f)) allValid = false; });
      if (!allValid) {
        var firstInvalid = form.querySelector(".field.is-invalid input, .field.is-invalid textarea");
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      gsap.to(form, {
        opacity: 0, y: -12, duration: 0.35, ease: "power2.in",
        onComplete: function () {
          form.classList.add("is-hidden");
          success.classList.add("is-visible");
          gsap.fromTo(success, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
          var path = success.querySelector(".consult-success__mark path");
          var len = path.getTotalLength();
          gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.6, delay: 0.2, ease: "power2.out" });
        }
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        form.reset();
        form.querySelectorAll(".field").forEach(function (f) { f.classList.remove("is-invalid"); });
        success.classList.remove("is-visible");
        form.classList.remove("is-hidden");
        gsap.set(form, { opacity: 1, y: 0 });
      });
    }
  }

  /* ---------------------------------------------------------
     Refresh ScrollTrigger after everything is laid out
  --------------------------------------------------------- */
  window.addEventListener("load", function () {
    ScrollTrigger.refresh();
  });
})();
