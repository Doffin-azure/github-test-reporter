import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Handlebars from "handlebars";
import { beforeAll, describe, expect, it } from "vitest";
import { registerAllHelpers } from "../../src/handlebars/helpers/index.js";

const template = Handlebars.compile(
	readFileSync(
		new URL("../../src/reports/failed-folded.hbs", import.meta.url),
		"utf8",
	),
	{ preventIndent: true },
);

beforeAll(() => {
	// Load the actual dependency without Vitest's repository-wide alias.
	const { loadHelpers } = createRequire(import.meta.url)(
		"handlebars-helpers-ctrf",
	) as typeof import("handlebars-helpers-ctrf");
	registerAllHelpers();
	loadHelpers(Handlebars);
});

function renderFailure(message?: string, trace?: string): string {
	return template({
		ctrf: {
			summary: { failed: 1 },
			tests: [{ name: "fails an assertion", status: "failed", message, trace }],
		},
	});
}

describe("failed-folded.hbs assertion diffs", () => {
	it.each(["Request timed out", "- one bullet", "+ one addition"])(
		"keeps %j as plain code",
		(message) => {
			const output = renderFailure(message);

			expect(output).toContain(`<pre><code>${message}</code></pre>`);
			expect(output).not.toMatch(/^`{3,}diff$/m);
		},
	);

	it("shows the existing placeholders for missing messages and traces", () => {
		const output = renderFailure();

		expect(output).toContain("<pre><code>No message available</code></pre>");
		expect(output).toContain("<pre><code>No trace available</code></pre>");
	});
});
