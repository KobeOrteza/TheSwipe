# The Swipe

A browser-based word game where players swipe right for real words/slang and left for fake words.

## Project structure

```text
The-Swipe/
├── index.html       # App layout and screen markup
├── css/
│   └── style.css    # App styling and responsive rules
├── js/
│   └── app.js       # Game logic, audio, scoring, settings, and UI events
├── data/
│   └── words.js     # Separate word banks (dictionary, slang, and fake words)
└── README.md
```

## Run the app

1. Open `index.html` in a modern browser.
2. For development, you can also run a local server from this folder:

   ```bash
   python3 -m http.server 8000
   ```

   Then visit <http://localhost:8000>.

The game stores progress in the browser's local storage. Sound, music, and haptics depend on browser/device support. The Google Font is optional; a system-font fallback is included.

## Word banks

The word lists are now maintained in `data/words.js`, separate from the HTML and game logic. The game reads them from `window.SWIPE_WORD_DATA`.

- Dictionary entries: 49,225
- Slang entries: 322
- Fake entries: 10,986
- Total entries: 60,533
