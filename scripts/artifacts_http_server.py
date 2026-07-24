#!/usr/bin/env python3
"""Serve the artifacts workspace using its deployment path mappings.

The editable workspace keeps Vite sources at paths such as
``ethic-brawl/index.html`` while the deploy manifest copies
``ethic-brawl/dist`` to the public ``ethic-brawl`` path.  A plain
``python -m http.server`` therefore exposes the source index and its
TypeScript entrypoint instead of the built JavaScript bundle.

This server reads the app-hub source catalog and applies the same
``deploy.includePath -> deploy.targetPath`` mounts while serving the working
tree.  The browser consequently sees the same URLs locally and after deploy.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path, PurePosixPath
from typing import Iterable
from urllib.parse import unquote, urlsplit


DEFAULT_CATALOG = "app-hub-v11/artifacts.source.json"


@dataclass(frozen=True)
class DeployMount:
    target: tuple[str, ...]
    include: tuple[str, ...]

    @property
    def target_text(self) -> str:
        return "/".join(self.target)

    @property
    def include_text(self) -> str:
        return "/".join(self.include)


class ArtifactHTTPServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def _safe_relative_parts(value: object) -> tuple[str, ...] | None:
    if not isinstance(value, str) or not value.strip():
        return None
    normalized = value.replace("\\", "/").strip("/")
    path = PurePosixPath(normalized)
    if path.is_absolute() or ".." in path.parts:
        return None
    parts = tuple(part for part in path.parts if part not in ("", "."))
    return parts or None


def resolve_request_parts(path: str, mounts: Iterable[DeployMount]) -> tuple[str, ...] | None:
    request_path = unquote(urlsplit(path).path, errors="surrogatepass").replace("\\", "/")
    request = PurePosixPath(request_path)
    parts: list[str] = []
    for part in request.parts:
        if part in ("", "/", "."):
            continue
        if part == "..":
            return None
        parts.append(part)
    return map_request_parts(parts, mounts)


def load_deploy_mounts(root: Path, catalog_path: Path) -> list[DeployMount]:
    catalog = catalog_path if catalog_path.is_absolute() else root / catalog_path
    if not catalog.is_file():
        return []

    source = json.loads(catalog.read_text(encoding="utf-8"))
    mounts: dict[tuple[str, ...], DeployMount] = {}
    for item in source.get("items", []):
        deploy = item.get("deploy") or {}
        include = _safe_relative_parts(deploy.get("includePath"))
        target = _safe_relative_parts(deploy.get("targetPath"))
        if not include or not target or include == target:
            continue
        previous = mounts.get(target)
        mount = DeployMount(target=target, include=include)
        if previous and previous.include != include:
            target_text = "/".join(target)
            raise ValueError(f"conflicting deployment mounts for {target_text}")
        mounts[target] = mount

    return sorted(mounts.values(), key=lambda mount: len(mount.target), reverse=True)


def map_request_parts(parts: Iterable[str], mounts: Iterable[DeployMount]) -> tuple[str, ...]:
    request = tuple(parts)
    for mount in mounts:
        # Keep an explicitly requested build path stable.  This matters when
        # includePath is nested below targetPath, as with ethic-brawl/dist.
        if request[: len(mount.include)] == mount.include:
            return request
        if request[: len(mount.target)] == mount.target:
            return mount.include + request[len(mount.target) :]
    return request


class ArtifactRequestHandler(SimpleHTTPRequestHandler):
    """Static handler with deployment mounts and browser-safe module MIME types."""

    module_mime_types = {
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".map": "application/json",
        ".wasm": "application/wasm",
        ".svg": "image/svg+xml",
        ".webmanifest": "application/manifest+json",
    }

    def __init__(self, *args, mounts: Iterable[DeployMount] = (), **kwargs):
        self.deploy_mounts = tuple(mounts)
        super().__init__(*args, **kwargs)

    def translate_path(self, path: str) -> str:
        mapped = resolve_request_parts(path, self.deploy_mounts)
        if mapped is None:
            return os.path.join(os.fspath(self.directory or os.getcwd()), "__invalid__")
        translated = os.fspath(self.directory or os.getcwd())
        for part in mapped:
            translated = os.path.join(translated, part)
        return translated

    def guess_type(self, path: str) -> str:
        override = self.module_mime_types.get(Path(path).suffix.lower())
        return override or super().guess_type(path)

    def security_headers(self) -> dict[str, str]:
        return {
            "Cache-Control": "no-store, max-age=0",
            "Pragma": "no-cache",
            "Referrer-Policy": "same-origin",
            "X-Content-Type-Options": "nosniff",
        }

    def end_headers(self) -> None:
        for name, value in self.security_headers().items():
            self.send_header(name, value)
        super().end_headers()

    def send_head(self):
        if resolve_request_parts(self.path, self.deploy_mounts) is None:
            self.send_error(404, "File not found")
            return None
        return super().send_head()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Serve artifacts with deploy includePath/targetPath mounts"
    )
    parser.add_argument("port", nargs="?", type=int, default=8080)
    parser.add_argument("--bind", "-b", metavar="ADDRESS", default=None)
    parser.add_argument("--directory", "-d", default=os.getcwd())
    parser.add_argument("--catalog", default=DEFAULT_CATALOG)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = Path(args.directory).expanduser().resolve()
    mounts = load_deploy_mounts(root, Path(args.catalog))
    handler = partial(ArtifactRequestHandler, directory=os.fspath(root), mounts=mounts)
    bind = args.bind or ""

    try:
        with ArtifactHTTPServer((bind, args.port), handler) as server:
            actual_port = int(server.server_address[1])
            display_host = args.bind or "0.0.0.0"
            for mount in mounts:
                state = "ready" if (root / mount.include_text).exists() else "build output missing"
                print(
                    f"Mount /{mount.target_text}/ -> {mount.include_text}/ ({state})",
                    flush=True,
                )
            print(
                f"Serving artifacts on http://{display_host}:{actual_port}/ from {root}",
                flush=True,
            )
            try:
                server.serve_forever()
            except KeyboardInterrupt:
                pass
    except OSError as exc:
        port_text = args.port
        bind_text = args.bind or "0.0.0.0"
        print(
            f"Error: Port {port_text} unavailable on {bind_text}:{port_text}: {exc.strerror or exc}",
            file=sys.stderr,
            flush=True,
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
