(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    ready(function () {
        function safe(value) {
            return String(value == null ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        var toggle = document.querySelector('[data-mobile-toggle]');
        var menu = document.querySelector('[data-mobile-menu]');
        if (toggle && menu) {
            toggle.addEventListener('click', function () {
                menu.hidden = !menu.hidden;
            });
        }

        var hero = document.querySelector('[data-hero]');
        if (hero) {
            var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
            var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
            var current = 0;
            var timer = null;

            function show(index) {
                if (!slides.length) {
                    return;
                }
                current = (index + slides.length) % slides.length;
                slides.forEach(function (slide, slideIndex) {
                    slide.classList.toggle('active', slideIndex === current);
                });
                dots.forEach(function (dot, dotIndex) {
                    dot.classList.toggle('active', dotIndex === current);
                });
            }

            function schedule() {
                if (timer) {
                    window.clearInterval(timer);
                }
                timer = window.setInterval(function () {
                    show(current + 1);
                }, 5200);
            }

            dots.forEach(function (dot) {
                dot.addEventListener('click', function () {
                    show(Number(dot.getAttribute('data-hero-dot')) || 0);
                    schedule();
                });
            });
            schedule();
        }

        var filterInput = document.querySelector('[data-filter-input]');
        if (filterInput) {
            var cards = Array.prototype.slice.call(document.querySelectorAll('[data-movie-card]'));
            filterInput.addEventListener('input', function () {
                var query = filterInput.value.trim().toLowerCase();
                cards.forEach(function (card) {
                    var text = ((card.getAttribute('data-title') || '') + ' ' + (card.getAttribute('data-meta') || '')).toLowerCase();
                    card.style.display = !query || text.indexOf(query) !== -1 ? '' : 'none';
                });
            });
        }

        Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(function (wrap) {
            var video = wrap.querySelector('video');
            var layer = wrap.querySelector('.play-layer');
            if (!video) {
                return;
            }
            var stream = video.getAttribute('data-stream');
            var started = false;

            function begin() {
                if (!stream) {
                    return;
                }
                if (layer) {
                    layer.classList.add('is-hidden');
                }
                if (!started) {
                    started = true;
                    if (window.Hls && window.Hls.isSupported()) {
                        var hls = new window.Hls({
                            enableWorker: true,
                            lowLatencyMode: true
                        });
                        hls.loadSource(stream);
                        hls.attachMedia(video);
                        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                            video.play().catch(function () {});
                        });
                    } else {
                        video.src = stream;
                        video.addEventListener('loadedmetadata', function () {
                            video.play().catch(function () {});
                        }, { once: true });
                    }
                } else {
                    video.play().catch(function () {});
                }
            }

            if (layer) {
                layer.addEventListener('click', begin);
            }
            video.addEventListener('click', function () {
                if (!started) {
                    begin();
                }
            });
        });

        var searchRoot = document.getElementById('searchPage');
        if (searchRoot && window.SearchEntries) {
            var input = document.getElementById('siteSearchInput');
            var list = document.getElementById('searchResults');
            var label = document.getElementById('searchResultText');
            var params = new URLSearchParams(window.location.search);
            var initial = params.get('q') || '';
            if (input) {
                input.value = initial;
            }

            function render() {
                var query = (input && input.value ? input.value : '').trim().toLowerCase();
                list.innerHTML = '';
                if (!query) {
                    label.textContent = '请输入关键词开始搜索';
                    return;
                }
                var matched = window.SearchEntries.filter(function (item) {
                    return item.text.indexOf(query) !== -1;
                }).slice(0, 80);
                label.textContent = matched.length ? '匹配影片如下' : '没有找到匹配影片';
                matched.forEach(function (item) {
                    var link = document.createElement('a');
                    link.className = 'movie-card group';
                    link.href = item.url;
                    link.innerHTML = '<span class="cover-frame"><img src="' + safe(item.poster) + '" alt="' + safe(item.title) + ' 海报" loading="lazy"><span class="badge-year">' + safe(item.year) + '</span><span class="badge-type">' + safe(item.type) + '</span></span><span class="p-4 block"><span class="flex items-center gap-2 mb-2"><span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">' + safe(item.genre) + '</span></span><strong class="text-base font-semibold text-gray-800 mb-2 group-hover:text-rose-600 transition-colors line-clamp-2">' + safe(item.title) + '</strong><span class="text-sm text-gray-600 line-clamp-2 mb-3">' + safe(item.line) + '</span><span class="flex items-center gap-3 text-xs text-gray-500"><span>' + safe(item.region) + '</span><span>' + safe(item.score) + ' 分</span></span></span>';
                    list.appendChild(link);
                });
            }

            if (input) {
                input.addEventListener('input', render);
            }
            render();
        }
    });
})();
