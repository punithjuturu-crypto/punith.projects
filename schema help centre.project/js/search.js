var Filter = { q: "", cat: "All" };

// All category names, without repeats.
function categories() {
  var names = SCHEMES.map(function (s) {
    return s.cat;
  }).filter(function (v, i, a) {
    return a.indexOf(v) === i;
  });
  return ["All"].concat(names);
}

// Schemes that match the search text and selected category.
function filtered() {
  var q = Filter.q.toLowerCase();
  return SCHEMES.filter(function (s) {
    if (Filter.cat !== "All" && s.cat !== Filter.cat) return false;
    var text = (s.name + " " + s.benefit + " " + s.who + " " + s.cat).toLowerCase();
    return !q || text.indexOf(q) >= 0;
  });
}

function renderChips(el, onChange) {
  el.innerHTML = categories()
    .map(function (c) {
      var on = c === Filter.cat ? " on" : "";
      return '<button class="chip' + on + '" data-c="' + c + '">' + c + "</button>";
    })
    .join("");

  el.onclick = function (e) {
    if (e.target.dataset.c) {
      Filter.cat = e.target.dataset.c;
      renderChips(el, onChange);
      onChange();
    }
  };
}
