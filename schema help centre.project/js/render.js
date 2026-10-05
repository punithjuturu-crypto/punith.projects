var LABEL = {
  yes: "You are eligible",
  maybe: "Maybe – check details",
  no: "Not eligible"
};

function badge(status) {
  if (!status) return "";
  return '<span class="badge ' + status + '">' + LABEL[status] + "</span>";
}

function schemeCard(s, status) {
  return (
    '<a class="card" href="scheme.html?id=' + s.id + '">' +
      "<h3>" + s.name + "</h3>" +
      '<div class="meta">' + s.cat + "</div>" +
      "<p>" + s.benefit + "</p>" +
      badge(status) +
    "</a>"
  );
}

function renderList(el, list, results) {
  if (!list.length) {
    el.innerHTML = '<div class="empty">No schemes match.</div>';
    return;
  }
  el.innerHTML = list
    .map(function (s) {
      return schemeCard(s, results && results[s.id]);
    })
    .join("");
}

function renderDetail(el, s, status) {
  el.innerHTML =
    "<h1>" + s.name + "</h1>" +
    '<div class="meta">' + s.cat + "</div>" +
    badge(status) +
    "<h3>Benefit</h3><p>" + s.benefit + "</p>" +
    "<h3>Who can get it</h3><p>" + s.who + "</p>" +
    "<h3>Documents needed</h3><p>" + s.docs + "</p>" +
    '<p><a class="btn" href="' + s.link + '" target="_blank" rel="noopener">Official website</a></p>';
}
