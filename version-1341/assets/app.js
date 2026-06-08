document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('[data-header]');
  const mobileButton = document.querySelector('[data-mobile-menu]');
  const mobilePanel = document.querySelector('[data-mobile-panel]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const menuPanel = document.querySelector('[data-menu-panel]');

  function updateHeader() {
    if (!header) {
      return;
    }
    header.classList.toggle('is-scrolled', window.scrollY > 20);
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if (mobileButton && mobilePanel) {
    mobileButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('is-open');
    });
  }

  if (menuToggle && menuPanel) {
    menuToggle.addEventListener('click', function () {
      menuPanel.classList.toggle('is-open');
    });

    document.addEventListener('click', function (event) {
      if (!menuPanel.contains(event.target) && !menuToggle.contains(event.target)) {
        menuPanel.classList.remove('is-open');
      }
    });
  }

  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  const dots = Array.from(document.querySelectorAll('.hero-dot'));
  const previous = document.querySelector('[data-hero-prev]');
  const next = document.querySelector('[data-hero-next]');
  let activeSlide = slides.findIndex(function (slide) {
    return slide.classList.contains('is-active');
  });

  if (activeSlide < 0) {
    activeSlide = 0;
  }

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    activeSlide = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('is-active', slideIndex === activeSlide);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('is-active', dotIndex === activeSlide);
    });
  }

  if (slides.length) {
    showSlide(activeSlide);
    if (previous) {
      previous.addEventListener('click', function () {
        showSlide(activeSlide - 1);
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        showSlide(activeSlide + 1);
      });
    }
    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        showSlide(index);
      });
    });
    window.setInterval(function () {
      showSlide(activeSlide + 1);
    }, 5500);
  }

  const filterInput = document.querySelector('[data-filter-input]');
  const sortSelect = document.querySelector('[data-sort-select]');
  const clearButton = document.querySelector('[data-filter-clear]');
  const filterCards = Array.from(document.querySelectorAll('[data-search]'));
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q');

  if (filterInput && initialQuery) {
    filterInput.value = initialQuery;
  }

  function sortCards() {
    if (!sortSelect || !filterCards.length) {
      return;
    }
    const container = filterCards[0].parentElement;
    const sorted = filterCards.slice().sort(function (a, b) {
      const ay = parseInt(a.getAttribute('data-year'), 10) || 0;
      const by = parseInt(b.getAttribute('data-year'), 10) || 0;
      if (sortSelect.value === 'old') {
        return ay - by;
      }
      if (sortSelect.value === 'name') {
        return a.getAttribute('data-search').localeCompare(b.getAttribute('data-search'), 'zh-Hans-CN');
      }
      return by - ay;
    });
    sorted.forEach(function (card) {
      container.appendChild(card);
    });
  }

  function applyFilter() {
    const query = filterInput ? filterInput.value.trim().toLowerCase() : '';
    filterCards.forEach(function (card) {
      const text = card.getAttribute('data-search') || '';
      card.classList.toggle('hidden-by-filter', query && !text.includes(query));
    });
  }

  if (filterInput || sortSelect) {
    sortCards();
    applyFilter();
  }

  if (filterInput) {
    filterInput.addEventListener('input', applyFilter);
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', sortCards);
  }

  if (clearButton && filterInput) {
    clearButton.addEventListener('click', function () {
      filterInput.value = '';
      applyFilter();
      filterInput.focus();
    });
  }

  const players = Array.from(document.querySelectorAll('[data-video-source]'));

  players.forEach(function (video) {
    const source = video.getAttribute('data-video-source');
    const frame = video.closest('.player-frame');
    const cover = frame ? frame.querySelector('[data-player-cover]') : null;
    let attached = false;
    let hls = null;

    function attachVideo() {
      if (attached || !source) {
        return;
      }
      attached = true;
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
    }

    function startVideo() {
      attachVideo();
      if (cover) {
        cover.classList.add('is-hidden');
      }
      video.setAttribute('controls', 'controls');
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          video.setAttribute('controls', 'controls');
        });
      }
    }

    if (cover) {
      cover.addEventListener('click', startVideo);
    }

    video.addEventListener('click', function () {
      if (!attached) {
        startVideo();
      }
    });

    window.addEventListener('pagehide', function () {
      if (hls) {
        hls.destroy();
      }
    });
  });
});
