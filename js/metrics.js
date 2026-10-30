(function () {
    var API_PROXY = "/summary";

    var METRICS = [
        { id: "running_vms",   label: "Running VMs",   unit: "",  decimals: 0 },
        { id: "cpu_computed",     label: "CPU Usage",          unit: "%", decimals: 1 },
        { id: "memory_used",     label: "Memory Usage",        unit: " GiB", decimals: 1 },
        { id: "storage_used", label: "Storage Used", unit: " GiB", decimals: 1 }
    ];

    var REFRESH_INTERVAL_MS = 30000;
    var REQUEST_TIMEOUT_MS = 5000;

    var cardsContainer = document.getElementById("metrics-cards");
    var statusEl = document.getElementById("metrics-status");
    if (!cardsContainer) return;

    var timer = null;
    var firstLoad = true;

    // Creates cards for each metric
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

    function fetchSummary() {
        return fetchWithTimeout(API_PROXY)
            .then(function (res) {
                // 503 = no data, 429 = rate limited
                if (!res.ok) throw new Error("HTTP " + res.status);
                return res.json();
            })
            .then(function (data) {
                METRICS.forEach(function (m, i) {
                    var el = document.getElementById("metric-value-" + i);
                    var value = data[m.id];

                    el.textContent = value.toFixed(m.decimals) + m.unit;
                });
            })
            .catch(function (err) {
                // (3) set every card to "error"
                METRICS.forEach(function (m, i) {
                    var el = document.getElementById("metric-value-" + i);
                    el.textContent = "error";
                });
                throw err;   // pass the failure on so refreshAll can report it
            });
    }

    function refreshAll() {
        if (firstLoad && statusEl) statusEl.textContent = "Loading...";

        fetchSummary()
        .then(function () {
            statusEl.textContent = "Last updated " + new Date().toLocaleTimeString();
        })
        .catch(function () {
            statusEl.textContent = "Last update failed " + new Date().toLocaleTimeString();
        })
        .finally(function () { firstLoad = false; });
    }


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
