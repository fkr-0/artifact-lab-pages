# Deploying the Bathroom Emergency Guide

A deployment is not “print PDF, place near toilet, achieve resilience.” It is a
small maintained installation: a chosen edition, verified local reference
figures, writable templates, visible revision information, basic supplies, and
a person who knows when the copy must be replaced.

## Roles

- **Authors** maintain generic content, evidence, rendering, references, and
  release history.
- **Deployer** adapts one copy to one place, verifies local routes, installs it,
  and maintains it.
- **Reader** uses the guide. The reader is not silently made responsible for
  project maintenance.
- **Helpers** may call, write, carry, observe, or hand off. Their support does
  not cancel consent or the affected person’s agency where they can decide.

## Minimum viable deployment

1. Build or obtain a current release from a trusted source.
2. Choose a physical layout and mode:
   - A4 for complete wall/folder copies;
   - A4/2 for narrow hanging or field-strip copies;
   - large print when the standard edition is not comfortably readable;
   - monochrome only after checking that pattern, labels, and contrast remain
     legible on the actual printer.
3. Complete the required fields in `src/data/deployment_fields.json` and the
   matching Grey Book figures or templates.
   - keep each detached resource’s title, stable reference, short description,
     privacy class, and local review date attached;
   - do not crop away route codes or patterns merely because the colour looks
     sufficient on one printer;
   - when a resource names figures or support services, keep those references with
     the deployed packet or confirm that they remain immediately findable.
4. Verify every local number from an official or directly responsible source.
5. Mark private and context-sensitive fields; do not expose hidden-key, medical,
   violence-shelter, credential, or safety-plan data on a shared wall copy.
6. Add writing tools, light, and charging support.
7. Test one route: find the address, choose 112 versus 116 117, find a local
   backup, and open the online guide without relying on a QR code alone.
8. Complete the **Installation and wet-room audit** in the Grey Book under the
   actual light, reach, moisture, privacy, and page-turning conditions.
9. Record the guide version, build commit, local customization revision, last
   check, and next check.
10. Replace the copy when a local route, household need, or release changes.

## Canonical deployment-field index

The machine-readable index is `src/data/deployment_fields.json`. The built
reference appendix renders the same fields with stable IDs. Required fields are
minimum installation gates; optional fields become required when they match the
people, building, devices, animals, or risks present.

### Identity and maintenance

- copy/site name;
- exact placement;
- deployer or maintainer;
- guide version and build commit;
- local customization revision;
- build date;
- last and next local review;
- replacement-copy location.

### Factual location and access

- full address and country;
- coordinates where useful;
- elevation only where it changes local hazards or access;
- building, entrance, rear/front structure, floor, room, bell;
- stairs, lift, locked-door and mobility barriers;
- safe door-unlocking or helper-meeting instruction;
- visible landmark;
- optional floor and exit map;
- outdoor meeting point.

Do not print hidden-key locations, alarm codes, escape-shelter addresses, or
other details that turn a support page into an attacker’s installation guide.

### Local professional support

Verify name, number, scope, hours, access channel, address when needed, and one
backup for relevant routes:

- GP or regular practice;
- pharmacy and official night-service lookup;
- emergency department and accessible route;
- regional poison information centre;
- psychiatric crisis route and Sozialpsychiatrischer Dienst;
- violence support and shelter routes;
- municipal emergency housing, day and after hours;
- accessible or powered safe destination;
- youth emergency service;
- gas-network emergency service;
- building utility or caretaker route;
- veterinary emergency service.

The guide’s German national baseline does not eliminate local verification.
The 116 117 service is organized by the Kassenärztliche Vereinigungen; 112
connects to the responsible local control centre for fire and rescue. Local
operations, access channels, and after-hours routes still vary.

## Object- and person-specific safe places

A destination is not safe because a local figure calls it “safe.” Confirm the features
that matter:

| Need | Confirmation question |
|---|---|
| active threat | Is the destination unknown to or protected from the threatening person? |
| weather | Is it open, reachable, and suitable for the expected conditions? |
| mobility | Can the person enter, move, transfer, and use a toilet? |
| power | Is suitable power available for the required duration and device? |
| medication | Can time-critical medication be stored, accessed, and administered as planned? |
| communication | Can the person communicate through a usable channel? |
| child/dependant | Can the dependant remain safely with the responsible adult or agreed backup? |
| animal | Is the destination compatible, or is a separate confirmed animal-care route ready? |
| sensory load | Are light, noise, crowding, smell, and waiting conditions tolerable enough? |

Record a backup. “Try the hospital lobby” is not a confirmed accessible care
bridge.

## Physical installation concepts

### Clear sleeve

Use a wipeable clear sleeve or binder pocket. Keep the cover visible, separate
fillable/private pages, and ensure pages can be removed without dismantling the
installation.

### Clip-hung strip

A4/2 editions can hang from a strong clip away from water, heat, flame, and door
mechanisms. Test whether the lowest page remains readable and whether turning
pages requires two hands.

### Open folder or shallow box

A folder or open-front box can align its visible face with the guide cover so the
project announces itself instead of resembling archived appliance warranties.
Use dividers for the master guide, Grey Book local reference figures, private
templates, and replacement blanks.

Whichever installation method is used, test it with the Grey Book’s
**Installation and wet-room audit**. A sleeve that looks excellent on a desk may
be unreadable under bathroom glare or impossible to turn with one hand.

### Wall panel plus takeaways

Keep only shared-safe orientation and contact figures visible. Put private templates in
a closed section. A QR code may link to `https://be.fkr.dev`, but print the URL
and retain an offline route because batteries and networks are unusually fond of
failing during examples about continuity.

## Additional deployables

A practical installation may include:

