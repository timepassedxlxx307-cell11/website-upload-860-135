
(function () {
  var menuToggle = document.querySelector('[data-menu-toggle]');
  var menuPanel = document.querySelector('[data-menu-panel]');
  if (menuToggle && menuPanel) {
    menuToggle.addEventListener('click', function () {
      menuPanel.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('[data-search-form]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = form.querySelector('input[name="q"]');
      var value = input ? input.value.trim() : '';
      var target = 'search.html';
      if (value) {
        target += '?q=' + encodeURIComponent(value);
      }
      window.location.href = target;
    });
  });

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;
    var activate = function (index) {
      current = index;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    };
    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        activate(index);
      });
    });
    if (slides.length > 1) {
      window.setInterval(function () {
        activate((current + 1) % slides.length);
      }, 5200);
    }
  }

  var localSearch = document.querySelector('[data-local-search]');
  var cardList = document.querySelector('[data-card-list]');
  var emptyState = document.querySelector('[data-no-results]');
  var activeFilter = '';
  var applyFilter = function () {
    if (!cardList) {
      return;
    }
    var query = localSearch ? localSearch.value.trim().toLowerCase() : '';
    var cards = Array.prototype.slice.call(cardList.querySelectorAll('[data-movie-card]'));
    var visible = 0;
    cards.forEach(function (card) {
      var keywords = (card.getAttribute('data-keywords') || '').toLowerCase();
      var matchesQuery = !query || keywords.indexOf(query) !== -1;
      var matchesFilter = !activeFilter || keywords.indexOf(activeFilter.toLowerCase()) !== -1;
      var show = matchesQuery && matchesFilter;
      card.style.display = show ? '' : 'none';
      if (show) {
        visible += 1;
      }
    });
    if (emptyState) {
      emptyState.classList.toggle('is-visible', visible === 0);
    }
  };
  if (localSearch) {
    var params = new URLSearchParams(window.location.search);
    var queryValue = params.get('q');
    if (queryValue) {
      localSearch.value = queryValue;
    }
    localSearch.addEventListener('input', applyFilter);
    applyFilter();
  }
  document.querySelectorAll('[data-filter-value]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('[data-filter-value]').forEach(function (item) {
        item.classList.remove('is-active');
      });
      button.classList.add('is-active');
      activeFilter = button.getAttribute('data-filter-value') || '';
      applyFilter();
    });
  });

  var player = document.querySelector('[data-player]');
  if (player) {
    var video = player.querySelector('video');
    var playButton = player.querySelector('[data-play-button]');
    var streamUrl = player.getAttribute('data-stream');
    var started = false;
    var startPlayback = function () {
      if (!video || !streamUrl) {
        return;
      }
      if (!started) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
        } else {
          video.src = streamUrl;
        }
        started = true;
      }
      if (playButton) {
        playButton.classList.add('is-hidden');
      }
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {});
      }
    };
    if (playButton) {
      playButton.addEventListener('click', startPlayback);
    }
    video.addEventListener('click', function () {
      if (!started || video.paused) {
        startPlayback();
      }
    });
  }
})();
