(function () {
    var header = document.querySelector('[data-header]');
    var menuButton = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');

    function syncHeader() {
        if (!header) {
            return;
        }
        if (window.scrollY > 20) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
    }

    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true });

    if (menuButton && menu) {
        menuButton.addEventListener('click', function () {
            menu.classList.toggle('is-open');
            document.body.classList.toggle('menu-open', menu.classList.contains('is-open'));
        });
    }

    var hero = document.querySelector('[data-hero]');
    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var next = hero.querySelector('[data-hero-next]');
        var prev = hero.querySelector('[data-hero-prev]');
        var index = 0;
        var timer = null;

        function showSlide(target) {
            if (!slides.length) {
                return;
            }
            index = (target + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === index);
            });
        }

        function startHero() {
            stopHero();
            timer = window.setInterval(function () {
                showSlide(index + 1);
            }, 5200);
        }

        function stopHero() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
                startHero();
            });
        });

        if (next) {
            next.addEventListener('click', function () {
                showSlide(index + 1);
                startHero();
            });
        }

        if (prev) {
            prev.addEventListener('click', function () {
                showSlide(index - 1);
                startHero();
            });
        }

        hero.addEventListener('mouseenter', stopHero);
        hero.addEventListener('mouseleave', startHero);
        showSlide(0);
        startHero();
    }

    Array.prototype.slice.call(document.querySelectorAll('.player-box')).forEach(function (box) {
        var video = box.querySelector('video');
        var overlay = box.querySelector('.player-overlay');
        var message = null;
        var attached = false;
        var hls = null;

        function setMessage(text) {
            if (!text) {
                if (message) {
                    message.remove();
                    message = null;
                }
                return;
            }
            if (!message) {
                message = document.createElement('div');
                message.className = 'player-message';
                box.appendChild(message);
            }
            message.textContent = text;
        }

        function attachSource() {
            if (!video || attached) {
                return Promise.resolve();
            }
            var src = video.getAttribute('data-m3u8');
            if (!src) {
                setMessage('暂时无法加载视频');
                return Promise.resolve();
            }
            attached = true;
            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(src);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.ERROR, function (event, data) {
                    if (!data || !data.fatal) {
                        return;
                    }
                    if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                        setMessage('网络加载异常，正在重试');
                        hls.startLoad();
                    } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                        setMessage('播放恢复中');
                        hls.recoverMediaError();
                    } else {
                        setMessage('播放失败，请稍后再试');
                    }
                });
                return Promise.resolve();
            }
            video.src = src;
            return Promise.resolve();
        }

        function playVideo() {
            attachSource().then(function () {
                if (!video) {
                    return;
                }
                var promise = video.play();
                if (promise && promise.catch) {
                    promise.catch(function () {
                        setMessage('点击视频区域继续播放');
                    });
                }
            });
        }

        if (overlay) {
            overlay.addEventListener('click', function () {
                overlay.classList.add('is-hidden');
                playVideo();
            });
        }

        if (video) {
            video.addEventListener('play', function () {
                if (overlay) {
                    overlay.classList.add('is-hidden');
                }
                setMessage('');
            });
            video.addEventListener('pause', function () {
                if (overlay && video.currentTime === 0) {
                    overlay.classList.remove('is-hidden');
                }
            });
            video.addEventListener('error', function () {
                setMessage('播放失败，请稍后再试');
            });
        }

        window.addEventListener('pagehide', function () {
            if (hls) {
                hls.destroy();
            }
        });
    });

    var results = document.querySelector('[data-search-results]');
    if (results && Array.isArray(window.siteSearchIndex)) {
        var params = new URLSearchParams(window.location.search);
        var query = (params.get('q') || '').trim();
        var title = document.querySelector('[data-search-title]');
        var input = document.querySelector('.search-page-form input[name="q"]');
        if (input) {
            input.value = query;
        }
        var source = window.siteSearchIndex;
        var filtered = source;
        if (query) {
            var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
            filtered = source.filter(function (item) {
                var text = [item.title, item.region, item.type, item.year, item.genre, item.tags, item.oneLine].join(' ').toLowerCase();
                return terms.every(function (term) {
                    return text.indexOf(term) !== -1;
                });
            });
        } else {
            filtered = source.slice(0, 80);
        }
        if (title) {
            title.textContent = query ? '“' + query + '”相关影片' : '热门影片';
        }
        if (!filtered.length) {
            results.innerHTML = '<div class="empty-state">没有找到相关影片</div>';
            return;
        }
        results.innerHTML = filtered.slice(0, 120).map(function (item) {
            return '<article class="movie-card">' +
                '<a href="' + item.href + '" class="card-link" aria-label="观看' + escapeHtml(item.title) + '">' +
                '<div class="card-cover">' +
                '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
                '<div class="card-shade"></div>' +
                '<span class="card-badge">' + escapeHtml(item.typeGroup) + '</span>' +
                '<span class="card-year">' + escapeHtml(item.year) + '</span>' +
                '</div>' +
                '<div class="card-body">' +
                '<h3>' + escapeHtml(item.title) + '</h3>' +
                '<p>' + escapeHtml(item.oneLine) + '</p>' +
                '</div>' +
                '</a>' +
                '</article>';
        }).join('');
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char];
        });
    }
})();
