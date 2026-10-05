// "yes" and "maybe" are lists of groups.
// A group is a list of conditions that must ALL pass.
// If ANY group passes, that result applies.
// Fields: age, gen (f/m/o), st (tn/ot), inc, job, house (yes/no)
var RULES = {
  "pm-kisan": {
    yes: [
      [{ f: "job", eq: "farmer" }]
    ]
  },
  "pm-jay": {
    yes: [
      [{ f: "age", min: 70 }],
      [{ f: "inc", max: 150000 }]
    ],
    maybe: [
      [{ f: "inc", max: 500000 }]
    ]
  },
  "cmchis": {
    yes: [
      [{ f: "st", eq: "tn" }, { f: "inc", max: 120000 }]
    ],
    maybe: [
      [{ f: "st", eq: "tn" }, { f: "inc", max: 300000 }]
    ]
  },
  "ujjwala": {
    yes: [
      [{ f: "gen", eq: "f" }, { f: "age", min: 18 }, { f: "inc", max: 200000 }]
    ],
    maybe: [
      [{ f: "gen", eq: "f" }, { f: "age", min: 18 }]
    ]
  },
  "pmay": {
    yes: [
      [{ f: "house", eq: "no" }, { f: "inc", max: 600000 }]
    ],
    maybe: [
      [{ f: "house", eq: "no" }, { f: "inc", max: 1800000 }]
    ]
  },
  "sukanya": {
    yes: [
      [{ f: "gen", eq: "f" }, { f: "age", max: 10 }]
    ]
  },
  "apy": {
    yes: [
      [{ f: "age", min: 18, max: 40 }, { f: "inc", max: 1000000 }]
    ],
    maybe: [
      [{ f: "age", min: 18, max: 40 }]
    ]
  },
  "suraksha": {
    yes: [
      [{ f: "age", min: 18, max: 50 }]
    ],
    maybe: [
      [{ f: "age", min: 51, max: 70 }]
    ]
  },
  "mudra": {
    yes: [
      [{ f: "job", eq: "self" }]
    ],
    maybe: [
      [{ f: "age", min: 18 }]
    ]
  },
  "vishwakarma": {
    maybe: [
      [{ f: "job", eq: "self" }, { f: "age", min: 18 }]
    ]
  },
  "kmut": {
    yes: [
      [
        { f: "st", eq: "tn" },
        { f: "gen", eq: "f" },
        { f: "age", min: 21 },
        { f: "inc", max: 250000 }
      ]
    ],
    maybe: [
      [
        { f: "st", eq: "tn" },
        { f: "gen", eq: "f" },
        { f: "age", min: 21 }
      ]
    ]
  },
  "puthumai": {
    maybe: [
      [{ f: "st", eq: "tn" }, { f: "gen", eq: "f" }, { f: "job", eq: "student" }]
    ]
  },
  "pudhalvan": {
    maybe: [
      [{ f: "st", eq: "tn" }, { f: "gen", eq: "m" }, { f: "job", eq: "student" }]
    ]
  }
};
