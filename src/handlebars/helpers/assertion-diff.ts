import { stripAnsi } from "../../ctrf/helpers.js";
import {
	assertionTheme as theme,
	getAssertionHighlighter,
	isDiffChange,
} from "./assertion-highlighter.js";
import { findAssertionMarkers } from "./assertion-markers.js";

const nodeLegend =
	/^\+ actual - expected(?:[ \t]+(?:\.\.\.|…) Lines skipped)?$/;
const expectedLegend = /^- Expected(?:[ \t]+-[ \t]+\d+)?$/;
const receivedLegend = /^\+ Received(?:[ \t]+\+[ \t]+\d+)?$/;
const markerColors = { expected: "#B31D28", actual: "#22863A" };

function renderAssertionValues(text: string, lines: string[]): string | undefined {
	const markers = findAssertionMarkers(lines);
	if (markers.length === 0) return undefined;

	return getAssertionHighlighter().codeToHtml(text, {
		lang: "text",
		theme,
		decorations: markers.map(({ line, start, end, role }) => ({
			start: { line, character: start },
			end: { line, character: end },
			properties: {
				style: `color:${markerColors[role]}`,
				"data-assertion-role": role,
			},
		})),
	});
}

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
	if (legendIndex === -1) return renderAssertionValues(text, lines);

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
