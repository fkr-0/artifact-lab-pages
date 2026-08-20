# Independent project submodule migration

Date: 2026-08-20

This record captures the publishable ownership boundary for the four project-shaped directories that remained embedded in the Artifact Lab parent tree after the earlier ownership reconciliation.

## GitHub repository check

| Parent path | Dedicated `fkr-0` repository | Current local form | Migration decision |
| --- | --- | --- | --- |
| `git-recipe-book` | **Missing** (`fkr-0/git-recipe-book` not found) | parent-owned files; no child `.git` | keep root-owned until a dedicated repository is created manually, then extract and add as a submodule |
| `inf-arrange` | **Missing** (`fkr-0/inf-arrange` not found) | parent-owned files; no child `.git` | keep root-owned until a dedicated repository is created manually, then extract and add as a submodule |
| `overlay-cam` | **Missing** (`fkr-0/overlay-cam` not found) | parent-owned files; no child `.git` | keep root-owned until a dedicated repository is created manually, then extract and add as a submodule |
| `bathroom-emergency-guide` | **Exists** as `fkr-0/bathroom-emergency` | dirty outer synthesis repository containing a clean canonical nested checkout | convert the parent index to a real gitlink at the canonical public `v5.1.2` commit while preserving the local synthesis checkout unchanged |

No GitHub repositories were created by this migration.

## Bathroom Emergency Guide conversion

Canonical remote:

```text
https://github.com/fkr-0/bathroom-emergency.git
```

Verified public pin:

```text
6d3ae5eba0f691059ef0db53287b1d9539486fd8  # v5.1.2 / origin/main
```

The local outer synthesis checkout is deliberately preserved at its existing revision and remains dirty. The parent commit therefore records the canonical remote gitlink without checking out that gitlink locally. A fresh clone initializes the directory as a normal submodule.

The equivalent clean-checkout commands are:

```sh
git -C bathroom-emergency-guide remote set-url origin https://github.com/fkr-0/bathroom-emergency.git
git rm -r bathroom-emergency-guide
git submodule add https://github.com/fkr-0/bathroom-emergency.git bathroom-emergency-guide
git -C bathroom-emergency-guide checkout 6d3ae5eba0f691059ef0db53287b1d9539486fd8
```

Because this checkout contains valuable dirty synthesis work, the migration performed the non-destructive index equivalent instead of `git rm -r` / `git submodule add`: it retained the local directory, set its remote, and wrote the verified commit as a `160000` parent gitlink.

## Repositories that still need creating

The following commands are the required remote/submodule operations **after** the corresponding GitHub repository has been created manually and the directory history/content has been extracted into a child Git repository. They are documented now so the future transition is deterministic; they are not executable against the current root-owned directories because those directories have no child `.git` yet.

### Git Recipe Book

```sh
git -C git-recipe-book remote set-url origin https://github.com/fkr-0/git-recipe-book.git
git submodule add https://github.com/fkr-0/git-recipe-book.git git-recipe-book
```

### Inf Arrange

```sh
git -C inf-arrange remote set-url origin https://github.com/fkr-0/inf-arrange.git
git submodule add https://github.com/fkr-0/inf-arrange.git inf-arrange
```

### Overlay Cam

```sh
git -C overlay-cam remote set-url origin https://github.com/fkr-0/overlay-cam.git
git submodule add https://github.com/fkr-0/overlay-cam.git overlay-cam
```

Before each future `git submodule add`, remove the parent-owned path from the parent index only after the extracted child repository has been independently verified and pushed. Do not delete the only local copy as part of that transition.

## Existing release-pinned submodules

The parent also retains the previously verified HTTPS release pins for `ethic-brawl`, `badger-sprawl-runner`, `v11-peer-daw`, and `hyperblast-shooter`. Their dirty/local child checkouts are not force-updated by this migration.
