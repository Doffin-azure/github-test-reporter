import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Handlebars from "handlebars";
import { beforeAll, expect, it } from "vitest";
import { registerAllHelpers } from "../../src/handlebars/helpers/index.js";

const template = Handlebars.compile(
	readFileSync(
		new URL("../../src/reports/failed-folded.hbs", import.meta.url),
		"utf8",
	),
	{ preventIndent: true },
);

beforeAll(() => {
	// Use the real helpers package instead of the repository's Vitest alias.
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
			tests: [{ name: "compares a value", status: "failed", message, trace }],
		},
	});
}

it("colors the two sides of a real Node assertion and keeps its trace", () => {
	const { message } = new assert.AssertionError({
		actual: { thing: { id: 111 } },
		expected: { thing: { id: 222 } },
		operator: "deepStrictEqual",
	});
	const output = renderFailure(message, "at example (test.ts:3:1)");
	const added = output.match(/<span style="color:([^"]+)">\+ +id: 111<\/span>/);
	const removed = output.match(/<span style="color:([^"]+)">- +id: 222<\/span>/);
	expect(added).not.toBeNull();
	expect(removed).not.toBeNull();
	expect(added?.[1]).not.toBe(removed?.[1]);
	expect(output).toContain("<pre><code>at example (test.ts:3:1)</code></pre>");
});
