import { stripAnsi } from "../../ctrf/helpers.js";
import {
	assertionTheme as theme,
	getAssertionHighlighter,
	isDiffChange,
} from "./assertion-highlighter.js";

const nodeLegend =
	/^\+ actual - expected(?:[ \t]+(?:\.\.\.|…) Lines skipped)?$/;
const expectedLegend = /^- Expected(?:[ \t]+-[ \t]+\d+)?$/;
const receivedLegend = /^\+ Received(?:[ \t]+\+[ \t]+\d+)?$/;

export function renderAssertionDiff(message: unknown): string | undefined {
	if (typeof message !== "string") return undefined;

	const text = stripAnsi(message).replace(/\r\n?/g, "\n");
	const lines = text.split("\n");
	const legendIndex = lines.findIndex(
		(line, index) =>
			nodeLegend.test(line) ||
			(expectedLegend.test(line) &&
				receivedLegend.test(lines[index + 1] ?? "")),
	);
	if (legendIndex === -1) return undefined;

	const highlighter = getAssertionHighlighter();
	const legendLength = nodeLegend.test(lines[legendIndex]) ? 1 : 2;
	const body = lines.slice(legendIndex + legendLength).join("\n");
	const tokens = highlighter.codeToTokensBase(body, {
		lang: "diff",
		theme,
		includeExplanation: "scopeName",
	});
	if (!tokens.some(isDiffChange)) return undefined;

	const intro = lines.slice(0, legendIndex).join("\n").trimEnd();
	const diffText = lines.slice(legendIndex).join("\n");
	const introHtml = intro
		? highlighter.codeToHtml(intro, { lang: "text", theme })
		: "";
	return introHtml + highlighter.codeToHtml(diffText, { lang: "diff", theme });
}
