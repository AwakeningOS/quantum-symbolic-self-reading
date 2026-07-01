import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  BASIS,
  abs2,
  initialState,
  runFullMeasurement,
  validateConfig,
} from "../src/quantum.js";

const sampleUrl = new URL("../examples/user_spiritual_evolution_light_descent_v0.json", import.meta.url);
const config = JSON.parse(await readFile(sampleUrl, "utf8"));

assert.equal(config.name, "user_spiritual_evolution_light_descent_v0", "1. サンプルJSONを読み込める");
assert.equal(validateConfig(config), true, "2. validateConfig が通る");

const { result, audit } = runFullMeasurement(config);
const norm = Object.values(result.final_statevector).reduce((sum, z) => sum + abs2(z), 0);
assert.ok(Math.abs(norm - 1) < 1e-10, `3. norm が 1 に近い: ${norm}`);

const probabilitySum = Object.values(result.probabilities).reduce((sum, value) => sum + value, 0);
assert.ok(Math.abs(probabilitySum - 1) < 1e-10, `4. probabilities の合計が 1 に近い: ${probabilitySum}`);
assert.deepEqual([...result.observed_ranking].sort(), [...BASIS].sort(), "5. ranking が返る");

const traceFinal = audit.gate_trace.at(-1).after;
for (const label of BASIS) {
  assert.ok(Math.abs(traceFinal[label] - result.probabilities[label]) < 1e-12, `6. gate_trace final ${label} が一致`);
}

assert.equal(audit.ablation.length, config.gates.length, "7. ablation が gates.length 件返る");
assert.equal(audit.order_sensitivity.length, config.gates.length - 1, "8. order sensitivity が gates.length - 1 件返る");
assert.equal(audit.phase_sensitivity.length, config.gates.length * 3, "9. phase sensitivity が gates.length * 3 件返る");
assert.equal(Object.values(result.counts).reduce((sum, count) => sum + count, 0), config.shots, "counts 合計が shots と一致");
assert.deepEqual(result.counts, runFullMeasurement(config).result.counts, "seed付き counts は決定的");

const tieConfig = {
  initial: "a",
  shots: 1,
  seed: 1,
  gates: [{ name: "tie", source: "a", target: "b", theta: Math.PI / 4, phi: 0, strength: 2.5 }],
};
assert.deepEqual(runFullMeasurement(tieConfig).result.observed_ranking, ["a", "b", "c", "d"], "同率は basis 順で安定ソート");
assert.equal(initialState("d")[3].re, 1, "単一初期状態を生成できる");

assert.throws(() => validateConfig({ initial: "x", gates: [] }), /initial は a\/b\/c\/d/, "不正な initial を拒否");
assert.throws(() => validateConfig({ initial: "a", gates: [] }), /gates が空/, "空の gates を拒否");

console.log("All tests passed.");
console.log(JSON.stringify({
  name: result.name,
  probabilities: result.probabilities,
  counts: result.counts,
  observed_ranking: result.observed_ranking,
  expected_ranking: result.expected_ranking,
  expected_match: result.expected_match,
  norm: result.norm,
}, null, 2));
