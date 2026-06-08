(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var slider = document.querySelector("[data-hero-slider]");
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
    if (slides.length < 2) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
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

    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    start();
  }

  function setupCardFilters() {
    var panel = document.querySelector("[data-filter-panel]");
    var list = document.querySelector("[data-card-list]");
    if (!panel || !list) {
      return;
    }
    var cards = Array.prototype.slice.call(list.querySelectorAll(".searchable-card"));
    var search = panel.querySelector("[data-card-search]");
    var genre = panel.querySelector("[data-card-genre]");
    var sort = panel.querySelector("[data-card-sort]");
    var empty = document.querySelector("[data-empty-state]");

    function apply() {
      var query = search ? search.value.trim().toLowerCase() : "";
      var genreValue = genre ? genre.value.trim().toLowerCase() : "";
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = (card.getAttribute("data-search") || "").toLowerCase();
        var matchesQuery = !query || haystack.indexOf(query) !== -1;
        var matchesGenre = !genreValue || haystack.indexOf(genreValue) !== -1;
        var show = matchesQuery && matchesGenre;
        card.style.display = show ? "" : "none";
        if (show) {
          visible += 1;
        }
      });
      if (empty) {
        empty.classList.toggle("is-visible", visible === 0);
      }
    }

    function applySort() {
      var value = sort ? sort.value : "default";
      var sorted = cards.slice();
      if (value === "year-desc") {
        sorted.sort(function (a, b) {
          return Number(b.getAttribute("data-year") || 0) - Number(a.getAttribute("data-year") || 0);
        });
      }
      if (value === "title-asc") {
        sorted.sort(function (a, b) {
          return String(a.getAttribute("data-title") || "").localeCompare(String(b.getAttribute("data-title") || ""), "zh-Hans-CN");
        });
      }
      sorted.forEach(function (card) {
        list.appendChild(card);
      });
      apply();
    }

    if (search) {
      search.addEventListener("input", apply);
    }
    if (genre) {
      genre.addEventListener("change", apply);
    }
    if (sort) {
      sort.addEventListener("change", applySort);
    }
    apply();
  }

  function setupPlayer() {
    var players = Array.prototype.slice.call(document.querySelectorAll(".video-player"));
    if (!players.length) {
      return;
    }
    players.forEach(function (player) {
      var video = player.querySelector("video");
      var button = player.querySelector(".play-overlay");
      var url = player.getAttribute("data-video");
      var prepared = false;
      var hls = null;

      function prepare() {
        if (prepared || !video || !url) {
          return;
        }
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url;
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls();
          hls.loadSource(url);
          hls.attachMedia(video);
        } else {
          video.src = url;
        }
        prepared = true;
      }

      function play() {
        prepare();
        player.classList.add("is-playing");
        video.setAttribute("controls", "controls");
        var promise = video.play();
        if (promise && promise.catch) {
          promise.catch(function () {});
        }
      }

      if (button) {
        button.addEventListener("click", play);
      }
      if (video) {
        video.addEventListener("click", function () {
          if (video.paused) {
            play();
          }
        });
      }
      window.addEventListener("pagehide", function () {
        if (hls && hls.destroy) {
          hls.destroy();
        }
      });
    });
  }

  function cardTemplate(movie) {
    var tags = (movie.tags || []).slice(0, 2).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");
    return "<article class=\"movie-card\">" +
      "<a class=\"poster-link\" href=\"./" + encodeURI(movie.file) + "\">" +
      "<img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\">" +
      "<span class=\"poster-glow\"></span><span class=\"play-chip\">▶</span></a>" +
      "<div class=\"card-content\"><div class=\"card-tags\">" + tags + "</div>" +
      "<h3><a href=\"./" + encodeURI(movie.file) + "\">" + escapeHtml(movie.title) + "</a></h3>" +
      "<p>" + escapeHtml(movie.oneLine || "") + "</p>" +
      "<div class=\"meta-row\"><span>" + escapeHtml(movie.year || "") + "</span><span>" + escapeHtml(movie.region || "") + "</span><span>" + escapeHtml(movie.type || "") + "</span></div>" +
      "</div></article>";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>\"]/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;"
      }[character];
    });
  }

  function setupSearchPage() {
    var results = document.querySelector("[data-search-results]");
    var title = document.querySelector("[data-search-title]");
    var empty = document.querySelector("[data-search-empty]");
    var input = document.querySelector("[data-search-input]");
    if (!results || !window.moviesData) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = (params.get("q") || "").trim();
    if (input) {
      input.value = query;
    }
    if (!query) {
      if (empty) {
        empty.classList.remove("is-visible");
      }
      return;
    }
    var lower = query.toLowerCase();
    var matches = window.moviesData.filter(function (movie) {
      return String(movie.search || "").toLowerCase().indexOf(lower) !== -1;
    });
    if (title) {
      title.textContent = "搜索：“" + query + "”";
    }
    results.innerHTML = matches.map(cardTemplate).join("");
    if (empty) {
      empty.classList.toggle("is-visible", matches.length === 0);
    }
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupCardFilters();
    setupPlayer();
    setupSearchPage();
  });
})();
