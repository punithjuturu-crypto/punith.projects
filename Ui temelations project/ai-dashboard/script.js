(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const NS = "http://www.w3.org/2000/svg";

  // ---------- Sample students ----------
  const SAMPLES = {
    aarav: [
      { name: "Tamil", attended: 52, total: 60, tests: [78, 80, 82, 85] },
      { name: "English", attended: 50, total: 60, tests: [72, 75, 74, 78] },
      { name: "Mathematics", attended: 54, total: 60, tests: [88, 90, 92, 94] },
      { name: "Physics", attended: 44, total: 60, tests: [70, 64, 58, 52] },
      { name: "Chemistry", attended: 48, total: 60, tests: [66, 68, 71, 72] },
      { name: "Computer Science", attended: 57, total: 60, tests: [90, 92, 95, 96] }
    ],
    divya: [
      { name: "Tamil", attended: 56, total: 60, tests: [82, 84, 85, 86] },
      { name: "English", attended: 53, total: 60, tests: [78, 80, 79, 82] },
      { name: "Mathematics", attended: 46, total: 60, tests: [48, 45, 50, 44] },
      { name: "Physics", attended: 50, total: 60, tests: [60, 62, 64, 66] },
      { name: "Chemistry", attended: 38, total: 60, tests: [55, 52, 56, 50] },
      { name: "Computer Science", attended: 55, total: 60, tests: [75, 78, 80, 82] }
    ],
    karthik: [
      { name: "Tamil", attended: 42, total: 60, tests: [62, 65, 60, 66] },
      { name: "English", attended: 40, total: 60, tests: [58, 60, 63, 61] },
      { name: "Mathematics", attended: 43, total: 60, tests: [55, 58, 62, 66] },
      { name: "Physics", attended: 41, total: 60, tests: [68, 66, 70, 72] },
      { name: "Chemistry", attended: 44, total: 60, tests: [50, 54, 52, 49] },
      { name: "Computer Science", attended: 46, total: 60, tests: [72, 74, 78, 80] }
    ],
    custom: [
      { name: "Subject 1", attended: 40, total: 50, tests: [60, 62, 64, 66] },
      { name: "Subject 2", attended: 35, total: 50, tests: [55, 52, 50, 48] },
      { name: "Subject 3", attended: 45, total: 50, tests: [80, 82, 84, 85] }
    ]
  };

  const EXAMPLES = [
    "Which subject is weak?",
    "How is my attendance?",
    "How many hours should I study?",
    "Predict my final marks",
    "Which notes should I refer?",
    "How can I improve?"
  ];

  // Reference tips and links by subject keyword.
  const RESOURCES = [
    {
      match: /math/i,
      tips: ["Write a one-page formula sheet and revise it daily.", "Solve about 10 problems every day from one chapter.", "Practise the last three years' question papers against the clock."],
      links: [["Khan Academy Mathematics", "https://www.khanacademy.org/math"], ["NPTEL courses", "https://nptel.ac.in"]]
    },
    {
      match: /physic/i,
      tips: ["Learn each law with its units and one worked example.", "Draw a diagram for every numerical problem.", "Revise derivations twice a week."],
      links: [["The Physics Classroom", "https://www.physicsclassroom.com"], ["Khan Academy Physics", "https://www.khanacademy.org/science/physics"]]
    },
    {
      match: /chem/i,
      tips: ["Make a table of reactions and their conditions.", "Practise balancing equations every day.", "Use flash cards for the periodic table and formulas."],
      links: [["Khan Academy Chemistry", "https://www.khanacademy.org/science/chemistry"], ["LibreTexts Chemistry", "https://chem.libretexts.org"]]
    },
    {
      match: /tamil/i,
      tips: ["Read one passage aloud each day and note new words.", "Write a short paragraph on a set topic every two days.", "Revise grammar rules with examples."],
      links: [["Tamil Nadu textbooks", "https://www.tntextbooks.in"]]
    },
    {
      match: /english/i,
      tips: ["Read for 20 minutes daily, such as a newspaper or a story.", "Learn five new words a day and use each in a sentence.", "Practise one letter or essay every week."],
      links: [["BBC Learning English", "https://www.bbc.co.uk/learningenglish"]]
    },
    {
      match: /comput|program|cs\b|it\b/i,
      tips: ["Write a small program every day instead of only reading.", "Trace the output of sample programs by hand.", "Keep a short list of key terms and definitions."],
      links: [["GeeksforGeeks", "https://www.geeksforgeeks.org"], ["W3Schools", "https://www.w3schools.com"]]
    }
  ];

  const GENERIC = {
    tips: ["Read the chapter once, then write a half-page summary from memory.", "Solve previous years' questions on this subject.", "Ask your teacher about the topics you keep getting wrong."],
    links: [["Khan Academy", "https://www.khanacademy.org"], ["NPTEL courses", "https://nptel.ac.in"]]
  };

  // ---------- State ----------
  const state = {
    subjects: clone(SAMPLES.aarav),
    hours: 20,
    target: 75
  };

  let analysis = [];
  let overall = null;
  let lastQuestion = "";

  function clone(list) {
    return JSON.parse(JSON.stringify(list));
  }

  // ---------- Helpers ----------
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const mean = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0);

  function esc(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function svgEl(name, attrs) {
    const el = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach((key) => el.setAttribute(key, attrs[key]));
    return el;
  }

  function addText(parent, x, y, text, anchor) {
    const el = svgEl("text", { x, y, "text-anchor": anchor || "middle" });
    el.textContent = text;
    parent.appendChild(el);
  }

  function gradeOf(score) {
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "At risk";
  }

  // ---------- Analysis ----------
  // Straight-line trend through the test marks, then one step ahead.
  function regress(values) {
    const n = values.length;
    if (n < 2) return { slope: 0, next: values[0] || 0 };

    const meanX = (n - 1) / 2;
    const meanY = mean(values);
    let num = 0;
    let den = 0;

    values.forEach((y, x) => {
      num += (x - meanX) * (y - meanY);
      den += (x - meanX) * (x - meanX);
    });

    const slope = num / den;
    return { slope, next: meanY + slope * (n - meanX) };
  }

  function analyze(subject) {
    const tests = subject.tests.map(Number).filter((v) => !isNaN(v));
    const avg = mean(tests);
    const fit = regress(tests);
    const predicted = clamp(0.5 * fit.next + 0.5 * mean(tests.slice(-2)), 0, 100);

    const attended = Number(subject.attended) || 0;
    const total = Number(subject.total) || 0;
    const attendance = total > 0 ? (attended / total) * 100 : 100;
    const adjusted = clamp(predicted - Math.max(0, 75 - attendance) * 0.2, 0, 100);

    let status = "Strong";
    let tone = "good";
    if (adjusted < 60) {
      status = "Weak";
      tone = "bad";
    } else if (adjusted < state.target) {
      status = "Needs work";
      tone = "warn";
    }

    let trend = "Steady";
    if (fit.slope > 1.5) trend = "Improving";
    if (fit.slope < -1.5) trend = "Declining";

    let attendanceNote;
    if (total > 0 && attendance < 75) {
      const needed = Math.ceil((0.75 * total - attended) / 0.25);
      attendanceNote = "Attend the next " + needed + " classes without a break to reach 75%.";
    } else if (total > 0) {
      const spare = Math.floor((attended - 0.75 * total) / 0.75);
      attendanceNote = "You can miss up to " + spare + " more " + (spare === 1 ? "class" : "classes") + " and stay above 75%.";
    } else {
      attendanceNote = "No classes recorded yet.";
    }

    return {
      name: subject.name || "Subject",
      avg, slope: fit.slope, predicted, adjusted, attendance,
      grade: gradeOf(adjusted), status, tone, trend, attendanceNote
    };
  }

  function runAnalysis() {
    analysis = state.subjects.map(analyze);

    const attended = state.subjects.reduce((a, s) => a + (Number(s.attended) || 0), 0);
    const total = state.subjects.reduce((a, s) => a + (Number(s.total) || 0), 0);

    overall = {
      average: mean(analysis.map((a) => a.avg)),
      predicted: mean(analysis.map((a) => a.adjusted)),
      attendance: total > 0 ? (attended / total) * 100 : 0,
      weak: analysis.filter((a) => a.status === "Weak"),
      lowAttendance: analysis.filter((a) => a.attendance < 75)
    };
  }

  function studyHours() {
    const weights = analysis.map((a) => Math.max(2, state.target - a.adjusted + 5));
    const sum = weights.reduce((a, b) => a + b, 0);

    // 40% of the time is shared equally, 60% goes to the subjects that need it most.
    return analysis.map((a, i) => {
      const share = 0.4 / analysis.length + (0.6 * weights[i]) / sum;
      const hours = Math.max(0.5, Math.round(state.hours * share * 2) / 2);
      const perDay = Math.max(5, Math.round((hours * 60) / 7 / 5) * 5);
      return { name: a.name, hours, perDay };
    });
  }

  function resourcesFor(name) {
    return RESOURCES.find((r) => r.match.test(name)) || GENERIC;
  }

  // ---------- Rendering: editor ----------
  function renderEditor() {
    $("#editRows").innerHTML = state.subjects
      .map((s, i) => {
        const tests = s.tests
          .map((v, t) => '<td><input type="number" min="0" max="100" data-i="' + i + '" data-f="t' + t + '" value="' + esc(v) + '"></td>')
          .join("");

        return (
          "<tr>" +
            '<td><input type="text" data-i="' + i + '" data-f="name" value="' + esc(s.name) + '"></td>' +
            '<td><input type="number" min="0" data-i="' + i + '" data-f="attended" value="' + esc(s.attended) + '"></td>' +
            '<td><input type="number" min="0" data-i="' + i + '" data-f="total" value="' + esc(s.total) + '"></td>' +
            tests +
            '<td><button class="btn small" data-remove="' + i + '" type="button">Remove</button></td>' +
          "</tr>"
        );
      })
      .join("");
  }

  // ---------- Rendering: summary ----------
  function renderAlerts() {
    const parts = [];

    if (overall.lowAttendance.length) {
      parts.push(
        '<div class="alert bad"><p><strong>Attendance is below 75%</strong> in ' +
        overall.lowAttendance.map((a) => esc(a.name) + " (" + a.attendance.toFixed(0) + "%)").join(", ") +
        ". This can affect exam eligibility, so check your school or college rules.</p></div>"
      );
    }

    if (overall.weak.length) {
      parts.push(
        '<div class="alert"><p><strong>Weak subjects:</strong> ' +
        overall.weak.map((a) => esc(a.name)).join(", ") + ". They are expected to finish below 60.</p></div>"
      );
    }

    $("#alerts").innerHTML = parts.join("");
  }

  function renderKpis() {
    const attTone = overall.attendance >= 75 ? "good" : "bad";
    const predTone = overall.predicted >= state.target ? "good" : overall.predicted >= 60 ? "warn" : "bad";

    const items = [
      { label: "Average marks so far", value: overall.average.toFixed(1), note: "Across all subjects", tone: "" },
      { label: "Predicted final marks", value: overall.predicted.toFixed(1), note: "Overall grade " + gradeOf(overall.predicted), tone: predTone },
      { label: "Overall attendance", value: overall.attendance.toFixed(1) + "%", note: overall.attendance >= 75 ? "Above the 75% minimum" : "Below the 75% minimum", tone: attTone },
      { label: "Weak subjects", value: String(overall.weak.length), note: overall.weak.length ? overall.weak.map((a) => a.name).join(", ") : "None right now", tone: overall.weak.length ? "bad" : "good" }
    ];

    $("#kpis").innerHTML = items
      .map((k) =>
        '<article class="kpi"><span class="kpi-label">' + k.label + "</span>" +
        '<strong class="kpi-value ' + k.tone + '">' + k.value + "</strong>" +
        '<span class="kpi-note">' + esc(k.note) + "</span></article>"
      )
      .join("");
  }

  // ---------- Rendering: charts ----------
  function drawMarks() {
    const svg = $("#marksChart");
    const W = 640;
    const H = 260;
    const pad = { l: 36, r: 10, t: 12, b: 34 };
    const innerH = H - pad.t - pad.b;
    const y = (v) => pad.t + innerH * (1 - v / 100);
    svg.innerHTML = "";

    for (let v = 0; v <= 100; v += 25) {
      svg.appendChild(svgEl("line", { x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v), stroke: "#234857" }));
      addText(svg, pad.l - 6, y(v) + 4, v, "end");
    }

    if (!analysis.length) return;

    const slot = (W - pad.l - pad.r) / analysis.length;
    const barW = Math.min(26, slot * 0.3);

    analysis.forEach((a, i) => {
      const cx = pad.l + slot * i + slot / 2;
      svg.appendChild(svgEl("rect", { x: cx - barW - 1, y: y(a.avg), width: barW, height: innerH * (a.avg / 100), rx: 3, fill: "#4fd1c5" }));
      svg.appendChild(svgEl("rect", { x: cx + 1, y: y(a.adjusted), width: barW, height: innerH * (a.adjusted / 100), rx: 3, fill: "#f5b942" }));
      addText(svg, cx, H - 14, a.name.length > 10 ? a.name.slice(0, 9) + "…" : a.name);
    });

    svg.appendChild(svgEl("line", { x1: pad.l, x2: W - pad.r, y1: y(state.target), y2: y(state.target), stroke: "#ff8a7a", "stroke-dasharray": "5 4", "stroke-width": 1.5 }));
  }

  function drawAttendance() {
    const svg = $("#attChart");
    const W = 640;
    const H = 260;
    const pad = { l: 120, r: 44, t: 10, b: 20 };
    const rowH = (H - pad.t - pad.b) / Math.max(1, analysis.length);
    const x = (v) => pad.l + ((W - pad.l - pad.r) * v) / 100;
    svg.innerHTML = "";

    analysis.forEach((a, i) => {
      const top = pad.t + rowH * i;
      const barH = Math.min(22, rowH * 0.6);
      const color = a.attendance < 75 ? "#ff8a7a" : "#4fd1c5";

      addText(svg, pad.l - 8, top + rowH / 2 + 4, a.name.length > 16 ? a.name.slice(0, 15) + "…" : a.name, "end");
      svg.appendChild(svgEl("rect", { x: pad.l, y: top + (rowH - barH) / 2, width: x(a.attendance) - pad.l, height: barH, rx: 3, fill: color }));
      addText(svg, x(a.attendance) + 6, top + rowH / 2 + 4, a.attendance.toFixed(0) + "%", "start");
    });

    svg.appendChild(svgEl("line", { x1: x(75), x2: x(75), y1: pad.t, y2: H - pad.b, stroke: "#ff8a7a", "stroke-dasharray": "5 4", "stroke-width": 1.5 }));
    addText(svg, x(75), H - 4, "75%");
  }

  // ---------- Rendering: results ----------
  function renderTable() {
    if (!analysis.length) {
      $("#predTable").innerHTML = '<p class="empty">Add a subject to see results.</p>';
      return;
    }

    const rows = analysis
      .map((a) => {
        const trendMark = a.trend === "Improving" ? "▲ " : a.trend === "Declining" ? "▼ " : "– ";
        const trendTone = a.trend === "Improving" ? "good" : a.trend === "Declining" ? "bad" : "";

        return (
          "<tr>" +
            "<td>" + esc(a.name) + "</td>" +
            "<td>" + a.avg.toFixed(1) + "</td>" +
            '<td class="' + trendTone + '">' + trendMark + a.trend + "</td>" +
            "<td>" + a.attendance.toFixed(0) + "%</td>" +
            "<td><strong>" + a.adjusted.toFixed(0) + "</strong> (" + a.grade + ")</td>" +
            '<td><span class="pill ' + a.tone + '">' + a.status + "</span></td>" +
          "</tr>"
        );
      })
      .join("");

    $("#predTable").innerHTML =
      "<table><thead><tr><th>Subject</th><th>Average</th><th>Trend</th><th>Attendance</th><th>Predicted final</th><th>Status</th></tr></thead><tbody>" +
      rows + "</tbody></table>";
  }

  function renderPlan() {
    if (!analysis.length) {
      $("#plan").innerHTML = "";
      return;
    }

    const plan = studyHours();
    const most = Math.max(...plan.map((p) => p.hours));

    $("#plan").innerHTML =
      plan
        .map((p) =>
          '<div class="plan-row"><div class="top-line"><span>' + esc(p.name) + "</span><span><strong>" + p.hours +
          " h</strong> <small>a week, about " + p.perDay + " min a day</small></span></div>" +
          '<span class="bar"><i style="width:' + (p.hours / most) * 100 + '%"></i></span></div>'
        )
        .join("") +
      '<p class="note">Based on ' + state.hours + " hours a week. Every subject gets a base share, and weaker subjects get more. Study in 45-minute blocks with 10-minute breaks.</p>";
  }

  function buildTips() {
    const tips = [];
    const sorted = analysis.slice().sort((a, b) => a.adjusted - b.adjusted);
    const plan = studyHours();

    if (!sorted.length) return ["Add your subjects to get suggestions."];

    const weakest = sorted[0];
    if (weakest.status !== "Strong") {
      const hours = plan.find((p) => p.name === weakest.name).hours;
      tips.push("Start with " + weakest.name + ". It needs the most time, about " + hours + " hours a week.");
    }

    analysis
      .filter((a) => a.trend === "Declining")
      .forEach((a) => tips.push(a.name + " is falling by about " + Math.abs(a.slope).toFixed(0) + " marks each test. Go through your last test and list the mistakes this week."));

    overall.lowAttendance.forEach((a) => tips.push(a.name + ": " + a.attendanceNote));

    if (!tips.length) tips.push("Every subject is on track. Keep your routine and try harder practice questions.");

    tips.push("Revise new lessons within 24 hours, and take one timed practice paper every week.");
    tips.push("Sleep 7 to 8 hours. It improves memory more than extra late-night study.");
    return tips;
  }

  function renderTips() {
    $("#tips").innerHTML = buildTips().map((t) => "<li>" + esc(t) + "</li>").join("");
  }

  function renderNotes() {
    const targets = analysis
      .filter((a) => a.status !== "Strong")
      .sort((a, b) => a.adjusted - b.adjusted)
      .slice(0, 4);

    if (!targets.length) {
      $("#notes").innerHTML = '<p class="empty">All subjects are on track. Revise your notes once a week to stay there.</p>';
      return;
    }

    $("#notes").innerHTML = targets
      .map((a) => {
        const r = resourcesFor(a.name);
        return (
          '<article class="note-card"><h3>' + esc(a.name) + "</h3><ul>" +
          r.tips.map((t) => "<li>" + esc(t) + "</li>").join("") + "</ul>" +
          r.links.map((l) => '<a href="' + l[1] + '" target="_blank" rel="noopener">' + l[0] + "</a>").join("<br>") +
          "</article>"
        );
      })
      .join("");
  }

  function renderAll() {
    runAnalysis();
    renderAlerts();
    renderKpis();
    drawMarks();
    drawAttendance();
    renderTable();
    renderPlan();
    renderTips();
    renderNotes();
    if (lastQuestion) answerQuestion(lastQuestion);
  }

  // ---------- Ask the AI ----------
  function answerQuestion(question) {
    lastQuestion = question;
    const q = question.toLowerCase();
    const box = $("#answer");

    if (!analysis.length) {
      box.textContent = "Add at least one subject first.";
      return;
    }

    const named = analysis.find((a) => q.includes(a.name.toLowerCase()));
    let text;

    if (named) {
      text = named.name + ": average " + named.avg.toFixed(1) + ", trend " + named.trend.toLowerCase() +
        ", attendance " + named.attendance.toFixed(0) + "%.\nPredicted final marks: " + named.adjusted.toFixed(0) +
        " (" + named.grade + "). Status: " + named.status + ".\n" + named.attendanceNote;
    } else if (/weak|low|poor|worst|bad/.test(q)) {
      const weak = analysis.filter((a) => a.status !== "Strong").sort((a, b) => a.adjusted - b.adjusted);
      text = weak.length
        ? "Subjects to focus on, weakest first:\n" + weak.map((a) => "- " + a.name + " (predicted " + a.adjusted.toFixed(0) + ", " + a.trend.toLowerCase() + ")").join("\n")
        : "No weak subjects right now. Every subject is predicted at or above your target of " + state.target + ".";
    } else if (/attend|absent|present|75/.test(q)) {
      text = "Overall attendance is " + overall.attendance.toFixed(1) + "%.\n" +
        analysis.map((a) => "- " + a.name + ": " + a.attendance.toFixed(0) + "%. " + a.attendanceNote).join("\n");
    } else if (/hour|study|time|plan|schedule/.test(q)) {
      text = "Suggested study time for " + state.hours + " hours a week:\n" +
        studyHours().map((p) => "- " + p.name + ": " + p.hours + " h (about " + p.perDay + " min a day)").join("\n");
    } else if (/predict|final|score|grade|result|marks/.test(q)) {
      text = "Predicted final marks:\n" +
        analysis.map((a) => "- " + a.name + ": " + a.adjusted.toFixed(0) + " (" + a.grade + ")").join("\n") +
        "\nOverall: " + overall.predicted.toFixed(1) + " (" + gradeOf(overall.predicted) + ").";
    } else if (/note|refer|resource|book|material|link/.test(q)) {
      const first = analysis.slice().sort((a, b) => a.adjusted - b.adjusted)[0];
      const r = resourcesFor(first.name);
      text = "For " + first.name + ", your weakest subject:\n" + r.tips.map((t) => "- " + t).join("\n") +
        "\nSee the Notes and resources section below for links.";
    } else if (/improve|suggest|tip|advice|help|better/.test(q)) {
      text = buildTips().map((t) => "- " + t).join("\n");
    } else {
      text = "I can answer questions about weak subjects, attendance, study hours, predictions, notes to refer, or any subject by name. Try one of the examples above.";
    }

    box.textContent = text;
  }

  // ---------- Page ----------
  function loadStudent(key) {
    state.subjects = clone(SAMPLES[key]);
    renderEditor();
    renderAll();
    answerQuestion("Which subject is weak?");
  }

  function init() {
    renderEditor();
    renderAll();

    $("#examples").innerHTML = EXAMPLES.map((e) => '<button type="button">' + e + "</button>").join("");
    $("#examples").addEventListener("click", (event) => {
      if (event.target.tagName !== "BUTTON") return;
      $("#askInput").value = event.target.textContent;
      answerQuestion(event.target.textContent);
    });

    $("#askForm").addEventListener("submit", (event) => {
      event.preventDefault();
      if ($("#askInput").value.trim()) answerQuestion($("#askInput").value);
    });

    $("#student").addEventListener("change", (event) => loadStudent(event.target.value));

    $("#hours").addEventListener("input", (event) => {
      state.hours = clamp(Number(event.target.value) || 1, 1, 80);
      renderAll();
    });

    $("#target").addEventListener("input", (event) => {
      state.target = clamp(Number(event.target.value) || 40, 40, 100);
      renderAll();
    });

    $("#editRows").addEventListener("input", (event) => {
      const input = event.target;
      const subject = state.subjects[Number(input.dataset.i)];
      if (!subject) return;

      const field = input.dataset.f;
      if (field === "name") subject.name = input.value;
      else if (field === "attended" || field === "total") subject[field] = Number(input.value) || 0;
      else subject.tests[Number(field.slice(1))] = clamp(Number(input.value) || 0, 0, 100);

      renderAll();
    });

    $("#editRows").addEventListener("click", (event) => {
      const index = event.target.dataset.remove;
      if (index === undefined) return;
      state.subjects.splice(Number(index), 1);
      renderEditor();
      renderAll();
    });

    $("#addSubject").addEventListener("click", () => {
      state.subjects.push({ name: "New subject", attended: 0, total: 0, tests: [0, 0, 0, 0] });
      renderEditor();
      renderAll();
    });

    answerQuestion("Which subject is weak?");
  }

  init();
})();
