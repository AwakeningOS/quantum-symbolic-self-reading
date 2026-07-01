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

## How it works

1. サイトのAI変換プロンプトと自分の物語を、利用者自身が選んだAIへ入力します。
2. AIが返したconfig JSONをサイトへ貼り、ブラウザ内JavaScriptで測定します。
3. result JSONまたはaudit JSONをAI解釈プロンプトとともにAIへ渡します。

サイト自体は外部APIと通信しません。入力内容の保存もしません。サンプルJSONは同一サイト内の静的ファイルとして読み込みます。

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

The recommended copy action combines the strict interpretation prompt with a dedicated `ai_interpretation_v1` JSON. The JSON identifies data provenance, separates statevector probabilities from sampled counts, includes independently calculated rankings, and declares which audit sections are actually present.

## AIの幻覚対策

このサイトでは、AIの役割を3つに分けています。

1. AIエンコーダ：人生文 → config JSON
2. ブラウザ計算：config JSON → 確定した数値結果
3. AI解釈者：数値結果 → 象徴的な解釈

config JSON は測定結果ではありません。
`expected_reading` は予想であり、実測値ではありません。
AIが入力にない確率や順位を作った場合、その解釈は破棄してください。

`probabilities` はstatevectorから計算した理想確率です。`sampled_counts` はshotsとseedを用いた疑似サンプリング結果で、`sampled_probabilities` は `sampled_counts / shots` です。期待順位と、確率・countsから計算した観測順位は別々に記録されます。

## Quantum model

内部basisは `[a, b, c, d]`、bit対応は `a=00, b=01, c=10, d=11` です。各ゲートはsourceとtargetの二成分に次のユニタリ回転を適用します。

```text
new_i = cos(theta) * amp_i - exp(-i phi) * sin(theta) * amp_j
new_j = exp(i phi) * sin(theta) * amp_i + cos(theta) * amp_j
```

source→targetは意味上の方向です。二準位回転のため、target側に振幅があれば逆向きの移動や干渉も起きます。

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
