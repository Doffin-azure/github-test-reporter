import {
	assertionTheme as theme,
	getAssertionHighlighter,
	hasScope,
	isDiffChange,
} from "./assertion-highlighter.js";

export function renderPythonAssertion(text: string, lines: string[]) {
	const headline = lines.findIndex((line) => line.trim() !== "");
	const expression = lines[headline]
		?.trimStart()
		.replace(/^AssertionError: /, "");
	if (!expression?.startsWith("assert ")) return undefined;

	const highlighter = getAssertionHighlighter();
	const [pythonTokens] = highlighter.codeToTokensBase(expression, {
		lang: "python",
		theme,
		includeExplanation: "scopeName",
	});
	if (!hasScope(pythonTokens[0], "keyword.control.flow.python"))
		return undefined;

	const fullDiff = lines.findIndex(
		(line, index) => index > headline && line.startsWith("  Full diff:"),
	);
	// pytest separates an inline string diff from its assertion with a blank line.
	const body = fullDiff === -1 ? headline + 2 : fullDiff + 1;
	const diffLines =
		fullDiff !== -1 || lines[headline + 1]?.trim() === ""
			? lines.slice(body)
			: [];
	const normalized = diffLines.map((line) => line.replace(/^ {2}/, ""));
	const diffTokens = highlighter.codeToTokensBase(normalized.join("\n"), {
		lang: "diff",
		theme,
		includeExplanation: "scopeName",
	});

	return highlighter.codeToHtml(text, {
		lang: "text",
		theme,
		transformers: [
			{
				tokens(tokens) {
					const prefix = lines[headline].slice(0, -expression.length);
					const offset = tokens[headline][0].offset;
					tokens[headline] = [
						{ content: prefix, offset },
						...pythonTokens.map((token) => ({
							...token,
							offset: offset + prefix.length + token.offset,
						})),
					];
					for (const [index, line] of diffLines.entries()) {
						const colored = diffTokens[index];
						if (!line.startsWith("  ") || !isDiffChange(colored)) continue;
						const offset = tokens[body + index][0].offset;
						tokens[body + index] = [
							{ content: "  ", offset },
							...colored.map((token) => ({
								...token,
								offset: offset + 2 + token.offset - colored[0].offset,
							})),
						];
					}
				},
			},
		],
	});
}
