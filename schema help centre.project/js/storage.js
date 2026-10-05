// Saves the user's answers in their own browser only.
var Store = {
  get: function () {
    try {
      return JSON.parse(localStorage.getItem("profile"));
    } catch (e) {
      return null;
    }
  },

  set: function (p) {
    try {
      localStorage.setItem("profile", JSON.stringify(p));
    } catch (e) {}
  },

  clear: function () {
    try {
      localStorage.removeItem("profile");
    } catch (e) {}
  }
};
