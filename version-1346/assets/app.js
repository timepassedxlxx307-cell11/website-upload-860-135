(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function normalize(value) {
        return String(value || '').trim().toLowerCase();
    }

    function initMenu() {
        var button = document.querySelector('.menu-toggle');
        var nav = document.querySelector('.mobile-nav');
        if (!button || !nav) {
            return;
        }
        button.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    function initHero() {
        var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
        var thumbs = Array.prototype.slice.call(document.querySelectorAll('.hero-thumb'));
        if (slides.length < 2) {
            return;
        }
        var current = 0;
        var timer = null;

        function show(next) {
            current = (next + slides.length) % slides.length;
            slides.forEach(function (slide, index) {
                slide.classList.toggle('active', index === current);
            });
            thumbs.forEach(function (thumb, index) {
                thumb.classList.toggle('active', index === current);
            });
        }

        function restart() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        thumbs.forEach(function (thumb) {
            thumb.addEventListener('click', function () {
                show(Number(thumb.getAttribute('data-hero-index')) || 0);
                restart();
            });
        });
        restart();
    }

    function initSearchRedirect() {
        document.querySelectorAll('[data-search-redirect]').forEach(function (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                var input = form.querySelector('input[name="q"]');
                var query = input ? input.value.trim() : '';
                var target = 'search.html';
                if (query) {
                    target += '?q=' + encodeURIComponent(query);
                }
                window.location.href = target;
            });
        });
    }

    function initFiltering() {
        var input = document.querySelector('.site-search');
        var scope = document.querySelector('[data-search-scope]');
        if (!input || !scope) {
            return;
        }
        var cards = Array.prototype.slice.call(scope.querySelectorAll('.movie-card'));
        var chips = Array.prototype.slice.call(document.querySelectorAll('.filter-chip'));
        var empty = scope.querySelector('.empty-state');
        var params = new URLSearchParams(window.location.search);
        var type = 'all';

        if (params.get('q')) {
            input.value = params.get('q');
        }

        function apply() {
            var query = normalize(input.value);
            var shown = 0;
            cards.forEach(function (card) {
                var haystack = normalize([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-tags'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-genre')
                ].join(' '));
                var cardType = card.getAttribute('data-type') || '';
                var matchText = !query || haystack.indexOf(query) !== -1;
                var matchType = type === 'all' || cardType.indexOf(type) !== -1;
                var visible = matchText && matchType;
                card.hidden = !visible;
                if (visible) {
                    shown += 1;
                }
            });
            if (empty) {
                empty.hidden = shown !== 0;
            }
        }

        input.addEventListener('input', apply);
        chips.forEach(function (chip) {
            chip.addEventListener('click', function () {
                type = chip.getAttribute('data-filter-type') || 'all';
                chips.forEach(function (item) {
                    item.classList.toggle('active', item === chip);
                });
                apply();
            });
        });
        apply();
    }

    ready(function () {
        initMenu();
        initHero();
        initSearchRedirect();
        initFiltering();
    });
}());

function initMoviePlayer(streamUrl) {
    var video = document.querySelector('[data-player-video]');
    var overlay = document.querySelector('[data-player-overlay]');
    var attached = false;
    var hlsInstance = null;

    if (!video || !overlay || !streamUrl) {
        return;
    }

    function attachStream() {
        if (attached) {
            return;
        }
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({ enableWorker: true });
            hlsInstance.loadSource(streamUrl);
            hlsInstance.attachMedia(video);
        } else {
            video.src = streamUrl;
        }
        attached = true;
    }

    function start() {
        attachStream();
        overlay.classList.add('is-hidden');
        video.setAttribute('controls', 'controls');
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {
                overlay.classList.remove('is-hidden');
            });
        }
    }

    overlay.addEventListener('click', start);
    video.addEventListener('click', function () {
        if (video.paused) {
            start();
        }
    });
    video.addEventListener('play', function () {
        overlay.classList.add('is-hidden');
    });
    window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
}