- two pencils or a pencil plus permanent fine liner;
- clipboard or rigid writing surface;
- charged light;
- working charger and compatible cable;
- maintained power bank;
- first-aid kit and a note showing the nearest known AED;
- drinking water where storage is hygienic and appropriate;
- simple timer or clock;
- spare printed emergency/location card;
- current official first-aid course information;
- accessible reading aid required by the household.

Do not add flames, incense, strong fragrances, unapproved medication, improvised
medical devices, or unlabeled chemicals in the name of atmosphere.

## Build from source

### Arch Linux example

    sudo pacman -S --needed python nodejs npm pandoc poppler weasyprint
    npm ci
    npx playwright install chromium
    npm run build

The diagram build also requires Python packages used by the repository, notably
matplotlib and Pillow. Use a virtual environment when installing them outside
the distribution package manager.

### Reproducible metadata

Set these variables in controlled builds:

    export SOURCE_DATE_EPOCH="$(git show -s --format=%ct HEAD)"
    export GUIDE_REVISION="$(git rev-parse --short=12 HEAD)"
    npm run build

The revision footer and release manifest use those values. Build output remains
ignored by Git and should be regenerated from tracked sources.

## Built artifacts

- `build/html/guide.html` — complete interactive HTML guide;
- `build/pdf/` — master PDF variants;
- `build/subguides/` — eleven-book shelf and standalone O, A, B, C, D, H, Z, P, S, T, and R families;
- `build/site/index.html` — modern project landing page;
- `build/site/deploy/index.html` — local-only deployment planner;
- `build/site/downloads/index.html` — master and standalone download catalogue;
- `build/site/guide/` and `build/site/routes/` — self-contained reading package;
- `build/site/assets/` — local stylesheet, interaction script, and project mark;
- `build/site/meta/release.json` — site version, revision, metrics, and explicit
  no-publication/no-deployment state;
- `build/generated/` — generated indexes and appendix fragments;
- `src/data/coverage_matrix.json` and `build/generated/coverage-matrix.md` —
  source, visual, and standalone-readiness provenance;
- `build/release/manifest.json` — release/build metadata and artifact hashes.

## Deployment targets and domain roles

The intended split is:

- `bathroom-emergency.fkr.dev` — project landing page, purpose, participation,
  deployment, sources, disclaimers, and release links;
- `be.fkr.dev` — current enhanced HTML guide and downloadable editions.

These are build/deployment contracts, not evidence that hosting has occurred.
Deployment is intentionally not performed by the local release process.

## Preview the Pages package locally

After a complete build:

    python -m http.server 8080 -d build/site

Open `http://localhost:8080`. Check at least:

1. landing-page navigation and the immediate-emergency strip;
2. complete guide and route-hub links;
3. master and standalone downloads;
4. deployment checklist progress, reset, and local persistence;
5. light/dark/automatic theme behavior;
6. mobile navigation and a narrow viewport;
7. the 404 page and one deliberately missing route.

The site has no remote font, analytics, CDN, API, or image dependency. The
interactive deployment checklist writes only completion keys to browser local
storage. It must not be used to enter addresses, codes, medical information,
safe-place locations, or other sensitive deployment facts.

## GitHub Pages deployment

The repository includes `.github/workflows/pages.yml`. It is the explicit
publication path and is separate from ordinary CI and local release creation.

1. In the GitHub repository, open **Settings → Pages**.
2. Choose **GitHub Actions** as the source.
3. Review branch protection and the workflow permissions before enabling a
   public deployment.
4. Push the workflow to `main` or run **deploy-github-pages** manually.
5. Verify the deployed landing, guide, route hub, planner, downloads, PDFs, and
   404 behavior.
6. Confirm the published footer/version and `meta/release.json` revision match
   the intended source commit.

For a custom domain, set the repository variable `PAGES_CUSTOM_DOMAIN` to the
hostname only after its DNS records and ownership checks are ready. The site
builder writes `CNAME` only when this value is present. Do not commit a guessed
domain or imply that either intended domain is live before verification.

The workflow rebuilds the complete release and runs all content, PDF, browser,
site, accessibility, and matrix gates before uploading `build/site`. A workflow
file in the repository is not proof that a deployment has occurred.

## Maintenance cycle

At each check:

1. inspect water, heat, light, physical damage, and page order;
2. verify required local fields and every time-sensitive contact;
3. confirm that private information is still appropriately protected;
4. charge lights and power banks; test cables;
5. replace used templates, stale local figures, and dry pens with functioning pencils;
6. compare local version with the latest approved release;
7. run one tabletop route with a willing household member;
8. use the route-drill log to record delay, wrong turns, and author coaching;
9. use the first-aid figure review only with sanitized scenarios and approved
   training practice;
10. record the check and next review date.

Review immediately after moving, access changes, household-care changes, a failed
route, a new local service, a relevant incident, or a safety/privacy concern.

## Feedback and upstream participation

Send corrections, failed routes, useful local adaptations, build problems, and
proposals to `bathroom_emergency@fkr.dev`. Include the guide version, build
commit, layout, and stable reference ID. Do not send private medical records,
credentials, hidden safe-place locations, or identifying information about
another person without permission.

Local personality is welcome: tested games, drawings, maps, examples, mounting
ideas, and access improvements can return upstream. Local medical, legal, or
service claims require sources and review before becoming generic content.

## Safety and scope

The guide supports observation, routing, first actions, preparation, and handoff.
It does not diagnose, replace first-aid training, guarantee service availability,
or overrule emergency dispatchers or qualified professionals. In Germany, use
**112** for acute or potentially life-threatening situations, fire, smoke, or
another rapidly escalating emergency. Use **116 117** for urgent medical help
that cannot wait for ordinary practice hours but is not life-threatening.
