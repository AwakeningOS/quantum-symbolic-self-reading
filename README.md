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
- Download result/audit JSON

## How it works

1. サイトのAI変換プロンプトと自分の物語を、利用者自身が選んだAIへ入力します。
2. AIが返したconfig JSONをサイトへ貼り、ブラウザ内JavaScriptで測定します。
3. result JSONまたはaudit JSONをAI解釈プロンプトとともにAIへ渡します。

サイト自体は外部APIと通信しません。入力内容の保存もしません。サンプルJSONは同一サイト内の静的ファイルとして読み込みます。

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
