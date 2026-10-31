# Pronunciation recordings

These recordings have their own terms; the application's MIT license does not replace them.
The in-app **Audio credits** dialog provides the same authors, source links, and license references.
The complete per-recording provenance, source/download URLs, original names, and SHA-256 hashes
are in `app/data/audio/manifest.json`.

## Taiwan Zhuyin

2017 © 教育部，國語注音符號手冊-開放部件。

此素材依「創用CC 姓名標示 4.0 國際版本」授權條款進行公眾釋出，使用者於遵守本條款各項規定之前提下，得利用之。

- Source: <https://language.moe.gov.tw/001/Upload/files/site_content/M0001/juyin/>
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- The original archive's attribution notice is preserved in `licenses/moe-zhuyin.txt`.
- The 37 `F1.WAV`–`F37.WAV` recordings were mapped against the handbook's playback links and symbol table.
- The separately licensed audio is used here; the handbook's different document/font licenses do not apply to these audio assets.

## Japanese kana

The 46 modern kana recordings are by **FUN Japanese Learning**, used under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), as credited by the
[kana-trainer distributor](https://github.com/arsalan-anwari/kana-trainer#credits).
Original publisher: <https://funjapaneselearning.com/katakana-course-2/>.
The exact distributor revision and attribution evidence are recorded in
`licenses/fun-japanese-learning.txt`; each manifest download URL pins that revision.
The user-provided downloads were checked against upstream Git blob hashes and copied
unchanged, without additional trimming, normalization, or re-encoding by Lingder.
Hiragana and katakana share recordings for equivalent sounds.

Historical wi and we are not included in that set. Their existing public-domain
recordings remain: **Spacecat2~commonswiki** (author attributed by Commons), with
the corrected `Ja-We.oga` uploaded by **TAKASUGI Shinji**.

- Historical wi: <https://commons.wikimedia.org/wiki/File:Ja-Wi.oga>
- Historical we: <https://commons.wikimedia.org/wiki/File:Ja-We.oga>

## Processing

For the 37 Zhuyin recordings and two historical kana recordings only,
outer silence was trimmed conservatively (−45 dB threshold, 80 ms lead / 120 ms tail retained),
then loudness normalized with FFmpeg's `loudnorm` filter (−18 LUFS, −2 dBTP target, LRA 7).
A final peak limiter (0.7 amplitude, automatic gain disabled) provides headroom for MP3 encoding.
Files were converted to mono 44.1 kHz MP3 at 96 kbps. No words or sounds were synthesized.
Some source downloads use Wikimedia's own MP3 transcodes; these are identified in the manifest.
`originalSha256` identifies the downloaded source bytes (including a transcode where specified),
while `sha256` identifies the shipped MP3. Retain these notices when redistributing the assets.

The conversion tool was used outside the application dependency tree. No audio library or conversion
binary is shipped to browsers. Source availability and correctness must be reviewed when replacing assets.

## Validation status

The 46 replacement modern kana files were verified byte-for-byte against the pinned
kana-trainer revision and decoded to confirm non-silent audio. Their CC BY 4.0 credit
comes from that distributor’s README. The remaining 39 files retain their previous
decode/peak checks and MOE/Commons source verification.
These technical checks do not replace a human pronunciation/listening review, which remains outstanding.
