# Wren – AI Assistant (chat and voice)

![Preview](preview.png)

## What the UI pattern is
An AI assistant interface is a conversation: the person types or speaks, and the assistant answers, sometimes with a structured card.

## Where it is commonly used
Chat assistants, customer support widgets, voice assistants, writing tools and copilots inside products.

## Why it is relevant to modern web interfaces
Natural-language input, including voice, is becoming a main way to use software. The interface has to make waiting feel short, make answers easy to scan and let people choose how they interact.

## Patterns observed
- Suggested prompts on an empty screen.
- A typing indicator, then text that streams in.
- Copy, "Listen" and "Try again" actions on the latest answer.
- Microphone button with a clear listening state.
- A list of recent chats, collapsible on small screens.

## What this implementation does differently
- **Answers any question in three layers.** 
  1. Built-in answers: maths (such as "15% of 2480"), time and date, jokes, greetings, and message drafts.
  2. General questions are looked up on Wikipedia, with a short summary and a link.
  3. Optional **full AI**: paste an Anthropic API key under "AI settings" and every question goes to Claude.
- **Voice in and out.** The microphone button uses the browser's speech recognition (English, Tamil or Hindi) and sends the question automatically. "Read replies aloud" speaks answers, and each answer has a "Listen" button.
- Assistant answers sit directly on the page; only the person's messages are in bubbles.

## Important notes
- Voice input works best in Chrome or Edge, needs an internet connection, and asks for microphone permission. Opening the page from a local server (for example `python -m http.server`) is more reliable than opening the file directly.
- Wikipedia lookup needs internet. Offline, Wren still does maths, time, jokes and drafts.
- The API key is stored only in the browser. Anyone who uses the page on a shared computer could see it, so do not publish a page with a key saved in it.
- Replies from the built-in engine are in English. For Tamil or Hindi answers, use the full AI option.

## Files
- `index.html` – page structure
- `style.css` – layout, colours and responsive rules
- `script.js` – chats, answer engine, Wikipedia lookup, optional AI call, voice input and output

## Run it
Open `index.html` in a modern browser. Try "Calculate 15% of 2480", "What is photosynthesis?" or tap the microphone and speak.
