export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="utf-8" />
    <title>Session Interrupted — VoxScript</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { color-scheme: dark; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: #09090b;
        color: #f4f4f5;
        display: grid;
        place-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 1.5rem;
        box-sizing: border-box;
      }
      .card {
        max-width: 30rem;
        width: 100%;
        background: #18181b;
        border: 1px solid #27272a;
        border-radius: 0.75rem;
        padding: 2rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      }
      .icon {
        display: inline-flex;
        padding: 0.5rem;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 0.5rem;
        color: #ef4444;
        margin-bottom: 1rem;
      }
      h1 { font-size: 1.25rem; font-weight: 700; margin: 0 0 0.5rem; }
      p { color: #a1a1aa; font-size: 0.875rem; line-height: 1.5; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
      button, a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        transition: opacity 0.15s ease;
      }
      .primary { background: #f4f4f5; color: #09090b; border: 1px solid #f4f4f5; }
      .secondary { background: #27272a; color: #f4f4f5; border: 1px solid #3f3f46; }
      button:hover, a:hover { opacity: 0.9; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <h1>Session Interrupted</h1>
      <p>Something went off-beat during rendering. Your saved tracks, recorded takes, and brain files are secure in local storage.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Reload Session</button>
        <a class="secondary" href="/library">Return to Library</a>
      </div>
    </div>
  </body>
</html>`;
}
