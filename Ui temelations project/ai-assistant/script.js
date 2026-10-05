(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const messagesEl = $("#messages");
  const scrollEl = $("#scroll");
  const emptyEl = $("#empty");
  const historyEl = $("#history");
  const inputEl = $("#prompt");
  const sendBtn = $("#send");
  const micBtn = $("#mic");

  const SUGGESTIONS = [
    "What is photosynthesis?",
    "Calculate 15% of 2480",
    "Tell me a joke",
    "Draft a follow-up email"
  ];

  const MODEL = "claude-sonnet-5-5";

  function store(action, key, value) {
    try {
      if (action === "get") return localStorage.getItem(key);
      if (action === "set") localStorage.setItem(key, value);
      if (action === "remove") localStorage.removeItem(key);
    } catch (error) {
      return null;
    }
    return null;
  }

  // ---------- State ----------
  let chats = [{ id: 1, title: "New chat", messages: [] }];
  let activeId = 1;
  let nextId = 2;
  let busy = false;
  let apiKey = store("get", "anthropicKey") || "";

  const activeChat = () => chats.find((c) => c.id === activeId);

  // ---------- Built-in answers (work without internet or a key) ----------
  const JOKES = [
    "Why do programmers prefer dark mode? Because light attracts bugs.",
    "I would tell you a UDP joke, but you might not get it.",
    "Why did the student eat his homework? The teacher said it was a piece of cake."
  ];

  function calculate(text) {
    let expr = text.toLowerCase()
      .replace(/what is|what's|calculate|compute|solve|equals|=|\?/g, " ")
      .replace(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/g, "($1/100*$2)")
      .replace(/×|x(?=\s*\d)/g, "*")
      .replace(/÷/g, "/")
      .replace(/\^/g, "**")
      .replace(/(\d),(?=\d{3})/g, "$1")
      .replace(/plus/g, "+")
      .replace(/minus/g, "-")
      .replace(/times|multiplied by/g, "*")
      .replace(/divided by/g, "/")
      .trim();

    if (!expr || !/^[\d\s+\-*/().%]+$/.test(expr) || !/\d/.test(expr) || !/[+\-*/%]/.test(expr)) return null;

    try {
      const value = Function('"use strict"; return (' + expr.replace(/%/g, "/100") + ")")();
      if (typeof value !== "number" || !isFinite(value)) return null;
      return { text: "The answer is " + Number(value.toFixed(6)).toLocaleString("en-IN") + "." };
    } catch (error) {
      return null;
    }
  }

  function localAnswer(prompt) {
    const q = prompt.toLowerCase().trim();

    const math = calculate(prompt);
    if (math) return math;

    if (/^(hi|hello|hey|vanakkam|good (morning|afternoon|evening))\b/.test(q)) {
      return { text: "Hello! I am Wren. Ask me anything, or tap the microphone and speak." };
    }
    if (/how are you/.test(q)) return { text: "I am doing well, thank you. What would you like to know?" };
    if (/your name|who are you/.test(q)) return { text: "I am Wren, a voice and chat assistant." };
    if (/thank/.test(q)) return { text: "You are welcome!" };
    if (/joke/.test(q)) return { text: JOKES[Math.floor(Math.random() * JOKES.length)] };

    if (/\b(time|date|day|today)\b/.test(q) && /what|tell|current|today/.test(q)) {
      const now = new Date();
      return {
        text: "It is " + now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) +
          " on " + now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + "."
      };
    }

    if (/email|follow/.test(q)) {
      return { text: "Hi Priya,\n\nThanks for your time earlier. I have attached the proposal we discussed. Could you share your thoughts by Friday?\n\nBest regards" };
    }
    if (/plan|checklist|launch/.test(q)) {
      return {
        text: "A plan goes more smoothly when each step has one owner. Here is a starting checklist.",
        card: { title: "Checklist", items: ["Confirm the goal and date.", "Split the work into small steps.", "Give each step one owner.", "Review progress every few days."] }
      };
    }
    if (/\bsql\b/.test(q)) {
      return {
        text: "This query counts orders per customer and keeps customers with more than five orders.",
        card: { title: "Query breakdown", code: "SELECT customer_id, COUNT(*) AS orders\nFROM orders\nGROUP BY customer_id\nHAVING COUNT(*) > 5;" }
      };
    }

    return null;
  }

  // ---------- Wikipedia lookup ----------
  function topicOf(prompt) {
    return prompt
      .replace(/\?/g, "")
      .replace(/^(please\s+)?(what is|what are|what's|who is|who was|who are|tell me about|explain|define|describe|meaning of|about)\s+(an?\s+|the\s+)?/i, "")
      .trim();
  }

  async function wikipedia(prompt) {
    const topic = topicOf(prompt);
    if (!topic) return null;

    const searchUrl = "https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=1&srsearch=" +
      encodeURIComponent(topic);
    const found = await (await fetch(searchUrl)).json();
    const hit = found.query && found.query.search && found.query.search[0];
    if (!hit) return null;

    const summaryUrl = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(hit.title);
    const page = await (await fetch(summaryUrl)).json();
    if (!page.extract) return null;

    const sentences = page.extract.match(/[^.!?]+[.!?]+/g) || [page.extract];
    return {
      text: sentences.slice(0, 3).join(" ").trim(),
      card: {
        title: page.title,
        text: "Source: Wikipedia",
        link: page.content_urls && page.content_urls.desktop ? page.content_urls.desktop.page : null
      }
    };
  }

  // ---------- Full AI answers (optional key) ----------
  async function askClaude(history) {
    const language = $("#lang").selectedOptions[0].textContent;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        system: "You are Wren, a friendly voice and chat assistant. Keep answers short and clear, in plain text with no markdown. Reply in " + language + " unless the user writes in another language.",
        messages: history.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }))
      })
    });

    const json = await response.json();
    if (!response.ok) throw new Error((json.error && json.error.message) || "The AI request failed.");
    return { text: json.content.map((part) => part.text || "").join("") };
  }

  async function answer(prompt, history) {
    if (apiKey) {
      try {
        return await askClaude(history);
      } catch (error) {
        return { text: "I could not reach the AI service: " + error.message };
      }
    }

    const local = localAnswer(prompt);
    if (local) return local;

    try {
      const web = await wikipedia(prompt);
      if (web) return web;
    } catch (error) {
      return { text: "I could not look that up because there is no internet connection right now. I can still do maths, tell the time, tell jokes and draft messages. Add an API key under AI settings to answer anything." };
    }

    return { text: "I could not find an answer to that. Try rephrasing it, for example \"What is machine learning?\", or add an API key under AI settings for full answers." };
  }

  // ---------- Voice ----------
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognizer = null;
  let listening = false;

  function setListening(value) {
    listening = value;
    micBtn.setAttribute("aria-pressed", String(value));
    micBtn.textContent = value ? "Stop" : "Mic";
    $("#hint").textContent = value ? "Listening… speak now." : "Enter to send, Shift + Enter for a new line.";
  }

  function startListening() {
    if (busy) return;
    recognizer = new Recognition();
    recognizer.lang = $("#lang").value;
    recognizer.interimResults = true;
    recognizer.continuous = false;

    recognizer.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
      inputEl.value = text;
      resizeInput();

      if (event.results[event.results.length - 1].isFinal) send(text);
    };

    recognizer.onerror = (event) => {
      const reasons = {
        "not-allowed": "Microphone access was blocked. Allow the microphone for this page and try again.",
        "no-speech": "I did not hear anything. Tap the microphone and try again.",
        "network": "Voice recognition needs an internet connection."
      };
      $("#hint").textContent = reasons[event.error] || "Voice input stopped (" + event.error + ").";
    };

    recognizer.onend = () => setListening(false);

    try {
      recognizer.start();
      setListening(true);
    } catch (error) {
      setListening(false);
    }
  }

  function toggleMic() {
    if (listening && recognizer) {
      recognizer.stop();
    } else {
      startListening();
    }
  }

  function speak(text) {
    if (!$("#speakToggle").checked || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = $("#lang").value;

    const voice = window.speechSynthesis.getVoices().find((v) => v.lang === utterance.lang) ||
      window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(utterance.lang.slice(0, 2)));
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  }

  // ---------- Rendering ----------
  function renderHistory() {
    historyEl.innerHTML = "";

    chats.forEach((chat) => {
      const item = document.createElement("li");
      const button = document.createElement("button");

      button.textContent = chat.title;
      button.classList.toggle("active", chat.id === activeId);
      button.addEventListener("click", () => {
        if (busy) return;
        activeId = chat.id;
        document.body.classList.remove("sidebar-open");
        renderAll();
      });

      item.appendChild(button);
      historyEl.appendChild(item);
    });

    $("#chatTitle").textContent = activeChat().title;
  }

  function buildCard(card) {
    const el = document.createElement("div");
    el.className = "card";

    const title = document.createElement("h3");
    title.textContent = card.title;
    el.appendChild(title);

    if (card.items) {
      const list = document.createElement("ul");
      card.items.forEach((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        list.appendChild(li);
      });
      el.appendChild(list);
    }

    if (card.code) {
      const pre = document.createElement("pre");
      pre.textContent = card.code;
      el.appendChild(pre);
    }

    if (card.text) {
      const p = document.createElement("p");
      p.textContent = card.text + " ";
      if (card.link) {
        const a = document.createElement("a");
        a.href = card.link;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "Read more";
        p.appendChild(a);
      }
      el.appendChild(p);
    }

    return el;
  }

  function buildActions(message) {
    const bar = document.createElement("div");
    bar.className = "actions";

    const copy = document.createElement("button");
    copy.textContent = "Copy";
    copy.addEventListener("click", () => {
      const extra = message.card && (message.card.items || message.card.code)
        ? [].concat(message.card.items || message.card.code).join("\n")
        : "";
      navigator.clipboard.writeText(message.text + (extra ? "\n\n" + extra : ""));
      copy.textContent = "Copied";
      setTimeout(() => (copy.textContent = "Copy"), 1200);
    });

    const again = document.createElement("button");
    again.textContent = "Try again";
    again.addEventListener("click", regenerate);

    const listen = document.createElement("button");
    listen.textContent = "Listen";
    listen.addEventListener("click", () => {
      const wasOn = $("#speakToggle").checked;
      $("#speakToggle").checked = true;
      speak(message.text);
      $("#speakToggle").checked = wasOn;
    });

    bar.append(copy, listen, again);
    return bar;
  }

  function buildMessage(message) {
    const wrap = document.createElement("div");
    wrap.className = "msg " + message.role;

    const text = document.createElement("div");
    text.className = "text";
    text.textContent = message.text;

    if (message.role === "user") {
      wrap.appendChild(text);
      return { wrap, text };
    }

    const body = document.createElement("div");
    body.appendChild(text);
    wrap.appendChild(body);
    return { wrap, text, body };
  }

  function finishAiMessage(parts, message, isLast) {
    if (message.card) parts.body.appendChild(buildCard(message.card));
    if (isLast) parts.body.appendChild(buildActions(message));
  }

  function renderMessages() {
    messagesEl.innerHTML = "";
    const list = activeChat().messages;
    emptyEl.hidden = list.length > 0;

    list.forEach((message, index) => {
      const parts = buildMessage(message);
      if (message.role === "ai") finishAiMessage(parts, message, index === list.length - 1);
      messagesEl.appendChild(parts.wrap);
    });

    scrollEl.scrollTop = scrollEl.scrollHeight;
  }

  function renderAll() {
    renderHistory();
    renderMessages();
  }

  // ---------- Sending ----------
  function setBusy(value) {
    busy = value;
    sendBtn.disabled = value;
  }

  function showTyping() {
    const wrap = document.createElement("div");
    wrap.className = "msg ai";
    wrap.innerHTML = '<span class="typing" aria-label="Wren is typing"><i></i><i></i><i></i></span>';
    messagesEl.appendChild(wrap);
    scrollEl.scrollTop = scrollEl.scrollHeight;
    return wrap;
  }

  async function respond(prompt) {
    setBusy(true);
    const typing = showTyping();
    const history = activeChat().messages.slice();

    const reply = await answer(prompt, history);
    typing.remove();

    const message = { role: "ai", text: reply.text, card: reply.card };
    activeChat().messages.push(message);

    const parts = buildMessage({ role: "ai", text: "" });
    messagesEl.appendChild(parts.wrap);
    speak(message.text);

    // Stream the text, a few characters at a time.
    const step = Math.max(1, Math.ceil(message.text.length / 220));
    let shown = 0;

    const timer = setInterval(() => {
      shown = Math.min(message.text.length, shown + step);
      parts.text.textContent = message.text.slice(0, shown);
      scrollEl.scrollTop = scrollEl.scrollHeight;

      if (shown >= message.text.length) {
        clearInterval(timer);
        finishAiMessage(parts, message, true);
        scrollEl.scrollTop = scrollEl.scrollHeight;
        setBusy(false);
      }
    }, 14);
  }

  function send(text) {
    const prompt = text.trim();
    if (!prompt || busy) return;

    if (listening && recognizer) recognizer.stop();

    const chat = activeChat();
    if (!chat.messages.length) chat.title = prompt.length > 28 ? prompt.slice(0, 28) + "…" : prompt;
    chat.messages.push({ role: "user", text: prompt });

    inputEl.value = "";
    resizeInput();
    renderAll();
    respond(prompt);
  }

  function regenerate() {
    if (busy) return;
    const list = activeChat().messages;
    if (list.length && list[list.length - 1].role === "ai") list.pop();

    const lastUser = [...list].reverse().find((m) => m.role === "user");
    renderMessages();
    if (lastUser) respond(lastUser.text);
  }

  // ---------- Input and settings ----------
  function resizeInput() {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 160) + "px";
  }

  function showKeyStatus() {
    $("#keyStatus").textContent = apiKey ? "Full AI answers are on." : "Using built-in answers and Wikipedia.";
  }

  function init() {
    SUGGESTIONS.forEach((text) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = text;
      button.addEventListener("click", () => send(text));
      $("#suggestions").appendChild(button);
    });

    $("#composer").addEventListener("submit", (event) => {
      event.preventDefault();
      send(inputEl.value);
    });

    inputEl.addEventListener("input", resizeInput);
    inputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        send(inputEl.value);
      }
    });

    if (Recognition) {
      micBtn.addEventListener("click", toggleMic);
    } else {
      micBtn.hidden = true;
      $("#hint").textContent = "Voice input is not supported in this browser. Try Chrome or Edge.";
    }

    $("#newChat").addEventListener("click", () => {
      if (busy) return;
      const empty = chats.find((c) => !c.messages.length);
      if (empty) {
        activeId = empty.id;
      } else {
        chats.unshift({ id: nextId, title: "New chat", messages: [] });
        activeId = nextId++;
      }
      document.body.classList.remove("sidebar-open");
      renderAll();
      inputEl.focus();
    });

    $("#menuBtn").addEventListener("click", () => document.body.classList.toggle("sidebar-open"));

    $("#settingsBtn").addEventListener("click", () => {
      $("#settings").hidden = !$("#settings").hidden;
      $("#keyInput").value = apiKey;
      showKeyStatus();
    });

    $("#keySave").addEventListener("click", () => {
      apiKey = $("#keyInput").value.trim();
      store("set", "anthropicKey", apiKey);
      showKeyStatus();
    });

    $("#keyClear").addEventListener("click", () => {
      apiKey = "";
      store("remove", "anthropicKey");
      $("#keyInput").value = "";
      showKeyStatus();
    });

    if ("speechSynthesis" in window) window.speechSynthesis.getVoices();

    renderAll();
  }

  init();
})();
