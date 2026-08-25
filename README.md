# Zotero Tag Sort

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Zotero 7+](https://img.shields.io/badge/Zotero-7%2B-red.svg)](https://www.zotero.org/)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()

给 Zotero 左侧边栏「标签筛选器」增加**排序下拉菜单**与**整洁表格化排版**的开源插件，
在完整保留原生筛选功能（勾选标签过滤文献）的前提下，提升标签的视觉区分度与排序管理体验。

An open-source Zotero plugin that adds a **sort dropdown** and a **clean, framed, table-like
layout** to the left-sidebar tag selector — while fully preserving native filtering (checking a
tag still filters items exactly as before).

---

## 功能特性 / Features

### 1. 标签线框 / Tag wireframes

为每个标签项添加柔和的浅色线框（1px 内阴影，视觉等同边框）。颜色使用 Zotero 的
`--color-border` 设计令牌，自动适配浅色 / 深色主题，且不改变标签的测量尺寸（不会裁切文字）。

Each tag gets a soft light wireframe (a 1px inset hairline that reads as a border). It uses the
`--color-border` design token, adapts to light/dark mode, and never shifts the tag's measured
size (no text clipping).

### 2. 排序下拉菜单 / Sort dropdown

在标签列表顶部（搜索/筛选区域上方）新增排序下拉菜单，提供三种维度、每种双向排序：

A dropdown is added at the top of the tag list (above the search/filter area):

| 维度 Dimension | 升序 Ascending | 降序 Descending |
| --- | --- | --- |
| 添加时间 Added time | 旧 → 新 (old → new) | 新 → 旧 (new → old) |
| 首字母 Name | A → Z | Z → A |
| 名称长度 Length | 短 → 长 (short → long) | 长 → 短 (long → short) |

选择后列表**实时重排**；排序偏好持久保存（`extensions.zotero-tag-sort.sortMode`），
切换文献库或重启 Zotero 后依然生效。

Selection re-sorts the list in real time. The preference is persisted and survives library
switches and Zotero restarts.

> **关于「添加时间」/ About “added time”**：Zotero 的标签数据表本身不存储标签创建时间戳。
> 本插件以随创建单调递增的 `tagID` 作为「添加时间」的近似代理（ID 越大越新）。
> 这是不引入额外数据即可获得的最可靠的创建顺序。
>
> Zotero's tag table stores no creation timestamp. This plugin uses the monotonic `tagID` as a
> proxy for creation order (higher ID = newer) — the most reliable ordering available without
> extra bookkeeping.

### 3. 标签左对齐、表格化 / Left-aligned, table-like list

标签列表改为**单列**布局：每个标签独占一行、左对齐、行高一致、宽度统一，呈现类似表格的
整齐效果，不再因名称长短而参差不齐。

Tags are laid out in a single column: one tag per row, left-aligned, uniform row height and
width — a tidy, table-like list.

### 4. 原生风格与深色模式 / Native style & dark mode

所有新增 UI 均使用 Zotero 的设计令牌（`--fill-*`、`--color-*`、`--material-*`），
字体、字号、颜色、间距与原生一致，并随系统 / Zotero 主题自动切换浅色与深色。

All added UI uses Zotero design tokens and follows the app theme automatically.

### 5. 保留原生筛选 / Native filtering preserved

本插件**仅**对标签的展示与排序做优化。勾选标签过滤文献的交互、操作反馈与筛选逻辑均未改动。

This plugin **only** changes how tags are displayed and ordered. The filtering interaction,
feedback, and logic are untouched.

---

## 截图 / Screenshots

> 待补充。请将截图放入 `docs/screenshots/` 并在下方引用。
> To be added. Put images in `docs/screenshots/` and reference them below.

```
docs/screenshots/sort-dropdown.png
docs/screenshots/tag-list-light.png
docs/screenshots/tag-list-dark.png
```

---

## 安装 / Installation

1. 在 [Releases](../../releases) 下载 `zotero-tag-sort.xpi`。
   Download `zotero-tag-sort.xpi` from [Releases](../../releases).
2. 打开 Zotero → 工具 → 插件（Add-ons）→ 右上角齿轮 → 「从文件安装附加组件…」，选择 `.xpi`。
   In Zotero: Tools → Add-ons → gear icon → “Install Add-on From File…” and pick the `.xpi`.

---

## 使用 / Usage

安装后，标签筛选器顶部会出现「排序」下拉菜单。点击即可选择排序方式；选择即时生效并自动记住。

After installation, a sort dropdown appears at the top of the tag selector. Pick a sort order;
it applies immediately and is remembered.

---

## 兼容性 / Compatibility

| 项 Item | 说明 Value |
| --- | --- |
| Zotero | 7.0 – 11.x（manifest 允许 `7.0` ~ `11.*`） |
| 平台 Platform | Windows / macOS / Linux |
| 性能 Performance | 排序为 O(n log n) 且使用原生排序器，500+ 标签保持流畅 |

本插件已针对 Zotero 7.0.32 / 9.0.6 / 10.0.0 / 11 开发版的标签选择器内部结构逐一核对。

The plugin has been verified against the tag-selector internals of Zotero 7.0.32, 9.0.6, 10.0.0,
and 11.x-dev.

---

## 构建 / Building

生成 `.xpi`（需要 `zip`）：

```sh
./build.sh
```

产物位于 `zotero-tag-sort.xpi`。Windows 下可用任意 zip 工具把 `addon/` 目录内容打包为
`zotero-tag-sort.xpi`（注意 `manifest.json` 必须位于 zip 根目录）。

The output is `zotero-tag-sort.xpi`. On Windows, zip the contents of `addon/` into
`zotero-tag-sort.xpi` (note that `manifest.json` must be at the zip root).

---

## 项目结构 / Project structure

```text
addon/
  manifest.json              # 插件清单（含版本、兼容范围、update_url）
  bootstrap.js               # Zotero 7+ 引导入口
  prefs.js                   # 默认偏好
  style.css                  # 线框 / 排序条 / 表格化样式
  content/
    zotero-tag-sort.js       # 核心逻辑（注入 UI + 补丁 + 排序）
  LICENSE                    # AGPL-3.0
build.sh                     # 打包脚本
.github/workflows/release.yml  # 自动发布 CI
```

---

## 高级设置 / Advanced

| 偏好 Pref | 默认 Default | 说明 |
| --- | --- | --- |
| `extensions.zotero-tag-sort.sortMode` | `alpha-asc` | 排序模式 |
| `extensions.zotero-tag-sort.enableTableLayout` | `true` | 单列表格化布局开关 |

可在 Zotero 的 `about:config` 中修改。
Both can be changed in Zotero's `about:config`.

---

## 发布 / Release

插件 id 为 `zotero-tag-sort@zhongrubo.github.io`，自动更新地址指向 GitHub Releases 的
`update.json`。发布新版本只需推送一个 `v*` 标签，GitHub Actions 会自动打包 `.xpi`、
生成 `update.json` 并创建 Release。

The plugin id is `zotero-tag-sort@zhongrubo.github.io`, and the update URL points to the
GitHub Releases `update.json`. To release, push a `v*` tag — CI builds the `.xpi`,
generates `update.json`, and creates a Release automatically.

```sh
git tag v1.0.2
git push origin v1.0.2
```

---

## 许可证 / License

[AGPL-3.0](./LICENSE)

---

## 致谢 / Acknowledgements

- [Zotero](https://www.zotero.org/) 团队及其开源的标签选择器实现。
- 引导结构参考了 Zotero 官方的 [make-it-red](https://github.com/zotero/make-it-red) 示例与
  [zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template)。

## 贡献 / Contributing

欢迎提交 Issue 与 Pull Request。详见 [CONTRIBUTING.md](./CONTRIBUTING.md) 与
[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)。

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) and
[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## 更新日志 / Changelog

见 [CHANGELOG.md](./CHANGELOG.md)。
See [CHANGELOG.md](./CHANGELOG.md).