"""
Minimal DL microservice for MamaGuide.
POST /predict  { messages: [...], system_prompt: "..." }  → { response: "..." }

If ANTHROPIC_API_KEY is set, uses Claude (claude-haiku-4-5-20251001) for real responses.
Otherwise falls back to a stub that echoes the last user message — useful for testing
the Express backend without a real model.
"""

import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = int(os.getenv("PORT", 8000))
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")


def call_claude(messages: list, system_prompt: str) -> str:
    try:
        import anthropic  # type: ignore

        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        )
        return response.content[0].text
    except Exception as e:
        return f"[Claude error: {e}]"


def stub_response(messages: list) -> str:
    last = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
    return f"[STUB] Echo: {last}"


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):  # quiet access logs
        print(f"[predict] {args[0]} {args[1]}")

    def do_POST(self):
        if self.path != "/predict":
            self._send(404, {"error": "Not found"})
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self._send(400, {"error": "Invalid JSON"})
            return

        messages = payload.get("messages", [])
        system_prompt = payload.get("system_prompt", "")

        if ANTHROPIC_API_KEY:
            text = call_claude(messages, system_prompt)
        else:
            text = stub_response(messages)

        self._send(200, {"response": text})

    def _send(self, status: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    mode = "Claude (claude-haiku-4-5-20251001)" if ANTHROPIC_API_KEY else "STUB (no ANTHROPIC_API_KEY)"
    print(f"MamaGuide Python service starting on port {PORT} — model: {mode}")
    HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
