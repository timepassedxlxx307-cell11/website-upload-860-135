(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function setupMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-menu-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      var open = panel.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero-carousel]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });
    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  function setupFilters() {
    var scopes = Array.prototype.slice.call(document.querySelectorAll("[data-filter-scope]"));
    scopes.forEach(function (scope) {
      var input = scope.querySelector("[data-filter-input]");
      var type = scope.querySelector("[data-filter-type]");
      var region = scope.querySelector("[data-filter-region]");
      var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-movie-card]"));
      var empty = scope.querySelector("[data-empty-state]");
      var params = new URLSearchParams(window.location.search);
      var q = params.get("q") || "";
      if (input && q && document.body.getAttribute("data-page") === "search") {
        input.value = q;
      }

      function apply() {
        var keyword = normalize(input ? input.value : "");
        var typeValue = normalize(type ? type.value : "");
        var regionValue = normalize(region ? region.value : "");
        var visible = 0;
        cards.forEach(function (card) {
          var text = normalize([
            card.getAttribute("data-title"),
            card.getAttribute("data-region"),
            card.getAttribute("data-type"),
            card.getAttribute("data-year"),
            card.getAttribute("data-tags"),
            card.getAttribute("data-genre")
          ].join(" "));
          var matched = true;
          if (keyword && text.indexOf(keyword) === -1) {
            matched = false;
          }
          if (typeValue && normalize(card.getAttribute("data-type")).indexOf(typeValue) === -1) {
            matched = false;
          }
          if (regionValue && normalize(card.getAttribute("data-region")).indexOf(regionValue) === -1) {
            matched = false;
          }
          card.style.display = matched ? "" : "none";
          if (matched) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle("show", visible === 0);
        }
      }

      [input, type, region].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });
      apply();
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
  });
})();

function initPlayer(streamUrl) {
  var video = document.getElementById("movie-video");
  var cover = document.getElementById("play-cover");
  if (!video || !streamUrl) {
    return;
  }
  var attached = false;

  function attach() {
    if (attached) {
      return;
    }
    attached = true;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
    } else if (window.Hls && window.Hls.isSupported()) {
      var hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
    } else {
      video.src = streamUrl;
    }
  }

  function hideCover() {
    if (cover) {
      cover.classList.add("is-hidden");
    }
  }

  function showCover() {
    if (cover && video.paused) {
      cover.classList.remove("is-hidden");
    }
  }

  function playVideo() {
    attach();
    hideCover();
    var attempt = video.play();
    if (attempt && attempt.catch) {
      attempt.catch(showCover);
    }
  }

  if (cover) {
    cover.addEventListener("click", playVideo);
  }
  video.addEventListener("click", function () {
    if (video.paused) {
      playVideo();
    }
  });
  video.addEventListener("play", hideCover);
  video.addEventListener("pause", showCover);
  video.addEventListener("ended", showCover);
}
