#!/usr/bin/env python3
"""Validate route, locale, source-freshness, and accessibility foundations."""
from __future__ import annotations

import json
import os
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PACKAGE = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
VERSION = PACKAGE["version"]
ROUTES_PATH = ROOT / "src" / "data" / "route_catalog.json"
LOCALE_PATH = ROOT / "src" / "data" / "locales" / "de-DE.json"
ACCESS_PATH = ROOT / "src" / "data" / "accessibility_profiles.json"
errors: list[str] = []
warnings: list[str] = []


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


routes = load(ROUTES_PATH)
locale = load(LOCALE_PATH)
access = load(ACCESS_PATH)
check(routes.get("release") == VERSION, "route catalog release does not match package version")
check(locale.get("release") == VERSION, "locale release does not match package version")
check(access.get("release") == VERSION, "accessibility registry release does not match package version")
check(routes.get("policy", {}).get("queue") == ["action", "backup", "escalation", "destination"], "route queue invariant missing")

destinations = routes.get("destinations", {})
sources = routes.get("source_registry", {})
overrides = routes.get("overrides", [])
needs = routes.get("needs", [])
modifiers = routes.get("modifiers", [])
required_override_ids = {
    "life-medical", "violence-crime", "fire-smoke", "carbon-monoxide",
    "gas-release", "chemical-exposure", "electrical-danger",
}
required_modifier_ids = {
    "alone", "infant-child", "pregnancy-postpartum", "mobility-sensory",
    "medication", "powered-device", "animal", "language-communication", "no-transport",
}
required_destinations = {
    "112", "110", "115", "116117", "116016", "116111", "116123",
    "poison-centre", "gas-network", "chapter-hazard", "chapter-outage",
    "chapter-safe-place", "men-violence-help", "women-shelter-search",
    "municipal-emergency-housing", "accessible-emergency-place", "youth-emergency-service",
}
check(required_destinations <= set(destinations), "route catalog is missing required destinations")
check(required_override_ids == {item.get("id") for item in overrides}, "override route set is incomplete or unexpected")
check(required_modifier_ids == {item.get("id") for item in modifiers}, "modifier set is incomplete or unexpected")
check(routes.get("override_order") == [item.get("id") for item in overrides], "override order and override records differ")

safe_place_routes = routes.get("safe_place_routes", [])
required_safe_place_ids = {
    "violence-coercion", "no-roof-tonight", "access-care-failure", "social-internal-crisis",
}
check({item.get("id") for item in safe_place_routes} == required_safe_place_ids, "safe-place route set is incomplete or unexpected")
for item in safe_place_routes:
    rid = item.get("id", "<missing>")
    for field in ("trigger", "action", "backup", "escalation", "destination"):
        check(bool(item.get(field)), f"safe-place route {rid} lacks {field}")
    check(item.get("destination") in destinations, f"safe-place route {rid} has unknown destination")
    for destination in item.get("service_destinations", []):
        check(destination in destinations, f"safe-place route {rid} has unknown service destination {destination}")
    for source_id in item.get("source_ids", []):
        check(source_id in sources, f"safe-place route {rid} has unknown source {source_id}")

for collection_name, collection in (("override", overrides), ("need", needs)):
    for item in collection:
        rid = item.get("id", "<missing>")
        for field in ("action", "backup", "escalation", "destination"):
            check(bool(item.get(field)), f"{collection_name} route {rid} lacks {field}")
        check(item.get("destination") in destinations, f"{collection_name} route {rid} has unknown destination")
        emergency = item.get("emergency_destination")
        check(not emergency or emergency in destinations, f"{collection_name} route {rid} has unknown emergency destination")
        if collection_name == "override":
            check(item.get("pass") == 1, f"override route {rid} is not pass 1")
            check(bool(item.get("trigger")), f"override route {rid} lacks trigger")
            for source_id in item.get("source_ids", []):
                check(source_id in sources, f"override route {rid} has unknown source {source_id}")
        else:
            check(item.get("pass") == 2, f"need route {rid} is not pass 2")

for modifier in modifiers:
    mid = modifier.get("id", "<missing>")
    check(bool(modifier.get("preparation")), f"modifier {mid} lacks preparation")
    check(bool(modifier.get("failure_escalation")), f"modifier {mid} lacks failure escalation")

freshness = routes.get("policy", {}).get("source_freshness", {})
warn_after = int(freshness.get("warn_after_days", 120))
fail_after = int(freshness.get("fail_after_days", 240))
as_of_text = os.environ.get(str(freshness.get("as_of_environment", "GUIDE_AS_OF")), date.today().isoformat())
try:
    as_of = date.fromisoformat(as_of_text)
except ValueError:
    errors.append(f"invalid validation date: {as_of_text}")
    as_of = date.today()

for source_id, source in sources.items():
    check(str(source.get("url", "")).startswith("https://"), f"source {source_id} lacks HTTPS URL")
    try:
        reviewed = date.fromisoformat(str(source.get("reviewed_on", "")))
    except ValueError:
        errors.append(f"source {source_id} has invalid review date")
        continue
    age = (as_of - reviewed).days
    check(age >= 0, f"source {source_id} review date is in the future")
    source_limit = int(source.get("review_max_age_days", fail_after))
    check(age <= source_limit, f"source {source_id} is stale: {age} days > {source_limit}")
    if age > min(warn_after, source_limit):
        warnings.append(f"source {source_id} should be re-reviewed: {age} days old")

