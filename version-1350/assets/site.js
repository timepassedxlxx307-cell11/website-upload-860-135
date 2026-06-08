(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  ready(function () {
    var menuButton = document.querySelector(".menu-toggle");
    var nav = document.querySelector(".site-nav");

    if (menuButton && nav) {
      menuButton.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        menuButton.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    var hero = document.querySelector("[data-hero]");

    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
      var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
      var previous = hero.querySelector("[data-hero-prev]");
      var next = hero.querySelector("[data-hero-next]");
      var index = 0;

      function show(nextIndex) {
        if (!slides.length) {
          return;
        }

        index = (nextIndex + slides.length) % slides.length;

        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle("is-active", slideIndex === index);
        });

        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle("is-active", dotIndex === index);
        });
      }

      dots.forEach(function (dot, dotIndex) {
        dot.addEventListener("click", function () {
          show(dotIndex);
        });
      });

      if (previous) {
        previous.addEventListener("click", function () {
          show(index - 1);
        });
      }

      if (next) {
        next.addEventListener("click", function () {
          show(index + 1);
        });
      }

      show(0);
      window.setInterval(function () {
        show(index + 1);
      }, 6500);
    }

    var filterRoot = document.querySelector("[data-filter-page]");

    if (filterRoot) {
      var keyword = filterRoot.querySelector("[data-filter-keyword]");
      var region = filterRoot.querySelector("[data-filter-region]");
      var type = filterRoot.querySelector("[data-filter-type]");
      var year = filterRoot.querySelector("[data-filter-year]");
      var cards = Array.prototype.slice.call(filterRoot.querySelectorAll(".movie-card"));
      var empty = filterRoot.querySelector(".empty-state");

      function applyFilter() {
        var query = normalize(keyword && keyword.value);
        var selectedRegion = normalize(region && region.value);
        var selectedType = normalize(type && type.value);
        var selectedYear = normalize(year && year.value);
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = normalize([
            card.dataset.title,
            card.dataset.region,
            card.dataset.type,
            card.dataset.year,
            card.dataset.genre,
            card.dataset.tags
          ].join(" "));
          var matched = true;

          if (query && haystack.indexOf(query) === -1) {
            matched = false;
          }

          if (selectedRegion && normalize(card.dataset.region) !== selectedRegion) {
            matched = false;
          }

          if (selectedType && normalize(card.dataset.type) !== selectedType) {
            matched = false;
          }

          if (selectedYear && normalize(card.dataset.year) !== selectedYear) {
            matched = false;
          }

          card.hidden = !matched;

          if (matched) {
            visible += 1;
          }
        });

        if (empty) {
          empty.classList.toggle("is-visible", visible === 0);
        }
      }

      [keyword, region, type, year].forEach(function (control) {
        if (control) {
          control.addEventListener("input", applyFilter);
          control.addEventListener("change", applyFilter);
        }
      });
    }

    var searchRoot = document.querySelector("[data-search-page]");

    if (searchRoot && window.SEARCH_MOVIES) {
      var form = searchRoot.querySelector(".search-form");
      var searchInput = searchRoot.querySelector("[data-search-input]");
      var searchRegion = searchRoot.querySelector("[data-search-region]");
      var searchType = searchRoot.querySelector("[data-search-type]");
      var searchYear = searchRoot.querySelector("[data-search-year]");
      var resultGrid = searchRoot.querySelector("[data-search-results]");
      var searchEmpty = searchRoot.querySelector(".empty-state");

      function buildCard(movie) {
        var article = document.createElement("article");
        article.className = "movie-card";

        var poster = document.createElement("a");
        poster.className = "poster-link";
        poster.href = movie.file;
        poster.setAttribute("aria-label", movie.title);

        var image = document.createElement("img");
        image.src = movie.cover;
        image.alt = movie.title;
        image.loading = "lazy";
        poster.appendChild(image);

        var score = document.createElement("span");
        score.className = "score-badge";
        score.textContent = movie.rating;
        poster.appendChild(score);

        var body = document.createElement("div");
        body.className = "movie-card-body";

        var title = document.createElement("a");
        title.className = "movie-title";
        title.href = movie.file;
        title.textContent = movie.title;
        body.appendChild(title);

        var meta = document.createElement("p");
        meta.className = "movie-meta";
        meta.textContent = movie.year + " · " + movie.region + " · " + movie.type;
        body.appendChild(meta);

        var line = document.createElement("p");
        line.className = "movie-line";
        line.textContent = movie.oneLine || movie.genre;
        body.appendChild(line);

        article.appendChild(poster);
        article.appendChild(body);
        return article;
      }

      function renderSearch() {
        var query = normalize(searchInput && searchInput.value);
        var selectedRegion = normalize(searchRegion && searchRegion.value);
        var selectedType = normalize(searchType && searchType.value);
        var selectedYear = normalize(searchYear && searchYear.value);
        var results = [];

        window.SEARCH_MOVIES.forEach(function (movie) {
          var haystack = normalize([
            movie.title,
            movie.region,
            movie.type,
            movie.year,
            movie.genre,
            movie.tags,
            movie.oneLine
          ].join(" "));
          var matched = true;

          if (query && haystack.indexOf(query) === -1) {
            matched = false;
          }

          if (selectedRegion && normalize(movie.region) !== selectedRegion) {
            matched = false;
          }

          if (selectedType && normalize(movie.type) !== selectedType) {
            matched = false;
          }

          if (selectedYear && normalize(movie.year) !== selectedYear) {
            matched = false;
          }

          if (matched) {
            results.push(movie);
          }
        });

        resultGrid.innerHTML = "";

        results.slice(0, 120).forEach(function (movie) {
          resultGrid.appendChild(buildCard(movie));
        });

        if (searchEmpty) {
          searchEmpty.classList.toggle("is-visible", results.length === 0);
        }
      }

      if (form) {
        form.addEventListener("submit", function (event) {
          event.preventDefault();
          renderSearch();
        });
      }

      [searchInput, searchRegion, searchType, searchYear].forEach(function (control) {
        if (control) {
          control.addEventListener("input", renderSearch);
          control.addEventListener("change", renderSearch);
        }
      });

      renderSearch();
    }
  });
}());
