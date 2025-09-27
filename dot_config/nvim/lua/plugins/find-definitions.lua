return {
  "nvim-telescope/telescope.nvim",
  dependencies = { "nvim-lua/plenary.nvim" },
  keys = {
    -- Simple: Find all occurrences of symbol from monorepo root
    {
      "<leader>sA",
      function()
        local symbol = vim.fn.expand("<cword>")
        local root = vim.fn.systemlist("git rev-parse --show-toplevel")[1]

        require("telescope.builtin").grep_string({
          search = symbol,
          prompt_title = "All: " .. symbol,
          cwd = root,
          glob_pattern = { "*.ts", "*.tsx", "*.js", "*.jsx" },
        })
      end,
      desc = "Find All (monorepo)",
    },

    -- Find definitions: Interactive
    {
      "<leader>sd",
      function()
        local symbol = vim.fn.input("Find definition of: ")
        if symbol == "" then
          return
        end

        local root = vim.fn.systemlist("git rev-parse --show-toplevel")[1]

        -- Search for common definition patterns
        require("telescope.builtin").live_grep({
          prompt_title = "Definition: " .. symbol,
          cwd = root,
          glob_pattern = { "*.ts", "*.tsx", "*.js", "*.jsx" },
          default_text = "(class|interface|type|function|const|let|var) " .. symbol,
        })
      end,
      desc = "Search Definition",
    },

    -- Find exports specifically
    {
      "<leader>se",
      function()
        local symbol = vim.fn.expand("<cword>")
        local root = vim.fn.systemlist("git rev-parse --show-toplevel")[1]

        require("telescope.builtin").grep_string({
          search = "export.*" .. symbol,
          prompt_title = "Exports: " .. symbol,
          cwd = root,
          glob_pattern = { "*.ts", "*.tsx", "*.js", "*.jsx" },
          use_regex = true,
        })
      end,
      desc = "Find Exports",
    },

    -- Find in index files (where things are often re-exported)
    {
      "<leader>si",
      function()
        local symbol = vim.fn.expand("<cword>")
        local root = vim.fn.systemlist("git rev-parse --show-toplevel")[1]

        require("telescope.builtin").grep_string({
          search = symbol,
          prompt_title = "Index files: " .. symbol,
          cwd = root,
          glob_pattern = { "**/index.ts", "**/index.tsx", "**/index.js" },
        })
      end,
      desc = "Find in Index files",
    },

    -- Most reliable: Use ripgrep directly
    {
      "gD",
      function()
        local symbol = vim.fn.expand("<cword>")
        local root = vim.fn.systemlist("git rev-parse --show-toplevel")[1]

        -- Build ripgrep command
        local cmd = {
          "rg",
          "--vimgrep",
          "--no-heading",
          "--smart-case",
          "--color=never",
          "--glob=*.{ts,tsx,js,jsx}",
          "--glob=!node_modules",
          "--glob=!dist",
          "--glob=!build",
          "-e",
          "^\\s*export\\s+(const|let|var|class|interface|type|function|async function)\\s+" .. symbol .. "\\b",
          "-e",
          "^\\s*(const|let|var|class|interface|type|function|async function)\\s+" .. symbol .. "\\b",
          root,
        }

        -- Use vim's quickfix list
        vim.fn.setqflist({}, "r", {
          title = "Definition: " .. symbol,
          lines = vim.fn.systemlist(table.concat(cmd, " ")),
          efm = "%f:%l:%c:%m",
        })

        -- Open quickfix if results found
        if #vim.fn.getqflist() > 0 then
          vim.cmd("copen")
        else
          vim.notify("No definition found for: " .. symbol, vim.log.levels.WARN)
        end
      end,
      desc = "Go to Definition (ripgrep)",
    },
  },
}
