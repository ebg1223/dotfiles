test -z $DEVBOX_COREPACK_ENABLED || corepack enable --install-directory "/Users/ethan/.local/share/devbox/global/default/.devbox/virtenv/nodejs/corepack-bin/"
test -z $DEVBOX_COREPACK_ENABLED || export PATH="/Users/ethan/.local/share/devbox/global/default/.devbox/virtenv/nodejs/corepack-bin/:$PATH"
echo 'Welcome to devbox!' > /dev/null