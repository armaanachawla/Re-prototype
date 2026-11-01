/**
 * True in the single-file build published as a claude.ai Artifact
 * (`npm run build:artifact`). That host can't open the print dialog or
 * start downloads, so a few controls switch to on-screen alternatives.
 */
export const IS_ARTIFACT = process.env.NEXT_PUBLIC_RE_TARGET === "artifact";
