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
	const removed = output.match(
		/<span style="color:([^"]+)">- +id: 222<\/span>/,
	);
	expect(added).not.toBeNull();
	expect(removed).not.toBeNull();
	expect(added?.[1]).not.toBe(removed?.[1]);
	expect(output).toContain("<pre><code>at example (test.ts:3:1)</code></pre>");
});

it("recognizes Jest diff headers and escapes literal HTML in the input", () => {
	const output = renderFailure(
		"- Expected\n+ Received\n\n- <em>old</em>\n+ <b>new</b>",
	);
	expect(output).toContain('<pre class="shiki github-light"');
	expect(output).not.toMatch(/<em>|<b>/);
	expect(output).toMatch(/(?:&lt;|&#x3C;)b/);
});

it("highlights JUnit values inline and leaves the message and brackets intact", () => {
	const output = renderFailure(
		"unexpected response ==> expected: <new <value>> but was: <old <value>>",
	);
	expect(output).toMatch(
		/data-assertion-role="expected">expected: (?:&lt;|&#x3C;)new /,
	);
	expect(output).toMatch(
		/data-assertion-role="actual">but was: (?:&lt;|&#x3C;)old /,
	);
	expect(output).toContain("unexpected response");
	expect(output).not.toContain("<value>");
});

it("highlights the xUnit values when there are diagnostic lines between them", () => {
	const output = renderFailure(
		'Assert.Equal() Failure: Strings differ\nExpected: "old value"\n                ↓ (pos 0)\nActual:   "new value"',
	);
	expect(output).toContain('data-assertion-role="expected"><span>Expected: ');
	expect(output).toContain('data-assertion-role="actual"><span>Actual:   ');
	expect(output).toContain("↓ (pos 0)");
});

it.each([
	"assert 111 == 222",
	"assert False",
	"AssertionError: assert 'x' in ['y']",
	"assert None is not None",
	"assert 0",
	"assert not True",
])("highlights %j as a pytest expression", (message) => {
	const output = renderFailure(message);
	expect(output).toMatch(/<span style="color:[^"]+">assert<\/span>/);
	expect(output).not.toContain('data-assertion-role="expected"');
	expect(output).not.toContain('data-assertion-role="actual"');
});

it("colors pytest intraline hints and preserves the report text", () => {
	const message =
		"AssertionError: assert actual == expected\n  Full diff: (-: missing in left side, +: extra in left side)\n    {\n  -     expected\n  ?     ^\n  +     actual\n    }";
	const output = renderFailure(message);
	expect(output).toMatch(/<span style="color:[^"]+">- +expected<\/span>/);
	expect(output).toMatch(/<span style="color:[^"]+">\+ +actual<\/span>/);
	expect(output).toMatch(/<span style="color:[^"]+">\? +\^<\/span>/);
	const code = output.match(/<code>([\s\S]*?)<\/code>/)?.[1];
	expect(code?.replace(/<[^>]+>/g, "")).toBe(message);
});

it.each(["+   id: 111,", "-   id: 222,"])(
	"highlights a one-sided assertion diff with %s",
	(line) => {
		expect(renderFailure(`+ actual - expected\n\n${line}`)).toContain(
			'<pre class="shiki github-light"',
		);
	},
);

it.each([
	"Request timed out",
	"Setup log\n+ starting the server\n- stopping the server",
	"+ actual - expected\nNo difference recorded",
	"Expected: config loaded\nActual: timeout",
	"Assert.Equal() Failure: Values differ\nExpected: 222",
])("leaves ordinary diagnostics alone in %j", (message) => {
	const output = renderFailure(message);
	expect(output).toContain("<pre><code>");
	expect(output).not.toContain('class="shiki');
});

it("leaves a standalone pytest question mark uncolored", () => {
	const output = renderFailure("assert False\n\n  ?     ^");
	expect(output).not.toMatch(/<span style="color:[^"]+">\? /);
});

it("keeps the existing placeholders when error details are missing", () => {
	const output = renderFailure();
	expect(output).toContain("<pre><code>No message available</code></pre>");
	expect(output).toContain("<pre><code>No trace available</code></pre>");
});
