# Quantum Symbolic Self-Reading

AIで人生・思想・霊的体験を量子象徴回路JSONに変換し、ブラウザ内で測定する実験的ツール。

公開サイト: <https://awakeningos.github.io/quantum-symbolic-self-reading/>

## Features

- No API
- No server
- Runs fully in browser
- Copy prompt for AI encoding
- Paste config JSON
- Compute a/b/c/d probabilities
- Gate trace
- Ablation
- Order sensitivity
- Phase sensitivity
- Copy result for AI interpretation
- Dedicated anti-hallucination JSON for AI interpretation
- Download result/audit/AI interpretation JSON
- Entanglement metrics (concurrence / entropy / purity)
- Classical controls (phase-kill, no-interference Markov)
- Encoder variance CLI

## How it works

1. サイトのAI変換プロンプトと自分の物語を、利用者自身が選んだAIへ入力します。
2. AIが返したconfig JSONをサイトへ貼り、ブラウザ内JavaScriptで測定します。
3. result JSONまたはaudit JSONをAI解釈プロンプトとともにAIへ渡します。

サイト自体は外部APIと通信しません。入力内容の保存もしません。サンプルJSONは同一サイト内の静的ファイルとして読み込みます。

## Mode profiles

This site supports two mode profiles.

### General mode

A general symbolic four-quadrant model.

- a = inner core
- b = manifested situation
- c = hidden order
- d = manifested action / intervention

Use this for life reflection, stories, career, relationships, creative writing, and general symbolic analysis.

### Seeker mode

A spiritual / mystical / seeker-oriented model.

- a = soul-like individual self
- b = manifested ego / embodied self
- c = unmanifest truth / source
- d = manifest divinity / grace

Use this for spiritual experiences, faith, enlightenment, mysticism, and religious texts.

Configs declare the profile with `mode_profile: "general"` or `mode_profile: "seeker"`. Older configs without the field are reported as `legacy`; the site does not silently infer seeker semantics.

## モード

### 一般ヴァージョン

汎用4象限モデルです。

- a = 内的核
- b = 現実相
- c = 背後秩序
- d = 顕在作用

人生相談、物語分析、キャリア、恋愛、創作、社会的テーマなどに使います。

### スピリチュアル・神秘主義・求道者ヴァージョン

霊的探究向けモデルです。

- a = 魂的個我
- b = 顕現した個我
- c = 非顕現の神・真理
- d = 顕現した神性・恩寵

霊的体験、信仰、悟り、神秘主義、宗教思想などに使います。

## AI hallucination prevention

This site separates three roles:

1. AI Encoder: life story -> config JSON
2. Browser calculator: config JSON -> fixed numeric measurement result
3. AI Interpreter: result JSON -> symbolic interpretation

Important:

- Config JSON is not a measurement result.
- `expected_reading` is only a hypothesis.
- Probabilities are calculated by the site.
- Counts are sampled from probabilities using shots and seed.
- AI should never invent probabilities, counts, rankings, or gate effects.

The recommended copy action combines the strict interpretation prompt with a dedicated `ai_interpretation_v3` JSON. The JSON identifies data provenance, separates statevector probabilities from sampled counts, includes independently calculated rankings, and declares which audit sections are actually present.

## AIの幻覚対策

このサイトでは、AIの役割を3つに分けています。

1. AIエンコーダ：人生文 → config JSON
2. ブラウザ計算：config JSON → 確定した数値結果
3. AI解釈者：数値結果 → 象徴的な解釈

config JSON は測定結果ではありません。
`expected_reading` は予想であり、実測値ではありません。
AIが入力にない確率や順位を作った場合、その解釈は破棄してください。

`probabilities` はstatevectorから計算した理想確率です。`sampled_counts` はshotsとseedを用いた疑似サンプリング結果で、`sampled_probabilities` は `sampled_counts / shots` です。期待順位と、確率・countsから計算した観測順位は別々に記録されます。

