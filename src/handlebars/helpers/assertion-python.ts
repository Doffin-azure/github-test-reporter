import {
	assertionTheme as theme,
	getAssertionHighlighter,
	hasScope,
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
				},
			},
		],
	});
}
