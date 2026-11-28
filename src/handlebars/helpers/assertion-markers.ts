type AssertionRole = "expected" | "actual";

interface AssertionMarker {
	line: number;
	start: number;
	end: number;
	role: AssertionRole;
}

const junitValues = /^(?:.*? ==> )?(expected: <.*?>) (but was: <.*>)$/d;
const xunitHeading = /^Assert\.Equal\(\) Failure(?:: .+)?$/;
const xunitExpected = /^Expected:[ \t]+\S/;
const xunitActual = /^Actual:[ \t]+\S/;

/** Locate comparison text from known assertion formats without changing the message. */
export function findAssertionMarkers(lines: string[]): AssertionMarker[] {
	const first = lines.findIndex((line) => line.trim() !== "");
	if (first === -1) return [];

	const line = lines[first];
	const [, expected, actual] = junitValues.exec(line)?.indices ?? [];
	if (expected && actual) {
		return [
			{ line: first, start: expected[0], end: expected[1], role: "expected" },
			{ line: first, start: actual[0], end: actual[1], role: "actual" },
		];
	}

	if (xunitHeading.test(line)) {
		const expected = lines.findIndex(
			(value, index) => index > first && xunitExpected.test(value),
		);
		if (expected === -1) return [];
		const actual = lines.findIndex(
			(value, index) => index > expected && xunitActual.test(value),
		);
		if (actual === -1) return [];
		return [
			{
				line: expected,
				start: 0,
				end: lines[expected].length,
				role: "expected",
			},
			{ line: actual, start: 0, end: lines[actual].length, role: "actual" },
		];
	}

	return [];
}
