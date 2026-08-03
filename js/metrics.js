(function () {
            // ---- Configuration -------------------------------------------------
            // Point this at your Prometheus instance. On localhost this is
            // usually http://localhost:9090. Prometheus must be started with
            // something like --web.cors.origin=".*" or the browser will block
            // the request (CORS), since your site and Prometheus run on
            // different ports/origins.
            var PROM_URL = "http://localhost:9090";

            // List whatever PromQL queries you want cards for. "label" is what
            // shows on the card, "query" is the PromQL expression, "unit" is
            // just cosmetic text appended after the number.
            var METRICS = [
                { label: "Prometheus Targets Up", query: "sum(up)", unit: "" },
                { label: "Node CPU Usage", query: "100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)", unit: "%" },
                { label: "Node Memory Used", query: "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100", unit: "%" },
                { label: "Filesystem Usage (root)", query: "100 - ((node_filesystem_avail_bytes{mountpoint=\"/\"} / node_filesystem_size_bytes{mountpoint=\"/\"}) * 100)", unit: "%" }
            ];

            var REFRESH_INTERVAL_MS = 15000; // how often to re-poll Prometheus

            // ---- Rendering -------------------------------------------------------
            var cardsContainer = document.getElementById("metrics-cards");
            var statusEl = document.getElementById("metrics-status");
            document.getElementById("prom-url-label").textContent = PROM_URL;

            // Build one card per metric up front, using the same
            // "services-inner-box" styling your Certifications section uses.
            METRICS.forEach(function (m, i) {
                var col = document.createElement("div");
                col.className = "col-md-3 col-sm-6";
                col.innerHTML =
                    '<div class="services-inner-box">' +
                    '<h2 id="metric-value-' + i + '">--</h2>' +
                    '<p>' + m.label + '</p>' +
                    '</div>';
                cardsContainer.appendChild(col);
            });

            function fetchMetric(m, i) {
                var url = PROM_URL + "/api/v1/query?query=" + encodeURIComponent(m.query);
                return fetch(url)
                    .then(function (res) {
                        if (!res.ok) throw new Error("HTTP " + res.status);
                        return res.json();
                    })
                    .then(function (data) {
                        var el = document.getElementById("metric-value-" + i);
                        var result = data.data && data.data.result;
                        if (!result || result.length === 0) {
                            el.textContent = "n/a";
                            return;
                        }
                        // Average across all returned series so one card = one number
                        var values = result.map(function (r) { return parseFloat(r.value[1]); });
                        var avg = values.reduce(function (a, b) { return a + b; }, 0) / values.length;
                        el.textContent = avg.toFixed(1) + m.unit;
                    })
                    .catch(function (err) {
                        var el = document.getElementById("metric-value-" + i);
                        el.textContent = "error";
                        throw err;
                    });
            }

            function refreshAll() {
                statusEl.textContent = "Refreshing...";
                var promises = METRICS.map(fetchMetric);
                Promise.allSettled(promises).then(function (results) {
                    var failed = results.filter(function (r) { return r.status === "rejected"; }).length;
                    var now = new Date().toLocaleTimeString();
                    if (failed > 0) {
                        statusEl.textContent =
                            "Last update " + now + " - " + failed + " of " + METRICS.length +
                            " queries failed (check Prometheus is running and CORS is enabled).";
                    } else {
                        statusEl.textContent = "Last updated " + now;
                    }
                });
            }

            refreshAll();
            setInterval(refreshAll, REFRESH_INTERVAL_MS);
        })();