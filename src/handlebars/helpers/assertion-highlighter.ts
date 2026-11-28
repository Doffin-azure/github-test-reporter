import { createHighlighterCoreSync } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import diff from "@shikijs/langs/diff";
import python from "@shikijs/langs/python";
import githubLight from "@shikijs/themes/github-light";

export const assertionTheme = "github-light";

type Highlighter = ReturnType<typeof createHighlighterCoreSync>;
type Token = ReturnType<Highlighter["codeToTokensBase"]>[number][number];
let highlighter: Highlighter | undefined;

export function getAssertionHighlighter(): Highlighter {
	highlighter ??= createHighlighterCoreSync({
		engine: createJavaScriptRegexEngine(),
		langs: [...diff, ...python],
		themes: [githubLight],
	});
	return highlighter;
}

export function hasScope(token: Token | undefined, name: string): boolean {
	return (
		token?.explanation?.some(({ scopes }) =>
			scopes.some(({ scopeName }) => scopeName === name),
		) ?? false
	);
}

export function isDiffChange(tokens: Token[]): boolean {
	return tokens.some(
		(token) =>
			hasScope(token, "markup.inserted.diff") ||
			hasScope(token, "markup.deleted.diff"),
	);
}
