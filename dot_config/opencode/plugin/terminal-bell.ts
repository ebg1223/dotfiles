import type { Plugin } from "@opencode-ai/plugin"

export const TerminalBell: Plugin = async () => {
  return {
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        // OSC 777 format: ESC ] 777 ; notify ; title ; body BEL
        const osc777 = `\x1b]777;notify;OpenCode;Ready for input\x07`
        const bell = "\x07"
        await Bun.write(Bun.stdout, osc777 + bell)
      }
    }
  }
}