for registry_name, registry in (("route catalog", routes), ("locale", locale), ("accessibility", access)):
    try:
        reviewed = date.fromisoformat(str(registry.get("reviewed_on", "")))
    except ValueError:
        errors.append(f"{registry_name} has invalid review date")
        continue
    age = (as_of - reviewed).days
    check(age >= 0, f"{registry_name} review date is in the future")
    locale_fail = int(locale.get("review_policy", {}).get("fail_after_days", fail_after))
    check(age <= locale_fail, f"{registry_name} is stale: {age} days > {locale_fail}")

serialized = json.dumps(routes, ensure_ascii=False).lower()
for forbidden in ("light a match to diagnose", "use a flame to test", "make yourself vomit", "neutralize with another chemical"):
    check(forbidden not in serialized, f"unsafe route wording present: {forbidden}")
check("no flame, switch, plug, bell, fan, or phone inside" in serialized, "gas no-spark rule missing")
check("do not enter it" in serialized, "smoky escape-route guard missing")
check("do not induce vomiting" in serialized, "chemical no-vomiting rule missing")

services = locale.get("services", {})
for key, number in {
    "112": "112", "110": "110", "115": "115", "116117": "116 117",
    "116123": "116 123", "116016": "116 016", "116111": "116 111",
    "men_violence_help": "0800 1239900",
}.items():
    check(services.get(key, {}).get("number") == number, f"locale service {key} has wrong number")
check(services.get("gas_network", {}).get("local_value_required") is True, "gas-network local field is not required")
for key in ("municipal_emergency_housing", "accessible_emergency_place", "youth_emergency_service"):
    check(services.get(key, {}).get("local_value_required") is True, f"locale service {key} is not explicitly local")
check(services.get("115", {}).get("always_available") is not True, "115 must not be presented as an always-available emergency line")
check("not an emergency" in services.get("115", {}).get("scope", ""), "115 emergency-scope guard missing")
required_local_fields = {
    "municipal emergency housing — daytime", "municipal emergency housing — after hours",
    "accessible emergency accommodation", "accessible transport", "powered refuge or care destination",
    "local youth emergency service", "specialist violence shelter or counselling",
}
check(required_local_fields <= set(locale.get("local_fields", [])), "locale is missing safe-place local fields")
poison_centres = locale.get("poison_centres", [])
check(len(poison_centres) == 7, f"expected seven German poison centres, found {len(poison_centres)}")
check({item.get("city") for item in poison_centres} == {"Berlin", "Bonn", "Erfurt", "Freiburg", "Göttingen", "Mainz", "München"}, "poison-centre city set drifted")

profiles = access.get("profiles", [])
required_profile_ids = {
    "blind-low-vision", "deaf-hard-of-hearing", "speech-language",
    "cognitive-overload", "mobility-fatigue-pain", "sensory-panic-neurodivergent",
}
check({item.get("id") for item in profiles} == required_profile_ids, "accessibility profile set drifted")
for profile in profiles:
    pid = profile.get("id", "<missing>")
    for field in ("barrier", "adaptation", "handoff", "failure_escalation"):
        check(bool(profile.get(field)), f"accessibility profile {pid} lacks {field}")
for source_id in access.get("policy", {}).get("source_ids", []):
    check(source_id in sources, f"accessibility registry has unknown source {source_id}")

safe_chapter = ROOT / "src" / "chapters" / "03g-safe-place-routing.md"
check(safe_chapter.exists(), "Situation G safe-place chapter is missing")
if safe_chapter.exists():
    safe_text = safe_chapter.read_text(encoding="utf-8")
    for marker in ("G1 — A person", "G2 — There is no weather-safe place", "G3 — A place exists", "G4 — The place is physically safe", "Minimal written emergency card", "safe-place handoff"):
        check(marker.lower() in safe_text.lower(), f"Situation G marker missing: {marker}")

chapter = ROOT / "src" / "chapters" / "03h-environmental-hazards.md"
check(chapter.exists(), "Situation H chapter is missing")
if chapter.exists():
    text = chapter.read_text(encoding="utf-8")
    for marker in ("Fire or smoke", "Carbon monoxide", "Gas smell or hissing", "Chemical fumes", "Electrical danger", "hazard handoff"):
        check(marker.lower() in text.lower(), f"Situation H marker missing: {marker}")

for name in (
    "two_pass_route_map.png", "hazard_override_matrix.png", "dependency_continuity_map.png",
    "safe_place_route_map.png", "communication_access_card.png",
):
    check((ROOT / "build" / "diagrams" / name).exists(), f"route diagram missing: {name}")

for warning in warnings:
    print(f"Route validation warning: {warning}")
if errors:
    print("Route validation failed:")
    for error in errors:
        print(f"  - {error}")
    raise SystemExit(1)
print(
    f"Route validation passed: {len(overrides)} pass-1 overrides, {len(needs)} pass-2 needs, "
    f"{len(safe_place_routes)} safe-place routes, {len(modifiers)} modifiers, "
    f"{len(profiles)} accessibility profiles, {len(poison_centres)} poison centres at {VERSION}."
)
