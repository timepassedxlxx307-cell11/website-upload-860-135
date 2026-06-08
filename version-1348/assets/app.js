(function () {
  function select(selector, parent) {
    return (parent || document).querySelector(selector);
  }

  function selectAll(selector, parent) {
    return Array.prototype.slice.call((parent || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setupMobileMenu() {
    var button = select("[data-mobile-menu-button]");
    var menu = select("[data-mobile-menu]");

    if (!button || !menu) {
      return;
    }

    button.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function setupHeroCarousel() {
    var root = select("[data-hero-carousel]");

    if (!root) {
      return;
    }

    var slides = selectAll(".hero-slide", root);
    var dots = selectAll(".hero-dot", root);
    var prev = select("[data-slide-prev]", root);
    var next = select("[data-slide-next]", root);
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        start();
      });
    }

    show(0);
    start();
  }

  function setupSearchForms() {
    selectAll("[data-search-form]").forEach(function (form) {
      form.addEventListener("submit", function () {
        var input = select("input[name='q']", form);
        if (input) {
          input.value = input.value.trim();
        }
      });
    });
  }

  function setupLocalFilters() {
    var grid = select("[data-movie-grid]");

    if (!grid) {
      return;
    }

    var cards = selectAll("[data-title]", grid);
    var search = select("[data-local-search]");
    var year = select("[data-filter-year]");
    var region = select("[data-filter-region]");

    function fillSelect(selectBox, key) {
      if (!selectBox || selectBox.options.length > 1) {
        return;
      }

      var values = [];
      cards.forEach(function (card) {
        var value = card.getAttribute(key);
        if (value && values.indexOf(value) === -1) {
          values.push(value);
        }
      });

      values.sort().reverse().forEach(function (value) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        selectBox.appendChild(option);
      });
    }

    function update() {
      var keyword = normalize(search && search.value);
      var selectedYear = normalize(year && year.value);
      var selectedRegion = normalize(region && region.value);

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-year"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-tags")
        ].join(" "));
        var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchesYear = !selectedYear || normalize(card.getAttribute("data-year")) === selectedYear;
        var matchesRegion = !selectedRegion || normalize(card.getAttribute("data-region")) === selectedRegion;
        card.hidden = !(matchesKeyword && matchesYear && matchesRegion);
      });
    }

    fillSelect(year, "data-year");
    fillSelect(region, "data-region");

    [search, year, region].forEach(function (control) {
      if (control) {
        control.addEventListener("input", update);
        control.addEventListener("change", update);
      }
    });

    update();
  }

  function setupSearchPage() {
    var results = select("[data-search-results]");

    if (!results || !window.SiteMovieIndex) {
      return;
    }

    var input = select("[data-search-input]");
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get("q") || "";

    if (input) {
      input.value = initialQuery;
      input.addEventListener("input", render);
    }

    function card(movie) {
      return [
        '<article class="movie-card">',
        '<a class="movie-poster" href="' + escapeHtml(movie.url) + '" aria-label="' + escapeHtml(movie.title) + '">',
        '<img src="' + escapeHtml(movie.image) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
        '<span class="movie-badge">' + escapeHtml(movie.type) + '</span>',
        '</a>',
        '<div class="movie-card-body">',
        '<div class="movie-meta-row"><a href="' + escapeHtml(movie.categoryUrl) + '">' + escapeHtml(movie.category) + '</a><span>' + escapeHtml(movie.year) + '</span></div>',
        '<h3><a href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>',
        '<p>' + escapeHtml(movie.oneLine) + '</p>',
        '<div class="tag-list"><span>' + escapeHtml(movie.genre) + '</span><span>' + escapeHtml(movie.region) + '</span></div>',
        '</div>',
        '</article>'
      ].join("");
    }

    function render() {
      var query = normalize(input && input.value);
      var movies = window.SiteMovieIndex.filter(function (movie) {
        if (!query) {
          return movie.featured;
        }

        var text = normalize([
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          movie.tags,
          movie.oneLine,
          movie.category
        ].join(" "));
        return text.indexOf(query) !== -1;
      }).slice(0, 120);

      results.innerHTML = movies.map(card).join("");
    }

    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupMobileMenu();
    setupHeroCarousel();
    setupSearchForms();
    setupLocalFilters();
    setupSearchPage();
  });
}());
