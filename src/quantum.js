export const BASIS = ["a", "b", "c", "d"];

export function complex(re = 0, im = 0) {
  return { re, im };
}

export const add = (z1, z2) => complex(z1.re + z2.re, z1.im + z2.im);
export const sub = (z1, z2) => complex(z1.re - z2.re, z1.im - z2.im);
export const mul = (z1, z2) => complex(z1.re * z2.re - z1.im * z2.im, z1.re * z2.im + z1.im * z2.re);
export const scale = (z, s) => complex(z.re * s, z.im * s);
export const abs2 = (z) => z.re * z.re + z.im * z.im;
export const phase = (z) => (abs2(z) < 1e-30 ? null : Math.atan2(z.im, z.re));
export const expI = (phi) => complex(Math.cos(phi), Math.sin(phi));

export function basisIndex(label) {
  return BASIS.indexOf(label);
}

export function initialState(label) {
  const index = basisIndex(label);
  if (index < 0) throw new Error("initial は a/b/c/d のいずれかにしてください。");
  return BASIS.map((_, i) => complex(i === index ? 1 : 0, 0));
}

export function pairRotation(state, source, target, theta, phi) {
  const i = basisIndex(source);
  const j = basisIndex(target);
  if (i < 0 || j < 0) throw new Error("gate の source/target は a/b/c/d のいずれかにしてください。");
  if (i === j) throw new Error("gate の source と target は異なる成分にしてください。");
  const next = state.map((z) => complex(z.re, z.im));
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  next[i] = sub(scale(state[i], c), scale(mul(expI(-phi), state[j]), s));
  next[j] = add(scale(mul(expI(phi), state[i]), s), scale(state[j], c));
  return next;
}

export function applyGates(state, gates) {
  return gates.reduce(
    (current, gate) => pairRotation(current, gate.source, gate.target, gate.theta, gate.phi),
    state.map((z) => complex(z.re, z.im)),
  );
}

export function probabilities(state) {
  return Object.fromEntries(BASIS.map((label, i) => [label, abs2(state[i])]));
}

export function rankComponents(values) {
  return BASIS.map((label, index) => ({ label, index, value: values[label] }))
    .sort((left, right) => right.value - left.value || left.index - right.index)
    .map(({ label }) => label);
}

export function phases(state) {
  return Object.fromEntries(BASIS.map((label, i) => [label, phase(state[i])]));
}

export function relativePhases(state) {
  const componentPhases = phases(state);
  const result = {};
  for (let i = 0; i < BASIS.length; i += 1) {
    for (let j = i + 1; j < BASIS.length; j += 1) {
      const left = componentPhases[BASIS[i]];
      const right = componentPhases[BASIS[j]];
      result[`${BASIS[i]}-${BASIS[j]}`] = left === null || right === null ? null : wrapPhase(left - right);
    }
  }
  return result;
}

function wrapPhase(value) {
  return Math.atan2(Math.sin(value), Math.cos(value));
}

