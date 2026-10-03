// meng.cam
(function () {
  "use strict";

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  /* ---------- Focus pull on the name ---------- */
  const name = document.getElementById("name");
  if (name) {
    requestAnimationFrame(() => requestAnimationFrame(() => name.classList.add("in-focus")));
  }

  /* ---------- Two live clocks ---------- */
  const clocks = document.querySelectorAll(".time[data-zone]");
  function tick() {
    const now = new Date();
    clocks.forEach((el) => {
      const zone = el.dataset.zone;
      el.textContent = new Intl.DateTimeFormat("en-US", {
        timeZone: zone, weekday: "short", hour: "numeric", minute: "2-digit"
      }).format(now);
      el.setAttribute("datetime", now.toISOString());
    });
  }
  tick();
  setInterval(tick, 15000);

  /* ---------- Experience timeline ---------- */
  // Months are counted as an index: Jan 2025 = 0.
  const toIndex = (ym) => {
    const [y, m] = ym.split("-").map(Number);
    return (y - 2025) * 12 + (m - 1);
  };
  const today = new Date();
  const nowIndex = (today.getFullYear() - 2025) * 12 + today.getMonth() + today.getDate() / 31;

  const roles = Array.from(document.querySelectorAll(".role[data-start]"));
  const items = roles.map((el) => {
    const ongoing = el.dataset.end === "present";
    return {
      el,
      label: el.dataset.label,
      start: toIndex(el.dataset.start),
      // end month is inclusive; never draw past today
      end: ongoing ? nowIndex : Math.min(toIndex(el.dataset.end) + 1, nowIndex),
      ongoing,
      startText: el.dataset.start,
      endText: el.dataset.end
    };
  });

  // Stevens as a separate, lighter row that links to Education
  items.push({
    el: document.getElementById("education"),
    label: "Stevens, B.S. CS",
    start: toIndex("2026-08"),
    end: nowIndex,
    ongoing: true,
    edu: true,
    startText: "2026-08",
    endText: "present"
  });

  const timeline = document.getElementById("timeline");
  if (timeline && items.length) {
    items.sort((a, b) => a.start - b.start || a.end - b.end);

    const minI = 0;
    const maxI = Math.max(Math.ceil(nowIndex), ...items.map((i) => Math.ceil(i.end))) + 0.5;
    const span = maxI - minI;
    const pct = (i) => ((i - minI) / span) * 100;

    const fmt = (ym) => {
      if (ym === "present") return "now";
      const [y, m] = ym.split("-").map(Number);
      return LONG[m - 1] + " " + y;
    };

    // Axis with quarterly ticks
    const axis = document.createElement("div");
    axis.className = "t-axis";
    axis.setAttribute("aria-hidden", "true");
    axis.innerHTML = '<span class="t-label"></span><div class="track"></div>';
    const axisTrack = axis.querySelector(".track");
    const step = window.innerWidth < 760 ? 6 : 3;
    for (let i = 0; i <= maxI; i += step) {
      if (Math.abs(i - nowIndex) < 1.2) continue; // leave room for the "Now" tag
      const y = 2025 + Math.floor(i / 12);
      const m = i % 12;
      const t = document.createElement("span");
      t.className = "tick";
      t.style.left = pct(i) + "%";
      t.textContent = m === 0 ? MONTHS[m] + " " + y : MONTHS[m];
      if (i === 0) t.classList.add("first");
      axisTrack.appendChild(t);
    }
    const nowTag = document.createElement("span");
    nowTag.className = "now-tag";
    nowTag.style.left = pct(nowIndex) + "%";
    nowTag.textContent = "Now";
    axisTrack.appendChild(nowTag);
    timeline.appendChild(axis);

    const body = document.createElement("div");
    body.className = "timeline-body";
    timeline.appendChild(body);

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "t-row";
      row.setAttribute("role", "listitem");

      const label = document.createElement("span");
      label.className = "t-label";
      label.textContent = item.label;

      const track = document.createElement("div");
      track.className = "track";

      const bar = document.createElement("button");
      bar.type = "button";
      bar.className = "bar" + (item.ongoing ? " ongoing" : "");
      if (item.edu) bar.style.background = "var(--graphite)";
      bar.style.left = pct(item.start) + "%";
      bar.style.width = Math.max(pct(item.end) - pct(item.start), 1.5) + "%";
      bar.setAttribute("aria-label", item.label + ", " + fmt(item.startText) + " to " + fmt(item.endText) + ". Jump to details.");

      bar.addEventListener("click", () => {
        item.el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
        item.el.classList.add("hot");
        setTimeout(() => item.el.classList.remove("hot"), 1600);
      });

      // Link hover between bar and its role entry
      const on = () => { bar.classList.add("hot"); item.el.classList.add("hot"); };
      const off = () => { bar.classList.remove("hot"); item.el.classList.remove("hot"); };
      bar.addEventListener("mouseenter", on);
      bar.addEventListener("mouseleave", off);
      bar.addEventListener("focus", on);
      bar.addEventListener("blur", off);
      if (!item.edu) {
        item.el.addEventListener("mouseenter", () => bar.classList.add("hot"));
        item.el.addEventListener("mouseleave", () => bar.classList.remove("hot"));
      }

      track.appendChild(bar);
      row.append(label, track);
      body.appendChild(row);
    });

    // Dashed "now" line across every row
    const tracks = body.querySelectorAll(".track");
    const first = tracks[0];
    if (first) {
      const placeNow = () => {
        const bodyBox = body.getBoundingClientRect();
        const trackBox = first.getBoundingClientRect();
        line.style.left = (trackBox.left - bodyBox.left) + trackBox.width * (pct(nowIndex) / 100) + "px";
      };
      const line = document.createElement("span");
      line.className = "now-line";
      line.setAttribute("aria-hidden", "true");
      body.appendChild(line);
      placeNow();
      window.addEventListener("resize", placeNow);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeNow);
    }
  }

  /* ---------- Copy email ---------- */
  const copyBtn = document.getElementById("copy");
  const copied = document.getElementById("copied");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const email = "mtang12@stevens.edu";
      try {
        await navigator.clipboard.writeText(email);
        copied.textContent = "Copied to clipboard.";
      } catch (e) {
        copied.textContent = "Copy failed. The address is " + email + ".";
      }
      setTimeout(() => (copied.textContent = ""), 2500);
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
