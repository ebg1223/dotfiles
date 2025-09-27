return {
  -- Add the GitHub theme
  {
    "projekt0n/github-nvim-theme",
    lazy = false,
    priority = 1000,
    config = function()
      require("github-theme").setup({
        -- Optional configuration
      })
    end,
  },
  -- Configure LazyVim to use it
  {
    "LazyVim/LazyVim",
    opts = {
      colorscheme = "github_light",
    },
  },
}