解釈AIは、サイトが計算した gate_resonance(遅効性/相殺の診断)・entanglement・classical_controls を翻訳するだけであり、これらの再計算・再判定は禁止されています。

## What only the circuit can see / 回路だけが見えるもの

- 反実仮想の重み: 各出来事を取り除いたとき、結末がどれだけ変わるかを比較します。
- 遅効性と相殺: 起きた瞬間の効果と最終的な重みの乖離から、静かな種や洗い流された効果を見分けます。
- 順序依存性: 隣接する出来事の順番を入れ替えたとき、結末が変わるかを測ります。
- 通り方の質: 同じ出来事を受容・葛藤・反転のどの位相で通ったかが、結果を変えたかを測ります。
- 二軸の絡み合い: 「私は誰か」と「それは現れているか」という二つの問いが、どれだけ不可分かを示します。
- 語りと構造のずれ: エンコーダが予想した結末と、回路が測定した結末の食い違いを示します。

## Quantum model

内部basisは `[a, b, c, d]`、bit対応は `a=00, b=01, c=10, d=11` です。各ゲートはsourceとtargetの二成分に次のユニタリ回転を適用します。

```text
new_i = cos(theta) * amp_i - exp(-i phi) * sin(theta) * amp_j
new_j = exp(i phi) * sin(theta) * amp_i + cos(theta) * amp_j
```

source→targetは意味上の方向です。二準位回転のため、target側に振幅があれば逆向きの移動や干渉も起きます。

## Tensor structure and entanglement

4成分は主体軸×顕現軸のテンソル積として、`a=|00⟩`、`b=|01⟩`、`c=|10⟩`、`d=|11⟩` に分解します。第1ビットの主体軸は個我 `(a,b)` と超越 `(c,d)`、第2ビットの顕現軸は非顕現 `(a,c)` と顕現 `(b,d)` を表します。

純粋状態の絡み合い度は `concurrence = 2|z_a z_d − z_b z_c|` で計算します。

| Concurrence | 判定 |
|---|---|
| `C < 0.1` | `SEPARABLE_LIKE` |
| `0.1 ≤ C < 0.5` | `WEAKLY_ENTANGLED` |
| `0.5 ≤ C < 0.9` | `STRONGLY_ENTANGLED` |
| `0.9 ≤ C` | `NEAR_MAXIMAL` |

## Classical controls

`phase_dependence` は元の最終確率と全ゲートの `phi=0` にした最終確率のL1距離です。`interference_gap` は量子回路の最終確率と、位相・干渉を使わない古典マルコフ遷移の確率のL1距離です。

両方 LOW なら、そのconfigに複素振幅を使う経験的正当性は弱いと判断します。

## Encoder reproducibility

同じ物語から複数のconfigを生成した場合、次のCLIでゲートパラメータ、順位、concurrence、確率分布のばらつきを確認できます。

```bash
node tools/encoder_variance.mjs a.json b.json c.json
```

同じ物語を3回以上エンコードして分散を確認することを推奨します。

## Local use

ES modulesとサンプルJSONの読み込みにはローカルHTTPサーバーを使います。

```bash
python3 -m http.server 8000
```

その後、<http://localhost:8000/> を開きます。

## Test

```bash
npm test
```

依存パッケージとビルド工程はありません。

## GitHub Pages

`main` ブランチの `/ (root)` をGitHub Pagesの公開元に指定します。相対パスだけを使っているため、プロジェクトPagesのサブパスでそのまま動作します。

## Privacy

このサイトは入力内容をサーバーに送信しません。すべての計算はブラウザ内で行われます。ただし、外部AIに入力した内容は、そのAIサービス側の規約に従います。

## Safety Notice

This tool does not prove spiritual truth, medical facts, or life diagnosis.
It is for symbolic self-reflection and structural interpretation only.

この結果は霊的真実・医学的事実・人生の絶対診断を証明するものではありません。自己理解・内省・物語の整理のために使い、医療・宗教・人生判断の絶対的根拠にはしないでください。
