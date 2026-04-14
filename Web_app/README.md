# PrePMa Landing Page

A clean, responsive landing page showcasing the PrePMa chatbot with a pop‑out Dialogflow widget.

## Structure

- `index.html` – main page and Dialogflow integration
- `assets/css/styles.css` – theme, layout, responsive styles
- `assets/js/main.js` – navigation, smooth scrolling, and chat CTA behavior

## Run Locally

Recommended: serve over HTTP so Dialogflow replies.

Option A — Node (no dependencies):

```cmd
cd d:\Projects\PrEP\Web_app
node server.js
```

Then open `http://localhost:8080`.

Option B — Quick one‑off server via npx:

```cmd
npx serve "d:\Projects\PrEP\Web_app"
```

Option C — VS Code Live Server: Right‑click `index.html` → "Open with Live Server".

Option D — Python Flask app:

```cmd
cd d:\Projects\PrEP\Web_app
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Then open `http://localhost:5000` and ensure this origin is allow‑listed in Dialogflow.

### Why not `file://`?
Dialogflow Messenger enforces an allow‑listed origin. Opening via `file://` gives a null origin and the bot won’t reply. Use a local server (`http://localhost`).

Run a quick server:

```cmd
npx serve "d:\Projects\PrEP\Web_app"
```

Then visit the printed `http://localhost:PORT` URL.

## Customize

- Update text, sections, and icons in `index.html`.
- Tweak theme colors and spacing via CSS variables in `assets/css/styles.css`.
- The chat buttons scroll to the chat bubble and nudge it. If your Dialogflow web component supports it, setting the `opened` attribute may open the chat.

## Dialogflow Widget

The page includes the provided snippet with your IDs:

```html
<link rel="stylesheet" href="https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/themes/df-messenger-default.css">
<script src="https://www.gstatic.com/dialogflow-console/fast/df-messenger/prod/v1/df-messenger.js"></script>
<df-messenger
  project-id="prepbot-41203"
  agent-id="a728e52b-7191-4785-8302-9570efd5c9fa"
  language-code="en"
  max-query-length="-1"
  allow-feedback="all">
  <df-messenger-chat-bubble chat-title="PrePMa"></df-messenger-chat-bubble>
</df-messenger>
```

Styles for the widget are applied inline in `index.html` under a `<style>` tag targeting `df-messenger` CSS variables.

## Troubleshooting (no bot replies)
- Domain allowlist: In Dialogflow CX Console → Integrations → Dialogflow Messenger → Manage → Domain allowlist, add:
  - `http://localhost`
  - `http://127.0.0.1`
  - Your production domain (e.g., `https://www.example.com`)
- Serve over HTTP(S): Avoid `file://` — use a local server (see above) or VS Code Live Server.
- Language: Ensure your agent supports `language-code="en"`.
- Check console logs: This page logs `df-request-sent`, `df-response-received`, and `df-error` events. Open DevTools → Console to see errors like permission/allowlist issues.
- Agent routing: Make sure your Start Flow handles text input or has a fallback intent so simple messages (like "hi") get a response.
