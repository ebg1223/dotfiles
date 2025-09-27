return {
  { import = "lazyvim.plugins.extras.lang.typescript" },
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        vtsls = {
          -- optional: keep the default root detector or extend it here
          -- root_dir = require("lspconfig.util").root_pattern("package.json", "tsconfig.json", ".git"),
          settings = {
            -- ---------- ① Vtsls-only knobs ----------
            vtsls = {
              autoUseWorkspaceTsdk = true,
              enableMoveToFileCodeAction = true,
            },
            -- ---------- ② Options passed straight to tsserver ----------
            typescript = {
              tsserver = {
                -- tell tsserver where the plug-in lives
                pluginPaths = { "../../node_modules" }, -- relative to packages/app
                -- turn logging ON so the :VtsExec command appears
                logVerbosity = "off",
                -- optional but handy: keep logs inside the workspace
                logDirectory = "./.logs/ts",
              },
            },
          },
        },
      },
    },
  },
}
