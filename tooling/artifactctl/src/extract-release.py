"""Extract only bounded regular files from an already hash-verified release."""
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import sys
import tarfile
import zipfile

archive, target, kind = sys.argv[1:]
root = Path(target).resolve()
root.mkdir(parents=True, exist_ok=True)
limit = 256 * 1024 * 1024
count = 0
total = 0

def destination(name, size, directory=False):
    global count, total
    path = PurePosixPath(name)
    if not name or '\\' in name or path.is_absolute() or '..' in path.parts or ':' in name:
        raise ValueError('unsafe archive path: ' + name)
    out = root.joinpath(*path.parts)
    if out.resolve() != root and root not in out.resolve().parents:
        raise ValueError('archive path escapes output')
    count += 1
    total += size
    if count > 10000 or total > limit:
        raise ValueError('archive exceeds release size limit')
    if directory and out.is_dir():
        return out
    if out.exists():
        raise ValueError('duplicate archive member: ' + name)
    out.parent.mkdir(parents=True, exist_ok=True)
    return out

if kind == 'zip':
    with zipfile.ZipFile(archive) as bundle:
        for member in bundle.infolist():
            mode = member.external_attr >> 16
            if stat.S_ISLNK(mode) or (stat.S_IFMT(mode) not in (0, stat.S_IFREG, stat.S_IFDIR)):
                raise ValueError('unsafe archive symlink or special file')
            if member.is_dir():
                destination(member.filename, 0, directory=True).mkdir(exist_ok=True)
            else:
                out = destination(member.filename, member.file_size)
                with bundle.open(member) as src, out.open('xb') as dst:
                    shutil.copyfileobj(src, dst)
else:
    with tarfile.open(archive, 'r:*') as bundle:
        for member in bundle:
            if member.isdir():
                destination(member.name, 0, directory=True).mkdir(exist_ok=True)
            elif member.isfile():
                out = destination(member.name, member.size)
                with bundle.extractfile(member) as src, out.open('xb') as dst:
                    shutil.copyfileobj(src, dst)
            else:
                raise ValueError('unsafe archive link or special file')
