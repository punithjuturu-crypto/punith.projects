// Checks one condition against the user's profile.
function condPass(c, p) {
  var v = p[c.f];
  if (c.eq !== undefined && v !== c.eq) return false;
  if (c.min !== undefined && !(v >= c.min)) return false;
  if (c.max !== undefined && !(v <= c.max)) return false;
  return true;
}

// True if any group has all of its conditions passing.
function anyGroup(groups, p) {
  return (groups || []).some(function (g) {
    return g.every(function (c) {
      return condPass(c, p);
    });
  });
}

// Returns "yes", "maybe" or "no" for one scheme.
function checkScheme(id, p) {
  var r = RULES[id];
  if (!r) return "maybe";
  if (anyGroup(r.yes, p)) return "yes";
  if (anyGroup(r.maybe, p)) return "maybe";
  return "no";
}

// Returns { schemeId: "yes" | "maybe" | "no" } for all schemes.
function checkAll(p) {
  var out = {};
  SCHEMES.forEach(function (s) {
    out[s.id] = checkScheme(s.id, p);
  });
  return out;
}

// Counts how many schemes fall in each result.
function countResults(res) {
  var c = { yes: 0, maybe: 0, no: 0 };
  Object.keys(res).forEach(function (k) {
    c[res[k]]++;
  });
  return c;
}
