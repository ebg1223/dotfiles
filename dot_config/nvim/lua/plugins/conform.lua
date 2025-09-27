-- lua/plugins/conform.lua
return {
  "stevearc/conform.nvim",
  opts = function(_, opts)
    local conform = require("conform")
    local function pick(buf, names)
      for _, n in ipairs(names) do
        if conform.get_formatter_info(n, buf).available then
          return n
        end
      end
    end
    local function eslint_then_prettier(buf)
      return {
        pick(buf, { "eslint_d" }),
        pick(buf, { "prettierd", "prettier" }),
      }
    end
    opts = opts or {}
    opts.formatters_by_ft = opts.formatters_by_ft or {}
    opts.formatters_by_ft.javascript = eslint_then_prettier
    opts.formatters_by_ft.typescript = eslint_then_prettier
    opts.formatters_by_ft.javascriptreact = eslint_then_prettier
    opts.formatters_by_ft.typescriptreact = eslint_then_prettier
    return opts
  end,
}
