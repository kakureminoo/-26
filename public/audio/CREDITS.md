# Audio credits

Downloaded 2026-10-18. All assets below are distributed by their authors under
Creative Commons CC0 1.0: https://creativecommons.org/publicdomain/zero/1.0/
No attribution is required by CC0; sources are retained here for traceability.

## Music (original files, no synthesised replacement)

- Home and title: **Once Upon a Time (loop)** — **TAD**
  - Source: https://opengameart.org/content/once-upon-a-time-loop
  - Download: https://opengameart.org/sites/default/files/once_upon_a_time_loop_0.mp3
  - Local: `music/home.mp3` (renamed, otherwise unchanged)
- Battles: **Determined Pursuit (epic orchestra loop)** — **Emma_MA**
  - Source: https://opengameart.org/content/determined-pursuit-epic-orchestra-loop
  - Download: https://opengameart.org/sites/default/files/determined_pursuit_loop.wav
  - Local: `music/battle.wav` (renamed, otherwise unchanged)

## Sound effects (selected original Ogg files, unchanged)

**Kenney — Interface Sounds**
- Source: https://kenney.nl/assets/interface-sounds
- Archive: https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip
- Included: click_001, error_001, confirmation_001, confirmation_004, back_001,
  open_001, close_001, glass_001, glitch_001, maximize_001, minimize_001,
  pluck_001, select_001, switch_001 (all `.ogg` in `sfx/`).
- Original license: `licenses/kenney-interface.txt`.

**Kenney — Impact Sounds**
- Source: https://kenney.nl/assets/impact-sounds
- Archive: https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip
- Included: footstep_concrete_000, footstep_carpet_000, impactPunch_heavy_000,
  impactWood_heavy_000, impactMetal_light_000, impactMining_000 (all `.ogg` in `sfx/`).
- Original license: `licenses/kenney-impact.txt`.

The game plays these files through Web Audio for volume control, stereo panning,
looping and music crossfades. It does not generate oscillator or noise-bank effects.
Music is loaded on demand after the first user gesture. Missing/unsupported audio
must not block gameplay. Real-device listening and loop quality need separate QA.

## クエスト出発音（2026-10-18追加）
- ファイル：`sfx/departure.ogg`（原音のまま）
- 作品：Trumpet Fanfare
- 作者：Graciano Choc - Bz.gamedev（gchoc）
- 配布・ライセンス確認元：https://opengameart.org/content/trumpet-fanfare
- 原音URL：https://opengameart.org/sites/default/files/castlefanfare_0.ogg
- ライセンス：CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/
- 用途：クエスト開始を確定した瞬間のみ。通常ボタン・撤退確認は既存のKenneyクリック音を継続。

## クエストクリアBGM（2026-10-19追加）
- 作品：Forgotten Victory — yd
- 配布・ライセンス：https://opengameart.org/content/forgotten-victory
- 原音：https://opengameart.org/sites/default/files/ForgottenVictory.ogg
- ライセンス：CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/
- Local: `music/victory.ogg`（名称のみ変更、音源の加工なし）
- 用途：クエスト成功リザルトと成功後の戦場振り返り。ループ再生し、拠点へ戻ると拠点BGMにクロスフェード。失敗・撤退時は従来の拠点BGM。
