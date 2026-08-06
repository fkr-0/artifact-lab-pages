#!/usr/bin/env python3
"""Validate the structured household-continuity layer and generated views."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PACKAGE = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
VERSION = PACKAGE["version"]
CONTINUITY_PATH = ROOT / "src" / "data" / "continuity_catalog.json"
ROUTES_PATH = ROOT / "src" / "data" / "route_catalog.json"
CHAPTER_PATH = ROOT / "src" / "chapters" / "06-zombie-guide.md"
errors: list[str] = []


def check(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


def load(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        errors.append(f"missing data file: {path.relative_to(ROOT)}")
    except json.JSONDecodeError as exc:
        errors.append(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")
    return {}


continuity = load(CONTINUITY_PATH)
routes = load(ROUTES_PATH)
check(continuity.get("release") == VERSION, "continuity catalog release does not match package version")
check(continuity.get("schema_version") == 1, "continuity catalog schema version is not 1")

systems = continuity.get("systems", [])
roles = continuity.get("roles", [])
expected_systems = {
    "information", "air-hazard", "care-power", "water",
    "temperature-shelter", "food", "sanitation", "access-transport",
}
expected_roles = {"coordination", "care", "supplies", "information", "access-logistics"}
check({item.get("id") for item in systems} == expected_systems, "continuity system set is incomplete or unexpected")
check({item.get("id") for item in roles} == expected_roles, "continuity role set is incomplete or unexpected")
check(continuity.get("policy", {}).get("order") == [item.get("id") for item in systems], "continuity order differs from system records")

source_ids = set(routes.get("source_registry", {}))
for system in systems:
    sid = system.get("id", "<missing>")
    for field in ("label", "question", "protect", "backup", "failure_escalation", "owner_prompt"):
        check(bool(system.get(field)), f"continuity system {sid} lacks {field}")
    dependencies = system.get("dependencies", [])
    check(all(dep in expected_systems for dep in dependencies), f"continuity system {sid} has unknown dependency")
    check(sid not in dependencies, f"continuity system {sid} depends on itself")
    refs = system.get("source_ids", [])
    check(bool(refs), f"continuity system {sid} has no source IDs")
    check(all(ref in source_ids for ref in refs), f"continuity system {sid} has unknown source ID")

for role in roles:
    rid = role.get("id", "<missing>")
    for field in ("label", "owns", "backup", "failure_mode"):
        check(bool(role.get(field)), f"continuity role {rid} lacks {field}")

check(len(continuity.get("handoff_fields", [])) >= 7, "continuity handoff lacks required fields")
check(CHAPTER_PATH.exists(), "continuity chapter is missing")
chapter = CHAPTER_PATH.read_text(encoding="utf-8") if CHAPTER_PATH.exists() else ""
for marker in (
    "Household continuity board",
    "Capability inventory",
    "Five functions for the first meeting",
    "The assignment invariant",
    "household_continuity_board.png",
    "first_meeting_roles.png",
):
    check(marker.lower() in chapter.lower(), f"continuity chapter marker missing: {marker}")

for name in ("household_continuity_board.png", "first_meeting_roles.png"):
    check((ROOT / "build" / "diagrams" / name).exists(), f"continuity figure missing: {name}")

serialized = json.dumps(continuity, ensure_ascii=False).lower()
for forbidden in (
    "ash and water",
    "edible insects",
    "three weeks without food",
    "minimum 30 m",
    "bulging cans are bacterial",
):
    check(forbidden not in serialized and forbidden not in chapter.lower(), f"rejected alternate guidance entered the current release: {forbidden}")

if errors:
    print("Continuity validation failed:")
    for error in errors:
        print(f"  - {error}")
    raise SystemExit(1)
print(f"Continuity validation passed: {len(systems)} systems, {len(roles)} roles, 2 generated figures at {VERSION}.")
