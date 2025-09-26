set -e

if [ -z "$__DEVBOX_SKIP_INIT_HOOK_49f7065302aa8a273dad0a88d05d6070d0d455d3e4ab1bb1d0f3dd23285b9cfc" ]; then
    . "/Users/ethan/.local/share/devbox/global/default/.devbox/gen/scripts/.hooks.sh"
fi

echo "Error: no test specified" && exit 1
