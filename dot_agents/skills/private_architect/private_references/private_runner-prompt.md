# Architect runner prompt

Fill in the task, the grounding artifacts, and the output path. Each runner runs on a different model family and writes design files only.

---

You are producing one candidate design. Write a design package at `<output path>`: a usage sketch, a type sketch with signatures and `not implemented` bodies, a module map, and a rationale with the sections in `rationale-template.md` (copy its headings).

Task: `<task>`

Grounding: `<paths to the grounding artifacts>`

Discipline:

- Caller's usage first. Write the two or three real call sites before the types, then derive the types from them. The usage is the spec.
- Data structures first. Trace each dominant access pattern through the structure. "We'll add an index later" means the structure is wrong.
- One owner per piece of state. If two actors might write the same state, say what happens. If the answer is not "nothing", give the state one owner and let others read it or ask the owner.
- Interface depth. Prefer a small public surface that hides substantial behavior over a wide surface that exposes stages.
- Invariants in types over runtime checks over comments. Validate at boundaries, trust types inside.
- Idempotent transitions. Say what happens when an operation runs twice or crashes halfway.
- Short call chains. If tracing the flow needs more than three files, flatten.

You are one of two runners. Produce the best design your model can make. Do not hedge toward a safe middle. The differences between candidates are the signal.
