(function () {
    // Same-origin proxy defined in nginx.conf. The browser never sees PromQL:
    // it sends a key, and nginx's map turns that into a fixed query. A key
    // that isn't in the map returns 404, so these ids must match exactly.
    var PROM_PROXY = "/prom/query";

    var METRICS = [
        { id: "targets_up",   label: "Prometheus Targets Up",   unit: "",  decimals: 0 },
        { id: "node_cpu",     label: "Node CPU Usage",          unit: "%", decimals: 1 },
        { id: "node_mem",     label: "Node Memory Used",        unit: "%", decimals: 1 },
        { id: "node_fs_root", label: "Filesystem Usage (root)", unit: "%", decimals: 1 }
    ];

    var REFRESH_INTERVAL_MS = 15000;
    var REQUEST_TIMEOUT_MS = 5000;

    var cardsContainer = document.getElementById("metrics-cards");
    var statusEl = document.getElementById("metrics-status");
    if (!cardsContainer) return;

    var timer = null;
    var firstLoad = true;

    METRICS.forEach(function (m, i) {
        var col = document.createElement("div");
        col.className = "col-md-3 col-sm-6";
        col.innerHTML =
            '<div class="services-inner-box">' +
            '<h2 id="metric-value-' + i + '">--</h2>' +
            '<p></p>' +
            '</div>';
        // Set label as text rather than markup so it can never be parsed as HTML.
        col.querySelector("p").textContent = m.label;
        cardsContainer.appendChild(col);
    });

    // fetch() has no built-in timeout: a hung connection would leave the card
    // showing "--" indefinitely. AbortController gives us one.
    function fetchWithTimeout(url) {
        var controller = new AbortController();
        var id = setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS);
        return fetch(url, { signal: controller.signal }).then(
            function (res) { clearTimeout(id); return res; },
            function (err) { clearTimeout(id); throw err; }
        );
    }

    function fetchMetric(m, i) {
        var url = PROM_PROXY + "?metric=" + encodeURIComponent(m.id);
        var el = document.getElementById("metric-value-" + i);

        return fetchWithTimeout(url)
            .then(function (res) {
                if (!res.ok) {
                    // 404 = key missing from the nginx map (typo in this file).
                    // 502/504 = Prometheus unreachable. 503 = rate limited.
                    throw new Error(m.id + ": HTTP " + res.status);
                }
                return res.json();
            })
            .then(function (data) {
                if (!data || data.status !== "success") {
                    throw new Error(m.id + ": " + ((data && data.error) || "bad response"));
                }

                var result = data.data && data.data.result;
                if (!result || result.length === 0) {
                    el.textContent = "n/a";
                    return;
                }

                // Most of these queries aggregate server-side and return one
                // series; averaging is the fallback when a query spans several.
                var values = result
                    .map(function (r) { return parseFloat(r.value[1]); })
                    .filter(function (v) { return isFinite(v); });

                if (values.length === 0) {
                    el.textContent = "n/a";
                    return;
                }

                var avg = values.reduce(function (a, b) { return a + b; }, 0) / values.length;
                el.textContent = avg.toFixed(m.decimals) + m.unit;
            })
            .catch(function (err) {
                el.textContent = "error";
                throw err;
            });
    }

    function refreshAll() {
        if (firstLoad && statusEl) statusEl.textContent = "Loading...";

        Promise.allSettled(METRICS.map(fetchMetric)).then(function (results) {
            firstLoad = false;
            if (!statusEl) return;

            var failures = results
                .filter(function (r) { return r.status === "rejected"; })
                .map(function (r) { return r.reason && r.reason.message; });

            var now = new Date().toLocaleTimeString();
            if (failures.length === 0) {
                statusEl.textContent = "Last updated " + now;
            } else {
                statusEl.textContent =
                    "Last update " + now + " - " + failures.length + " of " +
                    METRICS.length + " failed (" + failures.join("; ") + ")";
            }
        });
    }

    // Polling every 15s in a background tab is pure waste, and every visitor
    // doing it adds load to a home server behind a 2r/s rate limit. Pause when
    // the tab is hidden, and refresh immediately on return so the numbers
    // aren't stale when the page comes back into view.
    function startPolling() {
        if (timer === null) timer = setInterval(refreshAll, REFRESH_INTERVAL_MS);
    }

    function stopPolling() {
        if (timer !== null) { clearInterval(timer); timer = null; }
    }

    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
            stopPolling();
        } else {
            refreshAll();
            startPolling();
        }
    });

    refreshAll();
    startPolling();
})();
