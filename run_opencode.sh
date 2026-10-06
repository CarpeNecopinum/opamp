#!/bin/bash

exec bwrap \
  --unshare-pid \
  --unshare-uts \
  --unshare-ipc \
  --share-net \
  --die-with-parent \
  --new-session \
  --dev-bind /dev /dev \
  --ro-bind /usr /usr \
  --ro-bind /etc /etc \
  --ro-bind /lib /lib \
  --ro-bind-try /lib64 /lib64 \
  --ro-bind-try /lib32 /lib32 \
  --symlink usr/bin /bin \
  --symlink usr/sbin /sbin \
  --ro-bind /run /run \
  --bind "$PWD" "$PWD" \
  --bind /tmp /tmp \
  --bind "$HOME/.config/opencode" "$HOME/.config/opencode" \
  --bind "$HOME/.local/share/opencode" "$HOME/.local/share/opencode" \
  --bind "$HOME/.local/state/opencode" "$HOME/.local/state/opencode" \
  --bind "$HOME/.cache/opencode" "$HOME/.cache/opencode" \
  --proc /proc \
  -- /usr/bin/opencode "$@"
