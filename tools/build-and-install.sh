#!/usr/bin/env bash
# Build OpenClaw from this repository and install to this Mac.
# Run from the repository root: ./tools/build-and-install.sh

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INSTALL_DIR="/Users/keren/.local/bin"
NODE_MODULES="$REPO_ROOT/node_modules"

echo "==> Building OpenClaw..."
cd "$REPO_ROOT"
pnpm build

echo "==> Cleaning up existing installation..."
rm -rf "$INSTALL_DIR/openclaw"
rm -rf "$INSTALL_DIR/openclaw-dist"

echo "==> Installing to $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"

# Copy dist folder (renamed to openclaw-dist)
cp -r dist "$INSTALL_DIR/openclaw-dist"

# Create wrapper script that:
# 1. Changes to repo root (where node_modules lives)
# 2. Runs openclaw.mjs from there
cat > "$INSTALL_DIR/openclaw" << 'WRAPPER_EOF'
#!/usr/bin/env bash
# OpenClaw wrapper - runs from repo with node_modules available
REPO_ROOT="/Users/keren/repositories/openclaw"
cd "$REPO_ROOT"
exec node "$REPO_ROOT/openclaw.mjs" "$@"
WRAPPER_EOF

# Make executable
chmod +x "$INSTALL_DIR/openclaw"

# Warn about PATH
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
  echo "Warning: $INSTALL_DIR is not in your PATH. Add to ~/.zshrc:" >&2
  echo "  export PATH=\"\$HOME/.local/bin:\$PATH\"" >&2
fi

echo "==> Verifying installation..."
"$INSTALL_DIR/openclaw" --version

echo "Done."
