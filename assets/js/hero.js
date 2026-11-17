// Hero (top section): CV menu, rotating role line, rate-monotonic schedule strip.
(function () {
  "use strict";

  var hero = document.getElementById("top");
  if (!hero) return;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- CV menu ----------
  var cvBtn = document.getElementById("cvBtn");
  var cvMenu = document.getElementById("cvMenu");
  if (cvBtn && cvMenu) {
    cvBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = cvMenu.classList.toggle("open");
      cvBtn.setAttribute("aria-expanded", open);
    });
    document.addEventListener("click", function () {
      cvMenu.classList.remove("open");
      cvBtn.setAttribute("aria-expanded", false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { cvMenu.classList.remove("open"); cvBtn.setAttribute("aria-expanded", false); }
    });
  }

  // ---------- rotating role line ----------
  var typed = document.getElementById("typed");
  if (typed) {
    var roles = [
      "Embedded software engineer",
      "Real-time & safety-critical systems",
      "Avionics networks · RTOS · FPGA",
      "Human-centred aerospace systems"
    ];
    if (reduce) {
      typed.textContent = roles[0];
    } else {
      var r = 0, i = 0, del = false;
      (function tick() {
        var s = roles[r];
        typed.textContent = s.slice(0, i);
        if (!del && i < s.length) { i++; setTimeout(tick, 55); }
        else if (!del) { del = true; setTimeout(tick, 1800); }
        else if (i > 0) { i--; setTimeout(tick, 25); }
        else { del = false; r = (r + 1) % roles.length; setTimeout(tick, 300); }
      })();
    }
  }

  // ---------- rate-monotonic schedule (single core, preemptive) ----------
  var c = document.getElementById("sched");
  if (!c || !c.getContext) return;
  var ctx = c.getContext("2d");

  // [name, period T (ms), WCET C (ms), colour]; deadline = period.
  // Sorted by period, so array order = RM priority order.
  var TASKS = [
    ["CTRL", 10, 2, "#00B8D9"],
    ["NAV", 20, 4, "#4FD1C5"],
    ["BUS", 40, 5, "#7fdcef"],
    ["HMI", 80, 8, "rgba(248,250,252,.6)"]
  ];
  var H = 80, DT = 0.5; // hyperperiod and simulation step (ms)
  var U = TASKS.reduce(function (s, t) { return s + t[2] / t[1]; }, 0);

  // Simulate one hyperperiod; all tasks released together at t = 0 (critical instant).
  var segs = TASKS.map(function () { return []; });
  var rem = TASKS.map(function () { return 0; });
  var missed = 0, t, k;
  for (t = 0; t < H; t += DT) {
    for (k = 0; k < TASKS.length; k++) {
      if (Math.abs(t % TASKS[k][1]) < 1e-9) { if (rem[k] > 1e-9) missed++; rem[k] = TASKS[k][2]; }
    }
    var run = -1;
    for (k = 0; k < rem.length; k++) { if (rem[k] > 1e-9) { run = k; break; } }
    if (run < 0) continue;
    var sg = segs[run], last = sg[sg.length - 1];
    if (last && Math.abs(last[1] - t) < 1e-9) last[1] = t + DT; else sg.push([t, t + DT]);
    rem[run] -= DT;
  }

  var PX = 8.5, off = 0, running = true, prev = performance.now(), w = 0, h = 0;

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = c.clientWidth; h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    var rowH = 17, top = 30, labelW = 46, nowX = Math.round(labelW + (w - labelW) * 0.55);
    ctx.font = "10px ui-monospace, monospace";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(248,250,252,.45)";
    ctx.fillText("SINGLE CORE · PREEMPTIVE RM · U = " + U.toFixed(2) + " · " + missed + " DEADLINE MISSES", 0, 9);

    var t0 = off / PX, tEnd = t0 + (w - labelW) / PX, m, x;
    ctx.strokeStyle = "rgba(0,184,217,.35)";
    for (m = Math.ceil(t0 / H) * H; m <= tEnd; m += H) {
      x = labelW + (m - t0) * PX;
      ctx.beginPath(); ctx.moveTo(x + .5, top - 6); ctx.lineTo(x + .5, top + TASKS.length * rowH); ctx.stroke();
    }

    TASKS.forEach(function (task, r) {
      var y = top + r * rowH, T = task[1];
      ctx.fillStyle = "rgba(248,250,252,.55)";
      ctx.fillText(task[0], 0, y + rowH / 2 - 1);

      ctx.strokeStyle = "rgba(248,250,252,.18)"; // release markers
      for (var rel = Math.ceil(t0 / T) * T; rel <= tEnd; rel += T) {
        x = labelW + (rel - t0) * PX;
        ctx.beginPath(); ctx.moveTo(x + .5, y + 1); ctx.lineTo(x + .5, y + rowH - 3); ctx.stroke();
      }

      ctx.fillStyle = task[3];
      for (var base = Math.floor(t0 / H) * H; base <= tEnd; base += H) {
        segs[r].forEach(function (s) {
          var x1 = labelW + (base + s[0] - t0) * PX, x2 = labelW + (base + s[1] - t0) * PX;
          if (x2 < labelW || x1 > w) return;
          var xs = Math.max(x1, labelW);
          ctx.globalAlpha = (x1 + x2) / 2 < nowX ? .95 : .3;
          ctx.fillRect(xs, y + 3, x2 - xs, rowH - 7);
        });
      }
      ctx.globalAlpha = 1;
    });

    ctx.strokeStyle = "#4FD1C5"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(nowX + .5, top - 8); ctx.lineTo(nowX + .5, top + TASKS.length * rowH + 2); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = "#4FD1C5";
    ctx.beginPath(); ctx.moveTo(nowX - 4, top - 12); ctx.lineTo(nowX + 5, top - 12); ctx.lineTo(nowX + .5, top - 6); ctx.fill();
  }

  function loop(now) {
    if (!running) return;
    off += (now - prev) * 0.04; prev = now;
    draw();
    requestAnimationFrame(loop);
  }

  size(); draw();
  window.addEventListener("resize", function () { size(); draw(); });

  if (!reduce) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var was = running; running = entries[0].isIntersecting;
        if (running && !was) { prev = performance.now(); requestAnimationFrame(loop); }
      }).observe(hero);
    }
    requestAnimationFrame(loop);
  }
})();
