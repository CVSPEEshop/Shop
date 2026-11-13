(function () {
    var SHOWN_KEY = "cvspeeRecoShown";
    var cur = 0, count = 0;
    var viewed = {};

    function alreadyShown() {
        try { return sessionStorage.getItem(SHOWN_KEY) === "1"; } catch (e) { return false; }
    }
    function markShown() {
        try { sessionStorage.setItem(SHOWN_KEY, "1"); } catch (e) {}
    }

    function getTopProducts() {
        var counts = {};
        (_cloud.orders || []).forEach(function (o) {
            if (!o || o.status === "cancelled" || !Array.isArray(o.items)) return;
            o.items.forEach(function (it) {
                if (!it || !it.id) return;
                counts[it.id] = (counts[it.id] || 0) + (parseInt(it.qty, 10) || 1);
            });
        });
        return Object.keys(counts)
            .filter(function (id) {
                var p = PRODUCTS[id];
                return p && typeof p.stock === "number" && p.stock > 0;
            })
            .sort(function (a, b) { return counts[b] - counts[a]; })
            .slice(0, 6)
            .map(function (id) { return { product: PRODUCTS[id], sold: counts[id] }; });
    }

    function buildCards(list) {
        count = list.length;
        cur = 0;
        viewed = {};
        document.getElementById("recoCards").innerHTML = list.map(function (row, i) {
            var p = row.product;
            return '<div class="reco-card" data-i="' + i + '" onclick="recoCardClick(' + i + ')">' +
                '<div class="reco-card-title">Most Popular Products</div>' +
                '<span class="reco-rank">#' + (i + 1) + '</span>' +
                '<img class="reco-img" src="' + p.image + '" alt="' + escapeHtml(p.name) + '">' +
                '<div class="reco-info">' +
                    '<p class="reco-name">' + escapeHtml(p.name) + '</p>' +
                    '<div class="reco-price">' + priceDisplayHtml(p) + '</div>' +
                    '<div class="reco-sold">' + row.sold + ' sold</div>' +
                '</div></div>';
        }).join("");
        var multi = count > 1;
        document.querySelector(".reco-prev").style.display = multi ? "" : "none";
        document.querySelector(".reco-next").style.display = multi ? "" : "none";
        layout();
    }

    function layout() {
        var cards = document.querySelectorAll("#recoCards .reco-card");
        cards.forEach(function (c, i) {
            var d = i - cur;
            var abs = Math.abs(d);
            var shift = (d === 0) ? 0 : (d > 0 ? 1 : -1) * 0.72;
            var rot = (abs === 1) ? d * 9 : 0;
            c.style.transform = abs <= 1
                ? "translate3d(calc(var(--w) * " + shift + "), 0, 0) rotate(" + rot + "deg) scale(" + (abs === 0 ? 1 : 0.9) + ")"
                : "translate3d(0, 0, 0) scale(0.8)";
            c.style.opacity = abs <= 1 ? "1" : "0";
            c.style.pointerEvents = abs <= 1 ? "auto" : "none";
            c.style.zIndex = String(10 - abs * 3);
            c.classList.toggle("reco-side", abs === 1);
            c.classList.toggle("reco-off", abs > 1);
        });

        var prevBtn = document.querySelector(".reco-prev"), nextBtn = document.querySelector(".reco-next");
        if (prevBtn && nextBtn && count > 1) {
            prevBtn.style.visibility = cur === 0 ? "hidden" : "visible";
            nextBtn.style.visibility = cur === count - 1 ? "hidden" : "visible";
        }

        viewed[cur] = true;
        if (count > 1 && Object.keys(viewed).length >= count) revealClose();
    }

    window.recoMove = function (dir) {
        var next = cur + dir;
        if (count < 2 || next < 0 || next > count - 1) return;
        cur = next;
        layout();
    };
    window.recoCardClick = function (i) {
        if (i === cur) {
            var id = document.querySelectorAll("#recoCards .reco-card")[i].getAttribute("data-pid");
            hidePopup();
            if (id) openProductDetail(id);
        } else {
            cur = i;
            layout();
        }
    };
    var closeReady = false;
    function revealClose() {
        if (closeReady) return;
        closeReady = true;
        var btn = document.querySelector(".reco-close");
        if (btn) btn.classList.add("visible");
    }
    function hidePopup() {
        document.getElementById("recoOverlay").classList.remove("show");
        document.body.classList.remove("reco-open");
    }
    window.closeRecoPopup = function () {
        if (!closeReady) return;
        hidePopup();
    };

    document.addEventListener("keydown", function (e) {
        var open = document.getElementById("recoOverlay").classList.contains("show");
        if (!open) return;
        if (e.key === "Escape") closeRecoPopup();
        if (e.key === "ArrowLeft") recoMove(-1);
        if (e.key === "ArrowRight") recoMove(1);
    });

    var startX = null;
    var stage = document.getElementById("recoStage");
    stage.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        startX = null;
        if (Math.abs(dx) > 40) recoMove(dx < 0 ? 1 : -1);
    });

    var tries = 0;
    var timer = setInterval(function () {
        tries++;
        if (tries > 20) { clearInterval(timer); return; }
        if (alreadyShown()) { clearInterval(timer); return; }
        if (!_cloud.ready || !_cloud.ready.orders || !_cloud.ready.products) return;
        clearInterval(timer);

        var list = getTopProducts();
        if (list.length === 0) return;

        buildCards(list);
        var els = document.querySelectorAll("#recoCards .reco-card");
        list.forEach(function (row, i) { els[i].setAttribute("data-pid", row.product.id); });
        markShown();

        /* wait for the images to be decoded so the popup doesn't stutter while they load */
        var imgs = Array.prototype.slice.call(document.querySelectorAll("#recoCards img"));
        var decoded = Promise.all(imgs.map(function (im) {
            return (im.decode ? im.decode() : Promise.resolve()).catch(function () {});
        }));
        var cap = new Promise(function (res) { setTimeout(res, 3000); });

        Promise.race([decoded, cap]).then(function () {
            setTimeout(function () {
                var closeBtn = document.querySelector(".reco-close");
                closeReady = false;
                closeBtn.classList.remove("visible");
                document.body.classList.add("reco-open");
                document.getElementById("recoOverlay").classList.add("show");
                setTimeout(revealClose, 5000);
            }, 800);
        });
    }, 500);
})();