export function alignmentScores(state) {
  const componentPhases = phases(state);
  const magnitudes = state.map((z) => Math.sqrt(abs2(z)));
  const result = {};
  for (let i = 0; i < BASIS.length; i += 1) {
    for (let j = i + 1; j < BASIS.length; j += 1) {
      const key = `${BASIS[i]}-${BASIS[j]}`;
      result[key] = componentPhases[BASIS[i]] === null || componentPhases[BASIS[j]] === null
        ? 0
        : magnitudes[i] * magnitudes[j] * Math.cos(componentPhases[BASIS[i]] - componentPhases[BASIS[j]]);
    }
  }
  return result;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleCounts(values, shots, seed) {
  const counts = Object.fromEntries(BASIS.map((label) => [label, 0]));
  if (!Number.isInteger(shots) || shots <= 0) return counts;
  const random = mulberry32(Number.isInteger(seed) ? seed : 0);
  const cumulative = [];
  let sum = 0;
  for (const label of BASIS) {
    sum += values[label];
    cumulative.push(sum);
  }
  for (let shot = 0; shot < shots; shot += 1) {
    const draw = random();
    const index = cumulative.findIndex((limit) => draw < limit);
    counts[BASIS[index < 0 ? BASIS.length - 1 : index]] += 1;
  }
  return counts;
}

export function traceGateEffects(startState, gates) {
  const trace = [];
  let state = startState.map((z) => complex(z.re, z.im));
  gates.forEach((gate, index) => {
    const before = probabilities(state);
    state = pairRotation(state, gate.source, gate.target, gate.theta, gate.phi);
    const after = probabilities(state);
    trace.push({
      step: index + 1,
      gate: gate.name,
      source: gate.source,
      target: gate.target,
      before,
      after,
      delta: Object.fromEntries(BASIS.map((label) => [label, after[label] - before[label]])),
    });
  });
  return trace;
}

function measureWithGates(config, gates) {
  const state = applyGates(initialState(config.initial), gates);
  const values = probabilities(state);
  const ranking = rankComponents(values);
  return { state, probabilities: values, ranking, primary: ranking[0], secondary: ranking[1] };
}

function maxProbabilityDelta(left, right) {
  return Math.max(...BASIS.map((label) => Math.abs(left[label] - right[label])));
}

function sensitivity(delta) {
  if (delta < 0.1) return "LOW";
  if (delta < 0.3) return "MEDIUM";
  return "HIGH";
}

export function runGateAblation(config) {
  const baseline = measureWithGates(config, config.gates);
  return config.gates.map((gate, removedIndex) => {
    const measured = measureWithGates(config, config.gates.filter((_, index) => index !== removedIndex));
    const l1Difference = BASIS.reduce(
      (sum, label) => sum + Math.abs(measured.probabilities[label] - baseline.probabilities[label]),
      0,
    );
    return {
      removed_index: removedIndex,
      removed_gate: gate.name,
      primary: measured.primary,
      secondary: measured.secondary,
      probabilities: measured.probabilities,
      l1_difference: l1Difference,
    };
  });
}

export function runOrderSensitivity(config) {
  const baseline = measureWithGates(config, config.gates);
  return config.gates.slice(0, -1).map((gate, index) => {
    const swapped = config.gates.slice();
    [swapped[index], swapped[index + 1]] = [swapped[index + 1], swapped[index]];
    const measured = measureWithGates(config, swapped);
    const delta = maxProbabilityDelta(measured.probabilities, baseline.probabilities);
    return {
      swap_steps: [index + 1, index + 2],
      swapped_gates: [gate.name, config.gates[index + 1].name],
      primary: measured.primary,
      secondary: measured.secondary,
      probabilities: measured.probabilities,
      max_probability_delta: delta,
      sensitivity: sensitivity(delta),
    };
  });
}

export function runPhaseSensitivity(config) {
  const baseline = measureWithGates(config, config.gates);
  const testedPhases = [0, Math.PI / 2, Math.PI];
  return config.gates.flatMap((gate, gateIndex) => testedPhases.map((testedPhi) => {
    const changed = config.gates.map((item, index) => index === gateIndex ? { ...item, phi: testedPhi } : item);
    const measured = measureWithGates(config, changed);
    const delta = maxProbabilityDelta(measured.probabilities, baseline.probabilities);
    return {
      gate_index: gateIndex,
      gate: gate.name,
      original_phi: gate.phi,
      tested_phi: testedPhi,
      primary: measured.primary,
      secondary: measured.secondary,
      probabilities: measured.probabilities,
      max_probability_delta: delta,
      sensitivity: sensitivity(delta),
    };
  }));
}

export function validateConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("config はJSONオブジェクトにしてください。");
  if (basisIndex(config.initial) < 0) throw new Error("initial は a/b/c/d のいずれかにしてください。");
  if (!Array.isArray(config.gates) || config.gates.length === 0) throw new Error("gates が空です。");
  if (config.shots !== undefined && (!Number.isInteger(config.shots) || config.shots <= 0)) throw new Error("shots は正の整数にしてください。");
  if (config.seed !== undefined && !Number.isInteger(config.seed)) throw new Error("seed は整数にしてください。");
  config.gates.forEach((gate, index) => {
    if (basisIndex(gate.source) < 0 || basisIndex(gate.target) < 0) throw new Error(`gate ${index + 1} の source/target は a/b/c/d のいずれかにしてください。`);
    if (gate.source === gate.target) throw new Error(`gate ${index + 1} の source と target は異なる成分にしてください。`);
    if (![gate.theta, gate.phi, gate.strength].every(Number.isFinite)) throw new Error(`gate ${index + 1} の theta/phi/strength は数値にしてください。`);
  });
  return true;
}

export function runFullMeasurement(config) {
  validateConfig(config);
  const start = initialState(config.initial);
  const finalState = applyGates(start, config.gates);
  const finalProbabilities = probabilities(finalState);
  const ranking = rankComponents(finalProbabilities);
  const expectedRanking = Array.isArray(config.expected_reading?.ranking)
    ? config.expected_reading.ranking
    : [config.expected_reading?.primary, config.expected_reading?.secondary].filter(Boolean);
  const expectedMatch = expectedRanking.length > 0
    ? expectedRanking.every((label, index) => ranking[index] === label)
    : null;
  const componentPhases = phases(finalState);
  const result = {
    schema_version: "1.0",
    name: config.name ?? "unnamed",
    description: config.description ?? "",
    mode: config.mode ?? "process",
    initial: config.initial,
    basis: BASIS,
    expected_ranking: expectedRanking,
    observed_ranking: ranking,
    expected_match: expectedMatch,
    probabilities: finalProbabilities,
    shots: config.shots ?? null,
    seed: config.seed ?? null,
    counts: config.shots ? sampleCounts(finalProbabilities, config.shots, config.seed ?? 0) : null,
    final_statevector: Object.fromEntries(BASIS.map((label, index) => [label, finalState[index]])),
    norm: finalState.reduce((sum, z) => sum + abs2(z), 0),
    phases: Object.fromEntries(BASIS.map((label) => [label, {
      radians: componentPhases[label],
      degrees: componentPhases[label] === null ? null : componentPhases[label] * 180 / Math.PI,
    }])),
    relative_phases: Object.fromEntries(Object.entries(relativePhases(finalState)).map(([key, radians]) => [key, {
      radians,
      degrees: radians === null ? null : radians * 180 / Math.PI,
    }])),
    alignment: alignmentScores(finalState),
    component_meanings: config.component_meanings ?? {},
  };
  const audit = {
    schema_version: "1.0",
    measurement: result,
    gate_trace: traceGateEffects(start, config.gates),
    ablation: runGateAblation(config),
    order_sensitivity: runOrderSensitivity(config),
    phase_sensitivity: runPhaseSensitivity(config),
    notice: "This is a mathematical expansion of a symbolic circuit configuration, not proof of spiritual truth, medical fact, or an absolute life diagnosis.",
  };
  return { result, audit };
}
