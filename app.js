    var BACKEND_URL = "https://shop.dzarjhay.workers.dev";

    var MenuItems = document.getElementById("MenuItems");

    MenuItems.style.maxHeight = "0px";

    function menutoggle() {

        if (MenuItems.style.maxHeight == "0px") {

            MenuItems.style.maxHeight = "200px";

        }

        else {

            MenuItems.style.maxHeight = "0px";

        }

    }

    var PAGE_ORDER = ["home", "product", "about", "contact", "faqs", "return-policy", "privacy", "terms", "data-privacy", "how-to-order", "size-guide", "account"];
    var transitionOverlay = document.getElementById("pageTransitionOverlay");
    var TRANSITION_MS = 320;
    var currentPageKey = "home";

    function goToPage(pageKey, direction) {
        var targetPage = document.querySelector('.site-page[data-page="' + pageKey + '"]');
        if (!targetPage || !transitionOverlay) return;

        var enterX = direction === "right" ? "-100%" : "100%";
        var exitX = direction === "right" ? "100%" : "-100%";

        transitionOverlay.style.transition = "none";
        transitionOverlay.style.transform = "translate3d(" + enterX + ", 0, 0)";

        void transitionOverlay.offsetHeight;

        transitionOverlay.style.transition = "transform " + TRANSITION_MS + "ms cubic-bezier(0.65, 0, 0.35, 1)";
        transitionOverlay.style.transform = "translate3d(0, 0, 0)";

        setTimeout(function () {
            document.querySelectorAll(".site-page").forEach(function (p) {
                p.classList.remove("active");
            });
            targetPage.classList.add("active");
            currentPageKey = pageKey;
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });

            requestAnimationFrame(function () {
                transitionOverlay.style.transform = "translate3d(" + exitX + ", 0, 0)";
            });
        }, TRANSITION_MS);
    }

    function goToPageByKey(pageKey) {
        if (PAGE_ORDER.indexOf(pageKey) === -1) return;
        if (pageKey === currentPageKey) return;
        var direction = PAGE_ORDER.indexOf(pageKey) > PAGE_ORDER.indexOf(currentPageKey) ? "right" : "left";
        goToPage(pageKey, direction);
    }

    function handleNavLinkClick(e) {
        var href = this.getAttribute("href");
        if (!href || href.charAt(0) !== "#" || href.length < 2) return;

        var pageKey = href.substring(1);
        if (PAGE_ORDER.indexOf(pageKey) === -1) return;

        e.preventDefault();

        MenuItems.style.maxHeight = "0px";

        goToPageByKey(pageKey);
    }

    document.querySelectorAll('#MenuItems a[href^="#"]').forEach(function (link) {
        link.addEventListener("click", handleNavLinkClick);
    });

    var sideMenu = document.getElementById("sideMenu");
    var sideMenuOverlay = document.getElementById("sideMenuOverlay");

    function openSideMenu() {
        sideMenu.classList.add("show");
        sideMenuOverlay.classList.add("show");
    }

    function closeSideMenu() {
        sideMenu.classList.remove("show");
        sideMenuOverlay.classList.remove("show");
    }

    document.querySelectorAll('#sideMenu a[href^="#"]').forEach(function (link) {
        link.addEventListener("click", function (e) {
            handleNavLinkClick.call(this, e);
            closeSideMenu();
        });
    });

    function darkModeKeyFor(email) {
        return "cvspee_dark_mode_" + email;
    }

    function applyDarkMode(isDark) {
        document.body.classList.toggle("dark-mode", isDark);
        var toggle = document.getElementById("darkModeToggle");
        if (toggle) toggle.checked = isDark;
    }

    function currentUserEmailForDarkMode() {
        return localStorage.getItem("cvspee_current_user");
    }

    function toggleDarkMode() {
        var isDark = document.getElementById("darkModeToggle").checked;
        applyDarkMode(isDark);
        var email = currentUserEmailForDarkMode();
        if (email) {
            localStorage.setItem(darkModeKeyFor(email), isDark ? "1" : "0");
        }
    }

    function loadDarkModeForCurrentUser() {
        var email = currentUserEmailForDarkMode();
        var isDark = !!email && localStorage.getItem(darkModeKeyFor(email)) === "1";
        applyDarkMode(isDark);
    }

    (function initDarkMode() {
        loadDarkModeForCurrentUser();
    })();

    var EVENT_THEMES = {
        "default":   { decor: [] },
        "halloween": { decor: ["\uD83C\uDF83", "\uD83E\uDD87", "\uD83D\uDC7B"] },
        "christmas": { decor: ["\u2744\uFE0F", "\u2744\uFE0F", "\uD83C\uDF84"] },
        "newyear":   { decor: ["\uD83C\uDF89", "\u2728", "\uD83C\uDF86"] }
    };
    var _currentEventTheme = "default";

    var EventFX = (function () {
        var theme = "default", raf = 0, cv = null, cx = null, W = 0, H = 0, last = 0;
        var snowP = [], rockets = [], sparks = [], confetti = [], nextRocket = 0, timers = [];
        var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
        var soundOn = false, ac = null, master = null, sess = null, nbuf = null, nodes = [];
        /* Real audio files (put them in the "sounds" folder). If a file is missing, the built-in synth sound is used. */
        var FILES = { halloween: "sounds/halloween.mp3", christmas: "sounds/christmas.mp3", newyear: "sounds/newyear.mp3" };
        var aud = null, usingFile = false;
        try { soundOn = localStorage.getItem("cvspee_event_sound") === "1"; } catch (e) {}

        /* ---------- sound (synthesized, no files) ---------- */
        function A() {
            if (!ac) {
                var C = window.AudioContext || window.webkitAudioContext;
                if (!C) return null;
                ac = new C(); master = ac.createGain(); master.gain.value = 0.4; master.connect(ac.destination);
            }
            if (ac.state === "suspended") ac.resume();
            return ac;
        }
        function noiseBuf() {
            if (!nbuf) {
                nbuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
                var d = nbuf.getChannelData(0);
                for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
            }
            return nbuf;
        }
        function tone(f, t, dur, type, vol, f2) {
            var o = ac.createOscillator(), g = ac.createGain();
            o.type = type || "sine"; o.frequency.setValueAtTime(f, t);
            if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(sess); o.start(t); o.stop(t + dur + 0.05);
        }
        function noise(t, dur, type, f, vol) {
            var s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
            s.buffer = noiseBuf(); fl.type = type; fl.frequency.value = f;
            g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            s.connect(fl); fl.connect(g); g.connect(sess); s.start(t, Math.random()); s.stop(t + dur + 0.05);
        }
        function mf(m) { return 440 * Math.pow(2, (m - 69) / 12); }
        function organ(f, t, d, vol) {
            var g = ac.createGain(), l = ac.createBiquadFilter();
            l.type = "lowpass"; l.frequency.value = 1400;
            g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
            g.gain.setValueAtTime(vol, t + Math.max(d - 0.08, 0.05)); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.12);
            l.connect(g); g.connect(sess);
            [[f, "sawtooth", 1], [f * 2, "square", 0.4], [f / 2, "sawtooth", 0.6]].forEach(function (x) {
                var o = ac.createOscillator(), og = ac.createGain();
                o.type = x[1]; o.frequency.value = x[0]; og.gain.value = x[2];
                o.connect(og); og.connect(l); o.start(t); o.stop(t + d + 0.2); nodes.push(o);
            });
        }
        function soundHallo() {
            /* Intro: Bach "Toccata" motif on organ (public domain), then an original spooky waltz in A minor */
            var t0 = ac.currentTime + 0.2, t = t0;
            function intro(base, k) {
                [[69, 0.13], [67, 0.13], [69, 1.1], [0, 0.45], [67, 0.24], [65, 0.24], [64, 0.24], [62, 0.24], [61, 0.4], [62, 2.0]].forEach(function (n) {
                    if (n[0]) { organ(mf(n[0] + base), t, n[1], 0.05); if (k) organ(mf(n[0] + base - 12), t, n[1], 0.04); }
                    t += n[1];
                });
            }
            intro(0, 0); t += 0.4; intro(-12, 1); t += 1.2;
            var beat = 0.42, chords = ["Am", "Am", "Dm", "E", "Dm", "E", "Am", "Am"];
            var CH = { Am: [45, [57, 60, 64]], Dm: [50, [62, 65, 69]], E: [52, [64, 68, 71]] };
            var mel = [[[69,1],[72,1],[76,1]], [[81,2],[76,1]], [[77,1],[76,1],[74,1]], [[76,3]],
                       [[74,1],[77,1],[81,1]], [[80,1],[76,1],[71,1]], [[72,1],[71,1],[69,1]], [[69,3]]];
            for (var rep = 0; rep < 2; rep++) {
                for (var b = 0; b < 8; b++) {
                    var bt = t, c = CH[chords[b]];
                    tone(mf(c[0]), bt, beat * 1.6, "triangle", 0.16);
                    [1, 2].forEach(function (i) { c[1].forEach(function (m) { tone(mf(m), bt + i * beat, beat * 0.9, "triangle", 0.035); }); });
                    mel[b].forEach(function (n) {
                        tone(mf(n[0]), bt, n[1] * beat + 0.5, "triangle", 0.09);
                        tone(mf(n[0]) * 2, bt, 0.4, "sine", 0.03);
                        bt += n[1] * beat;
                    });
                    t += beat * 3;
                }
            }
            timers.push(setTimeout(soundHallo, (t - ac.currentTime + 3) * 1000));
        }
        function soundNewYear() {
            /* "Auld Lang Syne" (traditional, public domain) with soft chords */
            var beat = 0.62, t = ac.currentTime + 0.3;
            var mel = [[67,1],
                [72,1.5],[72,0.5],[72,1],[76,1], [74,1.5],[72,0.5],[74,1],[76,1], [72,1.5],[72,0.5],[76,1],[79,1], [81,4],
                [81,1],
                [79,1.5],[76,0.5],[76,1],[72,1], [74,1.5],[72,0.5],[74,1],[76,1], [72,1.5],[69,0.5],[69,1],[67,1], [72,4]];
            var CH = { C: [48, [60, 64, 67]], G: [43, [59, 62, 67]], F: [41, [57, 60, 65]] };
            var prog = ["C", "G", "C", "F", "C", "G", "F", "C"];
            var start = t + beat;
            prog.forEach(function (p, i) {
                var bt = start + i * beat * 4, c = CH[p];
                tone(mf(c[0]), bt, beat * 2, "triangle", 0.14);
                tone(mf(c[0]), bt + beat * 2, beat * 2, "triangle", 0.1);
                c[1].forEach(function (m) { tone(mf(m), bt + beat * 2, beat * 2, "sine", 0.03); });
            });
            mel.forEach(function (n) {
                var d = n[1] * beat;
                tone(mf(n[0]), t, d + 0.8, "triangle", 0.13);
                tone(mf(n[0]) * 2, t, 0.5, "sine", 0.035);
                t += d;
            });
            timers.push(setTimeout(soundNewYear, (t - ac.currentTime + 3) * 1000));
        }
        function soundXmas() {
            var F = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392 };
            var M = [["E",1],["E",1],["E",2],["E",1],["E",1],["E",2],["E",1],["G",1],["C",1.5],["D",0.5],["E",4],
                     ["F",1],["F",1],["F",1.5],["F",0.5],["F",1],["E",1],["E",1],["E",0.5],["E",0.5],["E",1],["D",1],["D",1],["E",1],["D",2],["G",2]];
            var beat = 0.34, t0 = ac.currentTime + 0.2, t = t0;
            M.forEach(function (n) {
                tone(F[n[0]] * 2, t, Math.max(n[1] * beat, 0.5) + 0.3, "sine", 0.10);
                tone(F[n[0]] * 4, t, 0.35, "sine", 0.025);
                t += n[1] * beat;
            });
            for (var k = t0; k < t; k += beat * 2) {
                noise(k, 0.22, "highpass", 6500, 0.05); noise(k + 0.07, 0.2, "highpass", 6500, 0.04);
                tone(2637, k, 0.18, "triangle", 0.015);
            }
            timers.push(setTimeout(soundXmas, (t - ac.currentTime + 3) * 1000));
        }
        function sfxWhistle() {}
        function sfxBoom() {}
        function stopSound() {
            if (aud) { try { aud.pause(); } catch (e) {} aud = null; }
            usingFile = false;
            timers.forEach(clearTimeout); timers = [];
            nodes.forEach(function (n) { try { n.stop(); } catch (e) {} }); nodes = [];
            if (sess && ac) {
                var s = sess; sess = null;
                s.gain.setTargetAtTime(0, ac.currentTime, 0.08);
                setTimeout(function () { try { s.disconnect(); } catch (e) {} }, 500);
            }
        }
        function startSound() {
            if (!soundOn || theme === "default" || !A()) return;
            stopSound();
            sess = ac.createGain(); sess.gain.value = 1; sess.connect(master);
            var src = FILES[theme];
            if (src) { playFile(src); return; }
            synth();
        }
        function synth() {
            if (!sess) return;
            if (theme === "halloween") soundHallo();
            else if (theme === "christmas") soundXmas();
            else if (theme === "newyear") soundNewYear();
        }
        function playFile(src) {
            var a = new Audio(src);
            a.loop = true; a.volume = 0.6; a.preload = "auto"; aud = a;
            function fallback() { if (aud !== a) return; aud = null; usingFile = false; synth(); }
            a.addEventListener("error", fallback);
            a.addEventListener("playing", function () { if (aud === a) usingFile = true; });
            var p = a.play();
            if (p && p.catch) p.catch(fallback);
        }

        /* ---------- canvas effects ---------- */
        function resize() {
            if (!cv) return;
            var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            W = window.innerWidth; H = window.innerHeight;
            cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
            var nav = document.querySelector(".site-navbar"), box = document.getElementById("eventDecor");
            if (box) box.style.setProperty("--ev-nav", (nav ? nav.offsetHeight : 70) + "px");
        }
        function rnd(a, b) { return a + Math.random() * (b - a); }
        function initSnow() {
            snowP = [];
            for (var i = 0; i < (W < 600 ? 60 : 130); i++) snowP.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(1.5, 4), vy: rnd(0.4, 1.3), ph: rnd(0, 6.28), sw: rnd(0.3, 0.9) });
        }
        function drawSnow(dt) {
            cx.fillStyle = "#fff"; cx.strokeStyle = "rgba(90,140,200,.55)"; cx.lineWidth = 0.8;
            snowP.forEach(function (p) {
                p.y += p.vy * dt; p.ph += 0.02 * dt; p.x += Math.sin(p.ph) * p.sw * dt;
                if (p.y > H + 5) { p.y = -5; p.x = rnd(0, W); }
                cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fill(); cx.stroke();
            });
        }
        var COLORS = ["#FFD54A", "#FF4D6D", "#33C3F0", "#FF9A2E", "#B388FF", "#5CE08A"];
        function launch() {
            rockets.push({ x: rnd(W * 0.15, W * 0.85), y: H, vy: -rnd(6, 9), ty: rnd(H * 0.12, H * 0.45), c: COLORS[(Math.random() * COLORS.length) | 0] });
            sfxWhistle();
        }
        function explode(r) {
            var n = W < 600 ? 36 : 60;
            for (var i = 0; i < n; i++) {
                var a = (i / n) * 6.283, s = rnd(1.5, 4.2);
                sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, a: 1, c: r.c });
            }
            sfxBoom();
        }
        function drawFire(dt, ts) {
            if (ts > nextRocket) { launch(); nextRocket = ts + rnd(900, 2300); }
            rockets = rockets.filter(function (r) {
                r.y += r.vy * dt; cx.fillStyle = r.c; cx.fillRect(r.x - 1.5, r.y, 3, 8);
                if (r.y <= r.ty) { explode(r); return false; } return true;
            });
            sparks = sparks.filter(function (s) {
                s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 0.04 * dt; s.vx *= 0.99; s.a -= 0.012 * dt;
                if (s.a <= 0) return false;
                cx.globalAlpha = s.a; cx.fillStyle = s.c; cx.beginPath(); cx.arc(s.x, s.y, 2.2, 0, 6.283); cx.fill(); return true;
            });
            cx.globalAlpha = 1;
            confetti.forEach(function (c) {
                c.y += c.vy * dt; c.x += Math.sin(c.ph += 0.03 * dt) * 0.8; c.rot += c.vr * dt;
                if (c.y > H + 10) { c.y = -10; c.x = rnd(0, W); }
                cx.save(); cx.translate(c.x, c.y); cx.rotate(c.rot); cx.fillStyle = c.c; cx.fillRect(-3, -2, 7, 4); cx.restore();
            });
        }
        function loop(ts) {
            raf = requestAnimationFrame(loop);
            var dt = Math.min((ts - last) / 16.7, 3) || 1; last = ts;
            cx.clearRect(0, 0, W, H);
            if (theme === "christmas") drawSnow(dt); else if (theme === "newyear") drawFire(dt, ts);
        }

        /* ---------- DOM decorations ---------- */
        function rep(n, html) { var s = ""; for (var i = 0; i < n; i++) s += html; return s; }
        var WEB = '<svg class="ev-web" viewBox="0 0 100 100"><g fill="none" stroke="#8a8a8a" stroke-width="1" opacity=".7"><path d="M0 0L100 100M0 0L100 45M0 0L45 100M0 0L100 0M0 0L0 100"/><path d="M0 22Q22 22 22 0M0 45Q45 45 45 0M0 70Q70 70 70 0"/></g></svg>';
        var GREET = {
            halloween: "\uD83C\uDF83 Happy Halloween from CVSPEE! \uD83D\uDC7B",
            christmas: "\uD83C\uDF84 Merry Christmas from CVSPEE! \uD83C\uDF81",
            newyear: "\uD83C\uDF86 Happy New Year " + (new Date().getMonth() >= 6 ? new Date().getFullYear() + 1 : new Date().getFullYear()) + "! \u2728"
        };
        function spawnHallo(box) {
            if (document.hidden) return;
            var s = document.createElement("span");
            if (Math.random() < 0.5) { s.className = "ev-fly"; s.textContent = "\uD83E\uDD87"; s.style.top = rnd(8, 40) + "vh"; }
            else { s.className = "ev-p ev-up"; s.textContent = "\uD83D\uDC7B"; s.style.left = rnd(5, 90) + "vw"; s.style.top = "auto"; s.style.bottom = "-40px"; }
            s.addEventListener("animationend", function () { s.remove(); });
            box.appendChild(s);
        }
        function build() {
            var box = document.getElementById("eventDecor");
            if (!box) { box = document.createElement("div"); box.id = "eventDecor"; box.setAttribute("aria-hidden", "true"); document.body.appendChild(box); }
            var html = "";
            if (theme === "halloween") html = '<div class="ev-garland">' + rep(14, '<span class="ev-bat">\uD83E\uDD87</span>') + '</div><div class="ev-webL">' + WEB + '</div><div class="ev-webR">' + WEB + '</div><div class="ev-spider">\uD83D\uDD77\uFE0F</div><div class="ev-fog"></div>';
            else if (theme === "christmas") html = '<div class="ev-garland ev-wire">' + rep(26, '<span class="ev-bulb"></span>') + '</div><div class="ev-snowground"></div>';
            else if (theme === "newyear") html = '<div class="ev-garland">' + rep(22, '<span class="ev-flag"></span>') + '</div>';
            box.innerHTML = html;
            cv = document.createElement("canvas"); cv.id = "eventFx"; box.insertBefore(cv, box.firstChild);
            cx = cv.getContext("2d"); resize();
            if (reduce) return;
            if (theme === "halloween") {
                for (var i = 0; i < 10; i++) {
                    var p = document.createElement("span"); p.className = "ev-p"; p.textContent = i % 3 ? "\uD83C\uDF42" : "\uD83C\uDF83";
                    p.style.left = rnd(0, 100) + "vw"; p.style.fontSize = rnd(14, 26) + "px";
                    p.style.animationDuration = rnd(10, 18) + "s"; p.style.animationDelay = (-rnd(0, 12)) + "s"; box.appendChild(p);
                }
                timers.push(setInterval(function () { spawnHallo(box); }, 6000));
            }
            if (theme === "christmas") initSnow();
            if (theme === "newyear") {
                confetti = [];
                for (var j = 0; j < (W < 600 ? 30 : 60); j++) confetti.push({ x: rnd(0, W), y: rnd(0, H), vy: rnd(0.6, 1.6), ph: rnd(0, 6), rot: rnd(0, 6), vr: rnd(-0.1, 0.1), c: COLORS[j % COLORS.length] });
                rockets = []; sparks = []; nextRocket = 0;
            }
            if (theme === "christmas" || theme === "newyear") { last = performance.now(); raf = requestAnimationFrame(loop); }
        }
        function soundBtn() {
            var b = document.getElementById("eventSoundBtn");
            if (theme === "default") { if (b) b.remove(); return; }
            if (!b) {
                b = document.createElement("button"); b.id = "eventSoundBtn"; b.type = "button";
                b.onclick = function () {
                    soundOn = !soundOn;
                    try { localStorage.setItem("cvspee_event_sound", soundOn ? "1" : "0"); } catch (e) {}
                    if (soundOn) startSound(); else stopSound();
                    soundBtn();
                };
                document.body.appendChild(b);
            }
            b.textContent = soundOn ? "\uD83D\uDD0A" : "\uD83D\uDD07";
            b.className = soundOn ? "on" : "";
            b.title = b.setAttribute("aria-label", soundOn ? "Turn event sound off" : "Turn event sound on") || (soundOn ? "Sound on" : "Tap for sound");
        }
        function greet() {
            var key = "cvspee_ev_greet_" + theme;
            try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch (e) {}
            var g = document.createElement("div"); g.className = "ev-greet"; g.textContent = GREET[theme];
            g.addEventListener("animationend", function () { g.remove(); });
            var box = document.getElementById("eventDecor"); if (box) box.appendChild(g);
        }
        function clear() {
            cancelAnimationFrame(raf); raf = 0;
            timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
            var box = document.getElementById("eventDecor"); if (box) box.innerHTML = "";
            cv = null; cx = null;
        }
        function set(t) {
            if (t === theme && document.getElementById("eventDecor") && t !== "default" && document.getElementById("eventDecor").children.length) { soundBtn(); return; }
            var wasSound = !!sess;
            stopSound(); clear(); theme = t;
            soundBtn();
            if (t === "default") return;
            build(); greet();
            if (wasSound || (soundOn && ac && ac.state === "running")) startSound();
        }
        window.addEventListener("resize", resize);
        document.addEventListener("pointerdown", function () { if (soundOn && theme !== "default" && !sess) startSound(); }, { passive: true });
        document.addEventListener("visibilitychange", function () {
            if (document.hidden) {
                if (aud) aud.pause();
                if (ac) ac.suspend();
            } else if (soundOn) {
                if (aud) aud.play().catch(function () {});
                if (ac && sess) ac.resume();
            }
        });
        return { set: set };
    })();

    function renderEventDecor(theme) { EventFX.set(theme); }

    function applyEventTheme(theme) {
        if (!EVENT_THEMES[theme]) theme = "default";
        _currentEventTheme = theme;
        document.documentElement.setAttribute("data-event-theme", theme);
        var sel = document.getElementById("eventThemeSelect");
        if (sel) sel.value = theme;
        try { localStorage.setItem("cvspee_event_theme", theme); } catch (e) {}
        renderEventDecor(theme);
    }

    function changeEventTheme(theme) {
        if (!isOwnerLoggedIn()) { applyEventTheme(_currentEventTheme); return; }
        if (!EVENT_THEMES[theme]) theme = "default";
        applyEventTheme(theme);
        var user = getCurrentUser();
        db.collection("cvspee").doc("siteTheme").set({
            theme: theme,
            updatedAt: Date.now(),
            updatedBy: (user && user.email) || ""
        }).catch(function (err) {
            console.error("theme save failed", err);
            alert("Sorry, the theme couldn't be saved (" + ((err && err.code) || "error") + "). Please try again.");
        });
    }

    function updateThemePickerVisibility() {
        var row = document.getElementById("themePickerRow");
        var menu = document.getElementById("sideMenu");
        var show = isOwnerLoggedIn();
        if (row) row.style.display = show ? "flex" : "none";
        if (menu) menu.classList.toggle("has-theme-picker", show);
        var sel = document.getElementById("eventThemeSelect");
        if (sel) sel.value = _currentEventTheme;
    }

    applyEventTheme((function () {
        try { return localStorage.getItem("cvspee_event_theme") || "default"; } catch (e) { return "default"; }
    })());

    var authOverlay = document.getElementById("authOverlay");

    var _cloud = {
        users: [],
        orders: [],
        reviews: {},
        comments: {},
        products: {},
        deletedDefaults: [],
        promocodes: [],
        dms: {},
        bannedAccounts: [],
        panelRoles: {},
        ready: { users: false, orders: false, reviews: false, comments: false, products: false, promocodes: false, dms: false, bannedAccounts: false, panelRoles: false }
    };
    var _ownerSeeded = false;

    function _onCloudChange(kind) {
        if (kind === "orders" && typeof refreshOrderUI === "function") {
            refreshOrderUI();
        }
        if (kind === "reviews") {
            if (typeof renderAllProductRatings === "function") renderAllProductRatings();
            if (typeof renderProductReviews === "function" && currentProductId) renderProductReviews(currentProductId);
        }
        if (kind === "comments") {
            if (typeof renderProductReviews === "function" && currentProductId) renderProductReviews(currentProductId);
        }
        if (kind === "users" && typeof renderAccount === "function") {
            renderAccount();
        }
        if (kind === "panelRoles") {
            if (typeof renderAccount === "function") renderAccount();
            if (typeof updateAddProductButtonVisibility === "function") updateAddProductButtonVisibility();
        }
        if (kind === "products") {
            applyCloudProducts();
            if (typeof renderProductGrid === "function") renderProductGrid();
            if (typeof renderAllProductRatings === "function") renderAllProductRatings();
        }
        if (kind === "promocodes") {
            if (typeof renderPromoHistoryList === "function") renderPromoHistoryList();
        }
        if (kind === "dms") {
            if (typeof renderDmMessages === "function") renderDmMessages();
            if (typeof renderChatHeadDock === "function") renderChatHeadDock();
            if (typeof checkForNewIncomingDm === "function") checkForNewIncomingDm();
        }
    }

    var _usersServerConfirmed = false;

    db.collection("cvspee").doc("users").onSnapshot(function (doc) {
        _cloud.users = (doc.exists && doc.data().list) ? doc.data().list : [];
        _cloud.ready.users = true;
        if (!doc.metadata.fromCache) _usersServerConfirmed = true;
        seedOwnerAccountIfNeeded();
        _onCloudChange("users");
    }, function (err) { console.error("users sync error", err); });

    db.collection("cvspee").doc("siteTheme").onSnapshot(function (doc) {
        applyEventTheme((doc.exists && doc.data().theme) || "default");
    }, function (err) { console.error("siteTheme sync error", err); });

    db.collection("cvspee").doc("bannedAccounts").onSnapshot(function (doc) {
        _cloud.bannedAccounts = (doc.exists && doc.data().list) ? doc.data().list : [];
        _cloud.ready.bannedAccounts = true;
    }, function (err) { console.error("bannedAccounts sync error", err); });

    function getBannedRecord(email) {
        email = (email || "").trim().toLowerCase();
        if (!email) return null;
        var list = _cloud.bannedAccounts || [];
        for (var i = 0; i < list.length; i++) {
            if ((list[i].email || "").toLowerCase() === email) return list[i];
        }
        return null;
    }

    db.collection("cvspee").doc("orderManageAccounts").onSnapshot(function (doc) {
        _cloud.panelRoles = (doc.exists && doc.data().map) ? doc.data().map : {};
        _cloud.ready.panelRoles = true;
        _onCloudChange("panelRoles");
    }, function (err) { console.error("panelRoles sync error", err); });

    function getPanelRole(email) {
        email = (email || "").trim().toLowerCase();
        if (!email) return null;
        var map = _cloud.panelRoles || {};
        for (var key in map) {
            if (Object.prototype.hasOwnProperty.call(map, key) && key.toLowerCase() === email) {
                return map[key].role || null;
            }
        }
        return null;
    }

    var _productsMode = "perdoc";
    var _pSync = { prod: false, meta: false };
    var _legacyAttached = false;

    function productDocRef(id) { return db.collection("cvspeeProducts").doc(id); }
    function productsMetaRef() { return db.collection("cvspee").doc("productsMeta"); }
    function cleanForSave(o) { return JSON.parse(JSON.stringify(o)); }
    function productTooLarge(p) { return JSON.stringify(p).length > 900000; }

    function reportProductSaveError(err) {
        console.error("product save failed", err);
        var code = (err && err.code) || "error";
        var msg = "Sorry, the product change couldn't be saved (" + code + "). ";
        if (code === "permission-denied") msg += "Your Firestore rules need to allow the cvspeeProducts collection.";
        else if (code === "invalid-argument") msg += "The photo may be too big. Try a smaller image.";
        else msg += "Please check your connection and try again.";
        alert(msg);
    }

    function persistProductsLegacy() {
        db.collection("cvspee").doc("products").set({ map: _cloud.products, deletedDefaults: _cloud.deletedDefaults || [] })
            .catch(reportProductSaveError);
    }

    function persistProduct(id, alsoMeta) {
        if (_productsMode === "legacy") { persistProductsLegacy(); return; }
        var batch = db.batch();
        batch.set(productDocRef(id), cleanForSave(_cloud.products[id]));
        if (alsoMeta) batch.set(productsMetaRef(), { migrated: true, deletedDefaults: _cloud.deletedDefaults || [] }, { merge: true });
        batch.commit().catch(reportProductSaveError);
    }

    function persistProductRemoval(id) {
        if (_productsMode === "legacy") { persistProductsLegacy(); return; }
        var batch = db.batch();
        batch.delete(productDocRef(id));
        batch.set(productsMetaRef(), { migrated: true, deletedDefaults: _cloud.deletedDefaults || [] }, { merge: true });
        batch.commit().catch(reportProductSaveError);
    }

    function persistStockChanges(changes) {
        if (_productsMode === "legacy") { persistProductsLegacy(); return; }
        changes.forEach(function (c) {
            var ref = productDocRef(c.id);
            db.runTransaction(function (tx) {
                return tx.get(ref).then(function (d) {
                    if (!d.exists || typeof d.data().stock !== "number") return;
                    tx.update(ref, { stock: Math.max(0, d.data().stock + c.delta) });
                });
            }).catch(function (err) { console.error("stock update failed", err); });
        });
    }

    function migrateProductsToPerDoc() {
        var legacyRef = db.collection("cvspee").doc("products");
        var metaRef = productsMetaRef();
        return db.runTransaction(function (tx) {
            return tx.get(metaRef).then(function (metaDoc) {
                if (metaDoc.exists && metaDoc.data().migrated) return;
                return tx.get(legacyRef).then(function (legacyDoc) {
                    var data = legacyDoc.exists ? legacyDoc.data() : {};
                    var map = data.map || {};
                    Object.keys(map).forEach(function (id) {
                        if (map[id]) tx.set(productDocRef(id), cleanForSave(map[id]));
                    });
                    tx.set(metaRef, {
                        migrated: true,
                        deletedDefaults: Array.isArray(data.deletedDefaults) ? data.deletedDefaults : [],
                        migratedAt: Date.now()
                    });
                });
            });
        });
    }

    function attachPerDocProducts() {
        _productsMode = "perdoc";
        productsMetaRef().onSnapshot(function (doc) {
            if (_productsMode === "legacy") return;
            _cloud.deletedDefaults = (doc.exists && Array.isArray(doc.data().deletedDefaults)) ? doc.data().deletedDefaults : [];
            if (!doc.metadata.fromCache) _pSync.meta = true;
            seedDefaultProductsIfNeeded();
        }, function (err) { console.error("products meta sync error", err); });

        db.collection("cvspeeProducts").onSnapshot(function (snap) {
            if (_productsMode === "legacy") return;
            var map = {};
            snap.docs.forEach(function (d) { map[d.id] = d.data(); });
            _cloud.products = map;
            _cloud.ready.products = true;
            if (!snap.metadata.fromCache) _pSync.prod = true;
            seedDefaultProductsIfNeeded();
            _onCloudChange("products");
        }, function (err) {
            console.error("products sync error", err);
            if (err && err.code === "permission-denied") attachLegacyProducts();
        });
    }

    function attachLegacyProducts() {
        if (_legacyAttached) return;
        _legacyAttached = true;
        _productsMode = "legacy";
        db.collection("cvspee").doc("products").onSnapshot(function (doc) {
            _cloud.products = (doc.exists && doc.data().map) ? doc.data().map : {};
            _cloud.deletedDefaults = (doc.exists && Array.isArray(doc.data().deletedDefaults)) ? doc.data().deletedDefaults : [];
            _cloud.ready.products = true;
            seedDefaultProductsIfNeeded();
            _onCloudChange("products");
        }, function (err) { console.error("products sync error", err); });
    }

    function startProductsSync() {
        productsMetaRef().get().then(function (d) {
            if (d.exists && d.data().migrated) return;
            return migrateProductsToPerDoc();
        }).then(attachPerDocProducts).catch(function (err) {
            console.error("products bootstrap failed", err);
            if (err && err.code === "permission-denied") attachLegacyProducts();
            else setTimeout(startProductsSync, 5000);
        });
    }
    startProductsSync();

    migrateLegacyOrdersIfNeeded();

    db.collection("cvspeeOrders").orderBy("id").onSnapshot(function (snapshot) {
        _cloud.orders = snapshot.docs.map(function (d) { return d.data(); });
        _cloud.ready.orders = true;
        _onCloudChange("orders");
    }, function (err) { console.error("orders sync error", err); });

    function migrateLegacyOrdersIfNeeded() {
        db.collection("cvspeeOrders").limit(1).get().then(function (snap) {
            if (!snap.empty) return;

            db.collection("cvspee").doc("orders").get().then(function (doc) {
                var legacyList = (doc.exists && Array.isArray(doc.data().list)) ? doc.data().list : [];
                if (legacyList.length === 0) return;

                var batch = db.batch();
                legacyList.forEach(function (o) {
                    if (o && o.id) batch.set(db.collection("cvspeeOrders").doc(o.id), o);
                });
                batch.commit().catch(function (err) {
                    console.error("Legacy order migration failed", err);
                });
            }).catch(function (err) {
                console.error("Failed reading legacy orders doc", err);
            });
        }).catch(function (err) {
            console.error("Failed checking orders subcollection", err);
        });
    }

    db.collection("cvspee").doc("reviews").onSnapshot(function (doc) {
        _cloud.reviews = (doc.exists && doc.data().map) ? doc.data().map : {};
        _cloud.ready.reviews = true;
        _onCloudChange("reviews");
    }, function (err) { console.error("reviews sync error", err); });

    db.collection("cvspee").doc("comments").onSnapshot(function (doc) {
        _cloud.comments = (doc.exists && doc.data().map) ? doc.data().map : {};
        _cloud.ready.comments = true;
        _onCloudChange("comments");
    }, function (err) { console.error("comments sync error", err); });

    db.collection("cvspee").doc("promocodes").onSnapshot(function (doc) {
        _cloud.promocodes = (doc.exists && doc.data().list) ? doc.data().list : [];
        _cloud.ready.promocodes = true;
        _onCloudChange("promocodes");
    }, function (err) { console.error("promocodes sync error", err); });

    db.collection("cvspee").doc("dms").onSnapshot(function (doc) {
        _cloud.dms = (doc.exists && doc.data().map) ? doc.data().map : {};
        _cloud.ready.dms = true;
        _onCloudChange("dms");
    }, function (err) { console.error("dms sync error", err); });

    
    
    
    var _presence = {};
    var PRESENCE_HEARTBEAT_MS = 12000;
    var ONLINE_THRESHOLD_MS = 30000;

    db.collection("cvspee").doc("presence").onSnapshot(function (doc) {
        _presence = (doc.exists && doc.data().map) ? doc.data().map : {};
    }, function (err) { console.error("presence sync error", err); });

    function isUserOnline(email) {
        if (!email || !_presence[email]) return false;
        return (Date.now() - _presence[email]) < ONLINE_THRESHOLD_MS;
    }

    function sendPresenceHeartbeat() {
        var user = getCurrentUser();
        if (!user) return;
        var patch = {};
        patch[user.email] = Date.now();
        db.collection("cvspee").doc("presence").set({ map: patch }, { merge: true })
            .catch(function (err) { console.error("presence heartbeat error", err); });
    }

    setInterval(sendPresenceHeartbeat, PRESENCE_HEARTBEAT_MS);

    var _typing = {};
    var TYPING_ACTIVE_MS = 2500;
    var TYPING_WRITE_THROTTLE_MS = 1200;
    var _lastTypingWriteAt = 0;

    db.collection("cvspee").doc("typing").onSnapshot(function (doc) {
        _typing = (doc.exists && doc.data().map) ? doc.data().map : {};
    }, function (err) { console.error("typing sync error", err); });

    function isOtherTyping(orderId, otherRole) {
        if (!orderId || !otherRole || !_typing[orderId]) return false;
        var ts = _typing[orderId][otherRole];
        if (!ts) return false;
        return (Date.now() - ts) < TYPING_ACTIVE_MS;
    }

    function notifyTyping(orderId, myRole) {
        if (!orderId || !myRole) return;
        var now = Date.now();
        if (now - _lastTypingWriteAt < TYPING_WRITE_THROTTLE_MS) return;
        _lastTypingWriteAt = now;

        var patch = {};
        patch[orderId] = {};
        patch[orderId][myRole] = now;
        db.collection("cvspee").doc("typing").set({ map: patch }, { merge: true })
            .catch(function (err) { console.error("typing write error", err); });
    }

    function getUsers() {
        return _cloud.users;
    }

    function saveUsers(users) {
        _cloud.users = users;
        db.collection("cvspee").doc("users").set({ list: users })
            .catch(function (err) {
                console.error("saveUsers error", err);
                alert("Sorry, we couldn't save that change. Please check your connection and try again.");
            });
    }

    function updateUsers(mutator, onDone, onError) {
        var ref = db.collection("cvspee").doc("users");
        db.runTransaction(function (transaction) {
            return transaction.get(ref).then(function (doc) {
                var list = (doc.exists && doc.data().list) ? doc.data().list : [];
                var result = mutator(list.slice()) || list;
                transaction.set(ref, { list: result });
                return result;
            });
        }).then(function (result) {
            _cloud.users = result;
            if (onDone) onDone(result);
        }).catch(function (err) {
            console.error("updateUsers error", err);
            alert("Sorry, we couldn't save that change. Please check your connection and try again.");
            if (onError) onError(err);
        });
    }

    function normalizeUsername(raw) {
        var v = (raw || "").trim();
        if (v && v.charAt(0) !== "@") v = "@" + v;
        return v;
    }

    function isValidUsername(username) {
        return /^@[A-Za-z0-9_]{3,20}$/.test(username);
    }

    function isCvsuEmail(email) {
        return /@([a-z0-9-]+\.)*cvsu\.edu\.ph$/i.test((email || "").trim());
    }

    function isUsernameTaken(username, excludeEmail) {
        var users = getUsers();
        var lower = username.toLowerCase();
        for (var i = 0; i < users.length; i++) {
            if (users[i].email === excludeEmail) continue;
            if ((users[i].username || "").toLowerCase() === lower) return true;
        }
        return false;
    }

    
    
    
    function liveAvatarFor(email, fallbackAvatar) {
        if (email) {
            var users = getUsers();
            for (var i = 0; i < users.length; i++) {
                if (users[i].email === email) return users[i].avatar || fallbackAvatar || "";
            }
        }
        return fallbackAvatar || "";
    }

    function liveNameFor(email, fallbackName) {
        if (email) {
            var users = getUsers();
            for (var i = 0; i < users.length; i++) {
                if (users[i].email === email) return users[i].name || fallbackName || "";
            }
        }
        return fallbackName || "";
    }

    var OWNER_EMAIL = "cvspeeowner@gmail.com";
    var OWNER_PASSWORD = "owner123";

    function seedOwnerAccountIfNeeded() {
        if (_ownerSeeded || !_cloud.ready.users) return;
        _ownerSeeded = true;
        var exists = _cloud.users.some(function (u) { return u.email === OWNER_EMAIL; });
        if (!exists) {
            updateUsers(function (users) {
                if (users.some(function (u) { return u.email === OWNER_EMAIL; })) return users;
                users.push({ name: "CVSPEE Owner", username: "@CVSPEEOwner", email: OWNER_EMAIL, password: OWNER_PASSWORD, avatar: "", isOwner: true });
                return users;
            });
        }
    }

    function continueAsOwner(e) {
        if (e) e.preventDefault();
        setCurrentUser(OWNER_EMAIL);
        closeAuthModal();
        renderAccount();
    }

    function getCurrentUser() {
        var email = localStorage.getItem("cvspee_current_user");
        if (!email) return null;
        if (getBannedRecord(email)) return null;
        var users = getUsers();
        for (var i = 0; i < users.length; i++) {
            if (users[i].email === email) return users[i];
        }
        return null;
    }

    function setCurrentUser(email) {
        localStorage.setItem("cvspee_current_user", email);
        migrateLegacyCart();
        sendPresenceHeartbeat();
        loadDarkModeForCurrentUser();
        _dmSoundInitialized = false;
    }

    var authSubtitles = {
        signin: "Sign in or create an account to continue to CVSPEE.",
        signup: "Sign in or create an account to continue to CVSPEE.",
        signupVerify: "Verify your email to finish creating your account.",
        forgotEmail: "Reset your password.",
        forgotReset: "Enter the code we sent and choose a new password."
    };

    var currentAuthMode = "signin";

    function togglePasswordVisibility(btn) {
        var input = btn.parentNode.querySelector("input");
        if (!input) return;
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.querySelector(".pw-eye").style.display = show ? "none" : "";
        btn.querySelector(".pw-eye-off").style.display = show ? "" : "none";
        var label = show ? "Hide password" : "Show password";
        btn.setAttribute("aria-label", label);
        btn.title = label;
    }

    function hideAllPasswords() {
        var btns = document.querySelectorAll(".auth-pw-toggle");
        for (var i = 0; i < btns.length; i++) {
            var input = btns[i].parentNode.querySelector("input");
            if (input && input.type !== "password") togglePasswordVisibility(btns[i]);
        }
    }

    function switchAuthTab(tab) {
        hideAllPasswords();
        if (tab === "signin" || tab === "signup") {
            currentAuthMode = tab;
        }

        document.getElementById("tabSignin").classList.toggle("active", tab === "signin");
        document.getElementById("tabSignup").classList.toggle("active", tab === "signup");

        document.getElementById("signinForm").classList.toggle("active", tab === "signin");
        document.getElementById("signupForm").classList.toggle("active", tab === "signup");
        document.getElementById("signupVerifyForm").classList.toggle("active", tab === "signupVerify");
        document.getElementById("forgotEmailForm").classList.toggle("active", tab === "forgotEmail");
        document.getElementById("forgotResetForm").classList.toggle("active", tab === "forgotReset");

        var isBaseStep = (tab === "signin" || tab === "signup");
        document.getElementById("authTabs").style.display = isBaseStep ? "flex" : "none";
        document.getElementById("authSkip").style.display = isBaseStep ? "inline-block" : "none";
        document.getElementById("authOwnerSkip").style.display = isBaseStep ? "inline-block" : "none";

        document.getElementById("authSubtitle").textContent = authSubtitles[tab] || "";

        if (tab === "signup") toggleSignupStudentId();
    }

    function generateCode() {
        return String(Math.floor(100000 + Math.random() * 900000));
    }

    var ROLE_ID_LABELS = {
        Student: "Student ID",
        Teacher: "Teacher ID",
        Parent: "National ID"
    };

    function toggleSignupStudentId() {
        var role = document.getElementById("signupRole").value;
        var field = document.getElementById("signupStudentId");
        field.style.display = (role === "Student") ? "block" : "none";
        if (role !== "Student") field.value = "";

        var emailNote = document.getElementById("signupEmailNote");
        if (emailNote) emailNote.style.display = (role === "Student" || role === "Teacher") ? "block" : "none";

        var idLabel = ROLE_ID_LABELS[role];
        var uploadLabel = document.getElementById("signupIdUploadLabel");
        var uploadNote = document.getElementById("signupIdUploadNote");
        if (idLabel) {
            uploadLabel.textContent = idLabel + " + Selfie";
            uploadNote.textContent = (role === "Student" ?
                "Fill up the form above first. Then scan your Student ID and take a selfie holding it — our AI checks that the Student ID number and name on your ID match what you typed." :
                "Fill up the form above first. Then scan your " + idLabel + " and take a selfie holding it — our AI checks that the name on your ID matches what you typed.");
        } else {
            uploadLabel.textContent = "Student/Teacher ID or National ID + Selfie";
            uploadNote.textContent = "Fill up the form and select your role first — then you'll scan your Student ID, Teacher ID, or National ID (for Parent) and take a selfie holding it.";
        }
    }

    function openAuthModal() {
        authOverlay.classList.add("show");
        toggleSignupStudentId();
        resetIdScanState();
    }

    function closeAuthModal(e) {
        if (e) e.preventDefault();
        authOverlay.classList.remove("show");
    }

    function resetIdScanState() {
        idScanMode = "id";
        signupCapturedIdImage = null;
        signupCapturedSelfieImage = null;
        idScanPendingDataUrl = null;
        var idPreview = document.getElementById("signupIdPreview");
        var selfiePreview = document.getElementById("signupSelfiePreview");
        var scanBtn = document.getElementById("signupScanBtn");
        if (idPreview) { idPreview.style.display = "none"; idPreview.src = ""; }
        if (selfiePreview) { selfiePreview.style.display = "none"; selfiePreview.src = ""; }
        if (scanBtn) scanBtn.textContent = "📷 Scan ID & Selfie";
    }

    var VERIFY_ID_ENDPOINT = BACKEND_URL + "/api/verify-id";

    var idScanStream = null;
    var idScanMode = "id";
    var signupCapturedIdImage = null;
    var signupCapturedSelfieImage = null;

    function validateSignupFieldsBeforeScan() {
        var errorEl = document.getElementById("signupError");
        function fail(msg, fieldId) {
            errorEl.textContent = msg;
            var el = document.getElementById(fieldId);
            if (el && el.focus) el.focus();
            return false;
        }

        var name = document.getElementById("signupName").value.trim();
        var username = normalizeUsername(document.getElementById("signupUsername").value);
        var email = document.getElementById("signupEmail").value.trim().toLowerCase();
        var password = document.getElementById("signupPassword").value;
        var role = document.getElementById("signupRole").value;
        var studentId = document.getElementById("signupStudentId").value.trim();

        if (!name || name.split(/\s+/).length < 2) return fail("Please enter your full name (first and last name) exactly as shown on your ID.", "signupName");
        if (!isValidUsername(username)) return fail("Username must start with @ and be 3-20 letters, numbers, or underscores (e.g. @CVSPEE2026).", "signupUsername");
        if (isUsernameTaken(username)) return fail("That username is already taken. Please choose another.", "signupUsername");
        if (!email) return fail("Please enter your email.", "signupEmail");
        if (password.length < 6) return fail("Password must be at least 6 characters.", "signupPassword");
        if (!role) return fail("Please select whether you are a Teacher, Student, or Parent first.", "signupRole");
        if ((role === "Student" || role === "Teacher") && !isCvsuEmail(email)) return fail("Students and teachers must sign up using an official @cvsu.edu.ph email address.", "signupEmail");
        if (role === "Student" && !/^[0-9A-Za-z-]{5,20}$/.test(studentId)) return fail("Please enter your Student ID number first (e.g. 202413535) — we'll match it with your ID.", "signupStudentId");

        errorEl.textContent = "";
        return true;
    }

    function startIdScanFlow() {
        if (!validateSignupFieldsBeforeScan()) return;

        signupCapturedIdImage = null;
        signupCapturedSelfieImage = null;
        document.getElementById("signupIdPreview").style.display = "none";
        document.getElementById("signupSelfiePreview").style.display = "none";
        idScanMode = "id";
        openIdScanner();
    }

    function openIdScanner() {
        var overlay = document.getElementById("idScanOverlay");
        var video = document.getElementById("idScanVideo");
        var errorEl = document.getElementById("idScanError");
        var guide = document.getElementById("idScanGuide");
        var title = document.getElementById("idScanTitle");
        var hint = document.getElementById("idScanHint");
        var frameWrap = document.getElementById("idScanFrameWrap");
        var isSelfieStep = (idScanMode === "selfie");

        errorEl.textContent = "";
        document.getElementById("idScanSnapshot").style.display = "none";
        video.style.display = "block";
        document.getElementById("idScanLiveActions").style.display = "flex";
        document.getElementById("idScanReviewActions").style.display = "none";

        guide.classList.toggle("id-scan-guide-face", isSelfieStep);
        guide.classList.remove("id-scan-guide-good", "id-scan-guide-tracking");
        resetIdGuidePosition();

        var idLabel = ROLE_ID_LABELS[document.getElementById("signupRole").value] || "ID";
        title.textContent = isSelfieStep ? ("Selfie with your " + idLabel) : ("Scan your " + idLabel);
        hint.textContent = isSelfieStep ?
            "Hold the same " + idLabel + " next to your face, and make sure both are clearly visible." :
            "Show your " + idLabel + " to the camera — the box will find it and follow it automatically.";

        overlay.classList.add("show");

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            errorEl.textContent = "Your browser doesn't support camera scanning. Please try a different browser (Chrome/Safari) or device.";
            return;
        }

        navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: isSelfieStep ? "user" : "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        }).then(function (stream) {
            idScanStream = stream;
            video.srcObject = stream;
            setupIdCameraFocus(stream);
            startAutoCaptureLoop();
        }).catch(function (err) {
            console.error("camera error:", err);
            errorEl.textContent = "Couldn't access the camera. Please allow camera permission and try again.";
        });
    }

    var idScanAutoTimer = null;
    var idScanAutoCanvas = document.createElement("canvas");
    var idScanPrevGray = null;
    var idScanStableCount = 0;

    function startAutoCaptureLoop() {
        stopAutoCaptureLoop();
        idScanPrevGray = null;
        idScanStableCount = 0;
        idScanSmoothBox = null;
        idScanMissCount = 0;
        idScanSessionId++;
        idAiEnabled = true;
        idAiBusy = false;
        idAiFails = 0;
        idAiResponded = false;
        idAiNoneCount = 0;
        idAiLast = null;
        idAiPending = null;
        idAiConfirmedAt = 0;
        idAiLastReqAt = 0;
        idScanAutoTimer = setInterval(analyzeFrameForAutoCapture, 150);
    }

    function stopAutoCaptureLoop() {
        if (idScanAutoTimer) {
            clearInterval(idScanAutoTimer);
            idScanAutoTimer = null;
        }
    }

    var idScanSmoothBox = null;
    var idScanMissCount = 0;

    function orderQuad(pts) {
        var cx = 0, cy = 0, i;
        for (i = 0; i < 4; i++) { cx += pts[i][0] / 4; cy += pts[i][1] / 4; }
        var sorted = pts.slice().sort(function (u, v) {
            return Math.atan2(u[1] - cy, u[0] - cx) - Math.atan2(v[1] - cy, v[0] - cx);
        });
        var st = 0, bs = 1e9;
        for (i = 0; i < 4; i++) { var sm = sorted[i][0] + sorted[i][1]; if (sm < bs) { bs = sm; st = i; } }
        return [sorted[st], sorted[(st + 1) % 4], sorted[(st + 2) % 4], sorted[(st + 3) % 4]];
    }

    function quadMeanDist(a, b) {
        var t = 0;
        for (var i = 0; i < 4; i++) t += Math.hypot(a[i][0] - b[i][0], a[i][1] - b[i][1]);
        return t / 4;
    }

    function detectCardQuad(gray, w, h, prior) {
        var x, y, i, k;
        function box3(src) {
            var out = new Float32Array(w * h);
            for (var yy = 1; yy < h - 1; yy++) {
                for (var xx = 1; xx < w - 1; xx++) {
                    var j = yy * w + xx;
                    out[j] = (src[j - w - 1] + src[j - w] + src[j - w + 1] +
                              src[j - 1] + src[j] + src[j + 1] +
                              src[j + w - 1] + src[j + w] + src[j + w + 1]) / 9;
                }
            }
            return out;
        }
        var bl = box3(box3(gray));

        var mag = new Float32Array(w * h);
        var ang = new Float32Array(w * h);
        var hist = new Int32Array(256);
        var maxMag = 0;
        for (y = 4; y < h - 4; y++) {
            for (x = 4; x < w - 4; x++) {
                i = y * w + x;
                var gx = (bl[i - w + 1] + 2 * bl[i + 1] + bl[i + w + 1]) -
                         (bl[i - w - 1] + 2 * bl[i - 1] + bl[i + w - 1]);
                var gy = (bl[i + w - 1] + 2 * bl[i + w] + bl[i + w + 1]) -
                         (bl[i - w - 1] + 2 * bl[i - w] + bl[i - w + 1]);
                var m = Math.sqrt(gx * gx + gy * gy) / 4;
                mag[i] = m;
                var a = Math.atan2(gy, gx);
                if (a < 0) a += Math.PI;
                if (a >= Math.PI) a -= Math.PI;
                ang[i] = a;
                if (m > maxMag) maxMag = m;
            }
        }
        if (maxMag < 6) return null;
        var scale = 255 / maxMag;
        var total = 0;
        for (i = 0; i < mag.length; i++) { hist[Math.min(255, (mag[i] * scale) | 0)]++; total++; }
        var acc = 0, cut = 255;
        for (k = 255; k >= 0; k--) { acc += hist[k]; if (acc > total * 0.14) { cut = k; break; } }
        var thr = Math.max(5, cut / scale);

        var edge = new Uint8Array(w * h);
        var edgeList = [];
        for (i = 0; i < mag.length; i++) {
            if (mag[i] > thr) { edge[i] = 1; edgeList.push(i); }
        }
        if (edgeList.length < 60) return null;

        var NT = 90;
        var diag = Math.ceil(Math.sqrt(w * w + h * h));
        var NR = diag * 2 + 1;
        var acc2 = new Float32Array(NT * NR);
        var cosT = new Float32Array(NT), sinT = new Float32Array(NT);
        for (k = 0; k < NT; k++) { cosT[k] = Math.cos(k * Math.PI / NT); sinT[k] = Math.sin(k * Math.PI / NT); }
        for (var e = 0; e < edgeList.length; e++) {
            i = edgeList[e];
            x = i % w; y = (i - x) / w;
            var tb = Math.round(ang[i] / Math.PI * NT);
            for (var dt = -1; dt <= 1; dt++) {
                var t = tb + dt;
                var xr = x, flip = 1;
                if (t < 0) { t += NT; flip = -1; }
                if (t >= NT) { t -= NT; flip = -1; }
                var rho = (x * cosT[t] + y * sinT[t]) * flip;
                var rb = Math.round(rho) + diag;
                if (rb >= 0 && rb < NR) acc2[t * NR + rb] += (dt === 0 ? 1 : 0.6);
            }
        }

        var accS = new Float32Array(NT * NR);
        for (var ts = 0; ts < NT; ts++) {
            for (var rs = 2; rs < NR - 2; rs++) {
                var bi = ts * NR + rs;
                accS[bi] = acc2[bi - 2] * 0.5 + acc2[bi - 1] + acc2[bi] + acc2[bi + 1] + acc2[bi + 2] * 0.5;
            }
        }
        acc2 = accS;
        function lineDist(a, b) {
            var dtheta = Math.abs(a.t - b.t), r2 = b.r;
            if (dtheta > NT / 2) { dtheta = NT - dtheta; r2 = -b.r; }
            return { dt: dtheta, dr: Math.abs(a.r - r2) };
        }
        var cand = [];
        for (var tt = 0; tt < NT; tt++) {
            for (var rr = 1; rr < NR - 1; rr++) {
                var v = acc2[tt * NR + rr];
                if (v > 0 && v >= acc2[tt * NR + rr - 1] && v >= acc2[tt * NR + rr + 1]) cand.push({ t: tt, r: rr - diag, v: v });
            }
        }
        cand.sort(function (a, b) { return b.v - a.v; });
        var lines = [];
        for (var grp = 0; grp < 2; grp++) {
            var gl = [], gmax = 0;
            for (var c = 0; c < cand.length; c++) {
                var isHoriz = (cand[c].t >= NT / 4 && cand[c].t <= NT * 3 / 4);
                if ((grp === 0) !== isHoriz) continue;
                if (!gmax) gmax = cand[c].v;
                if (cand[c].v < gmax * 0.12 || gl.length >= 8) break;
                var ok = true;
                for (var l = 0; l < lines.length; l++) {
                    var d = lineDist(cand[c], lines[l]);
                    if (d.dt <= 4 && d.dr <= 7) { ok = false; break; }
                }
                if (ok) { lines.push(cand[c]); gl.push(cand[c]); }
            }
        }
        if (lines.length < 4) return null;

        function angDiffBins(a, b) { var d = Math.abs(a.t - b.t); return d > NT / 2 ? NT - d : d; }
        function intersect(a, b) {
            var ta = a.t * Math.PI / NT, tb2 = b.t * Math.PI / NT;
            var c1 = Math.cos(ta), s1 = Math.sin(ta), c2 = Math.cos(tb2), s2 = Math.sin(tb2);
            var det = c1 * s2 - s1 * c2;
            if (Math.abs(det) < 0.2) return null;
            return [(a.r * s2 - b.r * s1) / det, (b.r * c1 - a.r * c2) / det];
        }

        var pairs = [];
        for (var p = 0; p < lines.length; p++) {
            for (var q = p + 1; q < lines.length; q++) {
                if (angDiffBins(lines[p], lines[q]) <= 4) {
                    var dd = lineDist(lines[p], lines[q]);
                    if (dd.dr >= Math.min(w, h) * 0.18) pairs.push([lines[p], lines[q]]);
                }
            }
        }

        function refineQuad(pts, range) {
            var lns = [];
            for (var q2 = 0; q2 < 4; q2++) {
                var p1 = pts[q2], p2 = pts[(q2 + 1) % 4];
                var dx = p2[0] - p1[0], dy = p2[1] - p1[1];
                var len = Math.sqrt(dx * dx + dy * dy) || 1;
                var nx = -dy / len, ny = dx / len;
                var bestO = 0, bestSum = -1;
                for (var o = -range; o <= range; o += 0.5) {
                    var sumM = 0;
                    for (var s2 = 1; s2 < 20; s2++) {
                        var f = 0.1 + 0.8 * s2 / 20;
                        var qx = Math.round(p1[0] + dx * f + nx * o), qy = Math.round(p1[1] + dy * f + ny * o);
                        if (qx < 4 || qy < 4 || qx >= w - 4 || qy >= h - 4) continue;
                        var qi = qy * w + qx;
                        var da = Math.abs(ang[qi] - (((Math.atan2(ny, nx) % Math.PI) + Math.PI) % Math.PI));
                        if (da > Math.PI / 2) da = Math.PI - da;
                        if (da < 0.5) sumM += mag[qi];
                    }
                    sumM -= Math.abs(o) * 0.02 * sumM;
                    if (sumM > bestSum) { bestSum = sumM; bestO = o; }
                }
                lns.push({ x: p1[0] + nx * bestO, y: p1[1] + ny * bestO, dx: dx, dy: dy });
            }
            var out = [];
            for (var c2 = 0; c2 < 4; c2++) {
                var l1 = lns[(c2 + 3) % 4], l2 = lns[c2];
                var det = l1.dx * l2.dy - l1.dy * l2.dx;
                if (Math.abs(det) < 1e-6) { out.push(pts[c2]); continue; }
                var tt2 = ((l2.x - l1.x) * l2.dy - (l2.y - l1.y) * l2.dx) / det;
                out.push([l1.x + l1.dx * tt2, l1.y + l1.dy * tt2]);
            }
            return out;
        }

        function sideSupport(p1, p2) {
            var dx = p2[0] - p1[0], dy = p2[1] - p1[1];
            var len = Math.sqrt(dx * dx + dy * dy);
            if (len < 8) return 0;
            var sideAng = Math.atan2(dy, dx) + Math.PI / 2;
            sideAng = ((sideAng % Math.PI) + Math.PI) % Math.PI;
            var steps = Math.max(12, Math.min(40, Math.round(len / 3)));
            var hit = 0, valid = 0;
            for (var s = 1; s < steps; s++) {
                var px = p1[0] + dx * s / steps, py = p1[1] + dy * s / steps;
                var ix = Math.round(px), iy = Math.round(py);
                if (ix < 2 || iy < 2 || ix >= w - 2 || iy >= h - 2) { continue; }
                valid++;
                var found = false;
                for (var oy = -2; oy <= 2 && !found; oy++) {
                    for (var ox = -2; ox <= 2; ox++) {
                        var j = (iy + oy) * w + (ix + ox);
                        if (!edge[j]) continue;
                        var da = Math.abs(ang[j] - sideAng);
                        if (da > Math.PI / 2) da = Math.PI - da;
                        if (da < 0.45) { found = true; break; }
                    }
                }
                if (found) hit++;
            }
            if (valid < steps * 0.5) return 0;
            return hit / valid;
        }

        var best = null, bestVal = 0;
        var frameArea = w * h;

        function dist(u, v2) { return Math.sqrt((u[0] - v2[0]) * (u[0] - v2[0]) + (u[1] - v2[1]) * (u[1] - v2[1])); }

        function evalQuad(A0, A1, B0, B1, virtualSide) {
            var perp = angDiffBins(A0, B0) * 180 / NT;
            if (perp < 84 || perp > 96) return;
            var c1 = intersect(A0, B0), c2 = intersect(A0, B1), c3 = intersect(A1, B1), c4 = intersect(A1, B0);
            if (!c1 || !c2 || !c3 || !c4) return;
            var pts = [c1, c2, c3, c4];
            var m2 = 6, kk;
            for (kk = 0; kk < 4; kk++) {
                if (pts[kk][0] < -m2 || pts[kk][0] > w + m2 || pts[kk][1] < -m2 || pts[kk][1] > h + m2) return;
            }
            pts = orderQuad(pts);

            var s1 = dist(pts[0], pts[1]), s2 = dist(pts[1], pts[2]), s3 = dist(pts[2], pts[3]), s4 = dist(pts[3], pts[0]);
            var lenA = (s1 + s3) / 2, lenB = (s2 + s4) / 2;
            var asp = Math.max(lenA, lenB) / Math.max(1, Math.min(lenA, lenB));
            if (asp < 1.25 || asp > 2.1) return;
            var area = 0;
            for (kk = 0; kk < 4; kk++) { var nk = (kk + 1) % 4; area += pts[kk][0] * pts[nk][1] - pts[nk][0] * pts[kk][1]; }
            var af = Math.abs(area) / 2 / frameArea;
            if (af < 0.10 || af > 0.95) return;
            if (Math.min(s1, s3) / Math.max(s1, s3) < 0.6 || Math.min(s2, s4) / Math.max(s2, s4) < 0.6) return;

            var sup = [sideSupport(pts[0], pts[1]), sideSupport(pts[1], pts[2]),
                       sideSupport(pts[2], pts[3]), sideSupport(pts[3], pts[0])];
            var val;
            var dev = Math.abs(asp - 1.586) / 1.586;
            if (virtualSide) {
                var sorted = sup.slice().sort(function (p1, p2) { return p1 - p2; });
                var real3 = (sorted[1] + sorted[2] + sorted[3]) / 3;
                if (sorted[1] < 0.4 || real3 < 0.5) return;
                var guessFactor = 0.45 + 0.55 * Math.min(1, sorted[0] / 0.35);
                val = real3 * Math.pow(af, 1.5) * 0.85 * guessFactor * (1 - Math.min(0.4, dev * 0.6));
                meanS = real3;
            } else {
                var minS = Math.min(sup[0], sup[1], sup[2], sup[3]);
                var meanS = (sup[0] + sup[1] + sup[2] + sup[3]) / 4;
                if (minS < 0.3 || meanS < 0.5) return;
                val = meanS * Math.pow(af, 1.5) * (1 - Math.min(0.4, dev * 0.6));
            }
            if (prior) {
                var dp = quadMeanDist(pts, prior) / diag;
                if (dp > 0.25) return;
                val *= 0.15 + Math.exp(-(dp / 0.07) * (dp / 0.07));
            }
            if (val > bestVal) { bestVal = val; best = { pts: pts, score: meanS }; }
        }

        var a, b;
        for (a = 0; a < pairs.length; a++) {
            for (b = a + 1; b < pairs.length; b++) {
                evalQuad(pairs[a][0], pairs[a][1], pairs[b][0], pairs[b][1], false);
            }
        }
        for (a = 0; a < pairs.length; a++) {
            var gap = lineDist(pairs[a][0], pairs[a][1]).dr;
            for (var li = 0; li < lines.length; li++) {
                var L = lines[li];
                if (L === pairs[a][0] || L === pairs[a][1]) continue;
                var pp = angDiffBins(pairs[a][0], L) * 180 / NT;
                if (pp < 84 || pp > 96) continue;
                var ratios = [1.586, 1 / 1.586];
                for (var ri = 0; ri < 2; ri++) {
                    for (var sg = -1; sg <= 1; sg += 2) {
                        var V = { t: L.t, r: L.r + sg * gap * ratios[ri], v: 0 };
                        evalQuad(pairs[a][0], pairs[a][1], L, V, true);
                    }
                }
            }
        }

        if (best) best.pts = refineQuad(best.pts, 3);
        if (prior) {
            var rp = refineQuad(prior, 4);
            var sp = (sideSupport(rp[0], rp[1]) + sideSupport(rp[1], rp[2]) +
                      sideSupport(rp[2], rp[3]) + sideSupport(rp[3], rp[0])) / 4;
            if (!best && sp >= 0.35) best = { pts: rp, score: sp };
        }
        return best;
    }

    var idScanTrack = null;
    var idScanCaps = null;
    var idScanLastFocusAt = 0;

    function setupIdCameraFocus(stream) {
        idScanTrack = null;
        idScanCaps = null;
        try {
            idScanTrack = stream.getVideoTracks()[0];
            idScanCaps = (idScanTrack && idScanTrack.getCapabilities) ? idScanTrack.getCapabilities() : null;
            if (idScanCaps && idScanCaps.focusMode && idScanCaps.focusMode.indexOf("continuous") !== -1) {
                idScanTrack.applyConstraints({ advanced: [{ focusMode: "continuous" }] }).catch(function () {});
            }
        } catch (e) {}
    }

    function focusCameraOnPoint(nx, ny) {
        var now = Date.now();
        if (!idScanTrack || !idScanCaps || now - idScanLastFocusAt < 1500) return;
        idScanLastFocusAt = now;
        try {
            var adv = {};
            if (idScanCaps.pointsOfInterest) {
                adv.pointsOfInterest = [{ x: nx, y: ny }];
            }
            if (idScanCaps.focusMode && idScanCaps.focusMode.indexOf("single-shot") !== -1) {
                adv.focusMode = "single-shot";
            } else if (idScanCaps.focusMode && idScanCaps.focusMode.indexOf("continuous") !== -1) {
                adv.focusMode = "continuous";
            }
            if (Object.keys(adv).length) {
                idScanTrack.applyConstraints({ advanced: [adv] }).catch(function () {});
            }
        } catch (e) {}
    }

    var idScanQuadTarget = null;
    var idScanQuadShown = null;
    var idScanQuadRaf = null;
    var idScanJumpCount = 0;

    function setIdOrientBadgeFromQuad(q) {
        var badge = document.getElementById("idScanOrientBadge");
        var video = document.getElementById("idScanVideo");
        if (!q || !video.videoWidth) { badge.style.display = "none"; return; }
        var vw = video.videoWidth, vh = video.videoHeight;
        function vec(a, b) { return [(b[0] - a[0]) * vw, (b[1] - a[1]) * vh]; }
        var e1 = vec(q[0], q[1]), e2 = vec(q[1], q[2]);
        var l1 = Math.hypot(e1[0], e1[1]), l2 = Math.hypot(e2[0], e2[1]);
        var longV = l1 >= l2 ? e1 : e2;
        var horizontal = Math.abs(longV[0]) >= Math.abs(longV[1]);
        badge.textContent = horizontal ? "▭ Horizontal ID detected" : "▯ Vertical ID detected";
        badge.style.display = "block";
    }

    function renderIdQuad() {
        idScanQuadRaf = null;
        var svg = document.getElementById("idScanQuad");
        if (!idScanQuadTarget) { svg.style.display = "none"; return; }
        if (!idScanQuadShown) {
            idScanQuadShown = idScanQuadTarget.map(function (p) { return [p[0], p[1]]; });
        } else {
            for (var i = 0; i < 4; i++) {
                idScanQuadShown[i][0] += (idScanQuadTarget[i][0] - idScanQuadShown[i][0]) * 0.18;
                idScanQuadShown[i][1] += (idScanQuadTarget[i][1] - idScanQuadShown[i][1]) * 0.18;
            }
        }
        var video = document.getElementById("idScanVideo");
        var wrap = document.getElementById("idScanFrameWrap");
        var cw = wrap.clientWidth, ch = wrap.clientHeight;
        var vw = video.videoWidth, vh = video.videoHeight;
        if (cw && ch && vw && vh) {
            var scale = Math.max(cw / vw, ch / vh);
            var ox = (cw - vw * scale) / 2, oy = (ch - vh * scale) / 2;
            var pts = idScanQuadShown.map(function (p) { return [p[0] * vw * scale + ox, p[1] * vh * scale + oy]; });
            var poly = pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
            svg.setAttribute("viewBox", "0 0 " + cw + " " + ch);
            document.getElementById("idScanQuadPoly").setAttribute("points", poly);
            document.getElementById("idScanQuadDim").setAttribute("d",
                "M0 0H" + cw + "V" + ch + "H0Z M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L") + "Z");
            var dots = svg.querySelectorAll("circle");
            for (var d = 0; d < 4; d++) {
                dots[d].setAttribute("cx", pts[d][0].toFixed(1));
                dots[d].setAttribute("cy", pts[d][1].toFixed(1));
            }
            svg.style.display = "block";
        }
        idScanQuadRaf = requestAnimationFrame(renderIdQuad);
    }

    function showIdQuad(q, locked) {
        idScanQuadTarget = q;
        document.getElementById("idScanGuide").style.display = "none";
        document.getElementById("idScanQuad").classList.toggle("locked", !!locked);
        if (!idScanQuadRaf) idScanQuadRaf = requestAnimationFrame(renderIdQuad);
    }

    function resetIdGuidePosition() {
        idScanQuadTarget = null;
        idScanQuadShown = null;
        idScanJumpCount = 0;
        if (idScanQuadRaf) { cancelAnimationFrame(idScanQuadRaf); idScanQuadRaf = null; }
        var svg = document.getElementById("idScanQuad");
        if (svg) { svg.style.display = "none"; svg.classList.remove("locked"); }
        var guide = document.getElementById("idScanGuide");
        guide.style.display = "";
        guide.classList.remove("id-scan-guide-tracking", "id-scan-guide-good");
        document.getElementById("idScanOrientBadge").style.display = "none";
    }

    function analyzeFrameForAutoCapture() {
        if (idScanMode === "selfie") {
            analyzeSelfieFrame();
        } else {
            analyzeIdFrame();
        }
    }

    function quadAreaNorm(q) {
        var a = 0;
        for (var i = 0; i < 4; i++) {
            var n = (i + 1) % 4;
            a += q[i][0] * q[n][1] - q[n][0] * q[i][1];
        }
        return Math.abs(a) / 2;
    }

    function quadDist(a, b) {
        return quadMeanDist(a, b) / 1.25;
    }

    function quadIsSane(q) {
        var i, sign = 0;
        for (i = 0; i < 4; i++) {
            if (!isFinite(q[i][0]) || !isFinite(q[i][1]) || q[i][0] < -0.03 || q[i][0] > 1.03 || q[i][1] < -0.03 || q[i][1] > 1.03) return false;
            var p1 = q[i], p2 = q[(i + 1) % 4], p3 = q[(i + 2) % 4];
            var cr = (p2[0] - p1[0]) * (p3[1] - p2[1]) - (p2[1] - p1[1]) * (p3[0] - p2[0]);
            var sg = cr > 0 ? 1 : -1;
            if (sign === 0) sign = sg; else if (sg !== sign) return false;
        }
        var ar = quadAreaNorm(q);
        return ar > 0.04 && ar < 0.97;
    }

    var idScanSessionId = 0;
    var idAiEnabled = true;
    var idAiBusy = false;
    var idAiFails = 0;
    var idAiResponded = false;
    var idAiNoneCount = 0;
    var idAiLast = null;
    var idAiPending = null;
    var idAiConfirmedAt = 0;
    var idAiLastReqAt = 0;
    var idAiCanvas = document.createElement("canvas");

    function requestAiDetect(video) {
        var now = Date.now();
        if (!idAiEnabled || idAiBusy || !video.videoWidth || now - idAiLastReqAt < 500) return;
        idAiBusy = true;
        idAiLastReqAt = now;

        var cw = 480;
        var ch = Math.round(cw * video.videoHeight / video.videoWidth);
        idAiCanvas.width = cw;
        idAiCanvas.height = ch;
        var dataUrl;
        try {
            idAiCanvas.getContext("2d").drawImage(video, 0, 0, cw, ch);
            dataUrl = idAiCanvas.toDataURL("image/jpeg", 0.72);
        } catch (e) {
            idAiBusy = false;
            return;
        }

        var session = idScanSessionId;
        var ctrl = (typeof AbortController !== "undefined") ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 7000);
        var url = VERIFY_ID_ENDPOINT.replace("/verify-id", "/detect-id");

        fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: dataUrl, mimeType: "image/jpeg" }),
            signal: ctrl ? ctrl.signal : undefined
        }).then(function (r) {
            if (!r.ok) throw new Error("http " + r.status);
            return r.json();
        }).then(function (d) {
            clearTimeout(timer);
            idAiBusy = false;
            if (session !== idScanSessionId) return;
            if (d && d.error) throw new Error(d.error);
            idAiFails = 0;
            idAiResponded = true;
            handleAiResult(d);
        }).catch(function () {
            clearTimeout(timer);
            idAiBusy = false;
            if (session !== idScanSessionId) return;
            idAiFails++;
            if (idAiFails >= 3) idAiEnabled = false;
        });
    }

    function handleAiResult(d) {
        if (!d || !d.found || !d.corners || d.corners.length !== 4) {
            idAiNoneCount++;
            if (idAiNoneCount >= 2) idAiLast = null;
            return;
        }
        var q = orderQuad(d.corners.map(function (c) { return [Number(c[0]), Number(c[1])]; }));
        if (!quadIsSane(q)) {
            idAiNoneCount++;
            if (idAiNoneCount >= 2) idAiLast = null;
            return;
        }
        idAiNoneCount = 0;
        idAiLast = { q: q, t: Date.now() };
        idAiPending = q;
    }

    function analyzeIdFrame() {
        var video = document.getElementById("idScanVideo");
        if (!video.videoWidth) return;

        var w = 192;
        var h = Math.max(72, Math.round(w * video.videoHeight / video.videoWidth));
        idScanAutoCanvas.width = w;
        idScanAutoCanvas.height = h;
        var ctx = idScanAutoCanvas.getContext("2d");
        ctx.drawImage(video, 0, 0, w, h);

        var frame;
        try {
            frame = ctx.getImageData(0, 0, w, h).data;
        } catch (e) {
            return;
        }

        var gray = new Float32Array(w * h);
        var sum = 0;
        for (var i = 0, p = 0; i < frame.length; i += 4, p++) {
            var g = frame[i] * 0.299 + frame[i + 1] * 0.587 + frame[i + 2] * 0.114;
            gray[p] = g;
            sum += g;
        }
        var brightness = sum / (w * h);

        var hint = document.getElementById("idScanHint");
        var idLabel = ROLE_ID_LABELS[document.getElementById("signupRole").value] || "ID";
        var now = Date.now();

        requestAiDetect(video);

        if (idAiEnabled && idAiResponded && idAiNoneCount >= 2) {
            idScanSmoothBox = null;
            idScanStableCount = 0;
            resetIdGuidePosition();
            hint.textContent = (brightness <= 40) ?
                "Too dark — move somewhere brighter." :
                "Show your " + idLabel + " to the camera — hold it flat and fill the frame.";
            return;
        }

        if (idAiPending) {
            var aq = idAiPending;
            idAiPending = null;
            if (!idScanSmoothBox || quadDist(idScanSmoothBox, aq) > 0.06) {
                idScanSmoothBox = aq.map(function (pt) { return [pt[0], pt[1]]; });
                idScanStableCount = 0;
            }
            idAiConfirmedAt = now;
            idScanMissCount = 0;
        }

        var prior = idScanSmoothBox ?
            idScanSmoothBox.map(function (pt) { return [pt[0] * w, pt[1] * h]; }) : null;
        var det = detectCardQuad(gray, w, h, prior);

        var shift = 1;
        if (det) {
            var nq = det.pts.map(function (pt) { return [pt[0] / w, pt[1] / h]; });
            if (!idScanSmoothBox) {
                idScanSmoothBox = nq;
                idScanStableCount = 0;
                idScanMissCount = 0;
            } else {
                var dmove = quadDist(idScanSmoothBox, nq);
                if (dmove > 0.15) {
                    idScanMissCount++;
                } else {
                    idScanMissCount = 0;
                    if (dmove > 0.004) {
                        for (var k = 0; k < 4; k++) {
                            idScanSmoothBox[k][0] += (nq[k][0] - idScanSmoothBox[k][0]) * 0.4;
                            idScanSmoothBox[k][1] += (nq[k][1] - idScanSmoothBox[k][1]) * 0.4;
                        }
                        shift = dmove;
                    } else {
                        shift = 0;
                    }
                }
            }
        } else {
            idScanMissCount++;
        }

        if (!idScanSmoothBox) {
            hint.textContent = (brightness <= 40) ?
                "Too dark — move somewhere brighter." :
                "Looking for your " + idLabel + "… hold it flat and fill the frame. You can also tap Capture Now.";
            return;
        }

        var aiFresh = idAiLast && (now - idAiLast.t) < 3000;
        if (idScanMissCount > 10 && !aiFresh) {
            idScanSmoothBox = null;
            idScanStableCount = 0;
            resetIdGuidePosition();
            hint.textContent = "Looking for your " + idLabel + "… hold it flat and fill the frame. You can also tap Capture Now.";
            return;
        }

        var q = idScanSmoothBox;
        var coverage = quadAreaNorm(q);
        var brightnessOk = brightness > 40 && brightness < 235;
        var cxm = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4;
        var cym = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
        if (shift > 0.05) focusCameraOnPoint(cxm, cym);
        setIdOrientBadgeFromQuad(q);

        if (!brightnessOk) {
            idScanStableCount = 0;
            showIdQuad(q, false);
            hint.textContent = (brightness <= 40) ?
                "Too dark — move somewhere brighter." :
                "Too bright / glare — tilt it to reduce glare.";
            return;
        }
        if (coverage < 0.14) {
            idScanStableCount = 0;
            showIdQuad(q, false);
            hint.textContent = "Move your " + idLabel + " a bit closer.";
            return;
        }
        if (shift !== 0 && shift > 0.012) {
            idScanStableCount = 0;
            showIdQuad(q, false);
            hint.textContent = "ID found — hold steady...";
            return;
        }

        idScanStableCount++;

        var needAi = idAiEnabled && idAiResponded;
        var aiAgrees = !needAi || (idAiLast && (now - idAiConfirmedAt) < 2800 && quadDist(q, idAiLast.q) < 0.07);

        if (idScanStableCount >= 3 && aiAgrees) {
            showIdQuad(q, true);
            hint.textContent = "Got it — capturing...";
            if (idScanStableCount >= 8) {
                stopAutoCaptureLoop();
                captureIdPhoto();
            }
        } else {
            showIdQuad(q, false);
            hint.textContent = needAi ? "Checking the ID position..." : "ID found — hold steady...";
        }
    }

    function analyzeSelfieFrame() {
        var video = document.getElementById("idScanVideo");
        if (!video.videoWidth) return;

        var w = 96, h = 72;
        idScanAutoCanvas.width = w;
        idScanAutoCanvas.height = h;
        var ctx = idScanAutoCanvas.getContext("2d");
        ctx.drawImage(video, 0, 0, w, h);

        var frame;
        try {
            frame = ctx.getImageData(0, 0, w, h).data;
        } catch (e) {
            return;
        }

        var gray = new Float32Array(w * h);
        var sum = 0;
        for (var i = 0, p = 0; i < frame.length; i += 4, p++) {
            var g = frame[i] * 0.299 + frame[i + 1] * 0.587 + frame[i + 2] * 0.114;
            gray[p] = g;
            sum += g;
        }
        var brightness = sum / (w * h);

        var edgeSum = 0;
        for (var y = 0; y < h; y++) {
            for (var x = 1; x < w; x++) {
                edgeSum += Math.abs(gray[y * w + x] - gray[y * w + x - 1]);
            }
        }
        var sharpness = edgeSum / (w * h);

        var motion = 999;
        if (idScanPrevGray) {
            var diffSum = 0;
            for (var k = 0; k < gray.length; k++) diffSum += Math.abs(gray[k] - idScanPrevGray[k]);
            motion = diffSum / gray.length;
        }
        idScanPrevGray = gray;

        var hint = document.getElementById("idScanHint");
        var guide = document.getElementById("idScanGuide");

        var brightnessOk = brightness > 40 && brightness < 235;
        var sharpOk = sharpness > 5;
        var stableOk = motion < 4;

        if (!brightnessOk) {
            idScanStableCount = 0;
            guide.classList.remove("id-scan-guide-good");
            hint.textContent = (brightness <= 40) ?
                "Too dark — move somewhere brighter." :
                "Too bright / glare — tilt it to reduce glare.";
            return;
        }
        if (!sharpOk) {
            idScanStableCount = 0;
            guide.classList.remove("id-scan-guide-good");
            hint.textContent = "Hold it a bit closer and steady so it's in focus.";
            return;
        }
        if (!stableOk) {
            idScanStableCount = 0;
            guide.classList.remove("id-scan-guide-good");
            hint.textContent = "Hold steady...";
            return;
        }

        idScanStableCount++;
        guide.classList.add("id-scan-guide-good");
        hint.textContent = "Looks good — capturing...";

        if (idScanStableCount >= 6) {
            stopAutoCaptureLoop();
            captureIdPhoto();
        }
    }

    function stopIdScanStream() {
        stopAutoCaptureLoop();
        idScanTrack = null;
        idScanCaps = null;
        idScanLastFocusAt = 0;
        resetIdGuidePosition();
        if (idScanStream) {
            idScanStream.getTracks().forEach(function (t) { t.stop(); });
            idScanStream = null;
        }
    }

    function closeIdScanner() {
        stopIdScanStream();
        document.getElementById("idScanOverlay").classList.remove("show");
    }

    function captureIdPhoto() {
        stopAutoCaptureLoop();

        var video = document.getElementById("idScanVideo");
        var canvas = document.getElementById("idScanCanvas");
        var snapshot = document.getElementById("idScanSnapshot");
        var errorEl = document.getElementById("idScanError");

        if (!video.videoWidth) {
            errorEl.textContent = "Camera isn't ready yet — please wait a moment and try again.";
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

        var dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        snapshot.src = dataUrl;
        snapshot.style.display = "block";
        video.style.display = "none";

        stopIdScanStream();

        document.getElementById("idScanLiveActions").style.display = "none";
        document.getElementById("idScanReviewActions").style.display = "flex";
        errorEl.textContent = "";

        idScanPendingDataUrl = dataUrl;
    }

    var idScanPendingDataUrl = null;

    function retakeIdPhoto() {
        idScanPendingDataUrl = null;
        openIdScanner();
    }

    function confirmIdPhoto() {
        if (!idScanPendingDataUrl) return;

        if (idScanMode === "id") {
            signupCapturedIdImage = idScanPendingDataUrl;
            idScanPendingDataUrl = null;

            var idPreview = document.getElementById("signupIdPreview");
            idPreview.src = signupCapturedIdImage;
            idPreview.style.display = "block";

            idScanMode = "selfie";
            openIdScanner();
            return;
        }

        signupCapturedSelfieImage = idScanPendingDataUrl;
        idScanPendingDataUrl = null;

        var selfiePreview = document.getElementById("signupSelfiePreview");
        selfiePreview.src = signupCapturedSelfieImage;
        selfiePreview.style.display = "block";
        document.getElementById("signupScanBtn").textContent = "📷 Re-scan ID & Selfie";

        idScanMode = "id";
        closeIdScanner();
    }

    function suspensionMessage(record) {
        var reason = (record && record.reason) ? record.reason.trim() : "";
        return "Your account has been suspended, because you violated the verification requirement." +
            (reason ? " Reason: " + reason : "");
    }

    var _banAppealEmail = "";
    var _banAppealName = "";
    var _pendingAccountAppeal = null;

    function openBanAppealFromAccountPage() {
        if (!_pendingAccountAppeal) return;
        openBanAppealModal(_pendingAccountAppeal.record, _pendingAccountAppeal.email, _pendingAccountAppeal.name);
    }

    function openBanAppealModal(record, email, name) {
        _banAppealEmail = (email || "").trim().toLowerCase();
        _banAppealName = name || "";

        document.getElementById("banAppealMessageText").textContent = suspensionMessage(record);
        document.getElementById("banAppealMessageView").style.display = "block";
        document.getElementById("banAppealFormView").style.display = "none";
        document.getElementById("banAppealSuccessView").style.display = "none";
        document.getElementById("banAppealMessageInput").value = "";
        document.getElementById("banAppealFormError").textContent = "";
        document.getElementById("banAppealOverlay").classList.add("show");
    }

    function closeBanAppealModal() {
        document.getElementById("banAppealOverlay").classList.remove("show");
    }

    function showBanAppealForm() {
        document.getElementById("banAppealMessageView").style.display = "none";
        document.getElementById("banAppealFormView").style.display = "block";
        document.getElementById("banAppealMessageInput").focus();
    }

    function submitBanAppeal() {
        var msg = document.getElementById("banAppealMessageInput").value.trim();
        var errorEl = document.getElementById("banAppealFormError");
        var submitBtn = document.getElementById("banAppealSubmitBtn");

        if (!msg) {
            errorEl.textContent = "Please explain why you're appealing this suspension.";
            return;
        }
        if (!_banAppealEmail) {
            errorEl.textContent = "Something went wrong — please close this and try again.";
            return;
        }

        errorEl.textContent = "";
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";

        var appealsDocRef = db.collection("cvspee").doc("accountAppeals");
        appealsDocRef.get().then(function (doc) {
            var list = (doc.exists && doc.data().list) ? doc.data().list : [];
            list.push({
                id: Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
                email: _banAppealEmail,
                name: _banAppealName,
                message: msg,
                submittedAt: new Date().toISOString(),
                status: "pending"
            });
            return appealsDocRef.set({ list: list });
        }).then(function () {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Appeal";
            document.getElementById("banAppealFormView").style.display = "none";
            document.getElementById("banAppealSuccessView").style.display = "block";
        }).catch(function (err) {
            console.error("appeal submit error", err);
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Appeal";
            errorEl.textContent = "Couldn't submit your appeal right now. Please try again.";
        });
    }

    function downscaleDataUrl(dataUrl, maxWidth, quality) {
        return new Promise(function (resolve) {
            var img = new Image();
            img.onload = function () {
                var scale = Math.min(1, maxWidth / img.width);
                var w = Math.round(img.width * scale);
                var h = Math.round(img.height * scale);
                var canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                canvas.getContext("2d").drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            img.onerror = function () { resolve(null); };
            img.src = dataUrl;
        });
    }

    function handleSignUp(e) {
        e.preventDefault();

        var name = document.getElementById("signupName").value.trim();
        var username = normalizeUsername(document.getElementById("signupUsername").value);
        var email = document.getElementById("signupEmail").value.trim().toLowerCase();
        var password = document.getElementById("signupPassword").value;
        var role = document.getElementById("signupRole").value;
        var studentId = document.getElementById("signupStudentId").value.trim();
        var errorEl = document.getElementById("signupError");
        var submitBtn = document.getElementById("signupSubmitBtn");

        var bannedRecord = getBannedRecord(email);
        if (bannedRecord) {
            errorEl.textContent = "";
            openBanAppealModal(bannedRecord, email, bannedRecord.name || name);
            return false;
        }

        if (!isValidUsername(username)) {
            errorEl.textContent = "Username must start with @ and be 3-20 letters, numbers, or underscores (e.g. @CVSPEE2026).";
            return false;
        }

        if (isUsernameTaken(username)) {
            errorEl.textContent = "That username is already taken. Please choose another.";
            return false;
        }

        if (password.length < 6) {
            errorEl.textContent = "Password must be at least 6 characters.";
            return false;
        }

        if (!role) {
            errorEl.textContent = "Please select whether you are a Teacher, Student, or Parent.";
            return false;
        }

        if ((role === "Student" || role === "Teacher") && !isCvsuEmail(email)) {
            errorEl.textContent = "Students and teachers must sign up using an official @cvsu.edu.ph email address.";
            return false;
        }

        if (role === "Student" && !studentId) {
            errorEl.textContent = "Please enter your Student ID.";
            return false;
        }

        if (!signupCapturedIdImage || !signupCapturedSelfieImage) {
            errorEl.textContent = "Please scan your ID and take the selfie holding it.";
            return false;
        }

        var users = getUsers();

        for (var i = 0; i < users.length; i++) {
            if (users[i].email === email) {
                errorEl.textContent = "An account with this email already exists.";
                return false;
            }
        }

        errorEl.textContent = "";
        submitBtn.disabled = true;
        submitBtn.textContent = "Checking your ID...";

        fetch(VERIFY_ID_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                image: signupCapturedIdImage,
                mimeType: "image/jpeg",
                selfieImage: signupCapturedSelfieImage,
                selfieMimeType: "image/jpeg",
                role: role,
                name: name,
                studentId: studentId
            })
        }).then(function (res) {
            return res.json();
        }).then(function (result) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Send Verification Code";

            if (!result || result.valid !== true) {
                errorEl.textContent = (result && result.reason) ||
                    "We couldn't verify your ID as a valid " + role.toLowerCase() +
                    " ID. Please re-scan with a clearer shot, or contact support if this seems wrong.";
                return;
            }

            errorEl.textContent = "";
            submitBtn.textContent = "Preparing your account...";

            Promise.all([
                downscaleDataUrl(signupCapturedIdImage, 700, 0.6),
                downscaleDataUrl(signupCapturedSelfieImage, 700, 0.6)
            ]).then(function (photos) {
                sendSignupCode(name, username, email, password, role, studentId, photos[0], photos[1]);
            });
        }).catch(function (err) {
            console.error("verify-id error:", err);
            submitBtn.disabled = false;
            submitBtn.textContent = "Send Verification Code";
            errorEl.textContent = "Couldn't verify your ID right now (network error). Please try again.";
        });

        return false;
    }

    var EMAILJS_SERVICE_ID = "service_p9aglpb";
    var EMAILJS_TEMPLATE_ID = "template_s94kdvl";

    function sendCodeEmail(email, code, onSuccess, onError) {
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: email,
            code: code
        }).then(function () {
            onSuccess();
        }, function (err) {
            onError(err);
        });
    }

    function sendSignupCode(name, username, email, password, role, studentId, idPhoto, selfiePhoto) {
        var code = generateCode();

        localStorage.setItem("cvspee_pending_signup", JSON.stringify({
            name: name, username: username, email: email, password: password, role: role, studentId: studentId || "", idVerified: true,
            idPhoto: idPhoto || "", selfiePhoto: selfiePhoto || "", code: code
        }));

        document.getElementById("signupVerifyNote").innerHTML =
            "Sending a 6-digit code to <strong>" + email + "</strong>...";
        document.getElementById("signupVerifyCode").value = "";
        document.getElementById("signupVerifyError").textContent = "";

        switchAuthTab("signupVerify");

        sendCodeEmail(email, code, function () {
            document.getElementById("signupVerifyNote").innerHTML =
                "We sent a 6-digit code to <strong>" + email + "</strong>. Check your inbox (and spam folder).";
        }, function () {
            document.getElementById("signupVerifyNote").innerHTML =
                "We sent a 6-digit code to <strong>" + email + "</strong>.";
            document.getElementById("signupVerifyError").textContent =
                "Couldn't send the email right now. Tap \"Resend code\" to try again.";
        });
    }

    function setResendState(prefix, state) {
        var link = document.getElementById(prefix + "ResendLink");
        var spinner = document.getElementById(prefix + "ResendSpinner");
        var check = document.getElementById(prefix + "ResendCheck");

        link.classList.toggle("disabled", state === "loading");
        spinner.classList.toggle("show", state === "loading");
        check.classList.remove("show");

        if (state === "sent") {
            check.classList.add("show");
            setTimeout(function () {
                check.classList.remove("show");
            }, 2000);
        }
    }

    function resendSignupCode() {
        var pending = JSON.parse(localStorage.getItem("cvspee_pending_signup") || "null");
        if (!pending) return;

        var newCode = generateCode();
        pending.code = newCode;
        localStorage.setItem("cvspee_pending_signup", JSON.stringify(pending));

        setResendState("signup", "loading");
        document.getElementById("signupVerifyError").textContent = "";

        sendCodeEmail(pending.email, newCode, function () {
            setResendState("signup", "sent");
            document.getElementById("signupVerifyNote").innerHTML =
                "We sent a new 6-digit code to <strong>" + pending.email + "</strong>. Check your inbox (and spam folder).";
        }, function () {
            setResendState("signup", "idle");
            document.getElementById("signupVerifyError").textContent =
                "Couldn't resend the email right now. Please try again.";
        });
    }

    function handleVerifySignup(e) {
        e.preventDefault();

        var entered = document.getElementById("signupVerifyCode").value.trim();
        var errorEl = document.getElementById("signupVerifyError");
        var pending = JSON.parse(localStorage.getItem("cvspee_pending_signup") || "null");

        if (!pending) {
            errorEl.textContent = "Your sign-up session expired. Please start again.";
            switchAuthTab("signup");
            return false;
        }

        if (entered !== pending.code) {
            errorEl.textContent = "That code doesn't match. Please try again.";
            return false;
        }

        updateUsers(function (users) {
            if (users.some(function (u) { return u.email === pending.email; })) return users;
            users.push({ name: pending.name, username: pending.username, email: pending.email, password: pending.password, role: pending.role, studentId: pending.studentId || "", idVerified: pending.idVerified === true, avatar: "" });
            return users;
        }, function () {
            setCurrentUser(pending.email);

            if (pending.idPhoto || pending.selfiePhoto) {
                db.collection("cvspee").doc("idPhotosRoot").collection("byEmail").doc(pending.email).set({
                    idImage: pending.idPhoto || "",
                    selfieImage: pending.selfiePhoto || "",
                    name: pending.name || "",
                    role: pending.role || "",
                    submittedAt: new Date().toISOString()
                }).catch(function (err) { console.error("id photo store error:", err); });
            }

            localStorage.removeItem("cvspee_pending_signup");

            errorEl.textContent = "";
            resetIdScanState();
            closeAuthModal();
            renderAccount();
        });

        return false;
    }

    function handleForgotEmail(e) {
        e.preventDefault();

        var email = document.getElementById("forgotEmail").value.trim().toLowerCase();
        var errorEl = document.getElementById("forgotEmailError");
        var users = getUsers();
        var found = null;

        for (var i = 0; i < users.length; i++) {
            if (users[i].email === email) { found = users[i]; break; }
        }

        if (!found) {
            errorEl.textContent = "No account found with this email.";
            return false;
        }

        errorEl.textContent = "";
        sendResetCode(email);

        return false;
    }

    function sendResetCode(email) {
        var code = generateCode();

        localStorage.setItem("cvspee_reset_request", JSON.stringify({ email: email, code: code }));

        document.getElementById("forgotResetNote").innerHTML =
            "Sending a reset code to <strong>" + email + "</strong>...";
        document.getElementById("forgotCode").value = "";
        document.getElementById("forgotNewPassword").value = "";
        document.getElementById("forgotResetError").textContent = "";

        switchAuthTab("forgotReset");

        sendCodeEmail(email, code, function () {
            document.getElementById("forgotResetNote").innerHTML =
                "We sent a reset code to <strong>" + email + "</strong>. Check your inbox (and spam folder).";
        }, function () {
            document.getElementById("forgotResetNote").innerHTML =
                "We sent a reset code to <strong>" + email + "</strong>.";
            document.getElementById("forgotResetError").textContent =
                "Couldn't send the email right now. Tap \"Resend code\" to try again.";
        });
    }

    function resendResetCode() {
        var reset = JSON.parse(localStorage.getItem("cvspee_reset_request") || "null");
        if (!reset) return;

        var newCode = generateCode();
        reset.code = newCode;
        localStorage.setItem("cvspee_reset_request", JSON.stringify(reset));

        setResendState("forgot", "loading");
        document.getElementById("forgotResetError").textContent = "";

        sendCodeEmail(reset.email, newCode, function () {
            setResendState("forgot", "sent");
            document.getElementById("forgotResetNote").innerHTML =
                "We sent a new reset code to <strong>" + reset.email + "</strong>. Check your inbox (and spam folder).";
        }, function () {
            setResendState("forgot", "idle");
            document.getElementById("forgotResetError").textContent =
                "Couldn't resend the email right now. Please try again.";
        });
    }

    function handleForgotReset(e) {
        e.preventDefault();

        var entered = document.getElementById("forgotCode").value.trim();
        var newPassword = document.getElementById("forgotNewPassword").value;
        var errorEl = document.getElementById("forgotResetError");
        var reset = JSON.parse(localStorage.getItem("cvspee_reset_request") || "null");

        if (!reset) {
            errorEl.textContent = "Your reset session expired. Please start again.";
            switchAuthTab("forgotEmail");
            return false;
        }

        if (entered !== reset.code) {
            errorEl.textContent = "That code doesn't match. Please try again.";
            return false;
        }

        if (newPassword.length < 6) {
            errorEl.textContent = "Password must be at least 6 characters.";
            return false;
        }

        updateUsers(function (users) {
            for (var i = 0; i < users.length; i++) {
                if (users[i].email === reset.email) {
                    users[i].password = newPassword;
                    break;
                }
            }
            return users;
        }, function () {
            localStorage.removeItem("cvspee_reset_request");

            errorEl.textContent = "";
            document.getElementById("signinEmail").value = reset.email;
            document.getElementById("signinPassword").value = "";
            document.getElementById("signinError").textContent = "Password reset! Please sign in with your new password.";
            switchAuthTab("signin");
        });

        return false;
    }

    function handleSignIn(e) {
        e.preventDefault();

        var input = document.getElementById("signinEmail").value.trim().toLowerCase();
        var password = document.getElementById("signinPassword").value;
        var errorEl = document.getElementById("signinError");

        var bannedRecord = getBannedRecord(input);
        if (bannedRecord) {
            errorEl.textContent = "";
            openBanAppealModal(bannedRecord, input, bannedRecord.name || "");
            return false;
        }

        var users = getUsers();
        var found = null;
        var strippedInput = input.charAt(0) === "@" ? input : "@" + input;

        for (var i = 0; i < users.length; i++) {
            var uEmail = (users[i].email || "").toLowerCase();
            var uUsername = (users[i].username || "").toLowerCase();
            if (uEmail === input || uUsername === input || uUsername === strippedInput) {
                found = users[i];
                break;
            }
        }

        if (!found) {
            errorEl.textContent = "No account found with this username or email. Try signing up.";
            return false;
        }

        if (found.password !== password) {
            errorEl.textContent = "Incorrect password.";
            return false;
        }

        setCurrentUser(found.email);
        errorEl.textContent = "";
        closeAuthModal();
        renderAccount();

        return false;
    }

    function logout() {
        localStorage.removeItem("cvspee_current_user");
        applyDarkMode(false);
        updateCartBadge();
        updateWishlistBadge();
        renderAccount();
        openAuthModal();
    }

    function editName() {
        var user = getCurrentUser();
        if (!user) return;

        document.getElementById("editNameInput").value = user.name;
        document.getElementById("editNameError").textContent = "";
        document.getElementById("editNameOverlay").classList.add("show");
        document.getElementById("editNameInput").focus();
    }

    function closeEditName() {
        document.getElementById("editNameOverlay").classList.remove("show");
    }

    function submitEditName(e) {
        e.preventDefault();

        var user = getCurrentUser();
        if (!user) return false;

        var newName = document.getElementById("editNameInput").value.trim();
        if (!newName) {
            document.getElementById("editNameError").textContent = "Please enter your name.";
            return false;
        }

        updateUsers(function (users) {
            for (var i = 0; i < users.length; i++) {
                if (users[i].email === user.email) {
                    users[i].name = newName;
                    break;
                }
            }
            return users;
        }, function () {
            closeEditName();
            renderAccount();
        });

        return false;
    }

    function changeAvatar(input) {
        var user = getCurrentUser();
        if (!user || !input.files || !input.files[0]) return;

        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                
                
                
                
                
                var maxDim = 200;
                var w = img.width, h = img.height;
                if (w > h && w > maxDim) { h = Math.round(h * (maxDim / w)); w = maxDim; }
                else if (h >= w && h > maxDim) { w = Math.round(w * (maxDim / h)); h = maxDim; }

                var canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                canvas.getContext("2d").drawImage(img, 0, 0, w, h);

                var dataUrl = canvas.toDataURL("image/jpeg", 0.72);

                updateUsers(function (users) {
                    for (var i = 0; i < users.length; i++) {
                        if (users[i].email === user.email) {
                            users[i].avatar = dataUrl;
                            break;
                        }
                    }
                    return users;
                }, function () {
                    renderAccount();
                });
            };
            img.onerror = function () {
                alert("Couldn't read that image. Please try a different photo.");
            };
            img.src = e.target.result;
        };
        reader.onerror = function () {
            alert("Couldn't read that image. Please try a different photo.");
        };
        reader.readAsDataURL(input.files[0]);
    }

    function readImageAsResizedDataUrl(file, maxDim, quality, onDone, onError) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                var w = img.width, h = img.height;
                if (w > h && w > maxDim) { h = Math.round(h * (maxDim / w)); w = maxDim; }
                else if (h >= w && h > maxDim) { w = Math.round(w * (maxDim / h)); h = maxDim; }

                var canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                canvas.getContext("2d").drawImage(img, 0, 0, w, h);

                onDone(canvas.toDataURL("image/jpeg", quality));
            };
            img.onerror = function () {
                if (onError) onError();
            };
            img.src = e.target.result;
        };
        reader.onerror = function () {
            if (onError) onError();
        };
        reader.readAsDataURL(file);
    }

    var HOME_DEFAULT_INTERVAL = 6;
    var HOME_MAX_SLIDES = 8;
    var HOME_DEFAULT_SLIDE = {
        id: "default",
        mediaType: "image",
        mediaSrc: "images/image1.png",
        cutout: true,
        title: "Welcome to CVSPEE",
        text: "The official campus shop of Cavite State University. From PE and department uniforms to school supplies, bags, and CVSU ID laces — everything you need for campus life, all in one place.\n\nTruth, Excellence, Service",
        textSide: "left",
        bgColor: "#E6EFE8",
        ambient: false
    };
    var HOME_SWATCHES = ["#E6EFE8", "#ffffff", "#F7F4EA", "#C9A227", "#0B5C2E", "#063A1C", "#111827", "#7a1f1f"];

    var _homeCloud = { items: [], interval: HOME_DEFAULT_INTERVAL, itemsReady: false };
    var _hs = { slides: [], index: 0, timer: null, ambTimer: null, paused: false, sig: "", activeEl: null };

    function hsValidColor(c) {
        return typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c);
    }

    function hsRgb(hex) {
        return [parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16)];
    }

    function hsLuma(hex) {
        var c = hsRgb(hex);
        return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
    }

    function hsMix(hex, toHex, t) {
        var a = hsRgb(hex), b = hsRgb(toHex), out = "#";
        for (var i = 0; i < 3; i++) {
            var v = Math.round(a[i] + (b[i] - a[i]) * t);
            out += (v < 16 ? "0" : "") + v.toString(16);
        }
        return out;
    }

    function hsBackground(bg) {
        var light = hsLuma(bg) > 170;
        var center = hsMix(bg, "#ffffff", light ? 0.85 : 0.16);
        return "radial-gradient(circle at 42% 45%, " + center + " 0%, " + bg + " 100%)";
    }

    function hsTextColor(bg) {
        return hsLuma(bg) > 150 ? "#1a1a1a" : "#ffffff";
    }

    function hsSafeSrc(src) {
        src = String(src || "").trim();
        if (!src) return "";
        if (/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(src)) return src;
        if (/^https?:\/\//i.test(src)) return src;
        if (/^[a-z][a-z0-9+.\-]*:/i.test(src) || src.indexOf("//") === 0) return "";
        return src;
    }

    function hsBadVideoHost(src) {
        return /(youtube\.com|youtu\.be|vimeo\.com|facebook\.com|fb\.watch|tiktok\.com|drive\.google\.com|instagram\.com)/i.test(src);
    }

    function hsSanitizeSlide(x, i) {
        var type = (x.mediaType === "image" || x.mediaType === "video") ? x.mediaType : "none";
        return {
            id: String(x.id || ("s" + i)),
            mediaType: type,
            mediaSrc: String(x.mediaSrc || ""),
            cutout: !!x.cutout,
            title: String(x.title || "").slice(0, 120),
            text: String(x.text || "").slice(0, 500),
            textSide: x.textSide === "right" ? "right" : "left",
            bgColor: hsValidColor(x.bgColor) ? x.bgColor : "#E6EFE8",
            ambient: x.ambient === false ? false : true
        };
    }

    function hsCurrentSlides() {
        if (_homeCloud.items.length) {
            return _homeCloud.items.map(hsSanitizeSlide);
        }
        return [HOME_DEFAULT_SLIDE];
    }

    function homePageIsActive() {
        var page = document.querySelector('.site-page[data-page="home"]');
        return !!(page && page.classList.contains("active"));
    }

    function hsBuildSlide(slide, preview) {
        var el = document.createElement("div");
        el.className = "hs-slide" + (slide.textSide === "right" ? " text-right" : "");
        var bg = hsValidColor(slide.bgColor) ? slide.bgColor : "#E6EFE8";
        el.style.background = hsBackground(bg);
        el.style.color = hsTextColor(bg);

        var title = String(slide.title || "").trim();
        var text = String(slide.text || "").trim();
        var src = (slide.mediaType === "image" || slide.mediaType === "video") ? hsSafeSrc(slide.mediaSrc) : "";
        var hasText = !!(title || text);
        var hasMedia = !!src;
        el.classList.add(hasMedia ? "has-media" : "no-media");
        el.classList.add(hasText ? "has-text" : "no-text");

        var inner = document.createElement("div");
        inner.className = "hs-inner";

        if (hasText) {
            var copy = document.createElement("div");
            copy.className = "hs-copy";
            if (title) {
                var t = document.createElement("div");
                t.className = "hs-title";
                t.textContent = title;
                copy.appendChild(t);
                var rule = document.createElement("div");
                rule.className = "hs-rule";
                rule.style.background = hsLuma(bg) > 150 ? "#C9A227" : "#FFC72C";
                copy.appendChild(rule);
            }
            if (text) {
                var p = document.createElement("div");
                p.className = "hs-text";
                p.textContent = text;
                copy.appendChild(p);
            }
            inner.appendChild(copy);
        }

        if (hasMedia) {
            var box = document.createElement("div");
            box.className = "hs-mediabox";
            var wrap = document.createElement("div");
            wrap.className = "hs-media-wrap" + (slide.ambient !== false ? " has-ambient" : "") +
                (slide.mediaType === "image" && slide.cutout ? " cutout" : "");
            var amb = document.createElement("div");
            amb.className = "hs-ambient";
            amb.setAttribute("aria-hidden", "true");

            function setRatio(w, h) {
                if (w > 0 && h > 0) wrap.style.setProperty("--ar", (w / h).toFixed(4));
            }

            if (slide.mediaType === "image") {
                var img = document.createElement("img");
                img.className = "hs-media";
                img.alt = title || "CVSPEE";
                img.decoding = "async";
                img.onload = function () { setRatio(img.naturalWidth, img.naturalHeight); };
                img.onerror = function () { el.classList.remove("has-media"); el.classList.add("no-media"); box.style.display = "none"; };
                img.src = src;
                var ambImg = document.createElement("img");
                ambImg.alt = "";
                ambImg.src = src;
                amb.appendChild(ambImg);
                wrap.appendChild(amb);
                wrap.appendChild(img);
            } else {
                var v = document.createElement("video");
                v.className = "hs-media";
                v.muted = true;
                v.defaultMuted = true;
                v.setAttribute("muted", "");
                v.playsInline = true;
                v.setAttribute("playsinline", "");
                v.preload = preview ? "metadata" : "auto";
                v.addEventListener("loadedmetadata", function () { setRatio(v.videoWidth, v.videoHeight); });
                v.addEventListener("error", function () {
                    el._videoFailed = true;
                    el.classList.remove("has-media");
                    el.classList.add("no-media");
                    box.style.display = "none";
                    if (!preview && _hs.activeEl === el && _hs.slides.length > 1) {
                        clearTimeout(_hs.timer);
                        _hs.timer = setTimeout(hsNext, 3000);
                    }
                });
                v.src = src;
                var cv = document.createElement("canvas");
                cv.width = 64;
                cv.height = 36;
                amb.appendChild(cv);
                wrap.appendChild(amb);
                wrap.appendChild(v);
                el._video = v;
                el._canvas = cv;
                if (preview) {
                    v.loop = true;
                    v.autoplay = true;
                    var tick = setInterval(function () {
                        if (!cv.isConnected) { clearInterval(tick); return; }
                        try { cv.getContext("2d").drawImage(v, 0, 0, cv.width, cv.height); } catch (e) {}
                    }, 100);
                }
            }
            box.appendChild(wrap);
            inner.appendChild(box);
        }

        el.appendChild(inner);
        return el;
    }

    function renderHomeSlider() {
        var host = document.getElementById("homeSlider");
        var track = document.getElementById("hsTrack");
        if (!host || !track) return;

        var slides = hsCurrentSlides();
        var interval = _homeCloud.interval;
        var sig = JSON.stringify(slides) + "|" + interval;
        if (sig === _hs.sig) return;
        _hs.sig = sig;

        var keepId = _hs.slides[_hs.index] ? _hs.slides[_hs.index].id : null;
        hsStopTimers();
        _hs.slides = slides;

        track.innerHTML = "";
        var dots = document.getElementById("hsDots");
        dots.innerHTML = "";
        slides.forEach(function (s, i) {
            track.appendChild(hsBuildSlide(s, false));
            var d = document.createElement("button");
            d.type = "button";
            d.className = "hs-dot";
            d.setAttribute("aria-label", "Go to slide " + (i + 1));
            d.onclick = function () { hsShow(i); };
            dots.appendChild(d);
        });
        host.classList.toggle("single", slides.length < 2);

        var idx = 0;
        for (var k = 0; k < slides.length; k++) { if (slides[k].id === keepId) { idx = k; break; } }
        hsShow(idx);
    }

    function hsStopTimers() {
        clearTimeout(_hs.timer);
        clearTimeout(_hs.ambTimer);
        _hs.timer = null;
        _hs.ambTimer = null;
    }

    function hsShow(i) {
        var track = document.getElementById("hsTrack");
        if (!track || !_hs.slides.length) return;
        hsStopTimers();
        if (i < 0) i = _hs.slides.length - 1;
        if (i >= _hs.slides.length) i = 0;
        _hs.index = i;

        var els = track.children;
        var dots = document.getElementById("hsDots").children;
        for (var k = 0; k < els.length; k++) {
            var on = (k === i);
            els[k].classList.toggle("active", on);
            if (dots[k]) dots[k].classList.toggle("active", on);
            if (!on && els[k]._video) {
                els[k]._video.onended = null;
                try { els[k]._video.pause(); } catch (e) {}
            }
        }
        _hs.activeEl = els[i] || null;
        hsPlayActive();
    }

    function hsPlayActive() {
        var el = _hs.activeEl;
        if (!el) return;
        var multiple = _hs.slides.length > 1;
        var v = el._video;

        if (v && !el._videoFailed) {
            v.loop = !multiple;
            try { v.currentTime = 0; } catch (e) {}
            v.onended = multiple ? function () { hsNext(); } : null;
            if (multiple) {
                var dur = (isFinite(v.duration) && v.duration > 0) ? v.duration * 1000 + 15000 : 10 * 60 * 1000;
                _hs.timer = setTimeout(hsNext, dur);
            }
            var pr = v.play();
            if (pr && pr.catch) {
                pr.catch(function () {
                    if (_hs.activeEl !== el) return;
                    clearTimeout(_hs.timer);
                    if (multiple) _hs.timer = setTimeout(hsNext, _homeCloud.interval * 1000);
                });
            }
            hsAmbientLoop();
        } else if (multiple) {
            _hs.timer = setTimeout(hsNext, _homeCloud.interval * 1000);
        }
    }

    function hsAmbientLoop() {
        clearTimeout(_hs.ambTimer);
        var el = _hs.activeEl;
        if (!el || !el._video) return;
        var v = el._video, c = el._canvas;
        if (!homePageIsActive() || document.hidden) {
            if (!v.paused) { try { v.pause(); } catch (e) {} }
        } else {
            if (v.paused && !v.ended && !el._videoFailed) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
            try { c.getContext("2d").drawImage(v, 0, 0, c.width, c.height); } catch (e) {}
        }
        _hs.ambTimer = setTimeout(hsAmbientLoop, 80);
    }

    function hsNext(manual) {
        if (!manual && (_hs.paused || document.hidden || !homePageIsActive())) {
            clearTimeout(_hs.timer);
            _hs.timer = setTimeout(function () { hsNext(); }, 800);
            return;
        }
        hsShow(_hs.index + 1);
    }

    function hsPrev() {
        hsShow(_hs.index - 1);
    }

    (function hsInit() {
        var host = document.getElementById("homeSlider");
        if (!host) return;
        host.addEventListener("mouseenter", function () { _hs.paused = true; });
        host.addEventListener("mouseleave", function () { _hs.paused = false; });
        var sx = null;
        host.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
        host.addEventListener("touchend", function (e) {
            if (sx === null) return;
            var dx = e.changedTouches[0].clientX - sx;
            sx = null;
            if (Math.abs(dx) > 50) { if (dx < 0) hsNext(true); else hsPrev(); }
        }, { passive: true });

        function cloudChanged() {
            if (_homeCloud.itemsReady) renderHomeSlider();
        }

        try {
            var metaRef = db.collection("cvspee").doc("homeSlides");
            metaRef.onSnapshot(function (doc) {
                var d = doc.exists ? (doc.data() || {}) : {};
                var n = parseInt(d.interval, 10);
                _homeCloud.interval = (n >= 3 && n <= 30) ? n : HOME_DEFAULT_INTERVAL;
                cloudChanged();
            }, function () {});
            metaRef.collection("items").onSnapshot(function (snap) {
                var arr = [];
                snap.forEach(function (d) { var x = d.data() || {}; x.id = d.id; arr.push(x); });
                arr.sort(function (a, b) { return (a.pos || 0) - (b.pos || 0); });
                _homeCloud.items = arr;
                _homeCloud.itemsReady = true;
                cloudChanged();
            }, function () {
                _homeCloud.itemsReady = true;
                cloudChanged();
            });
        } catch (e) {
            _homeCloud.itemsReady = true;
        }

        setTimeout(function () {
            if (!_homeCloud.itemsReady) { _homeCloud.itemsReady = true; renderHomeSlider(); }
        }, 2500);
    })();

    var _he = { slides: [], sel: 0, open: false };

    function heNewId() {
        return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function heBlankSlide() {
        return { id: heNewId(), mediaType: "image", imageSrc: "", videoSrc: "", cutout: false, title: "", text: "", textSide: "left", bgColor: "#E6EFE8", ambient: true };
    }

    function heFromStored(s) {
        return {
            id: s.id,
            mediaType: s.mediaType,
            imageSrc: s.mediaType === "image" ? s.mediaSrc : "",
            videoSrc: s.mediaType === "video" ? s.mediaSrc : "",
            cutout: !!s.cutout,
            title: s.title,
            text: s.text,
            textSide: s.textSide,
            bgColor: s.bgColor,
            ambient: s.ambient !== false
        };
    }

    function heToStored(s) {
        var src = s.mediaType === "image" ? s.imageSrc : (s.mediaType === "video" ? s.videoSrc : "");
        return {
            id: s.id,
            mediaType: s.mediaType,
            mediaSrc: String(src || "").trim(),
            cutout: s.mediaType === "image" && !!s.cutout,
            title: String(s.title || "").trim(),
            text: String(s.text || "").trim(),
            textSide: s.textSide === "right" ? "right" : "left",
            bgColor: hsValidColor(s.bgColor) ? s.bgColor : "#E6EFE8",
            ambient: s.ambient !== false
        };
    }

    function openHomeEditor() {
        if (!isOwnerLoggedIn()) return;
        var cur = hsCurrentSlides();
        _he.slides = cur.map(heFromStored);
        _he.sel = 0;
        _he.open = true;
        document.getElementById("heInterval").value = _homeCloud.interval;
        document.getElementById("heError").textContent = "";
        document.getElementById("heImageFile").value = "";
        document.getElementById("homeEditorOverlay").classList.add("show");
        heRenderAll();
    }

    function closeHomeEditor() {
        _he.open = false;
        document.getElementById("homeEditorOverlay").classList.remove("show");
        document.getElementById("hePreview").innerHTML = "";
    }

    function heCurrent() {
        return _he.slides[_he.sel] || null;
    }

    function heRenderAll() {
        heRenderList();
        heRenderForm();
        heRenderPreview();
    }

    function heRenderList() {
        var list = document.getElementById("heList");
        list.innerHTML = "";
        _he.slides.forEach(function (s, i) {
            var row = document.createElement("div");
            row.className = "he-item" + (i === _he.sel ? " selected" : "");
            row.onclick = function () { _he.sel = i; heRenderAll(); };

            var th = document.createElement("div");
            th.className = "he-thumb";
            th.style.backgroundColor = hsValidColor(s.bgColor) ? s.bgColor : "#E6EFE8";
            var tsrc = s.mediaType === "image" ? hsSafeSrc(s.imageSrc) : "";
            if (tsrc && tsrc.indexOf('"') === -1 && tsrc.indexOf("'") === -1 && tsrc.indexOf(")") === -1) {
                th.style.backgroundImage = 'url("' + tsrc + '")';
            }
            row.appendChild(th);

            var lab = document.createElement("div");
            lab.className = "he-item-label";
            var kind = s.mediaType === "video" ? "🎬 " : (s.mediaType === "image" ? "🖼 " : "✎ ");
            lab.textContent = (i + 1) + ". " + kind + (s.title || s.text || "(no text)");
            row.appendChild(lab);

            var btns = document.createElement("div");
            btns.className = "he-item-btns";
            function mk(label, title, disabled, fn) {
                var b = document.createElement("button");
                b.type = "button";
                b.textContent = label;
                b.title = title;
                b.disabled = disabled;
                b.onclick = function (e) { e.stopPropagation(); fn(); };
                btns.appendChild(b);
            }
            mk("▲", "Move up", i === 0, function () { heMove(i, -1); });
            mk("▼", "Move down", i === _he.slides.length - 1, function () { heMove(i, 1); });
            mk("✕", "Delete slide", false, function () { heDelete(i); });
            row.appendChild(btns);
            list.appendChild(row);
        });
        document.getElementById("heAddBtn").disabled = _he.slides.length >= HOME_MAX_SLIDES;
        if (!_he.slides.length) {
            var empty = document.createElement("p");
            empty.className = "form-hint";
            empty.textContent = "No slides. The original CVSPEE welcome banner will be shown.";
            list.appendChild(empty);
        }
    }

    function heSetSeg(containerId, value) {
        var labels = document.getElementById(containerId).querySelectorAll("label");
        for (var i = 0; i < labels.length; i++) {
            var inp = labels[i].querySelector("input");
            inp.checked = (inp.value === value);
            labels[i].classList.toggle("on", inp.checked);
        }
    }

    function heSegValue(containerId, fallback) {
        var inp = document.getElementById(containerId).querySelector("input:checked");
        return inp ? inp.value : fallback;
    }

    function heRenderForm() {
        var form = document.getElementById("heForm");
        var s = heCurrent();
        form.style.display = s ? "" : "none";
        if (!s) return;

        heSetSeg("heMediaSeg", s.mediaType);
        heSetSeg("heSideSeg", s.textSide);
        document.getElementById("heTitle").value = s.title;
        document.getElementById("heText").value = s.text;
        document.getElementById("heImageUrl").value = (s.imageSrc && s.imageSrc.indexOf("data:") !== 0) ? s.imageSrc : "";
        document.getElementById("heVideoUrl").value = s.videoSrc;
        document.getElementById("heAmbient").checked = s.ambient !== false;
        document.getElementById("heImageFile").value = "";
        document.getElementById("heImageInfo").textContent = (s.imageSrc && s.imageSrc.indexOf("data:") === 0)
            ? "Uploaded photo in use (about " + Math.round(s.imageSrc.length * 0.75 / 1024) + " KB)."
            : "";

        var sw = document.getElementById("heSwatches");
        sw.innerHTML = "";
        HOME_SWATCHES.forEach(function (c) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "he-swatch";
            b.style.background = c;
            b.title = c;
            b.onclick = function () { s.bgColor = c; heRenderAll(); };
            sw.appendChild(b);
        });
        var ci = document.createElement("input");
        ci.type = "color";
        ci.value = hsValidColor(s.bgColor) ? s.bgColor : "#E6EFE8";
        ci.title = "Custom color";
        ci.oninput = function () { s.bgColor = ci.value; heRenderList(); heRenderPreview(); };
        sw.appendChild(ci);

        heToggleBlocks(s);
    }

    function heToggleBlocks(s) {
        document.getElementById("heImageBlock").style.display = s.mediaType === "image" ? "" : "none";
        document.getElementById("heVideoBlock").style.display = s.mediaType === "video" ? "" : "none";
        document.getElementById("heAmbientBlock").style.display = s.mediaType === "none" ? "none" : "";
        document.getElementById("heSideBlock").style.display = s.mediaType === "none" ? "none" : "";
    }

    function heFieldChanged() {
        var s = heCurrent();
        if (!s) return;
        s.mediaType = heSegValue("heMediaSeg", s.mediaType);
        s.textSide = heSegValue("heSideSeg", s.textSide);
        s.title = document.getElementById("heTitle").value;
        s.text = document.getElementById("heText").value;
        s.ambient = document.getElementById("heAmbient").checked;

        var iu = document.getElementById("heImageUrl").value.trim();
        if (iu !== "" || (s.imageSrc && s.imageSrc.indexOf("data:") !== 0)) {
            if (iu !== s.imageSrc) { s.imageSrc = iu; s.cutout = false; }
        }
        s.videoSrc = document.getElementById("heVideoUrl").value.trim();

        heSetSeg("heMediaSeg", s.mediaType);
        heSetSeg("heSideSeg", s.textSide);
        heToggleBlocks(s);
        heRenderList();
        heRenderPreviewSoon();
    }

    var _hePreviewTimer = null;
    function heRenderPreviewSoon() {
        clearTimeout(_hePreviewTimer);
        _hePreviewTimer = setTimeout(heRenderPreview, 350);
    }

    function heRenderPreview() {
        var wrap = document.getElementById("hePreviewWrap");
        var host = document.getElementById("hePreview");
        host.innerHTML = "";
        var s = heCurrent();
        var stored = s ? heToStored(s) : HOME_DEFAULT_SLIDE;
        var el = hsBuildSlide(hsSanitizeSlide(stored, 0), true);
        el.classList.add("active");
        host.appendChild(el);
        var scale = wrap.clientWidth / 1200;
        host.style.transform = "scale(" + scale + ")";
        wrap.style.height = (520 * scale) + "px";
    }

    function heAddSlide() {
        if (_he.slides.length >= HOME_MAX_SLIDES) return;
        _he.slides.push(heBlankSlide());
        _he.sel = _he.slides.length - 1;
        heRenderAll();
    }

    function heMove(i, dir) {
        var j = i + dir;
        if (j < 0 || j >= _he.slides.length) return;
        var t = _he.slides[i];
        _he.slides[i] = _he.slides[j];
        _he.slides[j] = t;
        _he.sel = j;
        heRenderAll();
    }

    function heDelete(i) {
        if (!confirm("Delete this slide?")) return;
        _he.slides.splice(i, 1);
        if (_he.sel >= _he.slides.length) _he.sel = Math.max(0, _he.slides.length - 1);
        heRenderAll();
    }

    function heResetAll() {
        if (!confirm("Remove all custom slides and go back to the original welcome banner?")) return;
        _he.slides = [];
        _he.sel = 0;
        heRenderAll();
    }

    function hsReadFile(file) {
        return new Promise(function (resolve, reject) {
            var r = new FileReader();
            r.onload = function () { resolve(r.result); };
            r.onerror = function () { reject(new Error("Couldn't read that file.")); };
            r.readAsDataURL(file);
        });
    }

    function hsLoadImage(dataUrl) {
        return new Promise(function (resolve, reject) {
            var im = new Image();
            im.onload = function () { resolve(im); };
            im.onerror = function () { reject(new Error("That file isn't a valid photo.")); };
            im.src = dataUrl;
        });
    }

    function hsHasTransparency(img) {
        var c = document.createElement("canvas");
        c.width = 48;
        c.height = 48;
        var x = c.getContext("2d");
        x.drawImage(img, 0, 0, 48, 48);
        var d = x.getImageData(0, 0, 48, 48).data;
        var n = 0;
        for (var i = 3; i < d.length; i += 4) { if (d[i] < 235) n++; }
        return n > 48 * 48 * 0.03;
    }

    function hsProcessImageFile(file) {
        if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) {
            return Promise.reject(new Error("Please choose a PNG, JPG or WEBP photo."));
        }
        return hsReadFile(file).then(hsLoadImage).then(function (img) {
            var transparent = /png|webp/i.test(file.type) && hsHasTransparency(img);
            var tries = transparent
                ? [[1400, 0], [1100, 0], [850, 0], [650, 0]]
                : [[1600, 0.82], [1400, 0.74], [1200, 0.66], [1000, 0.58]];
            for (var i = 0; i < tries.length; i++) {
                var scale = Math.min(1, tries[i][0] / img.width);
                var c = document.createElement("canvas");
                c.width = Math.max(1, Math.round(img.width * scale));
                c.height = Math.max(1, Math.round(img.height * scale));
                var cx = c.getContext("2d");
                if (!transparent) { cx.fillStyle = "#ffffff"; cx.fillRect(0, 0, c.width, c.height); }
                cx.drawImage(img, 0, 0, c.width, c.height);
                var out = transparent ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", tries[i][1]);
                if (out.length <= 780000) return { src: out, cutout: transparent };
            }
            throw new Error("That photo is still too large after compressing. Please use a smaller one.");
        });
    }

    function heImageChosen(input) {
        var s = heCurrent();
        var file = input.files && input.files[0];
        if (!s || !file) return;
        var info = document.getElementById("heImageInfo");
        info.textContent = "Processing photo…";
        hsProcessImageFile(file).then(function (res) {
            s.mediaType = "image";
            s.imageSrc = res.src;
            s.cutout = res.cutout;
            document.getElementById("heError").textContent = "";
            heRenderAll();
        }).catch(function (err) {
            info.textContent = "";
            document.getElementById("heError").textContent = err.message || "Couldn't use that photo.";
            input.value = "";
        });
    }

    function heSave() {
        var err = document.getElementById("heError");
        err.textContent = "";
        if (!isOwnerLoggedIn()) {
            err.textContent = "Only the owner account can change the front page.";
            return;
        }

        var stored = [];
        for (var i = 0; i < _he.slides.length; i++) {
            var s = heToStored(_he.slides[i]);
            var n = "Slide " + (i + 1) + ": ";
            if (s.mediaType === "image" && !hsSafeSrc(s.mediaSrc)) { err.textContent = n + "add a photo, or switch it to Text only."; _he.sel = i; heRenderAll(); return; }
            if (s.mediaType === "video") {
                if (!hsSafeSrc(s.mediaSrc) || s.mediaSrc.indexOf("data:") === 0) { err.textContent = n + "add a video link or file path, or switch it to Text only."; _he.sel = i; heRenderAll(); return; }
                if (hsBadVideoHost(s.mediaSrc)) { err.textContent = n + "YouTube / Facebook / TikTok / Google Drive links can't be used. Use a direct .mp4 or .webm file."; _he.sel = i; heRenderAll(); return; }
            }
            if (s.mediaType === "none" && !s.title && !s.text) { err.textContent = n + "add some text or a photo/video."; _he.sel = i; heRenderAll(); return; }
            s.title = s.title.slice(0, 120);
            s.text = s.text.slice(0, 500);
            s.pos = i;
            if (JSON.stringify(s).length > 900000) { err.textContent = n + "is too large. Use a smaller photo."; _he.sel = i; heRenderAll(); return; }
            stored.push(s);
        }
        var total = 0;
        stored.forEach(function (s) { total += JSON.stringify(s).length; });
        if (total > 7500000) { err.textContent = "All slides together are too large. Remove a slide or use smaller photos."; return; }

        var interval = parseInt(document.getElementById("heInterval").value, 10);
        if (!(interval >= 3 && interval <= 30)) interval = HOME_DEFAULT_INTERVAL;

        var btn = document.getElementById("heSaveBtn");
        btn.disabled = true;
        btn.textContent = "Saving…";

        var metaRef = db.collection("cvspee").doc("homeSlides");
        var itemsRef = metaRef.collection("items");
        var batch = db.batch();
        var keep = {};
        stored.forEach(function (s) { keep[s.id] = true; batch.set(itemsRef.doc(s.id), s); });
        _homeCloud.items.forEach(function (old) { if (!keep[old.id]) batch.delete(itemsRef.doc(old.id)); });
        var me = getCurrentUser();
        batch.set(metaRef, { interval: interval, updatedAt: Date.now(), updatedBy: (me && me.email) || "" });

        batch.commit().then(function () {
            btn.disabled = false;
            btn.textContent = "Save & Publish";
            closeHomeEditor();
            alert("Front page saved. Everyone will see the new slideshow.");
        }).catch(function (e) {
            btn.disabled = false;
            btn.textContent = "Save & Publish";
            var msg = (e && e.code === "permission-denied")
                ? "Couldn't save: the database rejected the write (permission denied). Check your Firestore rules."
                : "Couldn't save the front page. Check your internet connection and try again.";
            err.textContent = msg;
        });
    }

    window.addEventListener("resize", function () { if (_he.open) heRenderPreview(); });


    function renderAccount() {
        var container = document.getElementById("accountContent");
        var storedEmail = localStorage.getItem("cvspee_current_user");

        updateAddProductButtonVisibility();

        if (storedEmail && !_cloud.ready.users) {
            container.innerHTML =
                '<div class="account-box">' +
                    '<h3>Loading your account…</h3>' +
                '</div>';
            return;
        }

        var user = getCurrentUser();

        if (!user) {

            if (storedEmail && !_usersServerConfirmed) {
                container.innerHTML =
                    '<div class="account-box">' +
                        '<h3>Loading your account…</h3>' +
                    '</div>';
                return;
            }

            var wasBanned = storedEmail ? getBannedRecord(storedEmail) : null;

            if (storedEmail) localStorage.removeItem("cvspee_current_user");

            updateCartBadge();
            updateWishlistBadge();

            if (wasBanned) {
                _pendingAccountAppeal = { record: wasBanned, email: storedEmail, name: wasBanned.name || "" };
                container.innerHTML =
                    '<div class="account-box">' +
                        '<h3>Account Suspended</h3>' +
                        '<p>' + escapeHtml(suspensionMessage(wasBanned)) + '</p>' +
                        '<button type="button" class="btn" onclick="openBanAppealFromAccountPage()">Appeal This Suspension</button>' +
                    '</div>';
                refreshOrderUI();
                return;
            }

            container.innerHTML =
                '<div class="account-box">' +
                    '<h3>Welcome to CVSPEE</h3>' +
                    '<p>Sign in or create an account to manage your CVSPEE orders and profile.</p>' +
                    '<a href="#" class="btn" onclick="openAuthModal(); return false;">Sign In / Sign Up</a>' +
                '</div>';
            refreshOrderUI();
            return;
        }

        migrateLegacyCart();
        updateCartBadge();
        updateWishlistBadge();

        var initials = user.name.trim().charAt(0).toUpperCase() || "?";

        var avatarHtml = user.avatar
            ? '<img src="' + user.avatar + '" class="profile-avatar-img" alt="Profile picture">'
            : '<div class="profile-avatar-initials">' + initials + '</div>';

        container.innerHTML =
            '<div class="user-search-wrap">' +
                '<span class="user-search-icon">&#128269;</span>' +
                '<input type="text" id="userSearchInput" class="user-search-input" placeholder="Search users by name or username..." oninput="handleUserSearchInput()" autocomplete="off">' +
            '</div>' +
            '<div class="user-search-results" id="userSearchResults"></div>' +
            '<div class="account-box profile-box">' +
                '<div class="profile-avatar-wrap">' +
                    avatarHtml +
                    '<span class="presence-dot presence-dot-lg presence-dot-left online" title="Online"></span>' +
                    '<label class="avatar-upload-btn">' +
                        '<i class="fa-solid fa-camera"></i>' +
                        '<input type="file" accept="image/*" onchange="changeAvatar(this)" hidden>' +
                    '</label>' +
                '</div>' +
                '<div class="profile-name-row">' +
                    '<h3>' + user.name + '</h3>' +
                    '<button type="button" class="profile-edit-name-btn" onclick="editName()" title="Edit name"><i class="fa-solid fa-pen"></i></button>' +
                '</div>' +
                (user.username ? '<p class="profile-username">' + escapeHtml(user.username) + '</p>' : '') +
                '<p class="profile-email">' + user.email + '</p>' +
                (user.role ? '<p class="profile-role">' + escapeHtml(user.role) + '</p>' : '') +
                (function () {
                    var panelRole = getPanelRole(user.email);
                    if (panelRole === "admin") {
                        return '<p class="panel-role-badge panel-role-badge-admin"><i class="fa-solid fa-shield-halved"></i> Admin</p>';
                    }
                    if (panelRole === "seller") {
                        return '<p class="panel-role-badge panel-role-badge-seller"><i class="fa-solid fa-store"></i> Seller</p>';
                    }
                    return '';
                })() +
                (user.role ? (user.idVerified
                    ? '<p class="verify-badge verify-badge-yes" title="ID verified at sign up"><i class="fa-solid fa-circle-check"></i> Verified</p>'
                    : '<p class="verify-badge verify-badge-no" title="ID not verified"><i class="fa-solid fa-circle-xmark"></i> Not Verified</p>') : '') +
                (user.isOwner ? '<p class="profile-email">Signed in as site owner</p>' + '<button type="button" class="profile-customize-btn" onclick="openHomeEditor()"><i class="fa-solid fa-palette"></i> Customize Front Page</button>' : '') +
                (!user.isOwner && user.isSeller ? '<p class="profile-email">Seller account</p>' : '') +
                '<button type="button" class="profile-logout-btn" onclick="logout()">Log Out</button>' +
            '</div>';

        refreshOrderUI();
    }

    function handleUserSearchInput() {
        var input = document.getElementById("userSearchInput");
        var resultsEl = document.getElementById("userSearchResults");
        if (!input || !resultsEl) return;

        var query = input.value.trim().toLowerCase().replace(/^@/, "");

        if (!query) {
            resultsEl.innerHTML = "";
            return;
        }

        var users = getUsers().filter(function (u) {
            var name = (u.name || "").toLowerCase();
            var username = (u.username || "").toLowerCase().replace(/^@/, "");
            return name.indexOf(query) !== -1 || username.indexOf(query) !== -1;
        }).slice(0, 25);

        if (!users.length) {
            resultsEl.innerHTML = '<p class="user-search-empty">No users found.</p>';
            return;
        }

        resultsEl.innerHTML = users.map(function (u) {
            var initials = (u.name || "?").trim().charAt(0).toUpperCase() || "?";
            var avatarHtml = u.avatar
                ? ('<img src="' + u.avatar + '" alt="">')
                : ('<span>' + initials + '</span>');

            var panelRole = getPanelRole(u.email);
            var tagsHtml = "";

            if (u.isOwner) {
                tagsHtml += ' <span class="user-search-tag tag-owner">Owner</span>';
            } else if (panelRole === "admin") {
                tagsHtml += ' <span class="user-search-tag tag-admin">Admin</span>';
            } else if (panelRole === "seller" || u.isSeller) {
                tagsHtml += ' <span class="user-search-tag tag-seller">Seller</span>';
            }

            if (!u.isOwner && u.role) {
                tagsHtml += ' <span class="user-search-tag tag-role">' + escapeHtml(u.role) + '</span>';
            }

            if (!u.isOwner && u.role) {
                tagsHtml += u.idVerified
                    ? ' <span class="user-search-tag tag-verified">Verified</span>'
                    : ' <span class="user-search-tag tag-unverified">Not Verified</span>';
            }

            return (
                '<div class="user-search-result" onclick="openUserProfileView(\'' + escapeHtml(u.email || "") + '\', \'' + escapeHtml(u.name || "") + '\')">' +
                    '<div class="user-search-avatar">' + avatarHtml + '</div>' +
                    '<div class="user-search-info">' +
                        '<div class="user-search-name">' + escapeHtml(u.name || "Unknown") + tagsHtml +
                        '</div>' +
                        (u.username ? '<div class="user-search-username">' + escapeHtml(u.username) + '</div>' : '') +
                    '</div>' +
                '</div>'
            );
        }).join('');
    }

    if (!localStorage.getItem("cvspee_current_user")) {
        openAuthModal();
    }

    document.querySelectorAll('a[href="#account"]').forEach(function (link) {
        link.addEventListener("click", function () {
            if (!getCurrentUser()) openAuthModal();
        });
    });

    var DEFAULT_PRODUCTS = {
        tracksuit: {
            id: "tracksuit",
            name: "CVSU PE Tracksuit",
            category: "Uniform",
            price: 1119,
            image: "images/product-1.png",
            description: "The official CVSU PE tracksuit — comfortable, breathable, and warm enough for morning classes or outdoor activities. Soft fleece lining, built to last the whole semester.",
            sizes: ["Small", "Medium", "Large", "Extra Large"],
            stock: 50
        },
        jersey: {
            id: "jersey",
            name: "CVSU PE Jersey",
            category: "Uniform",
            price: 699,
            image: "images/TJ.jpg",
            description: "The official CVSU PE jersey — lightweight, breathable fabric that stays comfortable through PE class and everyday campus wear.",
            sizes: ["Small", "Medium", "Large", "Extra Large"],
            stock: 50
        },
        shorts: {
            id: "shorts",
            name: "CVSU PE Shorts",
            category: "Uniform",
            price: 399,
            image: "images/ATS.png",
            description: "Flexible, quick-drying PE shorts with a comfortable stretch fit — part of the official CVSU PE uniform set.",
            sizes: ["Small", "Medium", "Large", "Extra Large"],
            stock: 50
        },
        shoes: {
            id: "shoes",
            name: "CVSPEE Campus Shoes",
            category: "Footwear",
            price: 999,
            image: "images/AJS.jpg",
            description: "Comfortable, durable everyday shoes built for long days on campus — from morning classes to PE period.",
            sizes: ["38", "39", "40", "41", "42", "43", "44"],
            stock: 50
        },
        idlace: {
            id: "idlace",
            name: "CVSU ID Lace",
            category: "Accessory",
            price: 79,
            image: "images/id-lace.png",
            description: "Official CVSU ID lace with lanyard clip — durable weave, comfortable to wear all day.",
            sizes: ["One Size"],
            stock: 100
        },
        tote: {
            id: "tote",
            name: "CVSPEE Campus Tote Bag",
            category: "Bag",
            price: 349,
            image: "images/tote-bag.png",
            description: "A spacious, durable tote bag for books, modules, and everyday campus essentials.",
            sizes: ["One Size"],
            stock: 50
        }
    };

    
    
    var PRODUCTS = {};
    Object.keys(DEFAULT_PRODUCTS).forEach(function (id) {
        PRODUCTS[id] = DEFAULT_PRODUCTS[id];
    });

    function applyCloudProducts() {
        Object.keys(PRODUCTS).forEach(function (id) {
            delete PRODUCTS[id];
        });
        var source = (_cloud.ready.products && Object.keys(_cloud.products).length > 0)
            ? _cloud.products
            : DEFAULT_PRODUCTS;
        Object.keys(source).forEach(function (id) {
            PRODUCTS[id] = source[id];
        });
    }

    var _productsSeeded = false;

    function seedDefaultProductsIfNeeded() {
        if (_productsSeeded || !_cloud.ready.products) return;
        if (_productsMode === "perdoc" && !(_pSync.prod && _pSync.meta)) return;
        _productsSeeded = true;

        var missing = Object.keys(DEFAULT_PRODUCTS).filter(function (id) {
            return !_cloud.products[id] && (_cloud.deletedDefaults || []).indexOf(id) === -1;
        });
        if (missing.length === 0) return;

        missing.forEach(function (id) { _cloud.products[id] = DEFAULT_PRODUCTS[id]; });
        if (_productsMode === "legacy") { persistProductsLegacy(); return; }
        var batch = db.batch();
        missing.forEach(function (id) { batch.set(productDocRef(id), cleanForSave(DEFAULT_PRODUCTS[id])); });
        batch.commit().catch(function (err) { console.error("seed defaults failed", err); });
    }

    var NEW_PRODUCT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

    function isNewProduct(product) {
        return !!(product.createdAt && (Date.now() - product.createdAt) < NEW_PRODUCT_WINDOW_MS);
    }

    function normalizeCategory(raw) {
        var c = (raw || "").toString().trim().toLowerCase();
        if (c.length > 1 && c.charAt(c.length - 1) === "s") {
            c = c.slice(0, -1);
        }
        return c;
    }

    function productCardHtml(product) {
        var stock = (typeof product.stock === "number") ? product.stock : 0;
        var outOfStock = stock <= 0;

        var inWishlist = isInWishlist(product.id);

        return (
            '<div class="col-4 product-card' + (outOfStock ? ' product-out-of-stock' : '') + '" data-product-id="' + product.id + '" onclick="openProductDetail(\'' + product.id + '\')">' +
                (isOwnerLoggedIn() ? '<button type="button" class="product-edit-btn" onclick="openEditProductModal(\'' + product.id + '\', event)" title="Edit product">&#9998;</button>' : '') +
                '<button type="button" class="product-wishlist-btn' + (inWishlist ? ' active' : '') + '" onclick="toggleWishlist(\'' + product.id + '\', event)" title="Add to wishlist">' +
                    '<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-10-9.2C.5 8 2 4.5 5.4 3.7 7.7 3.1 10 4.2 12 6.5c2-2.3 4.3-3.4 6.6-2.8C22 4.5 23.5 8 22 11.3c-2.5 4.6-10 9.2-10 9.2z"/></svg>' +
                '</button>' +
                '<div class="product-image-wrap">' +
                    (isNewProduct(product) ? '<span class="product-new-ribbon">New</span>' : '') +
                    '<img src="' + product.image + '" alt="' + escapeHtml(product.name) + '">' +
                    (normGender(product.gender) ? '<span class="product-gender-tag">' + normGender(product.gender) + '</span>' : '') +
                '</div>' +
                '<h4>' + escapeHtml(product.name) + '</h4>' +
                '<div class="ratings" id="rating-' + product.id + '"><h2>☆☆☆☆☆</h2></div>' +
                '<p>' + priceDisplayHtml(product) + '</p>' +
                (outOfStock
                    ? '<p class="stock-badge stock-out">Out of Stock</p>'
                    : (stock <= 10 ? '<p class="stock-badge stock-low">Only ' + stock + ' left</p>' : '')) +
            '</div>'
        );
    }

    
    
    var MOBILE_BREAKPOINT_QUERY = "(max-width: 600px)";
    function getProductsPerPage() {
        return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches ? 16 : 12;
    }

    var currentProductPage = 1;
    var _lastProductsPerPage = getProductsPerPage();

    
    
    
    var _productsPerPageResizeTimer = null;
    window.addEventListener("resize", function () {
        clearTimeout(_productsPerPageResizeTimer);
        _productsPerPageResizeTimer = setTimeout(function () {
            var newPerPage = getProductsPerPage();
            if (newPerPage !== _lastProductsPerPage) {
                _lastProductsPerPage = newPerPage;
                currentProductPage = 1;
                renderProductGrid();
            }
        }, 200);
    });

    function handleProductSearchInput() {
        currentProductPage = 1;
        renderProductGrid();
    }

    function goToProductPage(page) {
        var grid = document.getElementById("productGrid");
        if (!grid || page === currentProductPage) return;

        
        
        var goingForward = page > currentProductPage;
        var exitClass = goingForward ? "product-grid-slide-out-left" : "product-grid-slide-out-right";
        var enterClass = goingForward ? "product-grid-slide-in-right" : "product-grid-slide-in-left";

        currentProductPage = page;

        grid.classList.remove("product-grid-slide-out-left", "product-grid-slide-out-right", "product-grid-slide-in-left", "product-grid-slide-in-right");

        
        
        
        
        
        
        var swapped = false;
        function swapContent() {
            if (swapped) return;
            swapped = true;
            renderProductGrid();
            grid.classList.remove(exitClass);
            void grid.offsetWidth; 
            grid.classList.add(enterClass);
            grid.addEventListener("animationend", function () {
                grid.classList.remove(enterClass);
            }, { once: true });
        }

        grid.addEventListener("animationend", swapContent, { once: true });
        setTimeout(swapContent, 320);

        void grid.offsetWidth; 
        grid.classList.add(exitClass);

        
        
        var rect = grid.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
            grid.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    function renderProductPagination(totalItems) {
        var el = document.getElementById("productPagination");
        if (!el) return;

        var totalPages = Math.ceil(totalItems / getProductsPerPage());

        
        if (totalPages <= 1) {
            el.innerHTML = "";
            return;
        }

        var html = "";
        html += '<button type="button" onclick="goToProductPage(' + (currentProductPage - 1) + ')"' + (currentProductPage === 1 ? " disabled" : "") + '>&laquo;</button>';

        for (var p = 1; p <= totalPages; p++) {
            var showPage = (p === 1 || p === totalPages || Math.abs(p - currentProductPage) <= 1);
            if (showPage) {
                html += '<button type="button" class="' + (p === currentProductPage ? "pagination-active" : "") + '" onclick="goToProductPage(' + p + ')">' + p + '</button>';
            } else if (p === 2 || p === totalPages - 1) {
                html += '<span class="pagination-ellipsis">&hellip;</span>';
            }
        }

        html += '<button type="button" onclick="goToProductPage(' + (currentProductPage + 1) + ')"' + (currentProductPage === totalPages ? " disabled" : "") + '>&raquo;</button>';

        el.innerHTML = html;
    }

    var newProductFilterActive = false;
    var activeCategoryFilter = null;
    var categoryFilterPanelOpen = false;

    function handleNewProductFilterChange() {
        var checkbox = document.getElementById("newProductFilterCheckbox");
        newProductFilterActive = !!(checkbox && checkbox.checked);
        currentProductPage = 1;
        renderProductGrid();
    }

    function toggleCategoryFilterPanel(forceState) {
        categoryFilterPanelOpen = (typeof forceState === "boolean") ? forceState : !categoryFilterPanelOpen;
        var panel = document.getElementById("categoryFilterBar");
        var backdrop = document.getElementById("filterBackdrop");
        if (panel) panel.classList.toggle("show", categoryFilterPanelOpen);
        if (backdrop) backdrop.classList.toggle("show", categoryFilterPanelOpen);
        document.body.classList.toggle("filters-open", categoryFilterPanelOpen);
    }

    function setCategoryFilter(normalizedCategory) {
        activeCategoryFilter = normalizedCategory;
        currentProductPage = 1;
        renderProductGrid();
    }

    document.addEventListener("click", function (event) {
        if (!categoryFilterPanelOpen) return;
        if (!document.body.contains(event.target)) return;
        var wrap = event.target.closest ? event.target.closest(".category-filter-wrap") : null;
        if (!wrap) toggleCategoryFilterPanel(false);
    });

    function hasNum(v) { return typeof v === "number" && isFinite(v); }

    var activePriceMin = null;
    var activePriceMax = null;
    var _filterKeepPanel = false;

    function formatPesoShort(n) {
        return "\u20B1" + Number(n).toLocaleString("en-PH", { maximumFractionDigits: 2 });
    }

    function priceRangeLabel() {
        if (hasNum(activePriceMin) && hasNum(activePriceMax)) return formatPesoShort(activePriceMin) + " \u2013 " + formatPesoShort(activePriceMax);
        if (hasNum(activePriceMin)) return "From " + formatPesoShort(activePriceMin);
        if (hasNum(activePriceMax)) return "Up to " + formatPesoShort(activePriceMax);
        return null;
    }

    function catalogPriceRange() {
        var lo = null, hi = null;
        Object.keys(PRODUCTS).forEach(function (id) {
            var p = getDiscountedPrice(PRODUCTS[id]);
            if (!isFinite(p)) return;
            if (lo === null || p < lo) lo = p;
            if (hi === null || p > hi) hi = p;
        });
        return { min: lo, max: hi };
    }

    function pricePresets(range) {
        if (range.min === null || range.max - range.min < 150) return [];
        function r50(n) { return Math.round(n / 50) * 50; }
        var t1 = r50(range.min + (range.max - range.min) / 3);
        var t2 = r50(range.min + 2 * (range.max - range.min) / 3);
        if (t2 <= t1) return [];
        return [
            { label: "Under " + formatPesoShort(t1), min: null, max: t1 },
            { label: formatPesoShort(t1) + " \u2013 " + formatPesoShort(t2), min: t1, max: t2 },
            { label: "Over " + formatPesoShort(t2), min: t2, max: null }
        ];
    }

    function getFilterSections() {
        var seen = {};
        Object.keys(PRODUCTS).forEach(function (id) {
            var raw = (PRODUCTS[id].category || "").toString().trim();
            if (!raw) return;
            var norm = normalizeCategory(raw);
            if (!seen[norm]) seen[norm] = raw.charAt(0).toUpperCase() + raw.slice(1);
        });
        var cats = Object.keys(seen).sort().map(function (n) { return { value: n, label: seen[n] }; });

        return [
            {
                key: "category", type: "chips", title: "Category",
                options: [{ value: null, label: "All" }].concat(cats),
                getValue: function () { return activeCategoryFilter; },
                setValue: function (v) { activeCategoryFilter = v; },
                describe: function () {
                    var v = activeCategoryFilter;
                    if (v === null) return null;
                    return seen[v] || String(v);
                }
            },
            {
                key: "gender", type: "chips", title: "Gender",
                options: [{ value: null, label: "All" }, { value: "Male", label: "Male" }, { value: "Female", label: "Female" }],
                getValue: function () { return activeGenderFilter; },
                setValue: function (v) { activeGenderFilter = v; },
                describe: function () { return activeGenderFilter; }
            },
            {
                key: "price", type: "range", title: "Price",
                getValue: function () { return (hasNum(activePriceMin) || hasNum(activePriceMax)) ? "set" : null; },
                setValue: function () { activePriceMin = null; activePriceMax = null; },
                describe: priceRangeLabel
            }
        ];
    }

    function productPassesFilters(product, query) {
        var matchesQuery = !query || product.name.toLowerCase().indexOf(query) !== -1;
        var matchesNewFilter = !newProductFilterActive || isNewProduct(product);
        var matchesCategory = !activeCategoryFilter || normalizeCategory(product.category) === activeCategoryFilter;
        if (!(matchesQuery && matchesNewFilter && matchesCategory && productMatchesGender(product))) return false;

        if (hasNum(activePriceMin) || hasNum(activePriceMax)) {
            var price = getDiscountedPrice(product);
            if (!isFinite(price)) return false;
            if (hasNum(activePriceMin) && price < activePriceMin) return false;
            if (hasNum(activePriceMax) && price > activePriceMax) return false;
        }
        return true;
    }

    function applyFilterChoice(key, value) {
        var sections = getFilterSections();
        for (var i = 0; i < sections.length; i++) {
            if (sections[i].key === key) { sections[i].setValue(value === "" ? null : value); break; }
        }
        currentProductPage = 1;
        renderProductGrid();
    }

    function clearAllFilters() {
        getFilterSections().forEach(function (sec) { sec.setValue(null); });
        currentProductPage = 1;
        renderProductGrid();
    }

    function setPriceRange(min, max) {
        activePriceMin = (min === null || min === undefined) ? null : Number(min);
        activePriceMax = (max === null || max === undefined) ? null : Number(max);
        currentProductPage = 1;
        renderProductGrid();
    }

    function onPriceInput() {
        var mn = parseFloat(document.getElementById("fsPriceMin").value);
        var mx = parseFloat(document.getElementById("fsPriceMax").value);
        activePriceMin = (isFinite(mn) && mn >= 0) ? mn : null;
        activePriceMax = (isFinite(mx) && mx >= 0) ? mx : null;
        currentProductPage = 1;
        _filterKeepPanel = true;
        try { renderProductGrid(); } finally { _filterKeepPanel = false; }
    }

    (function filterPanelEvents() {
        var bar = document.getElementById("categoryFilterBar");
        if (bar) {
            bar.addEventListener("click", function (e) {
                var chip = e.target.closest ? e.target.closest(".fs-chip") : null;
                if (!chip) return;
                if (chip.getAttribute("data-preset") !== null) {
                    var mn = chip.getAttribute("data-min"), mx = chip.getAttribute("data-max");
                    var already = (activePriceMin === (mn === "" ? null : Number(mn))) && (activePriceMax === (mx === "" ? null : Number(mx)));
                    if (already) setPriceRange(null, null);
                    else setPriceRange(mn === "" ? null : mn, mx === "" ? null : mx);
                    return;
                }
                applyFilterChoice(chip.getAttribute("data-fk"), chip.getAttribute("data-fv"));
            });
        }
        var row = document.getElementById("activeFilters");
        if (row) {
            row.addEventListener("click", function (e) {
                var chip = e.target.closest ? e.target.closest(".af-chip") : null;
                if (chip) { applyFilterChoice(chip.getAttribute("data-fk"), ""); return; }
                if (e.target.closest && e.target.closest(".af-clear")) clearAllFilters();
            });
        }
    })();

    function renderCategoryFilterBar() {
        var bar = document.getElementById("categoryFilterBar");
        var labelEl = document.getElementById("filtersBtnLabel");
        var btnEl = document.getElementById("filtersBtn");
        var rowEl = document.getElementById("activeFilters");
        if (!bar) return;

        var sections = getFilterSections();
        var active = [];
        sections.forEach(function (sec) {
            var label = sec.describe();
            if (label === null || label === undefined) return;
            active.push({ key: sec.key, label: String(label) });
        });

        var searchInput = document.getElementById("productSearchInput");
        var query = searchInput ? searchInput.value.trim().toLowerCase() : "";
        var matchCount = Object.keys(PRODUCTS).filter(function (id) { return productPassesFilters(PRODUCTS[id], query); }).length;
        var countText = "Show " + matchCount + " product" + (matchCount === 1 ? "" : "s");

        var headHtml = '<div class="fs-head"><span class="fs-title">Filters</span>' +
            (active.length ? '<button type="button" class="fs-clear" onclick="clearAllFilters()">Clear all</button>' : '') +
            '<button type="button" class="fs-close" aria-label="Close filters" onclick="toggleCategoryFilterPanel(false)">&times;</button></div>';

        var existingBody = bar.querySelector ? bar.querySelector(".fs-body") : null;

        if (_filterKeepPanel && existingBody) {
            var oldHead = bar.querySelector(".fs-head");
            if (oldHead) oldHead.outerHTML = headHtml;
            var done = bar.querySelector(".fs-done");
            if (done) done.textContent = countText;
            var err = bar.querySelector(".fs-price-error");
            if (err) err.textContent = (hasNum(activePriceMin) && hasNum(activePriceMax) && activePriceMin > activePriceMax) ? "Min is higher than Max." : "";
        } else {
            var prevScroll = existingBody ? existingBody.scrollTop : 0;
            var range = catalogPriceRange();
            var html = headHtml + '<div class="fs-body">';

            sections.forEach(function (sec) {
                html += '<div class="fs-section"><div class="fs-section-title">' + escapeHtml(sec.title) + '</div>';

                if (sec.type === "range") {
                    var presets = pricePresets(range);
                    html += '<div class="fs-price">' +
                        '<label class="fs-price-field"><span>\u20B1</span><input type="number" inputmode="decimal" min="0" id="fsPriceMin" placeholder="Min" value="' +
                            (hasNum(activePriceMin) ? activePriceMin : "") + '" oninput="onPriceInput()"></label>' +
                        '<span class="fs-price-dash">\u2013</span>' +
                        '<label class="fs-price-field"><span>\u20B1</span><input type="number" inputmode="decimal" min="0" id="fsPriceMax" placeholder="Max" value="' +
                            (hasNum(activePriceMax) ? activePriceMax : "") + '" oninput="onPriceInput()"></label></div>';
                    html += '<div class="fs-price-error">' +
                        ((hasNum(activePriceMin) && hasNum(activePriceMax) && activePriceMin > activePriceMax) ? "Min is higher than Max." : "") + '</div>';
                    if (presets.length) {
                        html += '<div class="fs-chips" style="margin-top:10px;">';
                        presets.forEach(function (p) {
                            var on = (activePriceMin === p.min) && (activePriceMax === p.max);
                            html += '<button type="button" class="fs-chip' + (on ? ' active' : '') + '" data-preset="1" data-min="' +
                                (p.min === null ? "" : p.min) + '" data-max="' + (p.max === null ? "" : p.max) + '">' + escapeHtml(p.label) + '</button>';
                        });
                        html += '</div>';
                    }
                    if (range.min !== null) {
                        html += '<div class="fs-price-hint">Prices here: ' + formatPesoShort(Math.floor(range.min)) + ' \u2013 ' + formatPesoShort(Math.ceil(range.max)) + '</div>';
                    }
                } else {
                    html += '<div class="fs-chips">';
                    sec.options.forEach(function (o) {
                        var on = (sec.getValue() === o.value) || (o.value === null && (sec.getValue() === null || sec.getValue() === undefined));
                        html += '<button type="button" class="fs-chip' + (on ? ' active' : '') + '" aria-pressed="' + on +
                            '" data-fk="' + sec.key + '" data-fv="' + escapeHtml(o.value === null ? "" : String(o.value)).replace(/"/g, "&quot;") + '">' + escapeHtml(o.label) + '</button>';
                    });
                    html += '</div>';
                }
                html += '</div>';
            });
            html += '</div>';

            html += '<div class="fs-foot"><button type="button" class="btn fs-done" onclick="toggleCategoryFilterPanel(false)">' + countText + '</button></div>';

            bar.innerHTML = html;
            var newBody = bar.querySelector ? bar.querySelector(".fs-body") : null;
            if (newBody) newBody.scrollTop = prevScroll;
        }
        bar.classList.toggle("show", categoryFilterPanelOpen);

        if (labelEl) labelEl.textContent = "Filters";
        if (btnEl) {
            var badge = btnEl.querySelector(".filters-count");
            if (!badge) {
                badge = document.createElement("span");
                badge.className = "filters-count";
                btnEl.insertBefore(badge, btnEl.firstChild ? btnEl.firstChild.nextSibling : null);
            }
            badge.textContent = active.length;
            badge.classList.toggle("show", active.length > 0);
            btnEl.classList.toggle("active", active.length > 0);
        }

        if (rowEl) {
            var rowHtml = active.map(function (a) {
                return '<button type="button" class="af-chip" data-fk="' + a.key + '" title="Remove filter">' + escapeHtml(a.label) + ' <span>&times;</span></button>';
            }).join("");
            if (active.length > 1) rowHtml += '<button type="button" class="af-clear">Clear all</button>';
            rowEl.innerHTML = rowHtml;
            rowEl.classList.toggle("show", active.length > 0);
        }
    }

    function renderProductGrid() {
        var grid = document.getElementById("productGrid");
        if (!grid) return;

        renderCategoryFilterBar();

        var searchInput = document.getElementById("productSearchInput");
        var query = searchInput ? searchInput.value.trim().toLowerCase() : "";

        var ids = Object.keys(PRODUCTS).filter(function (id) {
            return productPassesFilters(PRODUCTS[id], query);
        });

        if (ids.length === 0) {
            var emptyMsg = newProductFilterActive
                ? "No new products right now."
                : ((activeCategoryFilter || activeGenderFilter || hasNum(activePriceMin) || hasNum(activePriceMax))
                    ? "No products found for this filter."
                    : 'No products found for "' + escapeHtml(searchInput ? searchInput.value.trim() : "") + '".');
            grid.innerHTML = '<p class="product-search-empty">' + emptyMsg + '</p>';
            var paginationEl = document.getElementById("productPagination");
            if (paginationEl) paginationEl.innerHTML = "";
            return;
        }

        var perPage = getProductsPerPage();
        var totalPages = Math.max(1, Math.ceil(ids.length / perPage));
        if (currentProductPage > totalPages) currentProductPage = totalPages;
        if (currentProductPage < 1) currentProductPage = 1;

        var start = (currentProductPage - 1) * perPage;
        var pageIds = ids.slice(start, start + perPage);

        grid.innerHTML = pageIds.map(function (id) {
            return productCardHtml(PRODUCTS[id]);
        }).join("");
        renderAllProductRatings();
        renderProductPagination(ids.length);
    }

    
    function adjustStockForItems(items, direction) {
        if (!items || items.length === 0) return;

        var changes = [];
        items.forEach(function (item) {
            var product = _cloud.products[item.id];
            if (!product || typeof product.stock !== "number") return;
            product.stock = Math.max(0, product.stock + (direction * item.qty));
            if (PRODUCTS[item.id]) PRODUCTS[item.id].stock = product.stock;
            changes.push({ id: item.id, delta: direction * item.qty });
        });

        if (changes.length) {
            persistStockChanges(changes);
            renderProductGrid();
        }
    }

    function isOwnerLoggedIn() {
        var user = getCurrentUser();
        return !!(user && user.isOwner);
    }

    function isSellerLoggedIn() {
        var user = getCurrentUser();
        return !!(user && !user.isOwner && user.isSeller);
    }

    function getMyPanelRole() {
        var user = getCurrentUser();
        if (!user) return null;
        return getPanelRole(user.email);
    }

    
    
    
    
    
    
    function getOrderRoleFor(order, user) {
        if (!order || !user) return "none";
        if (user.isOwner) return "owner";
        if (order.buyerEmail === user.email) return "buyer";
        if (user.isSeller) {
            if (order.sellerEmail === user.email) return "seller-assigned";
            if (!order.sellerEmail && order.status === "pending") return "seller-pending";
        }
        return "none";
    }

    function updateAddProductButtonVisibility() {
        var btn = document.getElementById("addProductBtn");
        if (btn) btn.style.display = isOwnerLoggedIn() ? "inline-block" : "none";

        var promoItem = document.getElementById("promoManagerMenuItem");
        if (promoItem) promoItem.style.display = isOwnerLoggedIn() ? "block" : "none";
        updateThemePickerVisibility();

        var orderMgmtItem = document.getElementById("orderManagementMenuItem");
        if (orderMgmtItem) {
            var myPanelRole = getMyPanelRole();
            orderMgmtItem.style.display = (isOwnerLoggedIn() || myPanelRole === "seller" || myPanelRole === "admin") ? "block" : "none";
        }

        renderProductGrid();
    }

    var newProductImageDataUrl = null;

    
    
    
    
    var NO_SIZE_LABEL = "One Size";

    
    
    function toggleNoSizeFields(which) {
        var checkbox = document.getElementById(which === "edit" ? "editProductNoSize" : "newProductNoSize");
        var sizesInput = document.getElementById(which === "edit" ? "editProductSizes" : "newProductSizes");
        var hint = document.getElementById(which === "edit" ? "editProductSizesHint" : "newProductSizesHint");
        var noSize = checkbox.checked;

        sizesInput.style.display = noSize ? "none" : "";
        hint.style.display = noSize ? "none" : "";
        sizesInput.required = !noSize;
        if (noSize) {
            sizesInput.value = NO_SIZE_LABEL;
        } else if (sizesInput.value === NO_SIZE_LABEL) {
            sizesInput.value = "";
        }
    }

    
    
    
    function toggleDiscountFields(which) {
        var checkbox = document.getElementById(which === "edit" ? "editProductDiscountToggle" : "newProductDiscountToggle");
        var fieldsWrap = document.getElementById(which === "edit" ? "editProductDiscountFields" : "newProductDiscountFields");
        if (!checkbox || !fieldsWrap) return;

        fieldsWrap.style.display = checkbox.checked ? "block" : "none";
    }

    
    
    
    function getActiveDiscount(product) {
        if (!product || !product.discount) return null;
        var d = product.discount;
        if (!d.percent || d.percent <= 0) return null;
        if (d.expiresAt && Date.now() > d.expiresAt) return null;
        return d;
    }

    function getDiscountedPrice(product) {
        var d = getActiveDiscount(product);
        if (!d) return Number(product.price);
        var price = Number(product.price) * (1 - d.percent / 100);
        return Math.max(0, price);
    }

    function priceDisplayHtml(product) {
        var d = getActiveDiscount(product);
        if (!d) {
            return '₱' + Number(product.price).toFixed(2);
        }
        return (
            '<span class="price-original">₱' + Number(product.price).toFixed(2) + '</span>' +
            '<span class="price-discounted">₱' + getDiscountedPrice(product).toFixed(2) + '</span>' +
            '<span class="discount-badge">-' + d.percent + '%</span>'
        );
    }

    
    
    
    function cartItemUnitPrice(item) {
        var product = PRODUCTS[item.id];
        return product ? getDiscountedPrice(product) : item.price;
    }

    function openAddProductModal() {
        if (!isOwnerLoggedIn()) {
            openAuthModal();
            return;
        }
        newProductImageDataUrl = null;
        newProductExtraImages = [];
        document.getElementById("newProductGender").value = "";
        document.getElementById("newProductExtraInput").value = "";
        renderExtraThumbs("new");
        document.getElementById("newProductName").value = "";
        document.getElementById("newProductPrice").value = "";
        document.getElementById("newProductDescription").value = "";
        fillSizeChartForm("new", null);
        document.getElementById("newProductSizes").value = "";
        document.getElementById("newProductStock").value = "";
        document.getElementById("newProductImageInput").value = "";
        document.getElementById("newProductNoSize").checked = false;
        toggleNoSizeFields("new");
        var preview = document.getElementById("newProductImagePreview");
        preview.src = "";
        preview.classList.remove("show");
        document.getElementById("addProductError").textContent = "";
        document.getElementById("addProductOverlay").classList.add("show");
    }

    function closeAddProductModal() {
        document.getElementById("addProductOverlay").classList.remove("show");
    }

    
    
    
    
    
    function getPromoCodesList() {
        return _cloud.promocodes || [];
    }

    function savePromoCodesList(list) {
        _cloud.promocodes = list;
        db.collection("cvspee").doc("promocodes").set({ list: list });
    }

    function todayDateStr() {
        var d = new Date();
        var m = String(d.getMonth() + 1).padStart(2, "0");
        var day = String(d.getDate()).padStart(2, "0");
        return d.getFullYear() + "-" + m + "-" + day;
    }

    function isPromoExpired(entry) {
        return !!entry.expiredDate && entry.expiredDate < todayDateStr();
    }

    function openPromoManager() {
        if (!isOwnerLoggedIn()) {
            openAuthModal();
            return;
        }
        document.getElementById("releasePromoCode").value = "";
        document.getElementById("releasePromoExpiry").value = "";
        document.getElementById("releasePromoPercent").value = "";
        document.getElementById("releasePromoError").textContent = "";
        document.querySelectorAll(".promo-percent-presets button").forEach(function (b) {
            b.classList.remove("selected");
        });
        renderPromoHistoryList();
        document.getElementById("promoManagerOverlay").classList.add("show");
    }

    function closePromoManager() {
        document.getElementById("promoManagerOverlay").classList.remove("show");
    }

    function setPromoPercentPreset(percent) {
        document.getElementById("releasePromoPercent").value = percent;
        document.querySelectorAll(".promo-percent-presets button").forEach(function (b) {
            b.classList.toggle("selected", parseInt(b.textContent, 10) === percent);
        });
    }

    function submitReleasePromoCode(event) {
        event.preventDefault();
        if (!isOwnerLoggedIn()) return false;

        var codeInput = document.getElementById("releasePromoCode");
        var expiryInput = document.getElementById("releasePromoExpiry");
        var percentInput = document.getElementById("releasePromoPercent");
        var errorEl = document.getElementById("releasePromoError");

        var code = codeInput.value.trim().toUpperCase();
        var expiry = expiryInput.value;
        var percent = parseInt(percentInput.value, 10);

        if (!code) {
            errorEl.textContent = "Please enter a code to release.";
            return false;
        }
        if (!expiry) {
            errorEl.textContent = "Please set an expiry date.";
            return false;
        }
        if (!percent || percent < 1 || percent > 100) {
            errorEl.textContent = "Please enter a valid discount percent (1-100).";
            return false;
        }

        var list = getPromoCodesList();
        if (list.some(function (e) { return e.code === code; })) {
            errorEl.textContent = "That code has already been released.";
            return false;
        }

        errorEl.textContent = "";

        list = list.concat([{
            code: code,
            discountPercent: percent,
            expiredDate: expiry,
            releasedAt: new Date().toLocaleString(),
            releasedBy: (getCurrentUser() && getCurrentUser().name) || "Owner"
        }]);
        savePromoCodesList(list);

        codeInput.value = "";
        expiryInput.value = "";
        percentInput.value = "";
        document.querySelectorAll(".promo-percent-presets button").forEach(function (b) {
            b.classList.remove("selected");
        });

        renderPromoHistoryList();
        return false;
    }

    function deletePromoCode(code) {
        if (!isOwnerLoggedIn()) return;
        var sure = confirm('Delete promo code "' + code + '"? This cannot be undone.');
        if (!sure) return;

        var list = getPromoCodesList().filter(function (e) { return e.code !== code; });
        savePromoCodesList(list);
        renderPromoHistoryList();
    }

    function renderPromoHistoryList() {
        var listEl = document.getElementById("promoHistoryList");
        if (!listEl) return;

        var list = getPromoCodesList();

        if (list.length === 0) {
            listEl.innerHTML = '<p class="promo-history-empty">No promo codes released yet.</p>';
            return;
        }

        var sorted = list.slice().reverse();

        listEl.innerHTML = sorted.map(function (entry) {
            var expired = isPromoExpired(entry);
            return (
                '<div class="promo-history-item">' +
                    '<div class="promo-history-info">' +
                        '<strong>' + escapeHtml(entry.code) + '</strong>' +
                        '<div>' + entry.discountPercent + '% off &middot; expires ' + escapeHtml(entry.expiredDate) + '</div>' +
                    '</div>' +
                    '<span class="promo-history-status ' + (expired ? "status-expired" : "status-active") + '">' + (expired ? "Expired" : "Active") + '</span>' +
                    '<button type="button" class="promo-history-delete" onclick="deletePromoCode(\'' + entry.code + '\')" title="Delete code"><i class="fa-solid fa-trash"></i></button>' +
                '</div>'
            );
        }).join("");
    }

    
    
    
    
    
    function resizeImageToDataUrl(file, targetW, targetH, callback) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                var srcW = img.width, srcH = img.height;
                var srcRatio = srcW / srcH;
                var targetRatio = targetW / targetH;

                var sx, sy, sw, sh;
                if (srcRatio > targetRatio) {
                    
                    sh = srcH;
                    sw = srcH * targetRatio;
                    sx = (srcW - sw) / 2;
                    sy = 0;
                } else {
                    
                    sw = srcW;
                    sh = srcW / targetRatio;
                    sx = 0;
                    sy = (srcH - sh) / 2;
                }

                var canvas = document.createElement("canvas");
                canvas.width = targetW;
                canvas.height = targetH;
                canvas.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

                callback(canvas.toDataURL("image/jpeg", 0.85));
            };
            img.onerror = function () {
                alert("Couldn't read that image. Please try a different photo.");
            };
            img.src = e.target.result;
        };
        reader.onerror = function () {
            alert("Couldn't read that image. Please try a different photo.");
        };
        reader.readAsDataURL(file);
    }

    function handleNewProductImageSelected(event) {
        var file = event.target.files && event.target.files[0];
        if (!file) return;

        resizeImageToDataUrl(file, 1024, 1536, function (dataUrl) {
            newProductImageDataUrl = dataUrl;
            var preview = document.getElementById("newProductImagePreview");
            preview.src = newProductImageDataUrl;
            preview.classList.add("show");
        });
    }

    function slugify(text) {
        var base = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        if (!base) base = "product";
        var id = base;
        var suffix = 1;
        while (PRODUCTS[id]) {
            id = base + "-" + suffix;
            suffix++;
        }
        return id;
    }

    function submitAddProduct(event) {
        if (event) event.preventDefault();

        if (!isOwnerLoggedIn()) {
            closeAddProductModal();
            openAuthModal();
            return false;
        }

        var errorEl = document.getElementById("addProductError");

        var name = document.getElementById("newProductName").value.trim();
        var category = document.getElementById("newProductCategory").value.trim();
        var priceRaw = document.getElementById("newProductPrice").value;
        var price = parseFloat(priceRaw);
        var description = document.getElementById("newProductDescription").value.trim();
        var noSize = document.getElementById("newProductNoSize").checked;
        var sizesRaw = noSize ? NO_SIZE_LABEL : document.getElementById("newProductSizes").value.trim();
        var sizes = noSize ? [NO_SIZE_LABEL] : sizesRaw.split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
        var stockRaw = document.getElementById("newProductStock").value;
        var stock = parseInt(stockRaw, 10);

        if (!name) {
            errorEl.textContent = "Please enter a product name.";
            return false;
        }
        if (!category) {
            errorEl.textContent = "Please enter a category.";
            return false;
        }
        if (!priceRaw || isNaN(price) || price < 0) {
            errorEl.textContent = "Please enter a valid price.";
            return false;
        }
        if (!description) {
            errorEl.textContent = "Please enter a description.";
            return false;
        }
        if (sizes.length === 0) {
            errorEl.textContent = "Please list at least one size.";
            return false;
        }
        if (stockRaw === "" || isNaN(stock) || stock < 0) {
            errorEl.textContent = "Please enter a valid stock quantity.";
            return false;
        }
        if (!newProductImageDataUrl) {
            errorEl.textContent = "Please upload a product image.";
            return false;
        }
        var gender = normGender(document.getElementById("newProductGender").value);
        if (!gender) {
            errorEl.textContent = "Please choose Male, Female or Unisex.";
            return false;
        }
        var sizeChartRes = readSizeChartFromForm("new");
        if (sizeChartRes.error) {
            errorEl.textContent = sizeChartRes.error;
            return false;
        }
        if (galleryTooLarge(newProductExtraImages)) {
            errorEl.textContent = "The extra photos are too large together. Remove one or two.";
            return false;
        }

        var id = slugify(name);
        var product = {
            id: id,
            name: name,
            category: category,
            price: price,
            image: newProductImageDataUrl,
            description: description,
            sizes: sizes,
            stock: stock,
            gender: gender,
            sizeChartMode: sizeChartRes.mode,
            sizeChart: sizeChartRes.chart,
            galleryCount: newProductExtraImages.length,
            createdAt: Date.now()
        };

        if (productTooLarge(product)) {
            errorEl.textContent = "That photo is too large to save. Please use a smaller image.";
            return false;
        }
        _cloud.products[id] = product;
        PRODUCTS[id] = product;
        if (_cloud.deletedDefaults) {
            var ddIdx = _cloud.deletedDefaults.indexOf(id);
            if (ddIdx !== -1) _cloud.deletedDefaults.splice(ddIdx, 1);
        }
        if (newProductExtraImages.length) saveProductGallery(id, newProductExtraImages);
        persistProduct(id, true);

        errorEl.textContent = "";
        closeAddProductModal();
        renderProductGrid();

        return false;
    }

    function deleteProduct(productId, event) {
        if (event) event.stopPropagation();
        if (!isOwnerLoggedIn()) return;

        showConfirmModal("Remove this product from the shop?", function () {
            delete _cloud.products[productId];
            delete PRODUCTS[productId];
            deleteProductGallery(productId);

            if (!_cloud.deletedDefaults) _cloud.deletedDefaults = [];
            if (_cloud.deletedDefaults.indexOf(productId) === -1) {
                _cloud.deletedDefaults.push(productId);
            }

            persistProductRemoval(productId);

            renderProductGrid();
        }, { title: "Remove Product", okText: "Remove" });
    }

    var currentEditProductId = null;
    var editProductImageDataUrl = null;

    function openEditProductModal(productId, event) {
        if (event) event.stopPropagation();
        if (!isOwnerLoggedIn()) {
            openAuthModal();
            return;
        }

        var product = PRODUCTS[productId];
        if (!product) return;

        currentEditProductId = productId;
        editProductImageDataUrl = null;

        document.getElementById("editProductName").value = product.name;
        document.getElementById("editProductCategory").value = product.category || "";
        document.getElementById("editProductPrice").value = product.price;
        document.getElementById("editProductDescription").value = product.description;
        document.getElementById("editProductSizes").value = (product.sizes || []).join(", ");
        document.getElementById("editProductStock").value = (typeof product.stock === "number") ? product.stock : 0;
        document.getElementById("editProductImageInput").value = "";
        document.getElementById("editProductExtraInput").value = "";
        document.getElementById("editProductGender").value = normGender(product.gender);
        fillSizeChartForm("edit", product);
        editProductExtraImages = [];
        editGalleryLoaded = !product.galleryCount;
        renderExtraThumbs("edit");
        if (product.galleryCount) {
            loadGallery(productId, function (imgs) {
                if (currentEditProductId !== productId) return;
                editProductExtraImages = imgs.slice();
                editGalleryLoaded = true;
                renderExtraThumbs("edit");
            });
        }

        var isNoSize = (product.sizes || []).length === 1 && product.sizes[0] === NO_SIZE_LABEL;
        document.getElementById("editProductNoSize").checked = isNoSize;
        toggleNoSizeFields("edit");

        var existingDiscount = getActiveDiscount(product) || (product.discount || null);
        var discountToggle = document.getElementById("editProductDiscountToggle");
        if (existingDiscount) {
            discountToggle.checked = true;
            document.getElementById("editProductDiscountPercent").value = existingDiscount.percent;
            document.getElementById("editProductDiscountExpiry").value = existingDiscount.expiresAt
                ? new Date(existingDiscount.expiresAt).toISOString().slice(0, 10)
                : "";
        } else {
            discountToggle.checked = false;
            document.getElementById("editProductDiscountPercent").value = "";
            document.getElementById("editProductDiscountExpiry").value = "";
        }
        toggleDiscountFields("edit");

        var preview = document.getElementById("editProductImagePreview");
        preview.src = product.image;
        preview.classList.add("show");

        document.getElementById("editProductError").textContent = "";
        document.getElementById("editProductOverlay").classList.add("show");
    }

    function closeEditProductModal() {
        document.getElementById("editProductOverlay").classList.remove("show");
        currentEditProductId = null;
    }

    function handleEditProductImageSelected(event) {
        var file = event.target.files && event.target.files[0];
        if (!file) return;

        resizeImageToDataUrl(file, 1024, 1536, function (dataUrl) {
            editProductImageDataUrl = dataUrl;
            var preview = document.getElementById("editProductImagePreview");
            preview.src = editProductImageDataUrl;
            preview.classList.add("show");
        });
    }

    function submitEditProduct(event) {
        if (event) event.preventDefault();

        if (!isOwnerLoggedIn() || !currentEditProductId) {
            closeEditProductModal();
            openAuthModal();
            return false;
        }

        var productId = currentEditProductId;
        var existing = PRODUCTS[productId];
        if (!existing) {
            closeEditProductModal();
            return false;
        }

        var errorEl = document.getElementById("editProductError");

        var name = document.getElementById("editProductName").value.trim();
        var category = document.getElementById("editProductCategory").value.trim();
        var priceRaw = document.getElementById("editProductPrice").value;
        var price = parseFloat(priceRaw);
        var description = document.getElementById("editProductDescription").value.trim();
        var noSize = document.getElementById("editProductNoSize").checked;
        var sizesRaw = noSize ? NO_SIZE_LABEL : document.getElementById("editProductSizes").value.trim();
        var sizes = noSize ? [NO_SIZE_LABEL] : sizesRaw.split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
        var stockRaw = document.getElementById("editProductStock").value;
        var stock = parseInt(stockRaw, 10);

        if (!name) {
            errorEl.textContent = "Please enter a product name.";
            return false;
        }
        if (!category) {
            errorEl.textContent = "Please enter a category.";
            return false;
        }
        if (!priceRaw || isNaN(price) || price < 0) {
            errorEl.textContent = "Please enter a valid price.";
            return false;
        }
        if (!description) {
            errorEl.textContent = "Please enter a description.";
            return false;
        }
        if (sizes.length === 0) {
            errorEl.textContent = "Please list at least one size.";
            return false;
        }
        if (stockRaw === "" || isNaN(stock) || stock < 0) {
            errorEl.textContent = "Please enter a valid stock quantity.";
            return false;
        }

        var discountEnabled = document.getElementById("editProductDiscountToggle").checked;
        var discount = null;
        if (discountEnabled) {
            var discountPercentRaw = document.getElementById("editProductDiscountPercent").value;
            var discountPercent = parseFloat(discountPercentRaw);
            var discountExpiryRaw = document.getElementById("editProductDiscountExpiry").value;

            if (discountPercentRaw === "" || isNaN(discountPercent) || discountPercent < 1 || discountPercent > 101) {
                errorEl.textContent = "Please enter a discount percent between 1 and 101.";
                return false;
            }
            if (!discountExpiryRaw) {
                errorEl.textContent = "Please set an expiry date for the discount.";
                return false;
            }

            discount = {
                percent: discountPercent,
                expiresAt: new Date(discountExpiryRaw + "T23:59:59").getTime()
            };
        }

        if (galleryTooLarge(editProductExtraImages)) {
            errorEl.textContent = "The extra photos are too large together. Remove one or two.";
            return false;
        }
        var newGender = normGender(document.getElementById("editProductGender").value) || normGender(existing.gender);
        var sizeChartRes = readSizeChartFromForm("edit");
        if (sizeChartRes.error) {
            errorEl.textContent = sizeChartRes.error;
            return false;
        }

        var updatedProduct = {
            id: productId,
            name: name,
            category: category,
            price: price,
            image: editProductImageDataUrl || existing.image,
            description: description,
            sizes: sizes,
            stock: stock,
            discount: discount,
            gender: newGender,
            sizeChartMode: sizeChartRes.mode,
            sizeChart: sizeChartRes.chart,
            galleryCount: editGalleryLoaded ? editProductExtraImages.length : (existing.galleryCount || 0),
            createdAt: (typeof existing.createdAt === "number") ? existing.createdAt : null
        };

        if (productTooLarge(updatedProduct)) {
            errorEl.textContent = "That photo is too large to save. Please use a smaller image.";
            return false;
        }
        _cloud.products[productId] = updatedProduct;
        PRODUCTS[productId] = updatedProduct;
        if (editGalleryLoaded) saveProductGallery(productId, editProductExtraImages);
        persistProduct(productId, false);

        errorEl.textContent = "";
        closeEditProductModal();
        renderProductGrid();

        if (currentProductId === productId && document.getElementById("productOverlay").classList.contains("show")) {
            openProductDetail(productId);
        }

        return false;
    }

    function removeProductFromEdit() {
        if (!currentEditProductId) return;
        var productId = currentEditProductId;

        showConfirmModal("Remove this product from the shop?", function () {
            delete _cloud.products[productId];
            delete PRODUCTS[productId];
            deleteProductGallery(productId);

            if (!_cloud.deletedDefaults) _cloud.deletedDefaults = [];
            if (_cloud.deletedDefaults.indexOf(productId) === -1) {
                _cloud.deletedDefaults.push(productId);
            }

            persistProductRemoval(productId);

            closeEditProductModal();
            renderProductGrid();
        }, { title: "Remove Product", okText: "Remove" });
    }

    var currentProfileViewEmail = null;

    function openUserProfileView(email, fallbackName, event) {
        if (event) event.stopPropagation();
        var viewer = getCurrentUser();
        if (!viewer) return;

        currentProfileViewEmail = email || null;

        var users = getUsers();
        var found = email ? users.find(function (u) { return u.email === email; }) : null;

        var name = found ? found.name : (fallbackName || "Unknown");
        var initials = name.trim().charAt(0).toUpperCase() || "?";

        var avatarEl = document.getElementById("userProfileViewAvatar");
        var avatarInner = (found && found.avatar) ? ('<img src="' + found.avatar + '" alt="">') : escapeHtml(initials);
        var dotHtml = found
            ? ('<span class="presence-dot presence-dot-lg' + (isUserOnline(found.email) ? ' online' : '') + '"></span>')
            : "";
        avatarEl.innerHTML = avatarInner + dotHtml;

        document.getElementById("userProfileViewName").textContent = name;
        document.getElementById("userProfileViewUsername").textContent = (found && found.username) ? found.username : "";

        var roleWrap = document.getElementById("userProfileViewRoleWrap");
        var roleHtml = "";
        if (found && found.isOwner) {
            roleHtml = '<span class="user-profile-view-role">Owner</span>';
        } else if (found && found.isSeller) {
            roleHtml = '<span class="user-profile-view-role role-seller">Seller</span>';
        } else if (found && found.role) {
            roleHtml = '<span class="user-profile-view-role">' + escapeHtml(found.role) + '</span>';
        }
        roleWrap.innerHTML = roleHtml || (found ? "" : '<p class="user-profile-view-empty">No account info available.</p>');

        var msgWrap = document.getElementById("userProfileViewMessageWrap");
        if (found && found.email !== viewer.email) {
            msgWrap.innerHTML =
                '<div class="message-user-btn-wrap">' +
                    '<button type="button" class="message-user-btn" onclick="openDirectMessage(\'' + escapeHtml(found.email) + '\', \'' + escapeHtml(found.name || "") + '\')">Message</button>' +
                '</div>';
        } else {
            msgWrap.innerHTML = "";
        }

        var toggleWrap = document.getElementById("userProfileViewSellerToggleWrap");
        toggleWrap.innerHTML = "";

        document.getElementById("userProfileViewOverlay").classList.add("show");
    }

    function closeUserProfileView() {
        document.getElementById("userProfileViewOverlay").classList.remove("show");
        currentProfileViewEmail = null;
    }

    renderAccount();

    var currentProductId = null;
    var currentReviewStars = 0;
    var commentPhotoDataUrl = "";

    function handleCommentPhoto(input) {
        if (!input.files || !input.files[0]) return;

        readImageAsResizedDataUrl(input.files[0], 900, 0.7, function (dataUrl) {
            commentPhotoDataUrl = dataUrl;
            document.getElementById("reviewPhotoPreview").src = commentPhotoDataUrl;
            document.getElementById("reviewPhotoPreviewWrap").style.display = "inline-block";
        }, function () {
            alert("Couldn't read that image. Please try a different photo.");
        });
    }

    function removeCommentPhoto() {
        commentPhotoDataUrl = "";
        document.getElementById("reviewPhotoPreview").src = "";
        document.getElementById("reviewPhotoPreviewWrap").style.display = "none";
    }

    function openImgZoom(src) {
        document.getElementById("imgZoomImg").src = src;
        document.getElementById("imgZoomOverlay").classList.add("show");
    }

    function closeImgZoom() {
        document.getElementById("imgZoomOverlay").classList.remove("show");
    }

    function escapeHtml(str) {
        var div = document.createElement("div");
        div.textContent = str == null ? "" : str;
        return div.innerHTML;
    }

    function codDetailsHtml(details) {
        details = details || {};
        var html = "";

        html += '<strong>Name:</strong> ' + escapeHtml(details.name) + '<br>';
        html += '<strong>Phone:</strong> ' + escapeHtml(details.phone) + '<br>';

        if (details.lat != null && details.lng != null) {
            var mapsUrl = "https://www.google.com/maps?q=" + details.lat + "," + details.lng;
            html +=
                '<strong>Delivery Location:</strong> ' + escapeHtml(details.address || (details.lat.toFixed(5) + ", " + details.lng.toFixed(5))) + '<br>' +
                '<a href="' + mapsUrl + '" target="_blank" rel="noopener" class="order-map-link"><i class="fa-solid fa-location-dot"></i> View Location on Map</a><br>';
        } else if (details.address) {
            html += '<strong>Address:</strong> ' + escapeHtml(details.address) + '<br>';
        }

        return html;
    }

    var COMMENT_COOLDOWN_MS = 10000;

    function getReviews(productId) {
        return _cloud.reviews[productId] || [];
    }

    function getUserReview(productId, email) {
        if (!email) return null;
        return getReviews(productId).find(function (r) { return r.email === email; }) || null;
    }

    
    
    
    function saveReview(productId, review) {
        if (!_cloud.reviews[productId]) _cloud.reviews[productId] = [];

        var list = _cloud.reviews[productId];
        var existingIndex = -1;
        for (var i = 0; i < list.length; i++) {
            if (list[i].email && list[i].email === review.email) { existingIndex = i; break; }
        }

        if (existingIndex !== -1) {
            list[existingIndex] = review;
        } else {
            list.push(review);
        }

        db.collection("cvspee").doc("reviews").set({ map: _cloud.reviews }).catch(function (err) {
            console.error("Failed to save review", err);
        });
    }

    function getComments(productId) {
        return _cloud.comments[productId] || [];
    }

    
    
    
    function saveComment(productId, comment) {
        if (!_cloud.comments[productId]) _cloud.comments[productId] = [];
        _cloud.comments[productId].push(comment);
        db.collection("cvspee").doc("comments").set({ map: _cloud.comments }).catch(function (err) {
            console.error("Failed to save comment", err);
            alert("Something went wrong posting this. Please check your connection and try again.");
        });
    }

    function lastCommentTsFor(email) {
        if (!email) return 0;
        var v = localStorage.getItem("cvspee_lastComment_" + email);
        return v ? parseInt(v, 10) : 0;
    }

    function setLastCommentTsFor(email) {
        if (!email) return;
        localStorage.setItem("cvspee_lastComment_" + email, String(Date.now()));
    }

    function commentCooldownRemainingMs(email) {
        if (!email) return 0;
        var remaining = COMMENT_COOLDOWN_MS - (Date.now() - lastCommentTsFor(email));
        return remaining > 0 ? remaining : 0;
    }

    function getAverageRating(productId) {
        var reviews = getReviews(productId);
        if (reviews.length === 0) return 0;
        var sum = reviews.reduce(function (acc, r) { return acc + r.rating; }, 0);
        return sum / reviews.length;
    }

    function starsHtml(avg) {
        var rounded = Math.round(avg);
        var html = "";
        for (var i = 1; i <= 5; i++) {
            html += i <= rounded ? "★" : "☆";
        }
        return html;
    }

    function renderAllProductRatings() {
        Object.keys(PRODUCTS).forEach(function (id) {
            var el = document.getElementById("rating-" + id);
            if (!el) return;
            el.innerHTML = "<h2>" + starsHtml(getAverageRating(id)) + "</h2>";
        });
    }

    var PRODUCT_GENDERS = ["Male", "Female", "Unisex"];
    var GALLERY_MAX_EXTRAS = 5;
    var activeGenderFilter = null;
    var _galleryCache = {};
    var newProductExtraImages = [];
    var editProductExtraImages = [];
    var editGalleryLoaded = false;

    function normGender(g) {
        return (g === "Male" || g === "Female" || g === "Unisex") ? g : "";
    }

    function productMatchesGender(product) {
        if (!activeGenderFilter) return true;
        var g = normGender(product.gender);
        return !g || g === "Unisex" || g === activeGenderFilter;
    }

    function setGenderFilter(g) {
        activeGenderFilter = g;
        currentProductPage = 1;
        renderProductGrid();
    }

    function galleryRef(productId) {
        return db.collection("cvspee").doc("productGallery").collection("items").doc(productId);
    }

    function loadGallery(productId, cb) {
        var p = PRODUCTS[productId];
        if (!p || !p.galleryCount) { cb([]); return; }
        if (_galleryCache[productId]) { cb(_galleryCache[productId]); return; }
        galleryRef(productId).get().then(function (d) {
            var imgs = [];
            if (d.exists && Array.isArray(d.data().images)) {
                imgs = d.data().images.filter(function (s) { return !!hsSafeSrc(s); }).slice(0, GALLERY_MAX_EXTRAS);
            }
            _galleryCache[productId] = imgs;
            cb(imgs);
        }).catch(function () { cb([]); });
    }

    function galleryTooLarge(images) {
        return JSON.stringify(images).length > 900000;
    }

    function saveProductGallery(productId, images) {
        _galleryCache[productId] = images.slice();
        var ref = galleryRef(productId);
        if (images.length) {
            ref.set({ images: images, updatedAt: Date.now() }).catch(function (e) {
                console.error("gallery save failed", e);
                alert("The extra photos could not be saved (" + ((e && e.code) || "error") + "). If it says permission-denied, your Firestore rules need to allow the cvspee/productGallery collection.");
            });
        } else {
            ref.delete().catch(function () {});
        }
    }

    function deleteProductGallery(productId) {
        delete _galleryCache[productId];
        try { galleryRef(productId).delete().catch(function () {}); } catch (e) {}
    }

    var _pdG = { images: [], index: 0, timer: null, productId: null, hover: false };

    function pdGalleryStop() {
        clearInterval(_pdG.timer);
        _pdG.timer = null;
    }

    function pdGalleryRender(fade) {
        var g = document.getElementById("pdGallery");
        var img = document.getElementById("pdImage");
        var dots = document.getElementById("pdGalleryDots");
        var p = PRODUCTS[_pdG.productId];
        g.classList.toggle("multi", _pdG.images.length > 1);
        img.alt = p ? p.name : "";

        var src = _pdG.images[_pdG.index] || "";
        if (fade && img.getAttribute("src") !== src) {
            img.style.opacity = "0";
            setTimeout(function () { img.src = src; img.style.opacity = "1"; }, 140);
        } else {
            img.style.opacity = "1";
            img.src = src;
        }

        dots.innerHTML = "";
        if (_pdG.images.length > 1) {
            _pdG.images.forEach(function (_, i) {
                var d = document.createElement("button");
                d.type = "button";
                d.className = "pd-g-dot" + (i === _pdG.index ? " active" : "");
                d.setAttribute("aria-label", "Photo " + (i + 1));
                d.onclick = function (e) { e.stopPropagation(); pdGalleryGo(i); };
                dots.appendChild(d);
            });
        }
    }

    function pdGalleryAuto() {
        pdGalleryStop();
        if (_pdG.images.length < 2) return;
        _pdG.timer = setInterval(function () {
            if (!_pdG.hover && document.getElementById("productOverlay").classList.contains("show")) pdGalleryStep(1, true);
        }, 4000);
    }

    function pdGalleryGo(i) {
        var n = _pdG.images.length;
        if (!n) return;
        _pdG.index = (i + n) % n;
        pdGalleryRender(true);
        pdGalleryAuto();
    }

    function pdGalleryStep(dir, auto) {
        var n = _pdG.images.length;
        if (n < 2) return;
        _pdG.index = (_pdG.index + dir + n) % n;
        pdGalleryRender(true);
        if (!auto) pdGalleryAuto();
    }

    function pdGalleryStart(productId) {
        pdGalleryStop();
        var p = PRODUCTS[productId];
        if (!p) return;
        _pdG.productId = productId;
        _pdG.images = [p.image];
        _pdG.index = 0;
        pdGalleryRender(false);
        loadGallery(productId, function (extras) {
            if (_pdG.productId !== productId || !extras.length) return;
            _pdG.images = [p.image].concat(extras);
            extras.forEach(function (s) { var pre = new Image(); pre.src = s; });
            pdGalleryRender(false);
            pdGalleryAuto();
        });
    }

    (function pdGalleryInit() {
        var g = document.getElementById("pdGallery");
        if (!g) return;
        g.addEventListener("mouseenter", function () { _pdG.hover = true; });
        g.addEventListener("mouseleave", function () { _pdG.hover = false; });
        var sx = null;
        g.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
        g.addEventListener("touchend", function (e) {
            if (sx === null) return;
            var dx = e.changedTouches[0].clientX - sx;
            sx = null;
            if (Math.abs(dx) > 40) pdGalleryStep(dx < 0 ? 1 : -1, false);
        }, { passive: true });
    })();

    function pdSetGender(product) {
        var el = document.getElementById("pdGender");
        var g = normGender(product.gender);
        if (!g) { el.style.display = "none"; el.textContent = ""; return; }
        el.textContent = g;
        el.style.display = "inline-block";
    }

    function renderExtraThumbs(prefix) {
        var list = prefix === "new" ? newProductExtraImages : editProductExtraImages;
        var box = document.getElementById(prefix + "ProductExtraThumbs");
        if (!box) return;
        box.innerHTML = "";
        list.forEach(function (src, i) {
            var t = document.createElement("div");
            t.className = "extra-thumb";
            var im = document.createElement("img");
            im.alt = "Extra photo " + (i + 1);
            im.src = src;
            var b = document.createElement("button");
            b.type = "button";
            b.title = "Remove photo";
            b.textContent = "\u00D7";
            b.onclick = function () { removeExtraImage(prefix, i); };
            t.appendChild(im);
            t.appendChild(b);
            box.appendChild(t);
        });
    }

    function removeExtraImage(prefix, i) {
        var list = prefix === "new" ? newProductExtraImages : editProductExtraImages;
        list.splice(i, 1);
        renderExtraThumbs(prefix);
    }

    function handleExtraImagesSelected(prefix, input) {
        var list = prefix === "new" ? newProductExtraImages : editProductExtraImages;
        var err = document.getElementById(prefix === "new" ? "addProductError" : "editProductError");
        var files = Array.prototype.slice.call(input.files || []);
        err.textContent = "";
        var room = GALLERY_MAX_EXTRAS - list.length;
        if (room <= 0) {
            err.textContent = "You can add up to " + GALLERY_MAX_EXTRAS + " extra photos per product.";
            input.value = "";
            return;
        }
        if (files.length > room) {
            err.textContent = "Only " + room + " more photo" + (room === 1 ? "" : "s") + " can be added (max " + GALLERY_MAX_EXTRAS + " extra).";
            files = files.slice(0, room);
        }
        var i = 0;
        (function next() {
            if (i >= files.length) { input.value = ""; renderExtraThumbs(prefix); return; }
            var f = files[i++];
            resizeImageToDataUrl(f, 720, 1080, function (dataUrl) {
                list.push(dataUrl);
                renderExtraThumbs(prefix);
                next();
            });
        })();
    }


    var SIZE_CHART_PRESETS = {
        tshirt: {
            label: "T-Shirt & Shorts (Unisex)",
            title: "T-Shirt & Shorts Size Chart (Unisex)",
            tables: [
                {
                    tab: "Asian Fit",
                    title: "Asian Sizes (Standard Fit in the Philippines / Asia)",
                    headers: ["Size", "Chest / Width (Inches)", "T-Shirt Length (Inches)", "Waistline (Inches)", "Shorts Length (Inches)"],
                    rows: [
                        ["S", "18\" (46 cm)", "26\" (66 cm)", "26\" \u2013 28\"", "15\" (38 cm)"],
                        ["M", "19\" (48 cm)", "27\" (69 cm)", "29\" \u2013 31\"", "16\" (41 cm)"],
                        ["L", "20\" (51 cm)", "28\" (71 cm)", "32\" \u2013 34\"", "17\" (43 cm)"],
                        ["XL", "21\" (53 cm)", "29\" (74 cm)", "35\" \u2013 37\"", "18\" (46 cm)"],
                        ["2XL", "22\" (56 cm)", "30\" (76 cm)", "38\" \u2013 40\"", "19\" (48 cm)"]
                    ]
                },
                {
                    tab: "US / Oversized",
                    title: "American / US Sizes (Oversized / Loose Fit)",
                    headers: ["Size", "Chest / Width (Inches)", "T-Shirt Length (Inches)", "Waistline (Inches)", "Recommended Fit Comparison"],
                    rows: [
                        ["XS", "18\" (46 cm)", "27\" (69 cm)", "28\" \u2013 30\"", "Fits like Asian S"],
                        ["S", "20\" (51 cm)", "28\" (71 cm)", "30\" \u2013 32\"", "Fits like Asian M"],
                        ["M", "22\" (56 cm)", "29\" (74 cm)", "32\" \u2013 34\"", "Fits like Asian L"],
                        ["L", "24\" (61 cm)", "30\" (76 cm)", "35\" \u2013 37\"", "Fits like Asian XL"],
                        ["XL", "26\" (66 cm)", "31\" (79 cm)", "38\" \u2013 40\"", "Fits like Asian 2XL"],
                        ["2XL", "28\" (71 cm)", "32\" (81 cm)", "41\" \u2013 43\"", "Fits like Asian 3XL"]
                    ]
                }
            ]
        },
        shoes: {
            label: "Shoes",
            title: "Shoe Size Conversion Chart",
            tables: [
                {
                    tab: "Men's",
                    title: "Men's Shoes",
                    headers: ["US / American", "EU / Asian Standard", "UK", "Foot Length (CM / Inches)"],
                    rows: [
                        ["US 7", "EU 40", "UK 6.5", "25.0 cm (9.8\")"],
                        ["US 8", "EU 41", "UK 7.5", "26.0 cm (10.2\")"],
                        ["US 9", "EU 42.5", "UK 8.5", "27.0 cm (10.6\")"],
                        ["US 10", "EU 44", "UK 9.5", "28.0 cm (11.0\")"],
                        ["US 11", "EU 45", "UK 10.5", "29.0 cm (11.4\")"]
                    ]
                },
                {
                    tab: "Women's",
                    title: "Women's Shoes",
                    headers: ["US / American", "EU / Asian Standard", "UK", "Foot Length (CM / Inches)"],
                    rows: [
                        ["US 5", "EU 35.5", "UK 3", "22.0 cm (8.6\")"],
                        ["US 6", "EU 36.5", "UK 4", "23.0 cm (9.0\")"],
                        ["US 7", "EU 37.5", "UK 5", "24.0 cm (9.4\")"],
                        ["US 8", "EU 38.5", "UK 6", "25.0 cm (9.8\")"],
                        ["US 9", "EU 40", "UK 7", "26.0 cm (10.2\")"]
                    ]
                }
            ]
        }
    };


    SIZE_CHART_PRESETS.polo = {
        label: "Polo / Blouse (Uniform)",
        title: "Polo & Blouse Size Chart (Uniform)",
        tables: [
            {
                tab: "Male",
                title: "Male Polo / Uniform (Inches)",
                headers: ["Size", "Chest / Width", "Shoulder", "Sleeve Length", "Shirt Length"],
                rows: [
                    ["S", "19\"", "16.5\"", "8\"", "26\""],
                    ["M", "20\"", "17.5\"", "8.5\"", "27\""],
                    ["L", "21\"", "18.5\"", "9\"", "28\""],
                    ["XL", "22\"", "19.5\"", "9.5\"", "29\""],
                    ["2XL", "23\"", "20.5\"", "10\"", "30\""]
                ]
            },
            {
                tab: "Female",
                title: "Female Blouse / Uniform (Inches)",
                headers: ["Size", "Chest / Width", "Shoulder", "Sleeve Length", "Blouse Length"],
                rows: [
                    ["S", "17\"", "14.5\"", "7\"", "24\""],
                    ["M", "18\"", "15\"", "7.5\"", "25\""],
                    ["L", "19\"", "15.5\"", "8\"", "26\""],
                    ["XL", "20\"", "16\"", "8.5\"", "27\""],
                    ["2XL", "21\"", "16.5\"", "9\"", "28\""]
                ]
            }
        ],
        note: "Standard size guide. Measurements are approximate and may vary by about 1 inch."
    };

    SIZE_CHART_PRESETS.pants = {
        label: "Pants / Slacks",
        title: "Pants & Slacks Size Chart (Unisex)",
        tables: [
            {
                tab: "",
                title: "Pants / Slacks (Inches)",
                headers: ["Size", "Waistline", "Hip", "Inseam", "Pants Length"],
                rows: [
                    ["S", "26\" \u2013 28\"", "34\" \u2013 36\"", "29\"", "38\""],
                    ["M", "29\" \u2013 31\"", "37\" \u2013 39\"", "30\"", "39\""],
                    ["L", "32\" \u2013 34\"", "40\" \u2013 42\"", "30\"", "40\""],
                    ["XL", "35\" \u2013 37\"", "43\" \u2013 45\"", "31\"", "41\""],
                    ["2XL", "38\" \u2013 40\"", "46\" \u2013 48\"", "31\"", "42\""]
                ]
            }
        ],
        note: "Standard size guide. Measurements are approximate and may vary by about 1 inch."
    };

    SIZE_CHART_PRESETS.skirt = {
        label: "Skirt",
        title: "Skirt Size Chart",
        tables: [
            {
                tab: "",
                title: "Skirt (Inches)",
                headers: ["Size", "Waistline", "Hip", "Skirt Length"],
                rows: [
                    ["S", "24\" \u2013 26\"", "34\" \u2013 36\"", "20\""],
                    ["M", "26\" \u2013 28\"", "36\" \u2013 38\"", "21\""],
                    ["L", "28\" \u2013 30\"", "38\" \u2013 40\"", "22\""],
                    ["XL", "30\" \u2013 32\"", "40\" \u2013 42\"", "22\""],
                    ["2XL", "32\" \u2013 34\"", "42\" \u2013 44\"", "23\""]
                ]
            }
        ],
        note: "Standard size guide. Measurements are approximate and may vary by about 1 inch."
    };

    SIZE_CHART_PRESETS.jacket = {
        label: "Jacket / Tracksuit / Hoodie",
        title: "Jacket, Tracksuit & Hoodie Size Chart (Unisex)",
        tables: [
            {
                tab: "",
                title: "Jacket / Tracksuit Top (Inches)",
                headers: ["Size", "Chest / Width", "Shoulder", "Sleeve Length", "Jacket Length"],
                rows: [
                    ["S", "21\"", "17.5\"", "24\"", "26\""],
                    ["M", "22\"", "18.5\"", "25\"", "27\""],
                    ["L", "23\"", "19.5\"", "25.5\"", "28\""],
                    ["XL", "24\"", "20.5\"", "26\"", "29\""],
                    ["2XL", "25\"", "21.5\"", "26.5\"", "30\""]
                ]
            }
        ],
        note: "Standard size guide. Measurements are approximate and may vary by about 1 inch."
    };

    SIZE_CHART_PRESETS.socks = {
        label: "Socks",
        title: "Socks Size Chart",
        tables: [
            {
                tab: "",
                title: "Socks (matches your shoe size)",
                headers: ["Size", "Foot Length (CM)", "EU / Asian Standard", "Fits Shoe Size"],
                rows: [
                    ["S", "22.0 \u2013 24.0 cm", "EU 35.5 \u2013 37.5", "Women's US 5 \u2013 7"],
                    ["M", "24.0 \u2013 26.0 cm", "EU 37.5 \u2013 40", "Women's US 7 \u2013 9 / Men's US 7"],
                    ["L", "26.0 \u2013 29.0 cm", "EU 40 \u2013 45", "Men's US 8 \u2013 11"]
                ]
            }
        ],
        note: "Standard size guide. Measurements are approximate and may vary by about 1 inch."
    };

    var SIZECHART_MODES = [
        { value: "auto", label: "Automatic (based on the product's category / name)" },
        { value: "tshirt", label: "T-Shirt & Shorts chart" },
        { value: "shoes", label: "Shoe size chart" },
        { value: "none", label: "No size chart" },
        { value: "custom", label: "Custom (I will type my own)" }
    ];

    var SIZECHART_MAX_COLS = 8;
    var SIZECHART_MAX_ROWS = 20;
    var SIZECHART_MAX_CELL = 24;
    var SIZECHART_EXAMPLE = "Size, Chest (in), Length (in)\nS, 36, 26\nM, 38, 27\nL, 40, 28\nXL, 42, 29";

    function detectSizeChartKind(name, category, sizes) {
        if (Array.isArray(sizes) && sizes.length === 1 && /one\s*size/i.test(String(sizes[0]))) return "";
        var n = String(name || "").toLowerCase();
        var all = (String(category || "") + " " + n).toLowerCase();

        if (/shoe|footwear|sneaker|sandal|slipper|boots?\b|loafer/.test(all)) return "shoes";
        if (/sock|medyas/.test(n)) return "socks";
        if (/pants|trouser|slacks|jogger/.test(n)) return "pants";
        if (/skirt|palda/.test(n)) return "skirt";
        if (/jacket|hoodie|tracksuit|track\s*suit|windbreaker|sweater/.test(n)) return "jacket";
        if (/shorts|t-?shirt|\btee\b|jersey|\bpe\b/.test(n)) return "tshirt";
        if (/polo|blouse|uniform|shirt/.test(all)) return "polo";
        if (/apparel|clothing/.test(all)) return "tshirt";
        return "";
    }

    function scRows(chart) {
        return (chart && Array.isArray(chart.rows) ? chart.rows : []).map(function (r) {
            return Array.isArray(r) ? r : (r && Array.isArray(r.c) ? r.c : []);
        });
    }

    function resolveSizeChart(product) {
        if (!product) return null;
        var mode = product.sizeChartMode || "auto";
        if (mode === "none") return null;

        if (mode === "custom") {
            var c = product.sizeChart;
            if (!c || !Array.isArray(c.headers) || !c.headers.length || !scRows(c).length) return null;
            return { title: "", tables: [{ tab: "", title: "", headers: c.headers, rows: scRows(c) }], note: c.note || "" };
        }

        var kind = mode;
        if (mode === "auto") kind = detectSizeChartKind(product.name, product.category, product.sizes);
        var preset = SIZE_CHART_PRESETS[kind];
        return preset ? { title: preset.title, tables: preset.tables, note: preset.note || "", kind: kind } : null;
    }

    function buildSizeChartTable(headers, rows) {
        var wrap = document.createElement("div");
        wrap.className = "pd-sizechart-scroll";
        var table = document.createElement("table");
        table.className = "sizechart-table";
        var thead = document.createElement("thead");
        var hr = document.createElement("tr");
        headers.forEach(function (h) {
            var th = document.createElement("th");
            th.textContent = h;
            hr.appendChild(th);
        });
        thead.appendChild(hr);
        table.appendChild(thead);
        var tbody = document.createElement("tbody");
        rows.forEach(function (r) {
            var tr = document.createElement("tr");
            headers.forEach(function (_, i) {
                var td = document.createElement("td");
                td.textContent = (r[i] === undefined || r[i] === null) ? "" : String(r[i]);
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        wrap.appendChild(table);
        return wrap;
    }

    function renderSizeChartInto(box, chart, preferredTab, showHeading) {
        box.innerHTML = "";
        if (!chart) return;

        if (showHeading) {
            var heading = document.createElement("div");
            heading.className = "pd-sizechart-title";
            heading.textContent = chart.title || "Size Chart";
            box.appendChild(heading);
        }

        var tabsEl = null;
        var holder = document.createElement("div");
        var current = Math.min(Math.max(preferredTab || 0, 0), chart.tables.length - 1);

        function show(i) {
            current = i;
            holder.innerHTML = "";
            var t = chart.tables[i];
            if (t.title) {
                var sub = document.createElement("div");
                sub.className = "sc-subtitle";
                sub.textContent = t.title;
                holder.appendChild(sub);
            }
            holder.appendChild(buildSizeChartTable(t.headers, t.rows));
            if (tabsEl) {
                for (var k = 0; k < tabsEl.children.length; k++) tabsEl.children[k].classList.toggle("active", k === i);
            }
        }

        if (chart.tables.length > 1) {
            tabsEl = document.createElement("div");
            tabsEl.className = "sc-tabs";
            chart.tables.forEach(function (t, i) {
                var b = document.createElement("button");
                b.type = "button";
                b.className = "sc-tab";
                b.textContent = t.tab || ("Table " + (i + 1));
                b.onclick = function () { show(i); };
                tabsEl.appendChild(b);
            });
            box.appendChild(tabsEl);
        }
        box.appendChild(holder);
        show(current);

        if (chart.note) {
            var note = document.createElement("div");
            note.className = "pd-sizechart-note";
            note.textContent = chart.note;
            box.appendChild(note);
        }
    }

    function pdRenderSizeChart(product) {
        var box = document.getElementById("pdSizeChart");
        if (!box) return;
        var chart = resolveSizeChart(product);
        if (!chart) { box.innerHTML = ""; box.style.display = "none"; return; }

        var tab = 0;
        if ((chart.kind === "shoes" || chart.kind === "polo") && product.gender === "Female") tab = 1;
        renderSizeChartInto(box, chart, tab, true);
        box.style.display = "";
    }

    function parseSizeChartText(text, note) {
        var lines = String(text || "").split(/\r?\n/).map(function (l) { return l.trim(); }).filter(function (l) { return l !== ""; });
        if (!lines.length) return { chart: null, error: "" };

        function cells(line) {
            var parts = line.indexOf("\t") !== -1 ? line.split("\t") : line.split(",");
            return parts.map(function (c) { return c.trim().slice(0, SIZECHART_MAX_CELL); });
        }

        var headers = cells(lines[0]);
        if (headers.length < 2) return { chart: null, error: "Size chart: put at least 2 columns on the first line (e.g. Size, Chest)." };
        if (headers.length > SIZECHART_MAX_COLS) return { chart: null, error: "Size chart: up to " + SIZECHART_MAX_COLS + " columns only." };
        if (lines.length < 2) return { chart: null, error: "Size chart: add at least one row under the column names." };
        if (lines.length - 1 > SIZECHART_MAX_ROWS) return { chart: null, error: "Size chart: up to " + SIZECHART_MAX_ROWS + " rows only." };

        var rows = [];
        for (var i = 1; i < lines.length; i++) {
            var r = cells(lines[i]);
            if (r.length > headers.length) return { chart: null, error: "Size chart: row " + i + " has more values than column names." };
            while (r.length < headers.length) r.push("");
            rows.push({ c: r });
        }
        return { chart: { headers: headers, rows: rows, note: String(note || "").trim().slice(0, 120) }, error: "" };
    }

    function sizeChartToText(chart) {
        if (!chart || !Array.isArray(chart.headers)) return "";
        var out = [chart.headers.join(", ")];
        scRows(chart).forEach(function (r) { out.push(r.join(", ")); });
        return out.join("\n");
    }

    function sizeChartModeOf(which) {
        return document.getElementById(which + "SizeChartMode").value || "auto";
    }

    function sizeChartFormUpdate(which) {
        var mode = sizeChartModeOf(which);
        document.getElementById(which + "SizeChartCustom").style.display = (mode === "custom") ? "" : "none";

        var info = document.getElementById(which + "SizeChartInfo");
        var preview = document.getElementById(which + "SizeChartPreview");
        preview.innerHTML = "";
        info.textContent = "";

        if (mode === "custom") {
            var res = parseSizeChartText(
                document.getElementById(which + "SizeChartText").value,
                document.getElementById(which + "SizeChartNote").value
            );
            if (res.error) {
                info.textContent = res.error;
                info.className = "sizechart-info sizechart-info-error";
            } else {
                info.className = "sizechart-info";
                info.textContent = res.chart ? "Preview:" : "Type your chart below (or press Insert example).";
                if (res.chart) preview.appendChild(buildSizeChartTable(res.chart.headers, scRows(res.chart)));
            }
            return;
        }

        info.className = "sizechart-info";
        if (mode === "none") { info.textContent = "No size chart will be shown for this product."; return; }

        var kind = mode;
        if (mode === "auto") {
            var sizesRaw = document.getElementById(which + "ProductNoSize").checked ? ["One Size"] : null;
            kind = detectSizeChartKind(
                document.getElementById(which + "ProductName").value,
                document.getElementById(which + "ProductCategory").value,
                sizesRaw
            );
            info.textContent = kind
                ? "Automatic: this product will show the " + SIZE_CHART_PRESETS[kind].label + " chart."
                : "Automatic: no size chart fits this product (customers will not see one).";
            return;
        }
        info.textContent = "This product will show the " + SIZE_CHART_PRESETS[kind].label + " chart.";
    }

    var _scFormTimer = null;
    function sizeChartFormUpdateSoon(which) {
        clearTimeout(_scFormTimer);
        _scFormTimer = setTimeout(function () { sizeChartFormUpdate(which); }, 250);
    }

    function insertSizeChartExample(which) {
        document.getElementById(which + "SizeChartText").value = SIZECHART_EXAMPLE;
        if (!document.getElementById(which + "SizeChartNote").value) {
            document.getElementById(which + "SizeChartNote").value = "All measurements are in inches.";
        }
        sizeChartFormUpdate(which);
    }

    function clearSizeChart(which) {
        document.getElementById(which + "SizeChartText").value = "";
        document.getElementById(which + "SizeChartNote").value = "";
        sizeChartFormUpdate(which);
    }

    function fillSizeChartForm(which, product) {
        var mode = (product && product.sizeChartMode) ? product.sizeChartMode : "auto";
        document.getElementById(which + "SizeChartMode").value = mode;
        var chart = product ? product.sizeChart : null;
        document.getElementById(which + "SizeChartText").value = sizeChartToText(chart);
        document.getElementById(which + "SizeChartNote").value = (chart && chart.note) ? chart.note : "";
        sizeChartFormUpdate(which);
    }

    function readSizeChartFromForm(which) {
        var mode = sizeChartModeOf(which);
        if (mode !== "custom") return { mode: mode, chart: null, error: "" };
        var res = parseSizeChartText(
            document.getElementById(which + "SizeChartText").value,
            document.getElementById(which + "SizeChartNote").value
        );
        if (res.error) return { mode: mode, chart: null, error: res.error };
        if (!res.chart) return { mode: mode, chart: null, error: "Size chart: type your custom chart, or choose another option." };
        return { mode: mode, chart: res.chart, error: "" };
    }

    function renderSizeGuidePage() {
        var host = document.getElementById("sizeGuideCharts");
        if (!host) return;
        host.innerHTML = "";
        ["polo", "tshirt", "pants", "skirt", "jacket", "socks", "shoes"].forEach(function (key) {
            var preset = SIZE_CHART_PRESETS[key];
            if (!preset) return;
            var block = document.createElement("div");
            block.className = "sizeguide-block";
            var h = document.createElement("h3");
            h.textContent = preset.title;
            block.appendChild(h);
            var box = document.createElement("div");
            renderSizeChartInto(box, { title: "", tables: preset.tables, note: preset.note || "" }, 0, false);
            block.appendChild(box);
            host.appendChild(block);
        });
    }
    renderSizeGuidePage();

    (function sizeChartFormEvents() {
        ["new", "edit"].forEach(function (which) {
            ["ProductName", "ProductCategory", "ProductNoSize"].forEach(function (suffix) {
                var el = document.getElementById(which + suffix);
                if (el) {
                    el.addEventListener("input", function () { sizeChartFormUpdateSoon(which); });
                    el.addEventListener("change", function () { sizeChartFormUpdateSoon(which); });
                }
            });
        });
    })();


    function openProductDetail(productId) {
        var product = PRODUCTS[productId];
        if (!product) return;

        currentProductId = productId;

        var stock = (typeof product.stock === "number") ? product.stock : 0;
        var inStock = stock > 0;

        pdGalleryStart(productId);
        pdSetGender(product);
        pdRenderSizeChart(product);
        document.getElementById("pdName").textContent = product.name;
        document.getElementById("pdPrice").innerHTML = priceDisplayHtml(product);

        var discountExpiryEl = document.getElementById("pdDiscountExpiry");
        var activeDiscount = getActiveDiscount(product);
        if (activeDiscount && activeDiscount.expiresAt) {
            discountExpiryEl.textContent = "Discount ends " + new Date(activeDiscount.expiresAt).toLocaleDateString();
            discountExpiryEl.style.display = "block";
        } else {
            discountExpiryEl.textContent = "";
            discountExpiryEl.style.display = "none";
        }

        document.getElementById("pdDescription").textContent = product.description;
        document.getElementById("pdQty").value = 1;
        document.getElementById("pdQty").max = inStock ? stock : 1;

        var stockEl = document.getElementById("pdStock");
        if (!inStock) {
            stockEl.textContent = "Out of Stock";
            stockEl.className = "product-detail-stock stock-out";
        } else if (stock <= 10) {
            stockEl.textContent = "Only " + stock + " left in stock";
            stockEl.className = "product-detail-stock stock-low";
        } else {
            stockEl.textContent = stock + " in stock";
            stockEl.className = "product-detail-stock stock-ok";
        }

        var loggedIn = !!getCurrentUser();
        document.getElementById("pdAddToCartBtn").disabled = !loggedIn || !inStock;
        document.getElementById("pdBuyNowBtn").disabled = !loggedIn || !inStock;
        document.getElementById("pdLoginNotice").style.display = (loggedIn || !inStock) ? "none" : "block";

        var pdWishlistBtn = document.getElementById("pdWishlistBtn");
        pdWishlistBtn.classList.toggle("active", isInWishlist(productId));

        renderProductReviews(productId);
        resetReviewForm();
        collapseCommentsSection();

        document.getElementById("productOverlay").classList.add("show");
    }

    function collapseCommentsSection() {
        document.getElementById("commentsBody").classList.remove("show");
        document.getElementById("commentsToggle").classList.remove("open");
    }

    function toggleCommentsSection() {
        document.getElementById("commentsBody").classList.toggle("show");
        document.getElementById("commentsToggle").classList.toggle("open");
    }

    function closeProductDetail() {
        pdGalleryStop();
        document.getElementById("productOverlay").classList.remove("show");
    }

    function changePdQty(delta) {
        var input = document.getElementById("pdQty");
        var product = PRODUCTS[currentProductId];
        var maxQty = (product && typeof product.stock === "number") ? product.stock : 999;
        var val = (parseInt(input.value, 10) || 1) + delta;
        input.value = Math.max(1, Math.min(val, Math.max(maxQty, 1)));
    }

    function renderProductReviews(productId) {
        var reviews = getReviews(productId);
        var avg = getAverageRating(productId);
        var comments = getComments(productId);

        document.getElementById("pdStars").innerHTML = "<h2>" + starsHtml(avg) + "</h2>";
        document.getElementById("pdRatingCount").textContent = reviews.length === 0
            ? "No ratings yet — be the first to rate!"
            : avg.toFixed(1) + " out of 5 (" + reviews.length + (reviews.length === 1 ? " rating" : " ratings") + ")";

        document.getElementById("commentsToggleLabel").textContent = "Comments " + comments.length;

        var listEl = document.getElementById("reviewsList");

        if (comments.length === 0) {
            listEl.innerHTML = '<p class="review-empty">No comments yet.</p>';
            return;
        }

        
        
        
        listEl.innerHTML = comments.slice().reverse().map(function (c) {
            var isAnon = !!c.anonymous;
            var displayName = isAnon ? "Anonymous" : c.name;
            var initials = (displayName || "?").trim().charAt(0).toUpperCase() || "?";
            var avatarHtml = (c.avatar && !isAnon)
                ? '<img src="' + c.avatar + '" class="review-item-avatar-img" alt="">'
                : '<div class="review-item-avatar-initials">' + escapeHtml(initials) + '</div>';

            var ownerCanView = isOwnerLoggedIn() && !isAnon;
            var userClickAttr = ownerCanView
                ? ' onclick="openUserProfileView(\'' + escapeHtml(c.email || "") + '\', \'' + escapeHtml(c.name || "") + '\')"'
                : '';

            var userRating = getUserReview(productId, c.email);
            var starsRowHtml = userRating ? '<div class="review-item-stars">' + starsHtml(userRating.rating) + '</div>' : '';

            var verifiedBadge = c.verified ? '<span class="review-item-verified">Verified Purchase</span>' : '';
            var photoHtml = c.photo
                ? '<img src="' + c.photo + '" class="review-item-photo" onclick="openImgZoom(\'' + c.photo.replace(/'/g, "\\'") + '\')" alt="Review photo">'
                : '';

            return (
                '<div class="review-item">' +
                    '<div class="review-item-head">' +
                        '<div class="review-item-user' + (ownerCanView ? ' review-item-user-clickable' : '') + '"' + userClickAttr + '>' +
                            avatarHtml +
                            '<span class="review-item-name">' + escapeHtml(displayName) + '</span>' +
                            verifiedBadge +
                        '</div>' +
                        '<span class="review-item-date">' + escapeHtml(c.date) + '</span>' +
                    '</div>' +
                    starsRowHtml +
                    (c.comment ? '<p class="review-item-comment">' + escapeHtml(c.comment) + '</p>' : '') +
                    photoHtml +
                '</div>'
            );
        }).join("");
    }

    function resetReviewForm() {
        var user = getCurrentUser();
        var whoEl = document.getElementById("reviewAsWho");
        var commentEl = document.getElementById("reviewComment");

        var existingRating = user ? getUserReview(currentProductId, user.email) : null;

        currentReviewStars = existingRating ? existingRating.rating : 0;
        updateStarInputDisplay();
        commentEl.value = "";
        removeCommentPhoto();
        document.getElementById("reviewError").textContent = "";

        if (user) {
            whoEl.style.display = "flex";
            var initials = user.name.trim().charAt(0).toUpperCase() || "?";
            document.getElementById("reviewAsAvatar").innerHTML = user.avatar
                ? '<img src="' + user.avatar + '" class="review-as-avatar-img" alt="">'
                : '<div class="review-as-avatar-initials">' + escapeHtml(initials) + '</div>';
            document.getElementById("reviewAsName").textContent = user.name;
        } else {
            whoEl.style.display = "none";
            document.getElementById("reviewError").textContent = "Sign in to leave a rating or comment.";
        }

        updateCommentSubmitState();
    }

    function updateStarInputDisplay() {
        document.querySelectorAll("#reviewStarInput span").forEach(function (span) {
            var starVal = parseInt(span.getAttribute("data-star"), 10);
            span.classList.toggle("filled", starVal <= currentReviewStars);
            span.textContent = starVal <= currentReviewStars ? "★" : "☆";
        });
    }

    
    
    
    document.querySelectorAll("#reviewStarInput span").forEach(function (span) {
        span.addEventListener("click", function () {
            if (!getCurrentUser()) {
                openAuthModal();
                return;
            }
            currentReviewStars = parseInt(this.getAttribute("data-star"), 10);
            updateStarInputDisplay();
            submitRating();
        });
    });

    function submitRating() {
        var user = getCurrentUser();
        if (!user || !currentProductId || currentReviewStars === 0) return;

        saveReview(currentProductId, {
            name: user.name,
            email: user.email,
            avatar: user.avatar || "",
            rating: currentReviewStars,
            date: new Date().toLocaleDateString()
        });

        renderProductReviews(currentProductId);
        renderAllProductRatings();
    }

    
    
    
    function updateCommentSubmitState() {
        var user = getCurrentUser();
        var submitBtn = document.querySelector(".review-form .auth-submit");
        var commentEl = document.getElementById("reviewComment");
        if (!submitBtn || !commentEl) return;

        if (!user) {
            commentEl.disabled = true;
            submitBtn.disabled = true;
            submitBtn.textContent = "Post Comment";
            return;
        }

        commentEl.disabled = false;

        var remaining = commentCooldownRemainingMs(user.email);
        if (remaining > 0) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Wait " + Math.ceil(remaining / 1000) + "s";
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = "Post Comment";
        }
    }

    setInterval(function () {
        var overlay = document.getElementById("productOverlay");
        if (overlay && overlay.classList.contains("show")) {
            updateCommentSubmitState();
        }
    }, 1000);

    function postComment() {
        var errorEl = document.getElementById("reviewError");
        var user = getCurrentUser();

        if (!user) {
            errorEl.textContent = "Please sign in to leave a rating or comment.";
            openAuthModal();
            return;
        }

        var commentEl = document.getElementById("reviewComment");
        var comment = commentEl.value.trim();

        if (!comment && !commentPhotoDataUrl) {
            errorEl.textContent = "Please write a comment or add a photo.";
            return;
        }

        var remaining = commentCooldownRemainingMs(user.email);
        if (remaining > 0) {
            errorEl.textContent = "Please wait " + Math.ceil(remaining / 1000) + "s before commenting again.";
            updateCommentSubmitState();
            return;
        }

        saveComment(currentProductId, {
            name: user.name,
            email: user.email,
            avatar: user.avatar || "",
            comment: comment,
            date: new Date().toLocaleDateString(),
            ts: Date.now(),
            photo: commentPhotoDataUrl || ""
        });

        setLastCommentTsFor(user.email);

        commentEl.value = "";
        removeCommentPhoto();
        errorEl.textContent = "";
        renderProductReviews(currentProductId);
        updateCommentSubmitState();
    }

    
    
    
    
    
    function cartStorageKey() {
        var user = getCurrentUser();
        return user ? ("cvspee_cart_" + user.email) : null;
    }

    
    
    
    function migrateLegacyCart() {
        var legacy = localStorage.getItem("cvspee_cart");
        if (legacy === null) return;

        var key = cartStorageKey();
        if (key && localStorage.getItem(key) === null) {
            localStorage.setItem(key, legacy);
        }
        localStorage.removeItem("cvspee_cart");
    }

    function getCart() {
        var key = cartStorageKey();
        if (!key) return [];
        return JSON.parse(localStorage.getItem(key) || "[]");
    }

    function saveCart(cart) {
        var key = cartStorageKey();
        if (!key) return;
        localStorage.setItem(key, JSON.stringify(cart));
        updateCartBadge();
    }

    function updateCartBadge() {
        var cart = getCart();
        var count = cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
        var badge = document.getElementById("cartBadge");
        if (!badge) return;
        badge.textContent = count;
        badge.style.display = "flex";
    }

    function addToCart(productId, qty, size) {
        var product = PRODUCTS[productId];
        if (!product) return;

        var maxQty = (typeof product.stock === "number") ? product.stock : 999;
        if (maxQty <= 0) return;

        var cart = getCart();
        var existing = null;
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].id === productId && (cart[i].size || null) === (size || null)) { existing = cart[i]; break; }
        }

        if (existing) {
            existing.qty = Math.min(maxQty, existing.qty + qty);
        } else {
            cart.push({ id: productId, name: product.name, price: getDiscountedPrice(product), image: product.image, qty: Math.min(maxQty, qty), size: size || null });
        }

        saveCart(cart);
    }

    
    
    
    
    function addToCartFromDetail() {
        openProductChat("cart");
    }

    function addSelectedItemToCartFromChat() {
        if (!chatState.size) return;

        addToCart(chatState.productId, chatState.qty, chatState.size);
        closeBuyChat();
        openCart();
    }

    
    
    
    function addToCartFromWishlist(productId) {
        if (!getCurrentUser()) {
            openAuthModal();
            return;
        }
        if (!PRODUCTS[productId]) return;

        currentProductId = productId;
        closeWishlist();
        openProductChat("cart", 1);
    }

    function removeFromCart(productId, size) {
        saveCart(getCart().filter(function (item) {
            return !(item.id === productId && (item.size || null) === (size || null));
        }));
        renderCart();
    }

    function changeCartQty(productId, size, delta) {
        var cart = getCart();
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].id === productId && (cart[i].size || null) === (size || null)) {
                var product = PRODUCTS[productId];
                var maxQty = (product && typeof product.stock === "number") ? product.stock : 999;
                cart[i].qty = Math.max(1, Math.min(maxQty, cart[i].qty + delta));
                break;
            }
        }
        saveCart(cart);
        renderCart();
    }

    function openCart() {
        if (!getCurrentUser()) {
            openAuthModal();
            return;
        }
        renderCart();
        document.getElementById("cartOverlay").classList.add("show");
    }

    function closeCart() {
        document.getElementById("cartOverlay").classList.remove("show");
    }

    function renderCart() {
        var cart = getCart();
        var listEl = document.getElementById("cartItemsList");
        var totalEl = document.getElementById("cartTotalAmount");
        var checkoutBtn = document.getElementById("cartCheckoutBtn");

        if (cart.length === 0) {
            listEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
            totalEl.textContent = "₱0.00";
            checkoutBtn.style.display = "none";
            return;
        }

        checkoutBtn.style.display = "block";

        var total = 0;
        listEl.innerHTML = cart.map(function (item) {
            var unitPrice = cartItemUnitPrice(item);
            total += unitPrice * item.qty;
            var sizeAttr = escapeHtml(item.size || "");
            var product = PRODUCTS[item.id];
            var activeDiscount = product ? getActiveDiscount(product) : null;
            var priceHtml = activeDiscount
                ? (
                    '<span class="price-original">₱' + Number(product.price).toFixed(2) + '</span>' +
                    '<span class="price-discounted">₱' + unitPrice.toFixed(2) + '</span>' +
                    '<span class="discount-badge">-' + activeDiscount.percent + '%</span>' +
                    ' x ' + item.qty
                )
                : ('₱' + unitPrice.toFixed(2) + ' x ' + item.qty);
            return (
                '<div class="cart-item">' +
                    '<img src="' + item.image + '" alt="' + escapeHtml(item.name) + '">' +
                    '<div class="cart-item-info">' +
                        '<div class="cart-item-name">' + escapeHtml(item.name) + (item.size ? ' <span class="cart-item-size">(' + escapeHtml(item.size) + ')</span>' : '') + '</div>' +
                        '<div class="cart-item-price">' + priceHtml + '</div>' +
                    '</div>' +
                    '<div class="cart-item-controls">' +
                        '<button type="button" class="qty-btn" onclick="changeCartQty(\'' + item.id + '\', \'' + sizeAttr + '\', -1)">-</button>' +
                        '<span>' + item.qty + '</span>' +
                        '<button type="button" class="qty-btn" onclick="changeCartQty(\'' + item.id + '\', \'' + sizeAttr + '\', 1)">+</button>' +
                    '</div>' +
                    '<button type="button" class="cart-item-remove" onclick="removeFromCart(\'' + item.id + '\', \'' + sizeAttr + '\')"><i class="fa-solid fa-trash"></i></button>' +
                '</div>'
            );
        }).join("");

        totalEl.textContent = "₱" + total.toFixed(2);
    }

    
    
    
    
    
    function wishlistStorageKey() {
        var user = getCurrentUser();
        return user ? ("cvspee_wishlist_" + user.email) : null;
    }

    function getWishlist() {
        var key = wishlistStorageKey();
        if (!key) return [];
        return JSON.parse(localStorage.getItem(key) || "[]");
    }

    function saveWishlist(list) {
        var key = wishlistStorageKey();
        if (!key) return;
        localStorage.setItem(key, JSON.stringify(list));
        updateWishlistBadge();
    }

    function isInWishlist(productId) {
        return getWishlist().indexOf(productId) !== -1;
    }

    function updateWishlistBadge() {
        var badge = document.getElementById("wishlistBadge");
        if (!badge) return;
        badge.textContent = getWishlist().length;
        badge.style.display = "flex";
    }

    function playHeartPop(btn) {
        if (!btn) return;
        btn.classList.remove("heart-pop");
        void btn.offsetWidth;
        btn.classList.add("heart-pop");
        setTimeout(function () {
            btn.classList.remove("heart-pop");
        }, 450);
    }

    function toggleWishlist(productId, event) {
        if (event) event.stopPropagation();

        if (!getCurrentUser()) {
            openAuthModal();
            return;
        }

        var list = getWishlist();
        var idx = list.indexOf(productId);
        var wasAdded = (idx === -1);
        if (idx === -1) {
            list.push(productId);
        } else {
            list.splice(idx, 1);
        }
        saveWishlist(list);

        
        document.querySelectorAll('.product-wishlist-btn').forEach(function (btn) {
            var card = btn.closest(".product-card");
            if (card && card.getAttribute("data-product-id") === productId) {
                btn.classList.toggle("active", wasAdded);
                if (wasAdded) playHeartPop(btn);
            }
        });

        var pdWishlistBtn = document.getElementById("pdWishlistBtn");
        if (pdWishlistBtn && currentProductId === productId) {
            pdWishlistBtn.classList.toggle("active", wasAdded);
            if (wasAdded) playHeartPop(pdWishlistBtn);
        }

        if (document.getElementById("wishlistOverlay").classList.contains("show")) {
            renderWishlist();
        }
    }

    function openWishlist() {
        if (!getCurrentUser()) {
            openAuthModal();
            return;
        }
        renderWishlist();
        document.getElementById("wishlistOverlay").classList.add("show");
    }

    function closeWishlist() {
        document.getElementById("wishlistOverlay").classList.remove("show");
    }

    function renderWishlist() {
        var list = getWishlist();
        var listEl = document.getElementById("wishlistItemsList");

        var validIds = list.filter(function (id) { return !!PRODUCTS[id]; });
        if (validIds.length !== list.length) saveWishlist(validIds);

        if (validIds.length === 0) {
            listEl.innerHTML = '<p class="wishlist-empty">Your wishlist is empty.</p>';
            return;
        }

        listEl.innerHTML = validIds.map(function (id) {
            var product = PRODUCTS[id];
            var stock = (typeof product.stock === "number") ? product.stock : 0;
            return (
                '<div class="wishlist-item">' +
                    '<img src="' + product.image + '" alt="' + escapeHtml(product.name) + '" onclick="closeWishlist(); openProductDetail(\'' + id + '\')">' +
                    '<div class="wishlist-item-info" onclick="closeWishlist(); openProductDetail(\'' + id + '\')">' +
                        '<div class="wishlist-item-name">' + escapeHtml(product.name) + '</div>' +
                        '<div class="wishlist-item-price">' + priceDisplayHtml(product) + '</div>' +
                    '</div>' +
                    '<div class="wishlist-item-actions">' +
                        (stock > 0 ? '<button type="button" class="wishlist-add-cart-btn" onclick="addToCartFromWishlist(\'' + id + '\')">Add to Cart</button>' : '') +
                        '<button type="button" class="wishlist-remove-btn" onclick="toggleWishlist(\'' + id + '\', event); renderWishlist();"><i class="fa-solid fa-trash"></i></button>' +
                    '</div>' +
                '</div>'
            );
        }).join("");
    }

    var checkoutOrder = null;
    var selectedPaymentMethod = null;

    var PROMO_CODES = {
        "CVSPEE10": { type: "percent", value: 10, label: "10% off" },
        "WELCOME15": { type: "percent", value: 15, label: "15% off" },
        "SAVE50": { type: "fixed", value: 50, label: "₱50 off" }
    };

    var WALLET_ACCOUNTS = {
        GCash: [
            { label: "Name", value: "CVSPEE OFFICIAL" },
            { label: "GCash Number", value: "09173456821" }
        ]
    };

    var chatState = { productId: null, qty: 1, size: null };
    var chatMode = "buy";
    var chatFlowSource = "buy"; 
    var paymentProofDataUrl = null;

    var mapPicker = { map: null, marker: null, lat: null, lng: null, address: "" };
    var codPinLocation = null;
    var walletPinLocation = null;
    var mapPickerTarget = "cod";
    var DEFAULT_MAP_CENTER = { lat: 14.2456, lng: 120.8770 };

    var LOCATION_TARGETS = {
        cod: { emptyId: "codLocationEmpty", setId: "codLocationSet", addressId: "codLocationAddress" },
        wallet: { emptyId: "walletLocationEmpty", setId: "walletLocationSet", addressId: "walletLocationAddress" }
    };

    function getPinLocation(target) {
        return target === "wallet" ? walletPinLocation : codPinLocation;
    }

    function setPinLocation(target, value) {
        if (target === "wallet") {
            walletPinLocation = value;
        } else {
            codPinLocation = value;
        }
    }

    function openMapPicker(target) {
        mapPickerTarget = target === "wallet" ? "wallet" : "cod";

        var existing = getPinLocation(mapPickerTarget);

        document.getElementById("mapPickerOverlay").classList.add("show");
        document.getElementById("mapConfirmBtn").disabled = !existing;

        mapPicker = { map: mapPicker.map, marker: mapPicker.marker, lat: existing ? existing.lat : null, lng: existing ? existing.lng : null, address: existing ? existing.address : "" };

        setTimeout(function () {
            var startLat = existing ? existing.lat : DEFAULT_MAP_CENTER.lat;
            var startLng = existing ? existing.lng : DEFAULT_MAP_CENTER.lng;

            if (!mapPicker.map) {
                mapPicker.map = L.map("mapPickerMap").setView([startLat, startLng], 15);

                L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    maxZoom: 19,
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(mapPicker.map);

                mapPicker.marker = L.marker([startLat, startLng], { draggable: true }).addTo(mapPicker.map);

                mapPicker.marker.on("dragend", function () {
                    var pos = mapPicker.marker.getLatLng();
                    setMapPickerLocation(pos.lat, pos.lng);
                });

                mapPicker.map.on("click", function (e) {
                    mapPicker.marker.setLatLng(e.latlng);
                    setMapPickerLocation(e.latlng.lat, e.latlng.lng);
                });
            } else {
                mapPicker.map.invalidateSize();
                mapPicker.map.setView([startLat, startLng], 15);
                mapPicker.marker.setLatLng([startLat, startLng]);
            }

            var addressEl = document.getElementById("mapPickerAddress");
            addressEl.classList.remove("map-picker-address-error");
            if (existing) {
                addressEl.textContent = existing.address || ("Pin set at " + existing.lat.toFixed(5) + ", " + existing.lng.toFixed(5));
            } else {
                addressEl.textContent = "Move the map or drag the pin to set your location.";
            }
        }, 50);
    }

    function closeMapPicker() {
        document.getElementById("mapPickerOverlay").classList.remove("show");
    }

    function locateMeOnMap() {
        var addressEl = document.getElementById("mapPickerAddress");

        if (!navigator.geolocation) {
            addressEl.classList.add("map-picker-address-error");
            addressEl.textContent = "Location detection isn't supported here. Please drag the pin instead.";
            return;
        }

        var btn = document.getElementById("mapLocateBtn");
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Locating…';
        addressEl.classList.remove("map-picker-address-error");
        addressEl.textContent = "Getting your current location…";

        function resetBtn() {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-crosshairs"></i> Use My Current Location';
        }

        navigator.geolocation.getCurrentPosition(function (pos) {
            var lat = pos.coords.latitude;
            var lng = pos.coords.longitude;

            mapPicker.map.setView([lat, lng], 16);
            mapPicker.marker.setLatLng([lat, lng]);
            setMapPickerLocation(lat, lng);

            resetBtn();
        }, function (err) {
            var msg = "We couldn't get your location. Please drag the pin to set it manually.";
            if (err) {
                if (err.code === 1) {
                    msg = "Location access is blocked for this site. Tap the lock/site icon next to the address bar, allow Location, then try again — or just drag the pin.";
                } else if (err.code === 3) {
                    msg = "Getting your location took too long. Please drag the pin to set it manually.";
                }
            }
            addressEl.classList.add("map-picker-address-error");
            addressEl.textContent = msg;
            resetBtn();
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    }

    function setMapPickerLocation(lat, lng) {
        mapPicker.lat = lat;
        mapPicker.lng = lng;
        mapPicker.address = "";

        var addressEl = document.getElementById("mapPickerAddress");
        addressEl.classList.remove("map-picker-address-error");
        addressEl.textContent = "Looking up address…";
        document.getElementById("mapConfirmBtn").disabled = false;

        fetch("https://nominatim.openstreetmap.org/reverse?format=json&lat=" + lat + "&lon=" + lng + "&zoom=18")
            .then(function (res) { return res.json(); })
            .then(function (data) {
                mapPicker.address = (data && data.display_name) ? data.display_name : "";
                addressEl.textContent = mapPicker.address || ("Pin set at " + lat.toFixed(5) + ", " + lng.toFixed(5));
            })
            .catch(function () {
                addressEl.textContent = "Pin set at " + lat.toFixed(5) + ", " + lng.toFixed(5);
            });
    }

    function confirmMapPin() {
        if (!mapPicker.lat) return;

        var pin = { lat: mapPicker.lat, lng: mapPicker.lng, address: mapPicker.address };
        setPinLocation(mapPickerTarget, pin);

        var ids = LOCATION_TARGETS[mapPickerTarget];
        document.getElementById(ids.emptyId).style.display = "none";
        document.getElementById(ids.setId).style.display = "flex";
        document.getElementById(ids.addressId).textContent =
            pin.address || (pin.lat.toFixed(5) + ", " + pin.lng.toFixed(5));

        closeMapPicker();
    }

    function openBuyChat() {
        openProductChat("buy");
    }

    
    
    
    function openProductChat(intent, qtyOverride) {
        if (!getCurrentUser()) {
            closeProductDetail();
            openAuthModal();
            return;
        }

        var product = PRODUCTS[currentProductId];
        if (!product) return;

        chatState = {
            productId: currentProductId,
            qty: (typeof qtyOverride === "number") ? qtyOverride : (parseInt(document.getElementById("pdQty").value, 10) || 1),
            size: null
        };
        chatMode = "buy";
        chatFlowSource = intent === "cart" ? "cart" : "buy";
        paymentProofDataUrl = null;

        document.getElementById("chatProductImg").src = product.image;
        document.getElementById("chatProductImg").alt = product.name;
        document.getElementById("chatProductName").textContent = product.name;

        document.getElementById("chatMessages").innerHTML = "";
        document.getElementById("chatChoices").innerHTML = "";
        document.getElementById("chatProofUpload").style.display = "none";
        document.getElementById("chatProofPreview").style.display = "none";
        document.getElementById("paymentProofInput").value = "";

        var continueBtn = document.getElementById("chatContinueBtn");
        continueBtn.textContent = chatFlowSource === "cart" ? "Add to Cart" : "Continue with Payment";
        continueBtn.disabled = true;

        chatHistory = [];
        var inputRow = document.getElementById("chatTextInputRow");
        var freeInput = document.getElementById("chatFreeInput");
        inputRow.style.display = "flex";
        freeInput.disabled = false;
        freeInput.value = "";
        document.getElementById("chatSendBtn").disabled = false;

        closeProductDetail();
        document.getElementById("chatOverlay").classList.add("show");

        
        
        
        
        
        
        var isSizeless = product.sizes && product.sizes.length === 1;

        var greeting;
        if (isSizeless) {
            greeting = chatFlowSource === "cart"
                ? "Hi! " + product.name + " doesn't need a size, so it's ready to add to your cart. What would you like to know, or should I add it now?"
                : "Hi! " + product.name + " doesn't need a size, so it's ready to check out. What would you like to know, or are you ready to buy?";
        } else {
            greeting = chatFlowSource === "cart"
                ? "Hi! Let's get " + product.name + " ready for your cart. What would you like to know, or are you ready to pick a size?"
                : "Hi! Ask me anything about " + product.name + ", or let me know when you're ready to buy.";
            greeting += " You can ask about the size chart, and you can change your size anytime by tapping a size or telling me.";
        }
        addChatMessage("ai", greeting);

        if (isSizeless) {
            chatSelectSize(product.sizes[0]);
        }

        showChatReadyChoice();

        freeInput.focus();
    }

    function closeBuyChat() {
        document.getElementById("chatOverlay").classList.remove("show");
    }

    function addChatMessage(sender, text) {
        var messagesEl = document.getElementById("chatMessages");
        var bubble = document.createElement("div");
        bubble.className = "chat-bubble " + (sender === "ai" ? "chat-bubble-ai" : "chat-bubble-user");
        bubble.textContent = text;
        messagesEl.appendChild(bubble);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return bubble;
    }

    function renderChatChoices(options) {
        var choicesEl = document.getElementById("chatChoices");
        choicesEl.innerHTML = "";

        options.forEach(function (opt) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "chat-choice-btn" + (opt.selected ? " selected" : "") + (opt.className ? " " + opt.className : "");
            btn.textContent = opt.label;
            btn.addEventListener("click", opt.onSelect);
            choicesEl.appendChild(btn);
        });
    }

    
    
    
    var chatHistory = [];
    var PRODUCT_CHAT_ENDPOINT = BACKEND_URL + "/api/product-chat";

    function sizeChartTextForAI(product) {
        var chart = resolveSizeChart(product);
        if (!chart) return "";
        var out = [];
        if (chart.title) out.push(chart.title);
        chart.tables.forEach(function (t) {
            if (t.title) out.push("[" + t.title + "]");
            out.push(t.headers.join(" | "));
            t.rows.forEach(function (r) { out.push(r.join(" | ")); });
        });
        if (chart.note) out.push("Note: " + chart.note);
        return out.join("\n").slice(0, 4000);
    }

    function appendSizeChartToChat() {
        var product = PRODUCTS[chatState.productId];
        var chart = product ? resolveSizeChart(product) : null;
        if (!chart) return false;

        var messagesEl = document.getElementById("chatMessages");
        var bubble = document.createElement("div");
        bubble.className = "chat-bubble chat-bubble-ai chat-bubble-chart";
        var box = document.createElement("div");
        var tab = ((chart.kind === "shoes" || chart.kind === "polo") && product.gender === "Female") ? 1 : 0;
        renderSizeChartInto(box, chart, tab, true);
        bubble.appendChild(box);
        messagesEl.appendChild(bubble);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return true;
    }

    function handleSizeChartChoice() {
        var product = PRODUCTS[chatState.productId];
        if (!product) return;
        addChatMessage("user", "Size chart");
        if (appendSizeChartToChat()) {
            addChatMessage("ai", "Here's the size chart for " + product.name + ". Pick your size below" + (chatState.size ? " — you can still change it." : "."));
        } else {
            addChatMessage("ai", "Sorry, " + product.name + " doesn't have a size chart.");
        }
    }

    function sendProductChatMessage() {
        if (chatMode !== "buy") return;

        var inputEl = document.getElementById("chatFreeInput");
        var sendBtn = document.getElementById("chatSendBtn");
        var text = inputEl.value.trim();
        if (!text) return;

        var product = PRODUCTS[chatState.productId];
        if (!product) return;

        addChatMessage("user", text);
        inputEl.value = "";
        inputEl.disabled = true;
        sendBtn.disabled = true;

        var typingBubble = addChatMessage("ai", "...");
        var historyForRequest = chatHistory.slice();
        chatHistory.push({ role: "user", content: text });

        fetch(PRODUCT_CHAT_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                product: {
                    id: product.id,
                    name: product.name,
                    price: getDiscountedPrice(product),
                    description: product.description,
                    sizes: product.sizes,
                    stock: product.stock,
                    sizeChart: sizeChartTextForAI(product)
                },
                selectedSize: chatState.size || null,
                message: text,
                history: historyForRequest
            })
        })
            .then(function (res) {
                if (!res.ok) throw new Error("bad status");
                return res.json();
            })
            .then(function (data) {
                typingBubble.remove();
                var reply = (data && data.reply) ? data.reply : "Sorry, no response was received.";
                addChatMessage("ai", reply);
                chatHistory.push({ role: "assistant", content: reply });

                if (data && data.show_size_chart) {
                    appendSizeChartToChat();
                }

                if (data && data.size && product.sizes.indexOf(data.size) !== -1) {
                    chatSelectSize(data.size);
                }
            })
            .catch(function () {
                typingBubble.remove();
                addChatMessage("ai", "Sorry, there was a connection problem. You can still use the choices below to continue.");
                ensureChatFallbackChoices();
            })
            .finally(function () {
                inputEl.disabled = false;
                sendBtn.disabled = false;
                inputEl.focus();
            });
    }

    document.getElementById("chatFreeInput").addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            sendProductChatMessage();
        }
    });

    
    
    
    var SUPPORT_CHAT_ENDPOINT = BACKEND_URL + "/api/support-chat";
    var supportChatHistory = [];
    var supportChatStarted = false;

    function openSupportChat() {
        document.getElementById("supportChatOverlay").classList.add("show");

        if (!supportChatStarted) {
            supportChatStarted = true;
            addSupportChatMessage("ai", "Hi! I'm the CVSPEE Support Assistant. I can help with questions about the website, our products, or your account — like creating an account, logging in, or resetting your password. How can I help?");
        }

        var freeInput = document.getElementById("supportChatFreeInput");
        if (freeInput) freeInput.focus();
    }

    function closeSupportChat() {
        document.getElementById("supportChatOverlay").classList.remove("show");
    }

    function addSupportChatMessage(sender, text) {
        var messagesEl = document.getElementById("supportChatMessages");
        var bubble = document.createElement("div");
        bubble.className = "chat-bubble " + (sender === "ai" ? "chat-bubble-ai" : "chat-bubble-user");
        bubble.textContent = text;
        messagesEl.appendChild(bubble);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return bubble;
    }

    function sendSupportChatMessage() {
        var inputEl = document.getElementById("supportChatFreeInput");
        var sendBtn = document.getElementById("supportChatSendBtn");
        var text = inputEl.value.trim();
        if (!text) return;

        addSupportChatMessage("user", text);
        inputEl.value = "";
        inputEl.disabled = true;
        sendBtn.disabled = true;

        var typingBubble = addSupportChatMessage("ai", "...");
        var historyForRequest = supportChatHistory.slice();
        supportChatHistory.push({ role: "user", content: text });

        fetch(SUPPORT_CHAT_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: text,
                history: historyForRequest
            })
        })
            .then(function (res) {
                if (!res.ok) throw new Error("bad status");
                return res.json();
            })
            .then(function (data) {
                typingBubble.remove();
                var reply = (data && data.reply) ? data.reply : "Sorry, no response was received.";
                addSupportChatMessage("ai", reply);
                supportChatHistory.push({ role: "assistant", content: reply });
            })
            .catch(function () {
                typingBubble.remove();
                addSupportChatMessage("ai", "Sorry, there was a connection problem. Please try again, or reach us through the contact details above.");
            })
            .finally(function () {
                inputEl.disabled = false;
                sendBtn.disabled = false;
                inputEl.focus();
            });
    }

    document.getElementById("supportChatFreeInput").addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            sendSupportChatMessage();
        }
    });

    
    
    
    function chatSelectSize(size) {
        chatState.size = size;
        document.getElementById("chatContinueBtn").disabled = false;

        var product = PRODUCTS[chatState.productId];
        if (product && product.sizes && product.sizes.length > 1) showChatSizeChoices();
    }

    
    
    
    
    function ensureChatFallbackChoices() {
        var choicesEl = document.getElementById("chatChoices");
        if (!choicesEl || choicesEl.children.length > 0) return;

        var product = PRODUCTS[chatState.productId];
        if (!product || chatState.size) return;

        if (product.sizes && product.sizes.length > 1) {
            showChatSizeChoices();
        } else {
            showChatReadyChoice();
        }
    }

    function showChatReadyChoice() {
        var product = PRODUCTS[chatState.productId];
        if (!product) return;

        var label = chatFlowSource === "cart" ? "I'm ready to add to cart" : "I'm ready to buy";

        var options = [{ label: label, onSelect: handleReadyToBuyChoice }];
        if (resolveSizeChart(product)) {
            options.push({ label: "Size chart", className: "chat-choice-chart", onSelect: handleSizeChartChoice });
        }
        renderChatChoices(options);
    }

    function handleReadyToBuyChoice() {
        var product = PRODUCTS[chatState.productId];
        if (!product) return;

        var label = chatFlowSource === "cart" ? "I'm ready to add to cart" : "I'm ready to buy";
        addChatMessage("user", label);
        document.getElementById("chatChoices").innerHTML = "";

        if (chatState.size) {
            var confirmMsg = (chatState.size !== NO_SIZE_LABEL)
                ? "Great! " + product.name + " in size " + chatState.size + " is all set. Tap Continue below whenever you're ready."
                : "Great! " + product.name + " is all set. Tap Continue below whenever you're ready.";
            addChatMessage("ai", confirmMsg);
            if (product.sizes && product.sizes.length > 1) showChatSizeChoices();
            return;
        }

        addChatMessage("ai", "Awesome! What size would you like for " + product.name + "?");
        showChatSizeChoices();
    }

    function showChatSizeChoices() {
        var product = PRODUCTS[chatState.productId];
        if (!product || !product.sizes) return;

        var options = product.sizes.map(function (size) {
            return {
                label: size,
                selected: chatState.size === size,
                onSelect: function () { handleChatSizeChoice(size); }
            };
        });
        if (resolveSizeChart(product)) {
            options.push({ label: "Size chart", className: "chat-choice-chart", onSelect: handleSizeChartChoice });
        }
        renderChatChoices(options);
    }

    function handleChatSizeChoice(size) {
        var product = PRODUCTS[chatState.productId];
        if (!product) return;

        var previous = chatState.size;
        if (previous === size) return;

        addChatMessage("user", size);
        chatSelectSize(size);

        if (previous) {
            addChatMessage("ai", "Okay — changed your size from " + previous + " to " + size + " for " + product.name + ". Tap Continue below whenever you're ready, or change it again anytime.");
        } else {
            addChatMessage("ai", "Got it — size " + size + " selected for " + product.name + ". Tap Continue below whenever you're ready. You can still change it by tapping another size or telling me.");
        }
    }

    function continueToPaymentFromChat() {
        if (!chatState.size) return;

        var product = PRODUCTS[chatState.productId];
        if (!product) return;

        var effectivePrice = getDiscountedPrice(product);

        checkoutOrder = {
            items: [{
                id: product.id,
                name: product.name,
                price: effectivePrice,
                image: product.image,
                qty: chatState.qty,
                size: chatState.size
            }],
            subtotal: effectivePrice * chatState.qty,
            discount: 0,
            promoCode: null,
            total: effectivePrice * chatState.qty,
            source: "buynow"
        };

        closeBuyChat();
        openPayment();
    }

    function openCheckoutFromCart() {
        if (!getCurrentUser()) {
            closeCart();
            openAuthModal();
            return;
        }

        var cart = getCart();
        if (cart.length === 0) return;

        var checkoutItems = cart.map(function (item) {
            return {
                id: item.id,
                name: item.name,
                price: cartItemUnitPrice(item),
                image: item.image,
                qty: item.qty,
                size: item.size
            };
        });

        var cartSubtotal = checkoutItems.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);

        checkoutOrder = {
            items: checkoutItems,
            subtotal: cartSubtotal,
            discount: 0,
            promoCode: null,
            total: cartSubtotal,
            source: "cart"
        };

        closeCart();
        openPayment();
    }

    function renderPaymentSummary() {
        if (!checkoutOrder) return;

        var itemsHtml = checkoutOrder.items.map(function (item) {
            return escapeHtml(item.name) + (item.size ? " (" + escapeHtml(item.size) + ")" : "") + " x" + item.qty;
        }).join("<br>");

        var html = itemsHtml;

        if (checkoutOrder.discount > 0) {
            html += "<br><br>Subtotal: ₱" + checkoutOrder.subtotal.toFixed(2);
            html += '<br><span class="summary-discount-row">Discount (' + escapeHtml(checkoutOrder.promoCode) + "): -₱" + checkoutOrder.discount.toFixed(2) + "</span>";
            html += '<br><span class="summary-total-row">Total: ₱' + checkoutOrder.total.toFixed(2) + "</span>";
        } else {
            html += '<br><br><span class="summary-total-row">Total: ₱' + checkoutOrder.total.toFixed(2) + "</span>";
        }

        document.getElementById("paymentOrderSummary").innerHTML = html;
    }

    function checkoutHasActiveDiscount() {
        if (!checkoutOrder) return false;
        return checkoutOrder.items.some(function (item) {
            var product = PRODUCTS[item.id];
            return !!getActiveDiscount(product);
        });
    }

    function applyPromoCode() {
        if (!checkoutOrder) return;

        var messageEl = document.getElementById("promoMessage");

        if (checkoutHasActiveDiscount()) {
            messageEl.textContent = "This order already has a product discount — promo codes can't be combined with it.";
            messageEl.className = "promo-message error";
            return;
        }

        var input = document.getElementById("promoCodeInput");
        var code = input.value.trim().toUpperCase();

        if (!code) {
            messageEl.textContent = "Please enter a promo code.";
            messageEl.className = "promo-message error";
            return;
        }

        var promo = null;

        var released = getPromoCodesList().find(function (e) { return e.code === code; });
        if (released) {
            if (isPromoExpired(released)) {
                messageEl.textContent = "This promo code has expired.";
                messageEl.className = "promo-message error";
                return;
            }
            promo = { type: "percent", value: released.discountPercent, label: released.discountPercent + "% off" };
        } else if (PROMO_CODES[code]) {
            promo = PROMO_CODES[code];
        }

        if (!promo) {
            messageEl.textContent = "Invalid or expired promo code.";
            messageEl.className = "promo-message error";
            return;
        }

        var discount = promo.type === "percent"
            ? checkoutOrder.subtotal * (promo.value / 100)
            : promo.value;
        discount = Math.min(discount, checkoutOrder.subtotal);

        checkoutOrder.promoCode = code;
        checkoutOrder.discount = discount;
        checkoutOrder.total = checkoutOrder.subtotal - discount;

        messageEl.textContent = "";
        messageEl.className = "promo-message";

        document.getElementById("promoInputRow").style.display = "none";
        document.getElementById("promoAppliedRow").style.display = "flex";
        document.getElementById("promoAppliedText").textContent = code + " applied — " + promo.label;

        renderPaymentSummary();
        refreshWalletAmountIfVisible();
    }

    function removePromoCode() {
        if (!checkoutOrder) return;

        checkoutOrder.promoCode = null;
        checkoutOrder.discount = 0;
        checkoutOrder.total = checkoutOrder.subtotal;

        document.getElementById("promoCodeInput").value = "";
        document.getElementById("promoInputRow").style.display = "flex";
        document.getElementById("promoAppliedRow").style.display = "none";
        document.getElementById("promoMessage").textContent = "";
        document.getElementById("promoMessage").className = "promo-message";

        renderPaymentSummary();
        refreshWalletAmountIfVisible();
    }

    function refreshWalletAmountIfVisible() {
        var walletStep = document.getElementById("paymentStepWalletInfo");
        if (walletStep && walletStep.classList.contains("active")) {
            document.getElementById("walletInfoAmount").textContent =
                "₱" + (checkoutOrder ? checkoutOrder.total.toFixed(2) : "0.00");
        }
    }

    function openPayment() {
        if (!checkoutOrder) return;

        document.getElementById("promoCodeInput").value = "";
        document.getElementById("promoMessage").textContent = "";
        document.getElementById("promoMessage").className = "promo-message";
        document.getElementById("promoAppliedRow").style.display = "none";

        var blockedMsg = document.getElementById("promoBlockedMessage");
        if (checkoutHasActiveDiscount()) {
            document.getElementById("promoInputRow").style.display = "none";
            blockedMsg.style.display = "block";
        } else {
            document.getElementById("promoInputRow").style.display = "flex";
            blockedMsg.style.display = "none";
        }

        renderPaymentSummary();

        goToPaymentStep("paymentStepMethod");
        document.getElementById("paymentOverlay").classList.add("show");
    }

    function closePayment() {
        document.getElementById("paymentOverlay").classList.remove("show");
        checkoutOrder = null;
        selectedPaymentMethod = null;
        resetCodForm();
    }

    function goToPaymentStep(stepId) {
        document.querySelectorAll(".payment-step").forEach(function (step) {
            step.classList.toggle("active", step.id === stepId);
        });
    }

    function selectPaymentMethod(method) {
        selectedPaymentMethod = method;

        if (method === "COD") {
            document.getElementById("codError").textContent = "";
            goToPaymentStep("paymentStepCod");
        } else {
            goToWalletInfoStep(method);
        }
    }

    function goToWalletInfoStep(method) {
        document.getElementById("walletInfoTitle").textContent = "Pay with " + method;
        document.getElementById("walletInfoAmount").textContent =
            "₱" + (checkoutOrder ? checkoutOrder.total.toFixed(2) : "0.00");

        var accountFields = WALLET_ACCOUNTS[method] || [];
        document.getElementById("walletInfoDetails").innerHTML = accountFields.map(function (f) {
            return "<p><span>" + escapeHtml(f.label) + "</span><strong>" + escapeHtml(f.value) + "</strong></p>";
        }).join("");

        goToPaymentStep("paymentStepWalletInfo");
    }

    function goToPaymentProofChat() {
        if (!checkoutOrder) return;

        var name = document.getElementById("walletName").value.trim();
        var phone = document.getElementById("walletPhone").value.trim();
        var errorEl = document.getElementById("walletInfoError");

        if (!name || !phone) {
            errorEl.textContent = "Please fill in all fields.";
            return;
        }

        if (!walletPinLocation) {
            errorEl.textContent = "Please pin your delivery location.";
            return;
        }

        errorEl.textContent = "";

        chatMode = "paymentProof";
        paymentProofDataUrl = null;

        var firstItem = checkoutOrder.items[0];
        var chatImgEl = document.getElementById("chatProductImg");
        chatImgEl.src = firstItem ? firstItem.image : "";
        chatImgEl.alt = firstItem ? firstItem.name : "";
        document.getElementById("chatProductName").textContent = firstItem
            ? (firstItem.name + (checkoutOrder.items.length > 1 ? " +" + (checkoutOrder.items.length - 1) + " more" : ""))
            : "Your Order";

        document.getElementById("chatMessages").innerHTML = "";
        document.getElementById("chatChoices").innerHTML = "";
        document.getElementById("chatTextInputRow").style.display = "none";

        document.getElementById("paymentProofInput").value = "";
        document.getElementById("chatProofPreview").style.display = "none";
        document.getElementById("chatProofUpload").style.display = "flex";

        var continueBtn = document.getElementById("chatContinueBtn");
        continueBtn.textContent = "Done Payment";
        continueBtn.disabled = true;

        document.getElementById("paymentOverlay").classList.remove("show");
        document.getElementById("chatOverlay").classList.add("show");

        addChatMessage("ai", "Thank you! Please upload a screenshot of your payment here so we can confirm your order.");
    }

    function handlePaymentProofSelected(e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;

        readImageAsResizedDataUrl(file, 1100, 0.75, function (dataUrl) {
            paymentProofDataUrl = dataUrl;

            var previewImg = document.getElementById("chatProofPreviewImg");
            previewImg.src = paymentProofDataUrl;
            document.getElementById("chatProofPreview").style.display = "flex";

            document.getElementById("chatContinueBtn").disabled = false;
        }, function () {
            alert("Couldn't read that image. Please try a different photo.");
        });
    }

    function handleChatContinueClick() {
        if (chatMode === "paymentProof") {
            finalizePaymentProofOrder();
        } else if (chatFlowSource === "cart") {
            addSelectedItemToCartFromChat();
        } else {
            continueToPaymentFromChat();
        }
    }

    function finalizePaymentProofOrder() {
        if (!paymentProofDataUrl) return;

        closeBuyChat();
        document.getElementById("paymentOverlay").classList.add("show");

        var name = document.getElementById("walletName").value.trim();
        var phone = document.getElementById("walletPhone").value.trim();

        finalizeOrder({
            name: name,
            phone: phone,
            lat: walletPinLocation ? walletPinLocation.lat : null,
            lng: walletPinLocation ? walletPinLocation.lng : null,
            address: walletPinLocation ? walletPinLocation.address : "",
            paymentProof: paymentProofDataUrl
        });
    }

    function backToPaymentMethod() {
        goToPaymentStep("paymentStepMethod");
    }

    function playOrderConfirmAnimation() {
        var svg = document.getElementById("orderConfirmCheck");
        svg.classList.remove("animate");
        void svg.offsetWidth;
        svg.classList.add("animate");
    }

    function finalizeOrder(extraDetails) {
        var user = getCurrentUser();
        if (!user) {
            closePayment();
            closeBuyChat();
            openAuthModal();
            return;
        }

        goToPaymentStep("paymentStepLoading");

        setTimeout(function () {
            var orders = getOrders();
            var previousOrders = orders.slice();

            orders.push({
                id: generateOrderId(),
                buyerEmail: user.email,
                buyerName: user.name,
                buyerAvatar: user.avatar || "",
                items: checkoutOrder.items,
                subtotal: checkoutOrder.subtotal,
                discount: checkoutOrder.discount,
                promoCode: checkoutOrder.promoCode,
                total: checkoutOrder.total,
                method: selectedPaymentMethod,
                details: extraDetails,
                date: new Date().toLocaleString(),
                createdAt: Date.now(),
                status: "pending",
                messages: [],
                ownerUnread: 0,
                buyerUnread: 1,
                sellerEmail: null,
                sellerName: "",
                sellerUnread: 0
            });

            saveOrdersList(orders, true).then(function () {
                adjustStockForItems(checkoutOrder.items, -1);

                if (checkoutOrder.source === "cart") {
                    saveCart([]);
                }

                document.getElementById("paymentConfirmText").textContent =
                    "Paid via " + selectedPaymentMethod + " — total ₱" + checkoutOrder.total.toFixed(2) + ". Thank you for shopping with CVSPEE! We'll notify you once the owner approves your order.";

                goToPaymentStep("paymentStepConfirm");
                playOrderConfirmAnimation();

                refreshOrderUI();
            }).catch(function (err) {
                console.error("Failed to save order", err);
                _cloud.orders = previousOrders;

                var msg = "We couldn't place your order. Please check your connection and try again.";
                if (err && err.code === "permission-denied") {
                    msg = "We couldn't place your order: the store isn't allowed to save it right now (permission-denied). Please tell the shop owner — the database access rules need to be updated.";
                } else if (err && err.message) {
                    msg = "We couldn't place your order (" + err.message + "). Please try again.";
                }
                alert(msg);
                goToPaymentStep(selectedPaymentMethod === "COD" ? "paymentStepCod" : "paymentStepWalletInfo");
            });
        }, 1200);
    }

    function submitCodPayment(e) {
        e.preventDefault();

        var name = document.getElementById("codName").value.trim();
        var phone = document.getElementById("codPhone").value.trim();
        var errorEl = document.getElementById("codError");

        if (!name || !phone) {
            errorEl.textContent = "Please fill in all fields.";
            return false;
        }

        if (!codPinLocation) {
            errorEl.textContent = "Please pin your delivery location.";
            return false;
        }

        errorEl.textContent = "";
        finalizeOrder({
            name: name,
            phone: phone,
            lat: codPinLocation.lat,
            lng: codPinLocation.lng,
            address: codPinLocation.address
        });
        return false;
    }

    function resetCodForm() {
        document.getElementById("codName").value = "";
        document.getElementById("codPhone").value = "";
        document.getElementById("codError").textContent = "";
        codPinLocation = null;
        document.getElementById("codLocationEmpty").style.display = "block";
        document.getElementById("codLocationSet").style.display = "none";

        document.getElementById("walletName").value = "";
        document.getElementById("walletPhone").value = "";
        document.getElementById("walletInfoError").textContent = "";
        walletPinLocation = null;
        document.getElementById("walletLocationEmpty").style.display = "block";
        document.getElementById("walletLocationSet").style.display = "none";

        if (mapPicker.map) {
            mapPicker.map.remove();
        }
        mapPicker = { map: null, marker: null, lat: null, lng: null, address: "" };
        var mapContainer = document.getElementById("mapPickerMap");
        if (mapContainer) mapContainer.innerHTML = "";
    }

    var currentOrderActionId = null;

    function getOrders() {
        return _cloud.orders;
    }

    function saveOrdersList(orders, silent) {
        _cloud.orders = orders;

        var validOrders = orders.filter(function (o) { return o && o.id; });
        var chunks = [];
        for (var i = 0; i < validOrders.length; i += 450) {
            chunks.push(validOrders.slice(i, i + 450));
        }

        var writePromise = chunks.reduce(function (chain, chunk) {
            return chain.then(function () {
                var batch = db.batch();
                chunk.forEach(function (o) {
                    batch.set(db.collection("cvspeeOrders").doc(o.id), o);
                });
                return batch.commit();
            });
        }, Promise.resolve());

        if (silent) {
            return writePromise;
        }

        return writePromise.catch(function (err) {
            console.error("Failed to save orders", err);
            var msg = "Something went wrong saving this order. Please check your connection and try again.";
            if (err && err.code === "permission-denied") {
                msg = "Couldn't save: the store isn't allowed to save orders right now (permission-denied). Please tell the shop owner — the database access rules need to be updated.";
            }
            alert(msg);
            throw err;
        });
    }

    function generateOrderId() {
        return "ord_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    }

    function orderSummaryText(order) {
        return order.items.map(function (it) {
            return it.name + (it.size ? " (" + it.size + ")" : "") + " x" + it.qty;
        }).join(", ");
    }

    var notifManualMode = false;
    var notifSelectedIds = [];

    function openOrdersPanel() {
        var user = getCurrentUser();
        if (!user) {
            openAuthModal();
            return;
        }

        notifManualMode = false;
        notifSelectedIds = [];

        renderOrdersPanel();
        document.getElementById("ordersPanelOverlay").classList.add("show");
    }

    function closeOrdersPanel() {
        document.getElementById("ordersPanelOverlay").classList.remove("show");
        notifManualMode = false;
        notifSelectedIds = [];
    }

    function isOrderUnreadFor(order, user) {
        var role = getOrderRoleFor(order, user);

        if (role === "owner") {
            return order.status === "pending" || !!(order.ownerUnread && order.ownerUnread > 0);
        }
        if (role === "seller-pending") {
            return true;
        }
        if (role === "seller-assigned") {
            return !!(order.sellerUnread && order.sellerUnread > 0);
        }
        if (role === "buyer") {
            return order.status === "pending" || !!(order.buyerUnread && order.buyerUnread > 0);
        }
        return false;
    }

    
    
    
    var confirmModalCallback = null;

    function showConfirmModal(message, onConfirm, options) {
        options = options || {};
        document.getElementById("confirmModalTitle").textContent = options.title || "Are you sure?";
        document.getElementById("confirmModalMessage").textContent = message;
        document.getElementById("confirmModalOkBtn").textContent = options.okText || "OK";
        document.getElementById("confirmModalCancelBtn").textContent = options.cancelText || "Cancel";
        confirmModalCallback = onConfirm;
        document.getElementById("confirmModalOverlay").classList.add("show");
    }

    function closeConfirmModal(confirmed) {
        document.getElementById("confirmModalOverlay").classList.remove("show");
        var cb = confirmModalCallback;
        confirmModalCallback = null;
        if (confirmed && typeof cb === "function") cb();
    }

    function openClearNotificationChoice() {
        document.getElementById("notifClearChoiceOverlay").classList.add("show");
    }

    function closeClearNotificationChoice() {
        document.getElementById("notifClearChoiceOverlay").classList.remove("show");
    }

    function chooseDeleteManually() {
        closeClearNotificationChoice();
        notifManualMode = true;
        notifSelectedIds = [];
        renderOrdersPanel();
    }

    function chooseClearReadFromPopup() {
        closeClearNotificationChoice();
        clearReadOrders();
    }

    function cancelManualDeleteMode() {
        notifManualMode = false;
        notifSelectedIds = [];
        renderOrdersPanel();
    }

    function toggleNotifSelect(orderId, event) {
        if (event) event.stopPropagation();

        var idx = notifSelectedIds.indexOf(orderId);
        if (idx === -1) notifSelectedIds.push(orderId);
        else notifSelectedIds.splice(idx, 1);

        renderOrdersPanel();
    }

    function confirmManualDelete() {
        if (notifSelectedIds.length === 0) return;

        var user = getCurrentUser();
        if (!user) return;

        if (!confirm("Delete " + notifSelectedIds.length + " selected notification(s)? This can't be undone.")) return;

        var orders = getOrders();
        var idsToDelete = notifSelectedIds.filter(function (id) {
            var o = orders.find(function (x) { return x.id === id; });
            return o && !isOrderUnreadFor(o, user);
        });

        orders.forEach(function (o) {
            if (idsToDelete.indexOf(o.id) !== -1) {
                o.clearedBy = o.clearedBy || [];
                if (o.clearedBy.indexOf(user.email) === -1) o.clearedBy.push(user.email);
            }
        });

        saveOrdersList(orders);

        notifManualMode = false;
        notifSelectedIds = [];
        renderOrdersPanel();
        refreshOrderUI();
    }

    function renderOrdersPanel() {
        var user = getCurrentUser();
        if (!user) return;

        var titleEl = document.getElementById("ordersPanelTitle");
        var listEl = document.getElementById("ordersPanelList");
        var headerEl = document.getElementById("ordersPanelHeader");
        var toolbarEl = document.getElementById("ordersPanelManualToolbar");
        var orders = getOrders();

        if (user.isOwner) {
            titleEl.textContent = "All Orders";
        } else if (user.isSeller) {
            titleEl.textContent = "Order Notifications";
            orders = orders.filter(function (o) { return getOrderRoleFor(o, user) !== "none"; });
        } else {
            titleEl.textContent = "My Orders";
            orders = orders.filter(function (o) { return o.buyerEmail === user.email; });
        }

        orders = orders.filter(function (o) { return !(o.clearedBy && o.clearedBy.indexOf(user.email) !== -1); });

        orders = orders.slice().reverse();

        
        orders.sort(function (a, b) {
            var aUnread = isOrderUnreadFor(a, user) ? 0 : 1;
            var bUnread = isOrderUnreadFor(b, user) ? 0 : 1;
            return aUnread - bUnread;
        });

        var hasReadOrders = orders.some(function (o) { return !isOrderUnreadFor(o, user); });

        if (notifManualMode) {
            headerEl.style.display = "none";
            toolbarEl.style.display = "flex";

            var readIds = orders.filter(function (o) { return !isOrderUnreadFor(o, user); }).map(function (o) { return o.id; });
            notifSelectedIds = notifSelectedIds.filter(function (id) { return readIds.indexOf(id) !== -1; });

            document.getElementById("manualSelectedCount").textContent = notifSelectedIds.length + " selected";
            var deleteBtn = document.getElementById("manualDeleteBtn");
            deleteBtn.disabled = notifSelectedIds.length === 0;
        } else {
            headerEl.style.display = "flex";
            toolbarEl.style.display = "none";

            var clearBtn = document.getElementById("ordersPanelClearBtn");
            clearBtn.style.display = hasReadOrders ? "inline-block" : "none";
        }

        if (orders.length === 0) {
            var emptyText = user.isOwner
                ? "No orders yet."
                : (user.isSeller ? "No order notifications right now." : "You haven't placed any orders yet.");
            listEl.innerHTML = '<p class="orders-panel-empty">' + emptyText + '</p>';
            return;
        }

        listEl.innerHTML = orders.map(function (o) {
            var role = getOrderRoleFor(o, user);
            var statusLabel = o.status === "pending" ? "Pending Approval" : (o.status === "confirmed" ? "Confirmed" : (o.status === "delivered" ? "Delivered" : "Cancelled"));
            var unread = role === "owner" ? o.ownerUnread : (role === "seller-assigned" ? o.sellerUnread : o.buyerUnread);
            var isRead = !isOrderUnreadFor(o, user);

            var sellerNote = "";
            if (o.sellerEmail && (role === "owner" || role === "seller-assigned")) {
                sellerNote = '<div class="order-row-seller-note">Handled by: ' + escapeHtml(o.sellerName || "Seller") + '</div>';
            }

            var innerHtml =
                '<div class="order-row-top">' +
                    '<strong>₱' + o.total.toFixed(2) + '</strong>' +
                    '<span class="order-status order-status-' + o.status + '">' + statusLabel + (unread ? " (" + unread + " new)" : "") + '</span>' +
                '</div>' +
                '<div class="order-row-items">' + escapeHtml(orderSummaryText(o)) + '</div>' +
                sellerNote +
                '<div class="order-row-footer">' +
                    '<div class="order-row-buyer">' +
                        (user.isOwner
                            ? '<span class="buyer-name-link" onclick="openUserProfileView(\'' + escapeHtml(o.buyerEmail || "") + '\', \'' + escapeHtml(o.buyerName || "") + '\', event)">' + escapeHtml(o.buyerName) + '</span> — '
                            : (role === "seller-pending" || role === "seller-assigned"
                                ? escapeHtml(o.buyerName || "") + ' — '
                                : '')) +
                        escapeHtml(o.date) +
                    '</div>' +
                '</div>';

            if (notifManualMode) {
                var checked = notifSelectedIds.indexOf(o.id) !== -1;
                var checkboxHtml = isRead
                    ? '<div class="order-row-checkbox-wrap"><input type="checkbox" ' + (checked ? "checked" : "") + ' onclick="toggleNotifSelect(\'' + o.id + '\', event)"></div>'
                    : '<div class="order-row-checkbox-wrap"></div>';

                var rowClass = "order-row order-row-manual" + (isRead ? " order-row-selectable" : " order-row-locked");
                var rowClick = isRead ? ' onclick="toggleNotifSelect(\'' + o.id + '\', event)"' : '';

                return (
                    '<div class="' + rowClass + '"' + rowClick + '>' +
                        checkboxHtml +
                        '<div class="order-row-main">' + innerHtml + '</div>' +
                    '</div>'
                );
            }

            return '<div class="order-row" onclick="openOrderAction(\'' + o.id + '\')">' + innerHtml + '</div>';
        }).join("");
    }

    function clearReadOrders() {
        var user = getCurrentUser();
        if (!user) return;

        if (!confirm("Clear all notifications you've already read?")) return;

        var orders = getOrders();
        var scoped = orders.filter(function (o) { return getOrderRoleFor(o, user) !== "none"; });
        var idsToRemove = scoped.filter(function (o) { return !isOrderUnreadFor(o, user); })
            .map(function (o) { return o.id; });

        orders.forEach(function (o) {
            if (idsToRemove.indexOf(o.id) !== -1) {
                o.clearedBy = o.clearedBy || [];
                if (o.clearedBy.indexOf(user.email) === -1) o.clearedBy.push(user.email);
            }
        });

        saveOrdersList(orders);
        renderOrdersPanel();
        refreshOrderUI();
    }

    function openOrderHistory() {
        var user = getCurrentUser();
        if (!user) {
            openAuthModal();
            return;
        }

        renderOrderHistory();
        document.getElementById("orderHistoryOverlay").classList.add("show");
    }

    function closeOrderHistory() {
        document.getElementById("orderHistoryOverlay").classList.remove("show");
    }

    function renderOrderHistory() {
        var user = getCurrentUser();
        if (!user) return;

        var listEl = document.getElementById("orderHistoryList");
        var orders = getOrders();

        if (user.isOwner) {
            
        } else if (user.isSeller) {
            orders = orders.filter(function (o) { return getOrderRoleFor(o, user) !== "none"; });
        } else {
            orders = orders.filter(function (o) { return o.buyerEmail === user.email; });
        }

        orders = orders.slice().reverse();

        if (orders.length === 0) {
            var emptyText = user.isOwner
                ? "No orders yet."
                : (user.isSeller ? "No orders yet." : "You haven't placed any orders yet.");
            listEl.innerHTML = '<p class="orders-panel-empty">' + emptyText + '</p>';
            return;
        }

        var rows = [];
        orders.forEach(function (o) {
            (o.items || []).forEach(function (item) {
                var metaParts = [];
                if (item.size) metaParts.push("Size: " + item.size);
                metaParts.push("Qty: " + item.qty);

                rows.push(
                    '<div class="order-history-item-row" onclick="goToProductFromOrderHistory(\'' + escapeHtml(item.id) + '\')">' +
                        '<div class="order-history-item-info">' +
                            '<div class="order-history-item-name">' + escapeHtml(item.name) + '</div>' +
                            '<div class="order-history-item-meta">' + escapeHtml(metaParts.join(" \u00b7 ")) + '</div>' +
                        '</div>' +
                    '</div>'
                );
            });
        });

        listEl.innerHTML = rows.length > 0
            ? rows.join("")
            : '<p class="orders-panel-empty">No orders yet.</p>';
    }

    function goToProductFromOrderHistory(productId) {
        var product = PRODUCTS[productId];
        if (!product) {
            alert("This product is no longer available.");
            return;
        }

        closeOrderHistory();
        openProductDetail(productId);
    }

    var orderTrackingTab = "toship";

    function openOrderTracking() {
        var user = getCurrentUser();
        if (!user) {
            openAuthModal();
            return;
        }

        orderTrackingTab = "toship";
        document.getElementById("orderTrackingOverlay").classList.add("show");
        renderOrderTracking();
    }

    function closeOrderTracking() {
        document.getElementById("orderTrackingOverlay").classList.remove("show");
    }

    function setOrderTrackingTab(tab) {
        orderTrackingTab = tab;
        renderOrderTracking();
    }

    function renderOrderTracking() {
        var user = getCurrentUser();
        if (!user) return;

        document.querySelectorAll("#orderTrackingTabs .order-tracking-tab").forEach(function (btn) {
            btn.classList.toggle("active", btn.getAttribute("data-tab") === orderTrackingTab);
        });

        if (orderTrackingTab === "toreview") {
            renderReviewOrders();
            return;
        }
        if (orderTrackingTab === "returns") {
            renderReturnsOrders();
            return;
        }

        var statusByTab = {
            toship: "pending",
            toreceive: "confirmed"
        };
        var emptyTextByTab = {
            toship: "No orders to ship.",
            toreceive: "No orders to receive."
        };

        var listEl = document.getElementById("orderTrackingList");
        var orders = getOrders().filter(function (o) {
            return o.buyerEmail === user.email && o.status === statusByTab[orderTrackingTab];
        });
        orders = orders.slice().reverse();

        if (orders.length === 0) {
            listEl.innerHTML = '<p class="orders-panel-empty">' + emptyTextByTab[orderTrackingTab] + '</p>';
            return;
        }

        listEl.innerHTML = orders.map(function (o) {
            var statusLabel = o.status === "pending" ? "Pending Approval" : (o.status === "confirmed" ? "In Transit" : (o.status === "delivered" ? "Delivered" : "Cancelled"));

            return (
                '<div class="order-row" onclick="openOrderAction(\'' + o.id + '\')">' +
                    '<div class="order-row-top">' +
                        '<strong>&#8369;' + o.total.toFixed(2) + '</strong>' +
                        '<span class="order-status order-status-' + o.status + '">' + statusLabel + '</span>' +
                    '</div>' +
                    '<div class="order-row-items">' + escapeHtml(orderSummaryText(o)) + '</div>' +
                    '<div class="order-row-eta">\uD83D\uDE9A ' + escapeHtml(orderEtaText(o)) + '</div>' +
                    '<div class="order-row-footer">' +
                        '<div class="order-row-buyer">' + escapeHtml(o.date) + '</div>' +
                    '</div>' +
                '</div>'
            );
        }).join("");
    }

    function renderReviewOrders() {
        var user = getCurrentUser();
        var listEl = document.getElementById("orderTrackingList");

        var orders = getOrders().filter(function (o) {
            return o.buyerEmail === user.email && o.status === "delivered" && !o.reviewed;
        });
        orders = orders.slice().reverse();

        if (orders.length === 0) {
            listEl.innerHTML = '<p class="orders-panel-empty">No orders to review.</p>';
            return;
        }

        listEl.innerHTML = orders.map(function (o) {
            var firstItem = o.items[0] || {};
            var extraCount = o.items.length - 1;
            var nameLine = escapeHtml(firstItem.name || "") + (extraCount > 0 ? " +" + extraCount + " more" : "");
            var variantLine = firstItem.size ? escapeHtml(firstItem.size) : "";
            var thumb = firstItem.image
                ? '<img class="review-order-thumb" src="' + firstItem.image + '" alt="">'
                : '<div class="review-order-thumb"></div>';

            var starsHtml = "";
            for (var i = 1; i <= 5; i++) {
                starsHtml += '<span class="quick-review-star" onclick="quickReviewSubmit(\'' + o.id + '\', ' + i + ')">&#9733;</span>';
            }

            var refundBtnHtml = o.refundStatus
                ? '<button type="button" class="review-refund-btn" disabled>Refund Requested</button>'
                : '<button type="button" class="review-refund-btn" onclick="openRefundRequestForm(\'' + o.id + '\')">Request Refund</button>';

            return (
                '<div class="review-order-card">' +
                    '<div class="review-order-top" onclick="openOrderAction(\'' + o.id + '\')">' +
                        thumb +
                        '<div class="review-order-info">' +
                            '<div class="review-order-name">' + nameLine + '</div>' +
                            (variantLine ? '<div class="review-order-variant">' + variantLine + '</div>' : '') +
                        '</div>' +
                    '</div>' +
                    '<div class="review-order-total">Total: <strong>&#8369;' + o.total.toFixed(2) + '</strong></div>' +
                    '<div class="review-order-actions">' +
                        refundBtnHtml +
                        '<button type="button" class="review-write-btn" onclick="openWriteReview(\'' + o.id + '\')">Write Review</button>' +
                    '</div>' +
                    '<div class="quick-review-row">' +
                        '<span class="quick-review-label">Quick review</span>' +
                        '<div class="quick-review-stars">' + starsHtml + '</div>' +
                    '</div>' +
                '</div>'
            );
        }).join("");
    }

    function renderReturnsOrders() {
        var user = getCurrentUser();
        var listEl = document.getElementById("orderTrackingList");

        var orders = getOrders().filter(function (o) {
            return o.buyerEmail === user.email && !!o.refundStatus;
        });
        orders = orders.slice().reverse();

        if (orders.length === 0) {
            listEl.innerHTML = '<p class="orders-panel-empty">No returns.</p>';
            return;
        }

        var labelByStatus = { pending: "Pending Approval", approved: "Returning", completed: "Success Return" };

        listEl.innerHTML = orders.map(function (o) {
            return (
                '<div class="order-row" onclick="openOrderAction(\'' + o.id + '\')">' +
                    '<div class="order-row-top">' +
                        '<strong>&#8369;' + o.total.toFixed(2) + '</strong>' +
                        '<span class="order-status order-status-refund-' + o.refundStatus + '">' + labelByStatus[o.refundStatus] + '</span>' +
                    '</div>' +
                    '<div class="order-row-items">' + escapeHtml(orderSummaryText(o)) + '</div>' +
                    '<div class="order-row-footer">' +
                        '<div class="order-row-buyer">' + escapeHtml(o.date) + '</div>' +
                    '</div>' +
                '</div>'
            );
        }).join("");
    }

    var refundRequestOrderId = null;
    var refundPhotoDataUrl = "";
    var REFUND_FIXED_METHODS = ["GCash"];

    function refundMethodFieldsHtml(method) {
        if (method === "GCash") {
            return (
                '<label class="refund-field-label">Account Name</label>' +
                '<input type="text" id="refundAccName" class="refund-input">' +
                '<label class="refund-field-label">Account Number</label>' +
                '<input type="text" id="refundAccNumber" class="refund-input">'
            );
        }
        return "";
    }

    function renderRefundMethodFields() {
        var order = getOrders().find(function (o) { return o.id === refundRequestOrderId; });
        var method = order && REFUND_FIXED_METHODS.indexOf(order.method) !== -1
            ? order.method
            : document.getElementById("refundMethodSelect").value;
        document.getElementById("refundMethodFields").innerHTML = refundMethodFieldsHtml(method);
    }

    function toggleRefundRoleFields() {
        var role = document.querySelector('input[name="refundRole"]:checked');
        document.getElementById("refundStudentFields").style.display = (role && role.value === "Student") ? "block" : "none";
    }

    function handleRefundPhoto(input) {
        if (!input.files || !input.files[0]) return;

        readImageAsResizedDataUrl(input.files[0], 900, 0.7, function (dataUrl) {
            refundPhotoDataUrl = dataUrl;
            document.getElementById("refundPhotoPreview").src = dataUrl;
            document.getElementById("refundPhotoPreviewWrap").style.display = "inline-block";
        }, function () {
            alert("Couldn't read that image. Please try a different photo.");
        });
    }

    function removeRefundPhoto() {
        refundPhotoDataUrl = "";
        var prev = document.getElementById("refundPhotoPreview");
        if (prev) prev.src = "";
        var wrap = document.getElementById("refundPhotoPreviewWrap");
        if (wrap) wrap.style.display = "none";
    }

    function openRefundRequestForm(orderId) {
        var order = getOrders().find(function (o) { return o.id === orderId; });
        if (!order || order.refundStatus) return;

        refundRequestOrderId = orderId;
        removeRefundPhoto();

        document.getElementById("refundFullName").value = "";
        document.getElementById("refundAddress").value = "";
        document.querySelectorAll('input[name="refundRole"]').forEach(function (r) { r.checked = false; });
        document.getElementById("refundStudentFields").style.display = "none";
        document.getElementById("refundYearLevel").value = "";
        document.getElementById("refundSection").value = "";
        document.getElementById("refundReason").value = "";
        document.getElementById("refundError").textContent = "";

        var fixedEl = document.getElementById("refundMethodFixed");
        var selectEl = document.getElementById("refundMethodSelect");
        selectEl.value = "";

        if (REFUND_FIXED_METHODS.indexOf(order.method) !== -1) {
            fixedEl.style.display = "block";
            fixedEl.textContent = order.method;
            selectEl.style.display = "none";
        } else {
            fixedEl.style.display = "none";
            selectEl.style.display = "block";
        }
        document.getElementById("refundMethodFields").innerHTML = "";
        if (REFUND_FIXED_METHODS.indexOf(order.method) !== -1) renderRefundMethodFields();

        document.getElementById("orderTrackingOverlay").classList.remove("show");
        document.getElementById("refundRequestOverlay").classList.add("show");
    }

    function closeRefundRequest() {
        document.getElementById("refundRequestOverlay").classList.remove("show");
        refundRequestOrderId = null;
    }

    function submitRefundRequest() {
        var order = getOrders().find(function (o) { return o.id === refundRequestOrderId; });
        var errorEl = document.getElementById("refundError");
        if (!order) return;

        var fullName = document.getElementById("refundFullName").value.trim();
        var address = document.getElementById("refundAddress").value.trim();
        var roleEl = document.querySelector('input[name="refundRole"]:checked');
        var role = roleEl ? roleEl.value : "";
        var yearLevel = document.getElementById("refundYearLevel").value.trim();
        var section = document.getElementById("refundSection").value.trim();
        var reason = document.getElementById("refundReason").value.trim();

        var method = REFUND_FIXED_METHODS.indexOf(order.method) !== -1
            ? order.method
            : document.getElementById("refundMethodSelect").value;

        if (!fullName || !address || !role || !reason || !method) {
            errorEl.textContent = "Please fill out all required fields.";
            return;
        }
        if (role === "Student" && (!yearLevel || !section)) {
            errorEl.textContent = "Please fill out year level and section.";
            return;
        }

        var accNameEl = document.getElementById("refundAccName");
        var accNumberEl = document.getElementById("refundAccNumber");
        var accName = accNameEl ? accNameEl.value.trim() : "";
        var accNumber = accNumberEl ? accNumberEl.value.trim() : "";

        if (!accName || !accNumber) {
            errorEl.textContent = "Please fill out your account details.";
            return;
        }

        var orders = getOrders();
        var target = orders.find(function (o) { return o.id === refundRequestOrderId; });
        if (!target) return;

        target.refundStatus = "pending";
        target.refundRequest = {
            fullName: fullName,
            address: address,
            role: role,
            yearLevel: role === "Student" ? yearLevel : "",
            section: role === "Student" ? section : "",
            paymentMethod: method,
            accountName: accName,
            accountNumber: accNumber,
            reason: reason,
            photo: refundPhotoDataUrl || "",
            submittedAt: new Date().toLocaleString()
        };
        target.ownerUnread = (target.ownerUnread || 0) + 1;

        saveOrdersList(orders);

        closeRefundRequest();
        orderTrackingTab = "returns";
        document.getElementById("orderTrackingOverlay").classList.add("show");
        renderOrderTracking();
        refreshOrderUI();
    }

    function postOrderReviewToProducts(order) {
        var user = getCurrentUser();
        if (!user || !order) return;

        var isAnon = !!order.reviewAnonymous;
        var displayName = isAnon ? "Anonymous" : user.name;
        var displayAvatar = isAnon ? "" : (user.avatar || "");
        var dateStr = new Date().toLocaleDateString();
        var ts = Date.now();

        var productIds = [];
        (order.items || []).forEach(function (it) {
            if (it.id && productIds.indexOf(it.id) === -1) productIds.push(it.id);
        });

        var hasText = !!(order.reviewText && order.reviewText.trim() !== "");
        var hasPhoto = !!order.reviewPhoto;

        productIds.forEach(function (productId) {
            saveReview(productId, {
                name: displayName,
                email: user.email,
                avatar: displayAvatar,
                rating: order.reviewRating,
                date: dateStr
            });

            if (hasText || hasPhoto) {
                saveComment(productId, {
                    name: displayName,
                    email: user.email,
                    avatar: displayAvatar,
                    comment: order.reviewText || "",
                    date: dateStr,
                    ts: ts,
                    rating: order.reviewRating,
                    photo: order.reviewPhoto || "",
                    anonymous: isAnon,
                    verified: true,
                    orderId: order.id
                });
            }
        });

        if (typeof renderAllProductRatings === "function") renderAllProductRatings();
        if (currentProductId && productIds.indexOf(currentProductId) !== -1 && typeof renderProductReviews === "function") {
            renderProductReviews(currentProductId);
        }
    }

    function quickReviewSubmit(orderId, rating) {
        var orders = getOrders();
        var order = orders.find(function (o) { return o.id === orderId; });
        if (!order) return;

        order.reviewRating = rating;
        order.reviewed = true;
        saveOrdersList(orders);

        postOrderReviewToProducts(order);

        renderOrderTracking();
    }

    var writeReviewOrderId = null;
    var writeReviewRating = 0;
    var writeReviewTags = [];
    var writeReviewPhotoDataUrl = "";

    function openWriteReview(orderId) {
        var order = getOrders().find(function (o) { return o.id === orderId; });
        if (!order) return;

        writeReviewOrderId = orderId;
        writeReviewRating = 0;
        writeReviewTags = [];
        writeReviewPhotoDataUrl = "";

        var firstItem = order.items[0] || {};
        var extraCount = order.items.length - 1;
        var thumb = firstItem.image
            ? '<img src="' + firstItem.image + '" alt="">'
            : '<img src="" alt="" style="visibility:hidden;">';

        document.getElementById("writeReviewProduct").innerHTML =
            thumb +
            '<div>' +
                '<div class="write-review-product-name">' + escapeHtml(firstItem.name || "") + (extraCount > 0 ? " +" + extraCount + " more" : "") + '</div>' +
                (firstItem.size ? '<div class="write-review-product-variant">' + escapeHtml(firstItem.size) + '</div>' : '') +
            '</div>';

        document.querySelectorAll(".write-review-tag").forEach(function (btn) {
            btn.classList.remove("selected");
        });
        document.getElementById("writeReviewText").value = "";
        document.getElementById("writeReviewCharCount").textContent = "0/300";
        document.getElementById("writeReviewAnon").checked = false;
        document.getElementById("writeReviewPhotoPreview").style.display = "none";
        document.getElementById("writeReviewPhotoPreview").src = "";
        document.getElementById("writeReviewPhotoText").textContent = "Add photo";

        renderWriteReviewStars();
        updateWriteReviewSubmitState();

        document.getElementById("orderTrackingOverlay").classList.remove("show");
        document.getElementById("writeReviewOverlay").classList.add("show");
    }

    function closeWriteReview() {
        document.getElementById("writeReviewOverlay").classList.remove("show");
        writeReviewOrderId = null;
    }

    function renderWriteReviewStars() {
        var el = document.getElementById("writeReviewStars");
        var html = "";
        for (var i = 1; i <= 5; i++) {
            html += '<span class="write-review-star' + (i <= writeReviewRating ? " filled" : "") + '" onclick="setWriteReviewRating(' + i + ')">&#9733;</span>';
        }
        el.innerHTML = html;
    }

    function setWriteReviewRating(rating) {
        writeReviewRating = rating;
        renderWriteReviewStars();
        updateWriteReviewSubmitState();
    }

    function toggleWriteReviewTag(tag) {
        var idx = writeReviewTags.indexOf(tag);
        if (idx === -1) writeReviewTags.push(tag);
        else writeReviewTags.splice(idx, 1);

        document.querySelectorAll(".write-review-tag").forEach(function (btn) {
            btn.classList.toggle("selected", writeReviewTags.indexOf(btn.getAttribute("data-tag")) !== -1);
        });
    }

    function updateWriteReviewCharCount() {
        var text = document.getElementById("writeReviewText").value;
        document.getElementById("writeReviewCharCount").textContent = text.length + "/300";
    }

    function handleWriteReviewPhoto(input) {
        if (!input.files || !input.files[0]) return;

        readImageAsResizedDataUrl(input.files[0], 900, 0.7, function (dataUrl) {
            writeReviewPhotoDataUrl = dataUrl;
            var preview = document.getElementById("writeReviewPhotoPreview");
            preview.src = writeReviewPhotoDataUrl;
            preview.style.display = "block";
            document.getElementById("writeReviewPhotoText").textContent = "Change photo";
        }, function () {
            alert("Couldn't read that image. Please try a different photo.");
        });
    }

    function updateWriteReviewSubmitState() {
        document.getElementById("writeReviewSubmitBtn").disabled = writeReviewRating === 0;
    }

    function submitWriteReview() {
        if (!writeReviewOrderId || writeReviewRating === 0) return;

        var orders = getOrders();
        var order = orders.find(function (o) { return o.id === writeReviewOrderId; });
        if (!order) return;

        order.reviewed = true;
        order.reviewRating = writeReviewRating;
        order.reviewText = document.getElementById("writeReviewText").value.trim();
        order.reviewTags = writeReviewTags.slice();
        order.reviewPhoto = writeReviewPhotoDataUrl || "";
        order.reviewAnonymous = document.getElementById("writeReviewAnon").checked;
        saveOrdersList(orders);

        postOrderReviewToProducts(order);

        closeWriteReview();
        orderTrackingTab = "toreview";
        document.getElementById("orderTrackingOverlay").classList.add("show");
        renderOrderTracking();
    }

    function openOrderAction(orderId) {
        var order = getOrders().find(function (o) { return o.id === orderId; });
        var user = getCurrentUser();
        if (!order || !user) return;

        var role = getOrderRoleFor(order, user);
        if (role === "none") return;

        currentOrderActionId = orderId;

        var orders = getOrders();
        var target = orders.find(function (o) { return o.id === orderId; });
        if (target) {
            if (role === "owner") target.ownerUnread = 0;
            else if (role === "seller-assigned") target.sellerUnread = 0;
            else if (role === "buyer") target.buyerUnread = 0;
            saveOrdersList(orders);
        }

        document.getElementById("ordersPanelOverlay").classList.remove("show");
        document.getElementById("orderTrackingOverlay").classList.remove("show");
        document.getElementById("orderActionOverlay").classList.add("show");

        renderOrderAction();
        refreshOrderUI();
    }

    function closeOrderAction() {
        trackCleanup();
        document.getElementById("orderActionOverlay").classList.remove("show");
        currentOrderActionId = null;
    }

    function renderOrderAction() {
        var order = getOrders().find(function (o) { return o.id === currentOrderActionId; });
        var user = getCurrentUser();
        if (!order || !user) return;

        var role = getOrderRoleFor(order, user);
        if (role === "none") {
            closeOrderAction();
            return;
        }

        var isOwnerView = role === "owner";
        var isSellerView = role === "seller-pending" || role === "seller-assigned";
        var isStaffView = isOwnerView || isSellerView;
        var itemsText = orderSummaryText(order);

        var avatarEl = document.getElementById("orderActionAvatar");
        avatarEl.classList.add("presence-avatar-wrap");
        if (isStaffView) {
            var initials = (order.buyerName || "?").trim().charAt(0).toUpperCase() || "?";
            var liveBuyerAvatar = liveAvatarFor(order.buyerEmail, order.buyerAvatar);
            avatarEl.innerHTML =
                (liveBuyerAvatar
                    ? '<img src="' + liveBuyerAvatar + '" class="order-action-avatar-img" alt="">'
                    : '<div class="order-action-avatar-initials">' + escapeHtml(initials) + '</div>') +
                '<span class="presence-dot' + (isUserOnline(order.buyerEmail) ? ' online' : '') + '"></span>';
            if (isOwnerView) {
                avatarEl.classList.add("profile-link-clickable");
                avatarEl.onclick = function () { openUserProfileView(order.buyerEmail, order.buyerName); };
            } else {
                avatarEl.classList.remove("profile-link-clickable");
                avatarEl.onclick = null;
            }
        } else {
            var shopOnline = isUserOnline(OWNER_EMAIL) || (order.sellerEmail && isUserOnline(order.sellerEmail));
            avatarEl.innerHTML =
                '<div class="order-action-avatar-initials">A</div>' +
                '<span class="presence-dot' + (shopOnline ? ' online' : '') + '"></span>';
            avatarEl.classList.remove("profile-link-clickable");
            avatarEl.onclick = null;
        }

        var titleEl = document.getElementById("orderActionTitle");
        if (isOwnerView) {
            titleEl.innerHTML = '<span class="profile-link-clickable" onclick="openUserProfileView(\'' + escapeHtml(order.buyerEmail || "") + '\', \'' + escapeHtml(order.buyerName || "") + '\')">' + escapeHtml(order.buyerName) + '</span> — Order';
        } else if (isSellerView) {
            titleEl.textContent = escapeHtml(order.buyerName) + " — Order";
        } else {
            titleEl.textContent = "CVSPEE — Your Order";
        }
        document.getElementById("orderActionSub").textContent = itemsText;

        var detailsHtml =
            '<strong>Items:</strong> ' + escapeHtml(itemsText) + '<br>' +
            '<strong>Total:</strong> ₱' + order.total.toFixed(2) + '<br>' +
            '<strong>Payment Method:</strong> ' + escapeHtml(order.method) + '<br>';

        if (order.details && (order.details.name || order.details.lat != null)) {
            detailsHtml += codDetailsHtml(order.details);
        }

        if (order.details && order.details.paymentProof) {
            detailsHtml +=
                '<strong>Payment Proof:</strong><br>' +
                '<img src="' + order.details.paymentProof + '" class="order-action-proof-img" alt="Payment proof"><br>';
        }

        if (isOwnerView) {
            detailsHtml += '<strong>Buyer:</strong> ' + escapeHtml(order.buyerName) + ' (' + escapeHtml(order.buyerEmail) + ')<br>';
        } else if (isSellerView) {
            detailsHtml += '<strong>Buyer:</strong> ' + escapeHtml(order.buyerName) + '<br>';
        }

        if (order.sellerEmail && isStaffView) {
            detailsHtml += '<strong>Seller:</strong> ' + escapeHtml(order.sellerName || "") + '<br>';
        }

        detailsHtml += '<strong>Date:</strong> ' + escapeHtml(order.date);

        document.getElementById("orderActionDetails").innerHTML = detailsHtml;
        renderTrackCard(order);

        var buttonsEl = document.getElementById("orderActionButtons");
        var chatSection = document.getElementById("orderChatSection");
        chatSection.style.display = "none";

        buttonsEl.style.display = "block";
        if (order.status === "pending") {
            buttonsEl.innerHTML = '<p class="orders-panel-empty">Waiting for approval.</p>';
        } else if (order.status === "cancelled") {
            buttonsEl.innerHTML = '<p class="orders-panel-empty">This order was cancelled.</p>';
        } else if (order.status === "delivered") {
            buttonsEl.innerHTML = '<p class="orders-panel-empty">This order has been delivered.</p>';
        } else {
            buttonsEl.innerHTML = '<p class="orders-panel-empty">This order is confirmed.</p>';
        }
    }

    /* ===== Estimated parcel tracking on a map (no live GPS) ===== */
    /* Starting point of the parcel. Change this to your shop's real pickup location. */
    var SHOP_LOC = { lat: 14.4837, lng: 120.899 };

    function rtDay(ts) { return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
    function rtDT(ts) { return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
    function orderEtaEnd(o) {
        if (o.eta) return o.eta;
        var b = o.confirmedAt || o.createdAt || Date.parse(o.date);
        return b ? b + 2 * 86400000 : 0;
    }
    function orderEtaText(o) {
        if (!o || o.status === "cancelled") return "";
        if (o.status === "pending") return "Waiting for seller confirmation";
        if (o.status === "delivered") return o.deliveredAt ? "Delivered on " + rtDT(o.deliveredAt) : "Delivered";
        if (o.eta) return "Estimated arrival: " + rtDT(o.eta);
        var b = o.confirmedAt || o.createdAt || Date.parse(o.date);
        if (!b) return "";
        return "Estimated arrival: " + rtDay(b + 86400000) + " \u2013 " + rtDay(b + 3 * 86400000);
    }
    function rtLeft(ms) {
        if (ms <= 0) return "Arriving any moment";
        var m = Math.round(ms / 60000);
        if (m < 60) return Math.max(1, m) + " min left";
        var h = Math.floor(m / 60);
        if (h < 24) return h + "h " + (m % 60) + "m left";
        return Math.floor(h / 24) + "d " + (h % 24) + "h left";
    }
    function rtProgress(start, end) {
        return Math.min(0.98, Math.max(0, (Date.now() - start) / Math.max(end - start, 1)));
    }
    function trkMeters(a, b) {
        var R = 6371000, rad = Math.PI / 180, dLa = (b[0] - a[0]) * rad, dLo = (b[1] - a[1]) * rad;
        var x = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
        return 2 * R * Math.asin(Math.sqrt(x));
    }
    var TRK_VAN = '<div class="trk-van-in"><svg viewBox="0 0 60 34" width="52" height="30" aria-hidden="true">' +
        '<rect x="2" y="5" width="34" height="21" rx="3" fill="#0B5C2E"/>' +
        '<text x="19" y="19" font-size="7" font-weight="700" fill="#FFC72C" text-anchor="middle" font-family="Arial,sans-serif">CVSPEE</text>' +
        '<path d="M37 11h10l8 9v6H37z" fill="#FFC72C"/><path d="M41 13.5h5l4.5 5.5H41z" fill="#d7ecff"/>' +
        '<circle cx="14" cy="28" r="5" fill="#222"/><circle cx="14" cy="28" r="2" fill="#bbb"/>' +
        '<circle cx="46" cy="28" r="5" fill="#222"/><circle cx="46" cy="28" r="2" fill="#bbb"/></svg></div>';

    var _trk = { map: null, orderId: null, order: null, coords: null, cum: null, total: 0, van: null, done: null, rest: null, timer: null };

    function trkStop() {
        if (_trk.timer) { clearInterval(_trk.timer); _trk.timer = null; }
        if (_trk.map) { try { _trk.map.remove(); } catch (e) {} }
        _trk.map = null; _trk.coords = null; _trk.cum = null; _trk.van = null; _trk.done = null; _trk.rest = null; _trk.total = 0;
    }

    function trackCleanup() {
        trkStop(); _trk.orderId = null; _trk.order = null;
        var h = document.getElementById("orderTrackCard");
        if (h) h.innerHTML = "";
    }

    function trkPrepare(coords) {
        _trk.coords = coords; _trk.cum = [0];
        for (var i = 1; i < coords.length; i++) _trk.cum.push(_trk.cum[i - 1] + trkMeters(coords[i - 1], coords[i]));
        _trk.total = _trk.cum[_trk.cum.length - 1] || 1;
    }

    function trkPointAt(p) {
        var c = _trk.coords, cum = _trk.cum, target = p * _trk.total, i = 1;
        while (i < c.length - 1 && cum[i] < target) i++;
        var seg = (cum[i] - cum[i - 1]) || 1, f = Math.min(1, Math.max(0, (target - cum[i - 1]) / seg));
        return { i: i, pt: [c[i - 1][0] + (c[i][0] - c[i - 1][0]) * f, c[i - 1][1] + (c[i][1] - c[i - 1][1]) * f], east: c[i][1] >= c[i - 1][1] };
    }

    function trkUpdate() {
        var o = _trk.order;
        if (!_trk.map || !_trk.coords || !o) return;
        var start = o.confirmedAt || o.createdAt || Date.parse(o.date) || Date.now();
        var end = orderEtaEnd(o) || start + 2 * 86400000;
        if (end <= start) end = start + 3600000;
        var p = rtProgress(start, end), at = trkPointAt(p);
        _trk.van.setLatLng(at.pt);
        var el = _trk.van.getElement();
        if (el && el.firstChild) el.firstChild.style.transform = at.east ? "none" : "scaleX(-1)";
        _trk.done.setLatLngs(_trk.coords.slice(0, at.i).concat([at.pt]));
        _trk.rest.setLatLngs([at.pt].concat(_trk.coords.slice(at.i)));
        var remM = (1 - p) * _trk.total, note = document.getElementById("trkMapNote");
        if (note) note.textContent = rtLeft(end - Date.now()) + " \u00B7 about " + (remM < 1000 ? Math.max(10, Math.round(remM / 10) * 10) + " m" : (remM / 1000).toFixed(1) + " km") + " away (estimated)";
    }

    function trkBuildMap(order) {
        var d = order.details || {};
        var dest = [d.lat, d.lng];
        var from = [order.shopLat != null ? order.shopLat : SHOP_LOC.lat, order.shopLng != null ? order.shopLng : SHOP_LOC.lng];
        var id = order.id;
        _trk.map = L.map("trkMap", { zoomControl: true });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(_trk.map);
        L.marker(dest, { icon: L.divIcon({ className: "trk-pin", html: "\uD83D\uDCCD", iconSize: [30, 30], iconAnchor: [15, 28] }) })
            .addTo(_trk.map).bindTooltip("Your location", { direction: "top", offset: [0, -26] });
        L.marker(from, { icon: L.divIcon({ className: "trk-pin trk-shop", html: "\uD83C\uDFEA", iconSize: [26, 26], iconAnchor: [13, 13] }) }).addTo(_trk.map).bindTooltip("Seller's starting point", { direction: "top", offset: [0, -12] });
        _trk.map.fitBounds(L.latLngBounds([from, dest]), { padding: [40, 40] });
        function go(coords) {
            if (!_trk.map || _trk.orderId !== id) return;
            trkPrepare(coords);
            _trk.rest = L.polyline(coords, { color: "#9aa5a0", weight: 5, dashArray: "2 9", lineCap: "round" }).addTo(_trk.map);
            _trk.done = L.polyline([coords[0]], { color: "#0B5C2E", weight: 6 }).addTo(_trk.map);
            _trk.van = L.marker(coords[0], { icon: L.divIcon({ className: "trk-van", html: TRK_VAN, iconSize: [52, 30], iconAnchor: [26, 15] }), zIndexOffset: 1000 })
                .addTo(_trk.map).bindTooltip("Out for delivery", { permanent: true, direction: "top", offset: [0, -16], className: "trk-tip" });
            _trk.map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
            trkUpdate();
            _trk.timer = setInterval(trkUpdate, 15000);
        }
        var fallback = [from, dest], done = false;
        function finish(c) { if (done) return; done = true; go(c); }
        try {
            var ctl = (typeof AbortController !== "undefined") ? new AbortController() : null;
            var t = setTimeout(function () { if (ctl) ctl.abort(); finish(fallback); }, 7000);
            fetch("https://router.project-osrm.org/route/v1/driving/" + from[1] + "," + from[0] + ";" + dest[1] + "," + dest[0] + "?overview=full&geometries=geojson", ctl ? { signal: ctl.signal } : {})
                .then(function (r) { return r.json(); })
                .then(function (j) {
                    clearTimeout(t);
                    var g = j && j.routes && j.routes[0] && j.routes[0].geometry && j.routes[0].geometry.coordinates;
                    finish(g && g.length > 1 ? g.map(function (c) { return [c[1], c[0]]; }) : fallback);
                })
                .catch(function () { clearTimeout(t); finish(fallback); });
        } catch (e) { finish(fallback); }
        setTimeout(function () { if (_trk.map) _trk.map.invalidateSize(); }, 250);
    }

    function renderTrackCard(order) {
        var host = document.getElementById("orderTrackCard");
        if (!host) return;
        var st = order.status;
        if (_trk.orderId !== order.id) { trackCleanup(); _trk.orderId = order.id; }
        _trk.order = order;
        if (st === "cancelled") { trkStop(); host.innerHTML = '<div class="trk-card">This order was cancelled.</div>'; return; }
        if (!document.getElementById("trkSteps")) {
            host.innerHTML = '<div class="trk-card"><div class="trk-eta" id="trkTop"></div>' +
                '<div id="trkMapBox" style="display:none;"><div id="trkMap"></div><p class="trk-note" id="trkMapNote"></p></div>' +
                '<ol class="trk-steps" id="trkSteps"></ol></div>';
        }
        var steps = [
            { t: "Order placed", s: "We received your order", ts: order.createdAt, done: true },
            { t: "Order confirmed", s: "The seller accepted the order", ts: order.confirmedAt, done: st !== "pending" },
            { t: "In transit", s: "Your parcel is on the way", done: st === "delivered" },
            { t: "Delivered", s: "Parcel received", ts: order.deliveredAt, done: st === "delivered" }
        ];
        var cur = -1;
        steps.forEach(function (x, i) { if (cur < 0 && !x.done) cur = i; });
        document.getElementById("trkTop").textContent = st === "pending"
            ? "\u23F3 Waiting for the seller to confirm. The estimated arrival time will show once it\u2019s confirmed."
            : "\uD83D\uDE9A " + orderEtaText(order);
        document.getElementById("trkSteps").innerHTML = steps.map(function (x, i) {
            return '<li class="' + (x.done ? "done" : (i === cur ? "cur" : "")) + '"><span class="trk-dot">' + (x.done ? "\u2713" : "") + '</span>' +
                '<div><strong>' + x.t + '</strong><small>' + (x.ts ? rtDT(x.ts) : x.s) + '</small></div></li>';
        }).join("");

        var d = order.details || {}, box = document.getElementById("trkMapBox");
        var canMap = st === "confirmed" && d.lat != null && d.lng != null && typeof L !== "undefined";
        if (!canMap) { trkStop(); box.style.display = "none"; return; }
        box.style.display = "block";
        if (!_trk.map) trkBuildMap(order); else trkUpdate();
    }

    function ownerDecideOrder(newStatus) {
        var user = getCurrentUser();
        if (!user || !user.isOwner) return;

        var orders = getOrders();
        var order = orders.find(function (o) { return o.id === currentOrderActionId; });
        if (!order) return;

        if (newStatus === "confirmed" && !order.eta) { alert("Set the estimated delivery time in the Admin/Seller Panel first."); return; }
        order.status = newStatus;
        if (newStatus === "confirmed") order.confirmedAt = Date.now();
        if (newStatus === "delivered") order.deliveredAt = Date.now();
        order.buyerUnread = (order.buyerUnread || 0) + 1;
        saveOrdersList(orders);

        if (newStatus === "cancelled") {
            adjustStockForItems(order.items, 1);
        }

        renderOrderAction();
        refreshOrderUI();
    }

    
    
    
    
    function sellerConfirmOrder() {
        var user = getCurrentUser();
        if (!user || !user.isSeller || user.isOwner) return;

        var orders = getOrders();
        var order = orders.find(function (o) { return o.id === currentOrderActionId; });
        if (!order || order.status !== "pending" || order.sellerEmail) return;
        if (!order.eta) { alert("Set the estimated delivery time in the Admin/Seller Panel first."); return; }

        order.status = "confirmed";
        order.confirmedAt = Date.now();
        order.sellerEmail = user.email;
        order.sellerName = user.name;
        order.sellerUnread = 0;
        order.buyerUnread = (order.buyerUnread || 0) + 1;
        saveOrdersList(orders);

        renderOrderAction();
        refreshOrderUI();
    }

    function chatSenderRoleFor(order, user) {
        if (!user) return "buyer";
        if (user.isOwner) return "owner";
        if (order.sellerEmail === user.email) return "seller";
        return "buyer";
    }

    
    
    
    function otherChatPartyRole(order, myRole) {
        return myRole === "buyer" ? (order.sellerEmail ? "seller" : "owner") : "buyer";
    }

    function otherChatPartyEmail(order, otherRole) {
        if (otherRole === "buyer") return order.buyerEmail;
        if (otherRole === "seller") return order.sellerEmail;
        return OWNER_EMAIL;
    }

    function renderOrderChatWithHeader(order, user) {
        var headerEl = document.getElementById("orderChatWithHeader");
        if (!headerEl) return;

        var myRole = chatSenderRoleFor(order, user);
        var otherRole = otherChatPartyRole(order, myRole);
        var otherEmail = otherChatPartyEmail(order, otherRole);
        var fallbackName = otherRole === "buyer" ? order.buyerName : (otherRole === "seller" ? (order.sellerName || "Seller") : "CVSPEE");
        var fallbackAvatar = otherRole === "buyer" ? order.buyerAvatar : "";

        var name = liveNameFor(otherEmail, fallbackName) || fallbackName;
        var avatar = liveAvatarFor(otherEmail, fallbackAvatar);
        var initials = name.trim().charAt(0).toUpperCase() || "?";

        var avatarHtml = avatar
            ? '<img src="' + avatar + '" alt="">'
            : '<div class="chat-with-avatar-initials">' + escapeHtml(initials) + '</div>';

        var online = isUserOnline(otherEmail);
        var typing = isOtherTyping(order.id, otherRole);

        headerEl.innerHTML =
            '<div class="chat-with-avatar-wrap">' +
                avatarHtml +
                '<span class="presence-dot' + (online ? ' online' : '') + '"></span>' +
            '</div>' +
            '<div>' +
                '<div class="chat-with-name">' + escapeHtml(name) + '</div>' +
                '<div class="chat-with-status' + (typing ? ' is-typing' : '') + '">' +
                    (typing ? "Typing..." : (online ? "Online" : "Offline")) +
                '</div>' +
            '</div>';
    }

    function renderOrderChatMessages(order) {
        var messagesEl = document.getElementById("orderChatMessages");
        var user = getCurrentUser();
        if (!user) return;

        var myRole = chatSenderRoleFor(order, user);

        renderOrderChatWithHeader(order, user);

        if (!order.messages || order.messages.length === 0) {
            messagesEl.innerHTML = '<p class="review-empty">Order confirmed! Say hi to start the conversation.</p>';
            return;
        }

        
        
        
        order.seenAt = order.seenAt || { buyer: 0, seller: 0, owner: 0 };
        var mySeenAt = order.seenAt[myRole] || 0;
        var hasUnseenFromOther = order.messages.some(function (m) {
            return m.sender !== myRole && (m.ts || 0) > mySeenAt;
        });
        if (hasUnseenFromOther) {
            order.seenAt[myRole] = Date.now();
            saveOrdersList(getOrders());
        }

        var otherRole = otherChatPartyRole(order, myRole);
        var otherEmail = otherChatPartyEmail(order, otherRole);

        var lastMineIndex = -1;
        for (var i = order.messages.length - 1; i >= 0; i--) {
            if (order.messages[i].sender === myRole) { lastMineIndex = i; break; }
        }

        messagesEl.innerHTML = order.messages.map(function (m, idx) {
            var isFromOther = m.sender !== myRole;
            var html = '<div class="chat-bubble ' + (isFromOther ? "chat-bubble-ai" : "chat-bubble-user") + '">' + escapeHtml(m.text) + '</div>';

            if (!isFromOther && idx === lastMineIndex) {
                var otherSeenAt = (order.seenAt && order.seenAt[otherRole]) || 0;
                var status = "Sent";
                if (otherSeenAt >= (m.ts || 0)) status = "Seen";
                else if (isUserOnline(otherEmail)) status = "Delivered";
                html += '<div class="chat-status-label">' + status + '</div>';
            }
            return html;
        }).join("");

        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function sendOrderChatMessage() {
        var input = document.getElementById("orderChatInput");
        var text = input.value.trim();
        var user = getCurrentUser();
        if (!text || !currentOrderActionId || !user) return;

        var orders = getOrders();
        var order = orders.find(function (o) { return o.id === currentOrderActionId; });
        if (!order) return;

        var role = getOrderRoleFor(order, user);
        if (role !== "owner" && role !== "buyer" && role !== "seller-assigned") return;

        var sender = chatSenderRoleFor(order, user);

        order.messages = order.messages || [];
        order.messages.push({ sender: sender, text: text, time: new Date().toLocaleTimeString(), ts: Date.now() });

        
        
        
        if (sender === "buyer") {
            order.ownerUnread = (order.ownerUnread || 0) + 1;
            if (order.sellerEmail) order.sellerUnread = (order.sellerUnread || 0) + 1;
        } else if (sender === "owner") {
            order.buyerUnread = (order.buyerUnread || 0) + 1;
            if (order.sellerEmail) order.sellerUnread = (order.sellerUnread || 0) + 1;
        } else if (sender === "seller") {
            order.buyerUnread = (order.buyerUnread || 0) + 1;
            order.ownerUnread = (order.ownerUnread || 0) + 1;
        }

        saveOrdersList(orders);
        input.value = "";

        renderOrderChatMessages(order);
        refreshOrderUI();
    }

    document.getElementById("orderChatInput").addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            sendOrderChatMessage();
        }
    });

    document.getElementById("orderChatInput").addEventListener("input", function () {
        if (!currentOrderActionId) return;
        var user = getCurrentUser();
        if (!user) return;

        var order = getOrders().find(function (o) { return o.id === currentOrderActionId; });
        if (!order) return;

        var role = getOrderRoleFor(order, user);
        if (role !== "owner" && role !== "buyer" && role !== "seller-assigned") return;

        notifyTyping(currentOrderActionId, chatSenderRoleFor(order, user));
    });

    
    
    

    var currentDmOtherEmail = null;
    var currentDmOtherName = null;

    function dmConvId(a, b) {
        return [a, b].sort().join("::");
    }

    var _lastSeenNewestDmTs = 0;
    var _dmSoundInitialized = false;
    var _dmSoundWarmupUntil = 0;
    var DM_SOUND_WARMUP_MS = 4000;

    var _notifAudioCtx = null;

    function getNotifAudioCtx() {
        var AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtxClass) return null;
        if (!_notifAudioCtx) {
            try {
                _notifAudioCtx = new AudioCtxClass();
            } catch (e) {
                console.error("Could not create audio context:", e);
                return null;
            }
        }
        if (_notifAudioCtx.state === "suspended") {
            _notifAudioCtx.resume().catch(function () {});
        }
        return _notifAudioCtx;
    }

    var _dmSoundUnlocked = false;
    function unlockMessageNotificationSound() {
        if (_dmSoundUnlocked) return;
        var ctx = getNotifAudioCtx();
        if (ctx && ctx.state === "running") {
            _dmSoundUnlocked = true;
            document.removeEventListener("click", unlockMessageNotificationSound);
            document.removeEventListener("touchstart", unlockMessageNotificationSound);
            document.removeEventListener("keydown", unlockMessageNotificationSound);
        }
    }
    document.addEventListener("click", unlockMessageNotificationSound);
    document.addEventListener("touchstart", unlockMessageNotificationSound);
    document.addEventListener("keydown", unlockMessageNotificationSound);

    function playTone(ctx, freq, startTime, peakGain, duration) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
    }

    function playMessageNotificationSound() {
        try {
            var ctx = getNotifAudioCtx();
            if (!ctx) return;
            var now = ctx.currentTime;
            playTone(ctx, 880, now, 0.18, 0.16);
            playTone(ctx, 659, now + 0.13, 0.16, 0.2);
        } catch (e) {
            console.error("Notification sound error:", e);
        }
    }

    function checkForNewIncomingDm() {
        var user = getCurrentUser();
        if (!user) return;

        var dms = getDms();
        var newestFromOthersTs = 0;
        var newestFromOthersOtherEmail = null;

        Object.keys(dms).forEach(function (convId) {
            var conv = dms[convId];
            if (!conv || !conv.participants || conv.participants.indexOf(user.email) === -1) return;
            var otherEmail = conv.participants[0] === user.email ? conv.participants[1] : conv.participants[0];
            (conv.messages || []).forEach(function (m) {
                if (m.sender !== user.email && (m.ts || 0) > newestFromOthersTs) {
                    newestFromOthersTs = m.ts || 0;
                    newestFromOthersOtherEmail = otherEmail;
                }
            });
        });

        if (!_dmSoundInitialized) {
            _lastSeenNewestDmTs = newestFromOthersTs;
            _dmSoundInitialized = true;
            _dmSoundWarmupUntil = Date.now() + DM_SOUND_WARMUP_MS;
            return;
        }

        if (Date.now() < _dmSoundWarmupUntil) {
            _lastSeenNewestDmTs = Math.max(_lastSeenNewestDmTs, newestFromOthersTs);
            return;
        }

        if (newestFromOthersTs > _lastSeenNewestDmTs) {
            _lastSeenNewestDmTs = newestFromOthersTs;

            var dmWindowOpenForThisConv = currentDmOtherEmail === newestFromOthersOtherEmail &&
                document.getElementById("dmOverlay").classList.contains("show");

            if (!dmWindowOpenForThisConv) {
                playMessageNotificationSound();
            }
        }
    }

    function getDms() {
        return _cloud.dms || {};
    }

    function saveDms(map) {
        _cloud.dms = map;
        db.collection("cvspee").doc("dms").set({ map: map });
    }

    function getUnreadDmThreadsFor(email) {
        var dms = getDms();
        var result = [];
        Object.keys(dms).forEach(function (convId) {
            var conv = dms[convId];
            if (!conv || !conv.participants || conv.participants.indexOf(email) === -1) return;
            var otherEmail = conv.participants[0] === email ? conv.participants[1] : conv.participants[0];
            var seenAt = (conv.seenAt && conv.seenAt[email]) || 0;
            var unread = (conv.messages || []).filter(function (m) {
                return m.sender !== email && (m.ts || 0) > seenAt;
            }).length;
            if (unread > 0) {
                result.push({ convId: convId, otherEmail: otherEmail, unread: unread });
            }
        });
        return result;
    }

    function getAllDmThreadsFor(email) {
        var dms = getDms();
        var result = [];
        Object.keys(dms).forEach(function (convId) {
            var conv = dms[convId];
            if (!conv || !conv.participants || conv.participants.indexOf(email) === -1) return;
            var otherEmail = conv.participants[0] === email ? conv.participants[1] : conv.participants[0];
            var seenAt = (conv.seenAt && conv.seenAt[email]) || 0;
            var messages = conv.messages || [];
            var unread = messages.filter(function (m) {
                return m.sender !== email && (m.ts || 0) > seenAt;
            }).length;
            var lastMsg = messages.length ? messages[messages.length - 1] : null;
            result.push({
                convId: convId,
                otherEmail: otherEmail,
                unread: unread,
                lastText: lastMsg ? lastMsg.text : "",
                lastTs: lastMsg ? (lastMsg.ts || 0) : 0
            });
        });
        result.sort(function (a, b) { return b.lastTs - a.lastTs; });
        return result;
    }

    function openMessagesList() {
        var user = getCurrentUser();
        if (!user) {
            openAuthModal();
            return;
        }

        document.getElementById("userProfileViewOverlay").classList.remove("show");
        document.getElementById("orderActionOverlay").classList.remove("show");
        document.getElementById("dmOverlay").classList.remove("show");
        document.getElementById("messagesListOverlay").classList.add("show");

        renderMessagesList();
    }

    function closeMessagesList() {
        document.getElementById("messagesListOverlay").classList.remove("show");
    }

    function renderMessagesList() {
        var user = getCurrentUser();
        var listEl = document.getElementById("messagesListBody");
        if (!listEl || !user) return;

        var threads = getAllDmThreadsFor(user.email);

        if (threads.length === 0) {
            listEl.innerHTML = '<p class="review-empty">No conversations yet.</p>';
            return;
        }

        listEl.innerHTML = threads.map(function (t) {
            var name = liveNameFor(t.otherEmail, t.otherEmail) || t.otherEmail;
            var avatar = liveAvatarFor(t.otherEmail, "");
            var initials = name.trim().charAt(0).toUpperCase() || "?";
            var avatarHtml = avatar
                ? '<img src="' + avatar + '" alt="">'
                : '<div class="chat-with-avatar-initials">' + escapeHtml(initials) + '</div>';
            var online = isUserOnline(t.otherEmail);
            var preview = t.lastText ? escapeHtml(t.lastText) : "Say hi to start the conversation.";

            return (
                '<div class="msg-list-row' + (t.unread > 0 ? ' msg-list-row-unread' : '') + '" onclick="openDirectMessage(\'' + escapeHtml(t.otherEmail) + '\', \'' + escapeHtml(name) + '\')">' +
                    '<div class="chat-with-avatar-wrap">' +
                        avatarHtml +
                        '<span class="presence-dot' + (online ? ' online' : '') + '"></span>' +
                    '</div>' +
                    '<div class="msg-list-info">' +
                        '<div class="msg-list-name">' + escapeHtml(name) + '</div>' +
                        '<div class="msg-list-preview">' + preview + '</div>' +
                    '</div>' +
                    (t.unread > 0 ? '<span class="msg-list-unread-badge">' + t.unread + '</span>' : '') +
                '</div>'
            );
        }).join("");
    }

    function updateAccountIconDots() {
        var orderDotEl = document.getElementById("accountOrderDot");
        var msgDotEl = document.getElementById("accountMsgDot");
        var user = getCurrentUser();

        if (!user) {
            if (orderDotEl) orderDotEl.style.display = "none";
            if (msgDotEl) msgDotEl.style.display = "none";
            return;
        }

        if (orderDotEl) {
            var orders = getOrders();
            var hasUnreadOrder = orders.some(function (o) { return isOrderUnreadFor(o, user); });
            orderDotEl.style.display = hasUnreadOrder ? "block" : "none";
        }

        if (msgDotEl) {
            var hasUnreadMsg = getAllDmThreadsFor(user.email).some(function (t) { return t.unread > 0; });
            msgDotEl.style.display = hasUnreadMsg ? "block" : "none";
        }
    }

    function openDirectMessage(email, name) {
        var user = getCurrentUser();
        if (!user) {
            openAuthModal();
            return;
        }
        if (!email || email === user.email) return;

        currentDmOtherEmail = email;
        currentDmOtherName = name || email;

        document.getElementById("userProfileViewOverlay").classList.remove("show");
        document.getElementById("orderActionOverlay").classList.remove("show");
        document.getElementById("messagesListOverlay").classList.remove("show");
        document.getElementById("dmOverlay").classList.add("show");

        renderDmMessages();

        var dmInputEl = document.getElementById("dmInput");
        if (dmInputEl) dmInputEl.focus();
    }

    function closeDirectMessage() {
        document.getElementById("dmOverlay").classList.remove("show");
        currentDmOtherEmail = null;
    }

    function renderDmChatWithHeader() {
        var headerEl = document.getElementById("dmChatWithHeader");
        var user = getCurrentUser();
        if (!headerEl || !user || !currentDmOtherEmail) return;

        var otherEmail = currentDmOtherEmail;
        var name = liveNameFor(otherEmail, currentDmOtherName) || currentDmOtherName || otherEmail;
        var avatar = liveAvatarFor(otherEmail, "");
        var initials = name.trim().charAt(0).toUpperCase() || "?";

        var avatarHtml = avatar
            ? '<img src="' + avatar + '" alt="">'
            : '<div class="chat-with-avatar-initials">' + escapeHtml(initials) + '</div>';

        var online = isUserOnline(otherEmail);
        var convId = dmConvId(user.email, otherEmail);
        var typing = isOtherDmTyping(convId, otherEmail);

        headerEl.innerHTML =
            '<div class="chat-with-avatar-wrap">' +
                avatarHtml +
                '<span class="presence-dot' + (online ? ' online' : '') + '"></span>' +
            '</div>' +
            '<div>' +
                '<div class="chat-with-name">' + escapeHtml(name) + '</div>' +
                '<div class="chat-with-status' + (typing ? ' is-typing' : '') + '">' +
                    (typing ? "Typing..." : (online ? "Online" : "Offline")) +
                '</div>' +
            '</div>';
    }

    function renderDmMessages() {
        var user = getCurrentUser();
        if (!user || !currentDmOtherEmail) return;

        var messagesEl = document.getElementById("dmMessages");
        renderDmChatWithHeader();

        var convId = dmConvId(user.email, currentDmOtherEmail);
        var dms = getDms();
        var conv = dms[convId];

        if (!conv || !conv.messages || conv.messages.length === 0) {
            messagesEl.innerHTML = '<p class="review-empty">Say hi to start the conversation.</p>';
            if (typeof renderChatHeadDock === "function") renderChatHeadDock();
            return;
        }

        conv.seenAt = conv.seenAt || {};
        var mySeenAt = conv.seenAt[user.email] || 0;
        var hasUnseenFromOther = conv.messages.some(function (m) {
            return m.sender !== user.email && (m.ts || 0) > mySeenAt;
        });
        if (hasUnseenFromOther) {
            conv.seenAt[user.email] = Date.now();
            saveDms(dms);
        }

        var otherSeenAt = (conv.seenAt && conv.seenAt[currentDmOtherEmail]) || 0;

        var lastMineIndex = -1;
        for (var i = conv.messages.length - 1; i >= 0; i--) {
            if (conv.messages[i].sender === user.email) { lastMineIndex = i; break; }
        }

        messagesEl.innerHTML = conv.messages.map(function (m, idx) {
            var isFromOther = m.sender !== user.email;
            var html = '<div class="chat-bubble ' + (isFromOther ? "chat-bubble-ai" : "chat-bubble-user") + '">' + escapeHtml(m.text) + '</div>';

            if (!isFromOther && idx === lastMineIndex) {
                var status = "Sent";
                if (otherSeenAt >= (m.ts || 0)) status = "Seen";
                else if (isUserOnline(currentDmOtherEmail)) status = "Delivered";
                html += '<div class="chat-status-label">' + status + '</div>';
            }
            return html;
        }).join("");

        messagesEl.scrollTop = messagesEl.scrollHeight;

        if (typeof renderChatHeadDock === "function") renderChatHeadDock();
    }

    function sendDirectMessage() {
        var input = document.getElementById("dmInput");
        var text = input.value.trim();
        var user = getCurrentUser();
        if (!text || !currentDmOtherEmail || !user) return;

        var convId = dmConvId(user.email, currentDmOtherEmail);
        var dms = getDms();
        if (!dms[convId]) {
            dms[convId] = { participants: [user.email, currentDmOtherEmail], messages: [], seenAt: {} };
        }
        var conv = dms[convId];
        conv.messages = conv.messages || [];
        conv.messages.push({ sender: user.email, text: text, ts: Date.now() });
        conv.seenAt = conv.seenAt || {};
        conv.seenAt[user.email] = Date.now();

        saveDms(dms);

        input.value = "";
        renderDmMessages();
    }

    function isOtherDmTyping(convId, otherEmail) {
        if (!convId || !otherEmail || !_typing[convId]) return false;
        var ts = _typing[convId][otherEmail];
        if (!ts) return false;
        return (Date.now() - ts) < TYPING_ACTIVE_MS;
    }

    function notifyDmTyping(convId, myEmail) {
        if (!convId || !myEmail) return;
        var now = Date.now();
        if (now - _lastTypingWriteAt < TYPING_WRITE_THROTTLE_MS) return;
        _lastTypingWriteAt = now;

        var patch = {};
        patch[convId] = {};
        patch[convId][myEmail] = now;
        db.collection("cvspee").doc("typing").set({ map: patch }, { merge: true })
            .catch(function (err) { console.error("typing write error", err); });
    }

    document.getElementById("dmInput").addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            sendDirectMessage();
        }
    });

    document.getElementById("dmInput").addEventListener("input", function () {
        var user = getCurrentUser();
        if (!user || !currentDmOtherEmail) return;

        notifyDmTyping(dmConvId(user.email, currentDmOtherEmail), user.email);
    });

    function renderChatHeadDock() {
        var dockEl = document.getElementById("chatHeadDock");
        var user = getCurrentUser();

        if (!user) {
            dockEl.innerHTML = "";
            dockEl.style.display = "none";
            return;
        }

        var heads = [];

        var dmThreads = getUnreadDmThreadsFor(user.email);
        dmThreads.forEach(function (t) {
            var otherEmail = t.otherEmail;
            var name = liveNameFor(otherEmail, otherEmail);
            var initials = (name || "?").trim().charAt(0).toUpperCase() || "?";
            var liveAvatar = liveAvatarFor(otherEmail, "");
            var avatarHtml = liveAvatar
                ? '<img src="' + liveAvatar + '" alt="">'
                : '<div class="chat-head-initials">' + escapeHtml(initials) + '</div>';

            heads.push(
                '<div class="chat-head" title="' + escapeHtml(name) + '" onclick="openDirectMessage(\'' + escapeHtml(otherEmail) + '\', \'' + escapeHtml(name) + '\')">' +
                    avatarHtml +
                    '<span class="presence-dot' + (isUserOnline(otherEmail) ? ' online' : '') + '"></span>' +
                    '<span class="chat-head-badge">' + String(t.unread) + '</span>' +
                '</div>'
            );
        });

        if (heads.length === 0) {
            dockEl.innerHTML = "";
            dockEl.style.display = "none";
            return;
        }

        dockEl.style.display = "flex";
        dockEl.innerHTML = heads.join("");
    }

    function updateNotifBadge() {
        var badgeEl = document.getElementById("notifBadge");
        var user = getCurrentUser();

        if (!user) {
            badgeEl.textContent = "0";
            return;
        }

        var orders = getOrders();
        var count = orders.filter(function (o) { return isOrderUnreadFor(o, user); }).length;

        badgeEl.textContent = count;
    }

    function refreshOrderUI() {
        updateNotifBadge();
        renderChatHeadDock();
        updateAccountIconDots();
        checkForNewIncomingDm();

        if (document.getElementById("ordersPanelOverlay").classList.contains("show")) {
            renderOrdersPanel();
        }
        if (document.getElementById("orderTrackingOverlay").classList.contains("show")) {
            renderOrderTracking();
        }
        if (document.getElementById("orderActionOverlay").classList.contains("show") && currentOrderActionId) {
            renderOrderAction();
        }
        if (document.getElementById("messagesListOverlay").classList.contains("show")) {
            renderMessagesList();
        }
        if (document.getElementById("orderHistoryOverlay").classList.contains("show")) {
            renderOrderHistory();
        }
    }

    setInterval(refreshOrderUI, 3000);

    
    
    setInterval(function () {
        if (!currentOrderActionId) return;
        if (!document.getElementById("orderActionOverlay").classList.contains("show")) return;

        var chatSection = document.getElementById("orderChatSection");
        if (!chatSection || chatSection.style.display === "none") return;

        var order = getOrders().find(function (o) { return o.id === currentOrderActionId; });
        var user = getCurrentUser();
        if (!order || !user) return;

        renderOrderChatWithHeader(order, user);
    }, 1200);

    renderAllProductRatings();
    updateCartBadge();
    updateWishlistBadge();
    refreshOrderUI();
    sendPresenceHeartbeat();
