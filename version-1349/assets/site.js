(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupMenu() {
    var toggle = qs('[data-menu-toggle]');
    var nav = qs('[data-mobile-nav]');
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var root = qs('[data-hero-carousel]');
    if (!root) {
      return;
    }
    var slides = qsa('[data-hero-slide]', root);
    var dots = qsa('[data-hero-dot]', root);
    var prev = qs('[data-hero-prev]', root);
    var next = qs('[data-hero-next]', root);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        start();
      });
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function setupFilters() {
    var forms = qsa('[data-filter-form]');
    forms.forEach(function (form) {
      var scope = form.parentElement || document;
      var cards = qsa('[data-movie-card]', scope);
      var input = qs('[data-filter-input]', form);
      var category = qs('[data-filter-category]', form);
      var year = qs('[data-filter-year]', form);
      var count = qs('[data-filter-count]', form);

      function cardText(card) {
        return [
          card.dataset.title,
          card.dataset.region,
          card.dataset.type,
          card.dataset.genre,
          card.dataset.tags,
          card.dataset.category,
          card.dataset.year
        ].join(' ').toLowerCase();
      }

      function apply() {
        var query = normalize(input && input.value);
        var categoryValue = normalize(category && category.value);
        var yearValue = normalize(year && year.value);
        var visible = 0;

        cards.forEach(function (card) {
          var text = cardText(card);
          var ok = true;
          if (query && text.indexOf(query) === -1) {
            ok = false;
          }
          if (categoryValue && normalize(card.dataset.category) !== categoryValue) {
            ok = false;
          }
          if (yearValue && normalize(card.dataset.year).indexOf(yearValue) === -1) {
            ok = false;
          }
          card.classList.toggle('is-hidden', !ok);
          if (ok) {
            visible += 1;
          }
        });

        if (count) {
          count.textContent = '匹配 ' + visible + ' 部';
        }
      }

      form.addEventListener('input', apply);
      form.addEventListener('change', apply);
      form.addEventListener('reset', function () {
        window.setTimeout(apply, 0);
      });
      apply();
    });
  }

  function setupPlayer() {
    var panels = qsa('[data-player]');
    panels.forEach(function (panel) {
      var video = qs('video[data-hls-src]', panel);
      var playButton = qs('[data-play-button]', panel);
      var sourceButtons = qsa('[data-source-button]', panel);
      var status = qs('[data-player-status]', panel);
      var hls = null;

      if (!video) {
        return;
      }

      function setStatus(message) {
        if (status) {
          status.textContent = message;
        }
      }

      function destroyHls() {
        if (hls && typeof hls.destroy === 'function') {
          hls.destroy();
        }
        hls = null;
      }

      function loadSource(source) {
        destroyHls();
        video.pause();
        video.removeAttribute('src');
        video.load();

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          setStatus('已使用浏览器原生播放能力。');
          return Promise.resolve();
        }

        if (window.Hls && window.Hls.isSupported()) {
          return new Promise(function (resolve, reject) {
            hls = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90
            });
            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
              setStatus('播放源已加载，可以开始播放。');
              resolve();
            });
            hls.on(window.Hls.Events.ERROR, function (event, data) {
              if (data && data.fatal) {
                setStatus('播放源加载失败，请稍后重试。');
                reject(new Error(data.type || 'HLS fatal error'));
              }
            });
          });
        }

        setStatus('当前浏览器不支持在线播放。');
        return Promise.reject(new Error('HLS is not supported'));
      }

      function playCurrent() {
        var source = video.dataset.hlsSrc;
        if (!source) {
          setStatus('未找到播放源。');
          return;
        }
        setStatus('正在初始化播放源...');
        loadSource(source)
          .then(function () {
            return video.play();
          })
          .then(function () {
            if (playButton) {
              playButton.classList.add('is-hidden');
            }
            setStatus('正在播放。');
          })
          .catch(function () {
            if (playButton) {
              playButton.classList.remove('is-hidden');
            }
          });
      }

      if (playButton) {
        playButton.addEventListener('click', playCurrent);
      }

      sourceButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          var source = button.dataset.source;
          if (!source) {
            return;
          }
          sourceButtons.forEach(function (item) {
            item.classList.toggle('is-active', item === button);
          });
          video.dataset.hlsSrc = source;
          playCurrent();
        });
      });

      video.addEventListener('play', function () {
        if (playButton) {
          playButton.classList.add('is-hidden');
        }
      });

      video.addEventListener('pause', function () {
        if (playButton && video.currentTime === 0) {
          playButton.classList.remove('is-hidden');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupPlayer();
  });
})();
