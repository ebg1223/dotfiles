import type { Plugin } from "@opencode-ai/plugin"

export const TerminalBell: Plugin = async () => {
  const inTmux = !!process.env.TMUX

  return {
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        // OSC 777 format: ESC ] 777 ; notify ; title ; body BEL
        const osc = `\x1b]777;notify;OpenCode;Ready for input\x07`

        // Wrap in DCS passthrough for tmux: ESC P tmux ; <escaped-osc> ESC \
        const payload = inTmux
          ? `\x1bPtmux;\x1b${osc}\x1b\\`
          : osc

        await Bun.write(Bun.stdout, payload + "\x07")
      }
    }
  }
}
