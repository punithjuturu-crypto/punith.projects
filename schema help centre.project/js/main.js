function $(id) {
  return document.getElementById(id);
}

var page = document.body.dataset.page;

// ---------- Home page ----------
if (page === "home") {
  var results = null;

  function showStats() {
    $("sTotal").textContent = SCHEMES.length;

    var p = Store.get();
    results = p ? checkAll(p) : null;
    var c = results ? countResults(results) : null;

    $("sYes").textContent = c ? c.yes : "–";
    $("sMaybe").textContent = c ? c.maybe : "–";
    $("sNo").textContent = c ? c.no : "–";
  }

  function draw() {
    renderList($("list"), filtered(), results);
  }

  showStats();
  renderChips($("chips"), draw);
  draw();

  $("q").oninput = function () {
    Filter.q = this.value;
    draw();
  };
}

// ---------- Eligibility page ----------
if (page === "eligibility") {
  var saved = Store.get();
  var fields = ["age", "gen", "st", "inc", "job", "house"];

  if (saved) {
    fields.forEach(function (k) {
      if (saved[k] !== undefined) $(k).value = saved[k];
    });
  }

  function run() {
    var p = {
      age: +$("age").value || 0,
      gen: $("gen").value,
      st: $("st").value,
      inc: +$("inc").value || 0,
      job: $("job").value,
      house: $("house").value
    };

    if (!p.age || !p.gen || !p.job) {
      alert("Please fill age, gender and occupation.");
      return;
    }

    Store.set(p);

    var res = checkAll(p);
    var c = countResults(res);

    $("summary").innerHTML =
      '<span class="badge yes">' + c.yes + " eligible</span> " +
      '<span class="badge maybe">' + c.maybe + " maybe</span> " +
      '<span class="badge no">' + c.no + " not eligible</span>";

    // Show eligible schemes first, then maybe, then not eligible.
    var order = { yes: 0, maybe: 1, no: 2 };
    var list = SCHEMES.slice().sort(function (a, b) {
      return order[res[a.id]] - order[res[b.id]];
    });

    renderList($("list"), list, res);
  }

  $("go").onclick = run;

  $("reset").onclick = function () {
    Store.clear();
    location.reload();
  };

  if (saved) run();
}

// ---------- Scheme detail page ----------
if (page === "scheme") {
  var id = new URLSearchParams(location.search).get("id");
  var s = SCHEMES.filter(function (x) {
    return x.id === id;
  })[0];
  var profile = Store.get();

  if (s) {
    renderDetail($("detail"), s, profile ? checkScheme(s.id, profile) : null);
  } else {
    $("detail").innerHTML =
      '<div class="empty">Scheme not found. <a href="index.html">Back to all schemes</a></div>';
  }
}
