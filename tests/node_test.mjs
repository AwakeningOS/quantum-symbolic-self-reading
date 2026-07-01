import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  BASIS,
  abs2,
  initialState,
  makeAiInterpretationJson,
  rankComponents,
  runFullMeasurement,
  validateConfig,
} from "../src/quantum.js";
import { encodingPrompt, interpretationPrompt } from "../src/prompts.js";

const sampleUrl = new URL("../examples/user_spiritual_evolution_light_descent_v0.json", import.meta.url);
const config = JSON.parse(await readFile(sampleUrl, "utf8"));

assert.equal(config.name, "user_spiritual_evolution_light_descent_v0", "1. サンプルJSONを読み込める");
assert.equal(validateConfig(config), true, "2. validateConfig が通る");

const { result, audit, aiInterpretation } = runFullMeasurement(config);
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
assert.ok(result.sampled_probabilities, "10. sampled_probabilities が存在する");
for (const label of BASIS) {
  assert.equal(result.sampled_probabilities[label], result.sampled_counts[label] / result.shots, `11. sampled_probabilities.${label} が counts / shots と一致`);
}
assert.deepEqual(result.observed_ranking_from_probabilities, rankComponents(result.probabilities), "12. probability ranking をサイト側で検算済み");
assert.deepEqual(result.observed_ranking_from_counts, rankComponents(result.sampled_counts), "13. count ranking をサイト側で検算済み");
assert.equal(result.probability_source, "statevector", "probability_source を明示");
assert.equal(result.count_source, "seeded_sampling", "count_source を明示");
assert.deepEqual(result.observed_ranking, result.observed_ranking_from_probabilities, "互換 ranking は probability ranking と一致");
assert.deepEqual(result.counts, result.sampled_counts, "互換 counts は sampled_counts と一致");

assert.ok(aiInterpretation, "14. AI解釈専用JSONが生成される");
assert.equal(aiInterpretation.input_type, "measurement_result", "15. AI解釈専用JSONの input_type");
assert.ok(Array.isArray(aiInterpretation.anti_hallucination_instructions), "16. anti_hallucination_instructions がある");
assert.ok(aiInterpretation.anti_hallucination_instructions.length >= 5, "anti_hallucination_instructions が具体的");
assert.equal(aiInterpretation.probability_source, "statevector", "17. AI JSONの probability_source");
assert.equal(aiInterpretation.count_source, "seeded_sampling", "18. AI JSONの count_source");
assert.deepEqual(aiInterpretation.sampled_probabilities, result.sampled_probabilities, "AI JSONは計算済み sampled_probabilities を保持");
assert.deepEqual(aiInterpretation.sections_present, {
  gate_trace: true,
  ablation: true,
  order_sensitivity: true,
  phase_sensitivity: true,
}, "AI JSONは監査セクションの有無を明示");
assert.equal(aiInterpretation.gate_trace.length, config.gates.length, "AI JSONに実在する gate_trace を含める");
assert.equal(makeAiInterpretationJson(result).sections_present.gate_trace, false, "軽量AI JSONは欠けたセクションをfalseにする");
assert.match(encodingPrompt, /あなたは測定結果を出してはいけません/, "19. encoder は測定結果を作らない");
assert.match(encodingPrompt, /expected_reading は「予想」または「仮説」/, "expected_reading は仮説と明記");
assert.match(interpretationPrompt, /これは測定前の config JSON です。実測確率が含まれていないため/, "config JSONだけを結果解釈しない");
assert.match(interpretationPrompt, /絶対に数値を推測・補完・創作しない/, "数値創作を禁止");

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
  sampled_counts: result.sampled_counts,
  sampled_probabilities: result.sampled_probabilities,
  observed_ranking_from_probabilities: result.observed_ranking_from_probabilities,
  observed_ranking_from_counts: result.observed_ranking_from_counts,
  expected_ranking: result.expected_ranking,
  ranking_match_expected_from_probabilities: result.ranking_match_expected_from_probabilities,
  ranking_match_expected_from_counts: result.ranking_match_expected_from_counts,
  ai_interpretation_schema: aiInterpretation.schema_version,
  norm: result.norm,
}, null, 2));
