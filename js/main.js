(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Header: solid on scroll
  --------------------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  function onScrollHeader() {
    if (window.scrollY > 40) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------------------------------------------------------------------
     Mobile nav toggle
  --------------------------------------------------------------------- */
  var navToggle = document.getElementById("nav-toggle");
  var mainNav = document.getElementById("main-nav");
  navToggle.addEventListener("click", function () {
    var open = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  });
  mainNav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      mainNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  /* ---------------------------------------------------------------------
     Scroll-reveal via IntersectionObserver
  --------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal-up, .reveal-fade, .reveal-scale, .reveal-line");

  function revealNow(el) { el.classList.add("is-visible"); }

  // Above-the-fold elements must not depend on IntersectionObserver's
  // callback scheduling (some browsers/testing harnesses delay the first
  // callback past first paint) — reveal anything already on screen right away.
  function revealInitialViewport() {
    var vh = window.innerHeight;
    revealEls.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < vh && rect.bottom > 0) revealNow(el);
    });
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var delay = el.dataset.delay || 0;
            setTimeout(function () { revealNow(el); }, delay);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(revealNow);
  }

  revealInitialViewport();
  window.addEventListener("load", revealInitialViewport);

  // Stagger hero lines / actions a touch, and estrutura rows / evento cards
  document.querySelectorAll(".estrutura-row").forEach(function (el, i) {
    el.style.transitionDelay = (i * 70) + "ms";
  });
  document.querySelectorAll(".evento-card").forEach(function (el, i) {
    el.style.transitionDelay = (i * 90) + "ms";
  });

  /* ---------------------------------------------------------------------
     Hero always plays immediately (no reveal needed on video itself)
  --------------------------------------------------------------------- */

  /* ---------------------------------------------------------------------
     Authority counters (count-up)
  --------------------------------------------------------------------- */
  var counters = document.querySelectorAll(".authority-item[data-count]");
  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    var isDecimal = el.dataset.decimal === "true";
    var numberEl = el.querySelector(".authority-number");
    var suffixEl = numberEl.querySelector(".star, .pct");
    var suffixHTML = suffixEl ? suffixEl.outerHTML : "";
    var start = null;
    var duration = 1400;

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      numberEl.innerHTML = (isDecimal ? value.toFixed(1).replace(".", ",") : Math.round(value)) + suffixHTML;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window && counters.length) {
    var countIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) { countIO.observe(el); });
  }

  /* ---------------------------------------------------------------------
     Horizontal nav buttons (gallery + reviews)
  --------------------------------------------------------------------- */
  function wireTrackNav(trackSel, prevSel, nextSel, amount) {
    var track = document.querySelector(trackSel);
    var prev = document.querySelector(prevSel);
    var next = document.querySelector(nextSel);
    if (!track || !prev || !next) return;
    prev.addEventListener("click", function () { track.scrollBy({ left: -amount, behavior: "smooth" }); });
    next.addEventListener("click", function () { track.scrollBy({ left: amount, behavior: "smooth" }); });
  }
  wireTrackNav("#galeria-track", ".galeria-prev", ".galeria-next", 660);
  wireTrackNav("#reviews-track", ".reviews-prev", ".reviews-next", 400);

  /* ---------------------------------------------------------------------
     Galeria: populate from JSON + filtering + lightbox
  --------------------------------------------------------------------- */
  var galeriaData = [];
  try {
    galeriaData = JSON.parse(document.getElementById("galeria-data").textContent);
  } catch (e) { galeriaData = []; }

  var track = document.getElementById("galeria-track");

  function renderGaleria(filter) {
    track.innerHTML = "";
    var items = filter === "all" ? galeriaData : galeriaData.filter(function (d) { return d.cat === filter; });
    items.forEach(function (item, idx) {
      var a = document.createElement("a");
      a.href = item.src;
      a.className = "galeria-item";
      a.dataset.index = idx;
      a.innerHTML =
        '<img src="' + item.src + '" alt="' + item.alt + '" loading="lazy">' +
        '<span class="galeria-item-tag">' + item.label + "</span>";
      a.addEventListener("click", function (e) {
        e.preventDefault();
        openLightbox(items, idx);
      });
      track.appendChild(a);
    });
  }
  renderGaleria("all");

  document.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".filter-btn").forEach(function (b) {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
      renderGaleria(btn.dataset.filter);
      track.scrollTo({ left: 0, behavior: "smooth" });
    });
  });

  /* ---------------------------------------------------------------------
     Eventos grid cards -> open lightbox filtered by category
  --------------------------------------------------------------------- */
  var catMap = {
    "Casamentos": "casamentos",
    "Aniversários": "aniversarios",
    "Chá Revelação": "cha-revelacao",
    "Outros eventos": "cha-bebe"
  };
  document.querySelectorAll(".evento-card").forEach(function (card) {
    card.addEventListener("click", function (e) {
      e.preventDefault();
      var cat = catMap[card.dataset.cat];
      var items = galeriaData.filter(function (d) { return d.cat === cat; });
      if (items.length) openLightbox(items, 0);
    });
  });

  /* ---------------------------------------------------------------------
     Lightbox
  --------------------------------------------------------------------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var currentItems = [];
  var currentIndex = 0;

  function openLightbox(items, index) {
    currentItems = items;
    currentIndex = index;
    updateLightboxImg();
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  function updateLightboxImg() {
    var item = currentItems[currentIndex];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt;
  }
  function stepLightbox(dir) {
    currentIndex = (currentIndex + dir + currentItems.length) % currentItems.length;
    updateLightboxImg();
  }
  document.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
  document.querySelector(".lightbox-prev").addEventListener("click", function () { stepLightbox(-1); });
  document.querySelector(".lightbox-next").addEventListener("click", function () { stepLightbox(1); });
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") stepLightbox(-1);
    if (e.key === "ArrowRight") stepLightbox(1);
  });

  /* ---------------------------------------------------------------------
     Vídeo do salão — play on demand
  --------------------------------------------------------------------- */
  var salaoVideo = document.querySelector(".salao-video");
  var playBtn = document.querySelector(".video-play");
  if (salaoVideo && playBtn) {
    playBtn.addEventListener("click", function () {
      salaoVideo.play();
      playBtn.classList.add("is-playing");
    });
    salaoVideo.addEventListener("pause", function () { playBtn.classList.remove("is-playing"); });
    salaoVideo.addEventListener("ended", function () { playBtn.classList.remove("is-playing"); });
  }

  /* ---------------------------------------------------------------------
     Hero video: pause politely if autoplay blocked, no-op fallback
  --------------------------------------------------------------------- */
  var heroVideo = document.querySelector(".hero-video");
  if (heroVideo) {
    var playPromise = heroVideo.play();
    if (playPromise !== undefined) playPromise.catch(function () {});
  }
})();
