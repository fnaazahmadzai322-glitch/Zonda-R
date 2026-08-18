/* ============================================================
   PAGANI DUBAI — Zonda R Private Showroom
   Lenis + GSAP ScrollTrigger cinematic interactions
   ============================================================ */
(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------
     MOTION PREFERENCE

     Everything cinematic here is decorative. When the visitor asks for
     reduced motion we skip building the animations rather than building
     and disabling them — a `.from()` tween that never runs leaves the
     element at its natural, visible state, whereas one that is created
     and then killed can strand it mid-fade.
  --------------------------------------------------------- */
  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var REDUCED = reduceQuery.matches;

  // The site builds its scroll rig once at load; honouring a mid-session
  // change means rebuilding it, and a reload is the honest way to do that.
  reduceQuery.addEventListener("change", function () {
    window.location.reload();
  });

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
  // Smooth-scroll hijacking is itself a motion effect: leave the browser's
  // native scrolling alone when reduced motion is requested.
  if (!REDUCED) {
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
  }

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
      var open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.querySelectorAll(".nav__links a, .nav__mark").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("is-open"); });
    });
  }

  /* ---------------------------------------------------------
     SCROLL RAIL — progress + current section index
  --------------------------------------------------------- */
  var rail = document.getElementById("scrollRail");
  var railFill = document.getElementById("railFill");
  var railIndex = document.getElementById("railIndex");
  var railSections = gsap.utils.toArray("main > section, main > footer");

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  var railTotalEl = document.querySelector(".rail__total");
  if (railTotalEl) railTotalEl.textContent = pad(railSections.length);

  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: function (self) {
      railFill.style.height = (self.progress * 100) + "%";
      rail.classList.toggle("is-visible", self.scroll() > window.innerHeight * 0.5);

      // current section = last one whose top has passed the viewport midpoint
      var mid = window.innerHeight * 0.5;
      var current = 0;
      railSections.forEach(function (sec, i) {
        if (sec.getBoundingClientRect().top <= mid) current = i;
      });
      railIndex.textContent = pad(current + 1);
    }
  });

  // Fallback in case JS runs before load event races
  window.addEventListener("load", function () {
    if (loader && !loader.classList.contains("is-hidden")) finishLoader();
  });

  // The hero's own motion — video scrub, title wipe, car reveal — is driven
  // entirely by the scroll rig set up below (see "HERO — the opening
  // sequence"). It replaces what used to be a load-time intro timeline plus a
  // separate parallax pass: one scroll-linked source of truth instead of two
  // animations racing each other over the same elements.

  /* ---------------------------------------------------------
     SECTION HEAD REVEALS (generic)
  --------------------------------------------------------- */
  if (!REDUCED) {
    document.querySelectorAll(".section-eyebrow, .section-title, .section-lede").forEach(function (el) {
      if (el.closest(".hero") || el.closest(".reveal")) return;
      gsap.from(el, {
        y: 34, opacity: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });
  }

  /* ---------------------------------------------------------
     COLLECTION — video-in reveal + stat counters
  --------------------------------------------------------- */
  // `transform` on #collectionVideo belongs solely to the view-switching
  // code below — a scrubbed tween here would overwrite the zoom on the next
  // scroll tick. The intro animates the frame's opacity instead, and the
  // depth that parallax used to provide now comes from the 3D tilt.
  if (!REDUCED) {
    gsap.from("#collectionVideoWrap", {
      opacity: 0, duration: 1.1, ease: "power2.out",
      scrollTrigger: { trigger: "#showcaseViewport", start: "top 80%", once: true }
    });
  }

  /* ---------------------------------------------------------
     COLLECTION — interactive 3D showcase (tilt + view switching)
  --------------------------------------------------------- */
  var showcaseViewport = document.getElementById("showcaseViewport");
  var showcaseDepth = document.getElementById("showcaseDepth");
  var showcaseGlow = document.getElementById("showcaseGlow");
  var showcaseCar = document.getElementById("collectionVideo");
  var showcaseLabel = document.getElementById("showcaseLabel");
  var showcaseIndex = document.getElementById("showcaseIndex");
  var showcaseTicks = gsap.utils.toArray(".showcase__tick");

  // Ordered, not keyed by name: scroll progress through the viewport picks
  // an index, so the list order *is* the sequence the visitor scrolls through.
  // Only scale varies — the content here is a playing video, and cropping to
  // a fixed object-position on a constantly-moving frame reads as an
  // accident rather than a chosen composition, unlike it did on a still photo.
  var VIEWS = [
    { scale: 1,    label: "Overview" },
    { scale: 1.35, label: "Assembly" },
    { scale: 1.8,  label: "Detail" }
  ];

  if (showcaseViewport && showcaseCar) {
    var activeView = -1;
    function setView(i) {
      if (i === activeView) return;
      activeView = i;
      var view = VIEWS[i];
      showcaseCar.style.transform = "scale(" + view.scale + ")";
      showcaseLabel.textContent = view.label;
      if (showcaseIndex) showcaseIndex.textContent = (i + 1 < 10 ? "0" : "") + (i + 1);
      showcaseTicks.forEach(function (t, ti) { t.classList.toggle("is-active", ti === i); });
      if (!REDUCED) {
        gsap.fromTo(showcaseLabel, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
      }
    }

    // The car drifts through Profile → Front → Detail purely as it crosses
    // the viewport — no click target, matching every other reveal on the
    // page, which all fire from the mouse wheel rather than a control.
    ScrollTrigger.create({
      trigger: showcaseViewport,
      start: "top 75%",
      end: "bottom 25%",
      onUpdate: function (self) {
        var i = Math.min(VIEWS.length - 1, Math.floor(self.progress * VIEWS.length));
        setView(i);
      },
      onLeaveBack: function () { setView(0); }
    });
  }

  if (showcaseViewport && showcaseDepth) {
    var tiltX = 0, tiltY = 0, targetX = 0, targetY = 0, tiltRAF = null;

    function renderTilt() {
      tiltX += (targetX - tiltX) * 0.12;
      tiltY += (targetY - tiltY) * 0.12;
      showcaseDepth.style.transform =
        "rotateX(" + tiltY.toFixed(3) + "deg) rotateY(" + tiltX.toFixed(3) + "deg)";
      if (Math.abs(targetX - tiltX) > 0.01 || Math.abs(targetY - tiltY) > 0.01) {
        tiltRAF = requestAnimationFrame(renderTilt);
      } else {
        tiltRAF = null;
      }
    }
    function queueTilt() {
      if (!tiltRAF) tiltRAF = requestAnimationFrame(renderTilt);
    }

    // Tilt is the decorative half of the showcase; the view tabs below are
    // the functional half and stay available either way.
    if (!REDUCED) {
      showcaseViewport.addEventListener("mousemove", function (e) {
        var r = showcaseViewport.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        targetX = (px - 0.5) * 14;   // rotateY
        targetY = (0.5 - py) * 9;    // rotateX
        showcaseGlow.style.left = (px * 100) + "%";
        showcaseGlow.style.top = (py * 100) + "%";
        queueTilt();
      });

      showcaseViewport.addEventListener("mouseleave", function () {
        targetX = 0; targetY = 0;
        queueTilt();
      });
    }
  }

  function writeCount(el, value, decimals) {
    el.firstChild.nodeValue = decimals ? value.toFixed(decimals) : Math.round(value);
  }

  function animateCount(el, target, decimals) {
    // The number is the content, not the effect — reduced motion still
    // needs the real figure, just without the count-up.
    if (REDUCED) { writeCount(el, target, decimals); return; }
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: "power2.out",
      onUpdate: function () { writeCount(el, obj.v, decimals); }
    });
  }

  document.querySelectorAll(".stat-card").forEach(function (card) {
    var valueEl = card.querySelector(".stat-card__value");
    var target = parseFloat(card.dataset.value);
    var decimals = card.dataset.decimals ? parseInt(card.dataset.decimals, 10) : 0;
    ScrollTrigger.create({
      trigger: card, start: "top 85%", once: true,
      onEnter: function () {
        if (!REDUCED) gsap.from(card, { y: 24, opacity: 0, duration: 0.7, ease: "power3.out" });
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

  /* =========================================================
     SCROLL-SCRUBBED VIDEO

     Two sections drive a video's playhead from scroll position. An earlier
     version of this fetched each clip to a blob before scrubbing, on the
     theory that seeking a streamed file issues a range request per seek and
     the frame lands late. That fetch turned out to be the actual point of
     failure in production — on at least one real host the video simply
     never appeared, because everything depended on that fetch succeeding
     and nothing was visible if it didn't.

     The fix is to stop depending on it. Every <video> here now carries
     autoplay + loop in the markup, which is the same mechanism every
     background-video site relies on and works with zero JavaScript: the
     browser fetches and decodes the file on its own, so there's a frame on
     screen from the first paint regardless of what this script does. Scroll
     scrubbing is layered on top as an enhancement — the first seek pauses
     the loop and hands control to scroll — and if seeking never engages for
     any reason, the visitor still sees the video playing, just not scrubbed.

     Seeking: assigning currentTime while a seek is already in flight makes
     the browser drop the intermediate targets, which is what makes naive
     scrubbing stutter. Keep one seek in flight and always resume toward the
     newest target once it lands.

     Handoff from autoplay to scroll must be irreversible. The first seek
     calls .pause(), but the video still carries the `loop` attribute in the
     markup — if pause doesn't fully land before the browser's own loop
     logic checks in (a buffering stall, a timing race, any of several
     device-specific quirks that don't reproduce in every environment), the
     native loop can resume and the video keeps playing on its own while the
     text — pure scroll-math, independent of the video — keeps tracking
     scroll correctly. The result: text moves, video doesn't, and they look
     disconnected. So once scrubbing engages: drop the loop attribute
     entirely (there is no correct reason for it to still be set once scroll
     owns the playhead), and if `play` ever fires afterward anyway, treat it
     as a bug and immediately re-pause — self-healing regardless of what
     triggered it, rather than a fix aimed at one specific cause.
     ========================================================= */
  function createScrubber(video) {
    var pendingTime = null;
    var isSeeking = false;
    var seekTimeoutId = null;
    var engaged = false;

    function duration() {
      var d = video && video.duration;
      return isFinite(d) && d > 0 ? d : null;
    }

    function flush() {
      var d = duration();
      if (isSeeking || pendingTime === null || !d) return;
      var t = pendingTime;
      pendingTime = null;
      isSeeking = true;
      // Safety valve: if `seeked` never fires (it won't, for a target the
      // browser treats as a no-op, among other edge cases), don't let that
      // wedge every future seek — self-clear and let the next one through.
      clearTimeout(seekTimeoutId);
      seekTimeoutId = setTimeout(function () { isSeeking = false; flush(); }, 400);
      try { video.currentTime = t; } catch (e) { isSeeking = false; }
    }

    if (video) {
      video.addEventListener("seeked", function () {
        clearTimeout(seekTimeoutId);
        isSeeking = false;
        flush();
      });
      video.addEventListener("play", function () {
        if (engaged) video.pause();
      });
    }

    return {
      seekTo: function (progress) {
        var d = duration();
        if (!d) return;
        if (!engaged) {
          engaged = true;
          video.loop = false;
        }
        if (!video.paused) video.pause();
        // hold a hair inside the end: seeking exactly to duration can park
        // on a blank frame in some browsers
        pendingTime = Math.min(progress, 0.999) * d;
        flush();
      }
    };
  }

  /* ---------------------------------------------------------
     HERO — the opening sequence, scrubbed from the very first scroll
  --------------------------------------------------------- */
  var heroScrubber = createScrubber(heroVideo);
  var heroScrollCue = document.getElementById("heroScrollCue");
  var heroChapterNav = document.getElementById("heroChapterNav");
  var heroChapterIndex = document.getElementById("heroChapterIndex");
  var heroChapterBar = document.getElementById("heroChapterBar");

  // Three beats told in the same slot: brand, then chassis, then engine —
  // each a huge headline plus one short line, echoing the Engineering
  // section below but at hero scale and in miniature. inStart/outStart are
  // hero-scroll fractions (0–1); each line within a chapter staggers off
  // that by its index, so lines wipe in and out one at a time rather than
  // all at once. The last chapter has no outStart — it holds through the
  // end of the hero rather than clearing the stage for nothing.
  var CHAPTERS = [
    { inStart: 0.015, outStart: 0.24 },
    { inStart: 0.40,  outStart: 0.60 },
    { inStart: 0.76,  outStart: null }
  ];
  var STAGGER = 0.045;

  var chapterEls = gsap.utils.toArray(".hero__chapter");
  var chapters = chapterEls.map(function (el, ci) {
    return {
      lines: gsap.utils.toArray(".hero__line", el),
      cfg: CHAPTERS[ci]
    };
  });

  if (!REDUCED) {
    ScrollTrigger.create({
      trigger: ".hero",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onUpdate: function (self) {
        var p = self.progress;
        heroScrubber.seekTo(p);

        var current = 0;
        chapters.forEach(function (chapter, ci) {
          var cfg = chapter.cfg;
          chapter.lines.forEach(function (line, i) {
            var inAt = cfg.inStart + i * STAGGER;
            var outAt = cfg.outStart === null ? null : cfg.outStart + i * STAGGER;
            if (p < inAt) {
              line.classList.remove("is-in", "is-out");
            } else if (outAt !== null && p >= outAt) {
              line.classList.remove("is-in");
              line.classList.add("is-out");
            } else {
              line.classList.add("is-in");
              line.classList.remove("is-out");
            }
          });
          // "current" chapter for the nav readout = the last one that has
          // started wiping in — matches what's actually readable on screen.
          if (p >= cfg.inStart) current = ci;
        });

        if (heroChapterIndex) heroChapterIndex.textContent = "0" + (current + 1);
        if (heroChapterBar) heroChapterBar.style.width = (p * 100) + "%";

        // the cue and the chapter nav share one job, handed off once scrolling starts
        var scrolling = p > 0.01;
        if (heroScrollCue) heroScrollCue.style.opacity = scrolling ? 0 : 1;
        if (heroChapterNav) heroChapterNav.classList.toggle("is-visible", scrolling);
      }
    });
  }

  /* ---------------------------------------------------------
     3D REVEAL — still photo + callouts scrubbed by scroll
  --------------------------------------------------------- */
  var revealImage = document.getElementById("revealImage");
  var revealCallouts = gsap.utils.toArray(".reveal__callout");
  var revealProgressBar = document.getElementById("revealProgressBar");

  /* The bar and the text reveals are pure scroll-math and run the moment the
     section is on screen. There's no footage to scrub against a still photo,
     so a slow continuous zoom carries the section's motion instead — that
     part is decorative, so it's skipped under reduced motion same as the
     hero/performance/showroom parallax elsewhere; the bar and callouts never
     are, because they're content. */
  ScrollTrigger.create({
    trigger: ".reveal",
    start: "top top",
    end: "bottom bottom",
    scrub: 0.4,
    onUpdate: function (self) {
      var progress = self.progress;
      if (!REDUCED && revealImage) {
        revealImage.style.transform = "scale(" + (1 + progress * 0.18) + ")";
      }
      revealProgressBar.style.width = (progress * 100) + "%";
      revealCallouts.forEach(function (c) {
        var at = parseFloat(c.dataset.at);
        c.classList.toggle("is-active", progress >= at && progress < at + 0.20);
      });
    }
  });

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

  // Embers read as fire rather than electrical spark: hotter colour, larger,
  // slower, and they wander sideways as they rise.
  function spawnEmber() {
    var e = document.createElement("span");
    e.className = "ember";
    var x = 8 + Math.random() * 84;
    var drift = (Math.random() - 0.5) * 90;
    var rise = 220 + Math.random() * 340;
    var size = 2 + Math.random() * 4;
    e.style.left = x + "%";
    e.style.width = size + "px";
    e.style.height = size + "px";
    sparkHost.appendChild(e);
    gsap.timeline({ onComplete: function () { e.remove(); } })
      .fromTo(e, { y: 0, opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" })
      .to(e, {
        y: -rise, x: drift, opacity: 0,
        duration: 1.8 + Math.random() * 1.4, ease: "power1.out"
      }, 0)
      .to(e, {
        x: drift + (Math.random() - 0.5) * 60,
        duration: 0.9, repeat: 1, yoyo: true, ease: "sine.inOut"
      }, 0.2);
  }

  var emberInterval = null;
  var perfHeat = document.getElementById("perfHeat");

  function startPerfFx() {
    if (perfVideo) perfVideo.play().catch(function () {});
    // Sparks and embers are the most motion-heavy thing on the page; the
    // heat wash is a static gradient, so it stays either way.
    if (!REDUCED) {
      if (!sparkInterval) sparkInterval = setInterval(spawnSpark, 90);
      if (!emberInterval) emberInterval = setInterval(spawnEmber, 140);
    }
    if (perfHeat) gsap.to(perfHeat, { opacity: 1, duration: REDUCED ? 0 : 1.2, ease: "power2.out" });
  }

  function stopPerfFx() {
    if (sparkInterval) { clearInterval(sparkInterval); sparkInterval = null; }
    if (emberInterval) { clearInterval(emberInterval); emberInterval = null; }
    if (perfHeat) gsap.to(perfHeat, { opacity: 0, duration: 0.6, ease: "power2.in" });
  }

  ScrollTrigger.create({
    trigger: perfSection, start: "top 70%", end: "bottom 30%",
    onEnter: startPerfFx,
    onLeave: stopPerfFx,
    onEnterBack: startPerfFx,
    onLeaveBack: stopPerfFx
  });

  // Particles are wasted work in a hidden tab, and pausing avoids a
  // burst of queued tweens when the user returns.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopPerfFx();
  });

  if (!REDUCED) {
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
  }

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

    // "Please choose a date" is the wrong complaint when one *is* chosen and
    // simply falls outside the bookable window — say which it is.
    if (input.id === "cf-date") {
      var err = field.querySelector(".field__error");
      if (err) {
        err.textContent = (!valid && input.value)
          ? "Please choose a date within the next year"
          : "Please choose a date";
      }
    }
    return valid;
  }

  // A viewing can only be booked forward. Set in JS rather than hard-coding a
  // date in the markup, which would silently go stale the day after shipping.
  var dateField = document.getElementById("cf-date");
  if (dateField) {
    var today = new Date();
    var horizon = new Date(today.getTime());
    horizon.setFullYear(horizon.getFullYear() + 1);
    var iso = function (d) { return d.toISOString().slice(0, 10); };
    dateField.min = iso(today);
    dateField.max = iso(horizon);
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
