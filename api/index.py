import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.main import app


class StripAPIPrefixMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            path = scope["path"]
            if path.startswith("/api"):
                scope["path"] = path[4:] or "/"
        await self.app(scope, receive, send)


app.add_middleware(StripAPIPrefixMiddleware)
handler = app
