# 更新日志 / Changelog

本项目所有值得注意的变更都会记录在此。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循[语义化版本](https://semver.org/lang/zh-CN/)。

All notable changes to this project are documented here, based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/).

## [1.0.11] - 2026-08-25

### 优化 / Improved

- 新增插件图标：圆角蓝色方块 + 白色上下排序箭头（48px / 96px PNG，附 SVG 源文件），
  用于 Zotero 插件列表展示。
  Added a plugin icon (rounded blue tile with white up/down sort arrows; 48px/96px PNG plus SVG
  source) for the Zotero add-ons list.

[1.0.11]: https://github.com/zhongrubo/zotero-tag-sort/compare/v1.0.10...v1.0.11
## [1.0.10] - 2026-08-25

### 优化 / Improved

- 启动自愈机制改为「早停」：确认补丁已生效、排序栏已出现、且布局已成功重算一次后立即停止，
  通常只需 1–3 次轻量检查，进一步降低启动期开销。
  The startup self-heal now stops early once the patches are applied, the sort bar is present, and
  the layout has been recomputed successfully — typically just 1–3 light ticks, further reducing
  startup overhead.

[1.0.10]: https://github.com/zhongrubo/zotero-tag-sort/compare/v1.0.9...v1.0.10
## [1.0.9] - 2026-08-25

### 修复 / Fixed

- 修复重启后插件可能不生效的问题：新增启动自愈机制——窗口加载后前约 15 秒内周期性重注入
  排序栏、重新应用排序与单列布局，并加大初始重试窗口；即使标签选择器初始化较慢也能自动恢复。
  Fixed the plugin sometimes not taking effect after restart: added a self-heal mechanism that
  periodically re-injects the sort bar and re-applies sorting/layout during the first ~15s after
  window load, plus a longer initial retry window.
- 新增补丁状态日志：排序补丁应用时输出具体路径（React.cloneElement / 降级 / require / 元素链），
  便于定位。
  Added patch-status logging: the plugin now logs which path applied the sort/layout patch.

[1.0.9]: https://github.com/zhongrubo/zotero-tag-sort/compare/v1.0.8...v1.0.9
## [1.0.8] - 2026-08-25

### 修复 / Fixed

- 再次加固单列布局：新增「元素链」方式定位并修补 TagList 类——从容器 render 返回的元素
  的 type（TagSelector 类）逐级取得 TagList 类，不再依赖 window.require，确保布局补丁
  在标签选择器渲染时必然生效，从根本上消除多个标签挤在同一行的问题。
  Further hardened the single-column layout: the TagList class is now located via the rendered
  element chain (from the container's render output), without depending on window.require, so
  the layout patch is guaranteed to apply whenever the tag selector renders — eliminating the
  flow-layout regression at its root.
- 新增诊断日志，布局补丁失败或重试耗尽时会输出具体状态，便于排查。
  Added diagnostic logging: when the layout patch fails or retries are exhausted, the plugin logs
  the exact state for easier diagnosis.

[1.0.8]: https://github.com/zhongrubo/zotero-tag-sort/compare/v1.0.7...v1.0.8
## [1.0.7] - 2026-08-25

### 优化 / Improved

- 排序按钮图标由下拉箭头改为代表排序的上下箭头（内联 SVG，跨平台渲染一致）。
  The sort button icon changed from a dropdown caret to an up/down arrow sort icon (inline SVG,
  rendered identically on all platforms).

[1.0.7]: https://github.com/zhongrubo/zotero-tag-sort/compare/v1.0.6...v1.0.7
## [1.0.6] - 2026-08-25

### 优化 / Improved

- 排序与「取消选择」两个圆角矩形框等宽（均分排序栏宽度），文字居中显示。
  The sort and "Clear selection" boxes now have equal width (splitting the sort bar evenly) with
  centered text.

[1.0.6]: https://github.com/zhongrubo/zotero-tag-sort/compare/v1.0.5...v1.0.6
## [1.0.5] - 2026-08-25

### 优化 / Improved

- 排序下拉按钮文字简化为「排序」，当前排序方式移到悬停提示（title）中显示；
  「取消选择」按钮保持简洁文字。
  The sort button label is simplified to "Sort" (排序); the current sort mode now shows in the
  hover tooltip. The "Clear selection" button keeps its concise label.

[1.0.5]: https://github.com/zhongrubo/zotero-tag-sort/compare/v1.0.4...v1.0.5
## [1.0.4] - 2026-08-25

### 修复 / Fixed

- 进一步加固单列布局：新增 React fiber 兜底查找标签选择器实例，并直接调用
  Collection.recomputeCellSizesAndPositions() 强制刷新位置缓存，即使标签选择器处于空闲
  状态（无重新渲染）也能立即恢复单列，避免再次出现多个标签挤在同一行。
  Further hardened the single-column layout: added a React-fiber fallback to locate the tag-selector
  instance and directly call Collection.recomputeCellSizesAndPositions() to refresh the position
  cache, so the single-column layout is restored immediately even when the tag selector is idle,
  preventing multiple tags from being squeezed onto the same row again.
- 新增 componentDidMount 补丁：标签选择器每次挂载后立即强制单列布局。
  Added a componentDidMount patch: the single-column layout is forced right after every mount.

### 优化 / Improved

- 排序下拉与「取消选择」两个功能区改为圆角矩形框，视觉上明确分割。
  The sort dropdown and the "Clear selection" button are now separate rounded-rectangle boxes.

[1.0.4]: https://github.com/zhongrubo/zotero-tag-sort/compare/v1.0.3...v1.0.4
## [1.0.3] - 2026-08-25

### 新增 / Added

- 在排序下拉菜单同一行的右侧新增「取消选择」按钮，一键清除所有已勾选的标签（原生清除逻辑，
  未选择任何标签时按钮自动置灰）。
  Added a "Clear selection" button on the right side of the sort dropdown row; it clears all
  checked tags in one click (uses the native clear logic, and is grayed out when nothing is selected).

[1.0.3]: https://github.com/zhongrubo/zotero-tag-sort/compare/v1.0.2...v1.0.3
## [1.0.2] - 2026-08-19

### 修复 / Fixed

- 修复标签列表偶尔不是单列、而是多个标签挤在同一行（回退为原生流式布局）的问题。
  Fixed the tag list occasionally falling back to the native flow layout (multiple tags on the same row) instead of the single-column layout.
- 原因：react-virtualized 的 Collection 会缓存单元格位置，只有在单元格数量变化或显式调用
  recomputeCellSizesAndPositions() 时才重新读取位置函数；插件加载晚于首次渲染时，缓存的
  流式位置会残留。现改为直接覆写位置函数并强制每次更新后刷新缓存。
  Cause: react-virtualized's Collection caches cell positions and only re-reads the size/position getter when the cell count changes or recomputeCellSizesAndPositions() is called; when the plugin patches the classes after the first render, the cached flow positions persist. Now the getter is overridden directly and the cache is refreshed on every update.
- 布局补丁失败时现在会自动重试，并记录错误日志。
  The layout patch now retries automatically and logs errors.

[1.0.2]: https://github.com/zhongrubo/zotero-tag-sort/compare/v1.0.1...v1.0.2
## [1.0.1] - 2026-08-19

### 修复 / Fixed

- 补齐 manifest.json 必需的 applications.zotero.update_url 字段，修复无法安装的问题。Added the required update_url field, fixing a manifest error that prevented installation.
- 将 strict_max_version 从 8.* 提升到 11.*，以支持 Zotero 9 / 10 / 11。Raised strict_max_version from 8.* to 11.* to support Zotero 9 / 10 / 11.
- 修复 Zotero.Prefs.set 缺少 true（global）参数导致排序偏好无法持久化的问题。Fixed Zotero.Prefs.set missing the true (global) flag, which broke preference persistence.
- 为表格化布局增加 enableTableLayout 开关（默认开启）。Added an enableTableLayout toggle for the table layout (on by default).

## [1.0.0] - 2026-08-19

### 新增 / Added

- 为每个标签添加柔和浅色线框（适配浅色 / 深色主题）。Soft light wireframe around every tag (light/dark aware).
- 在标签列表顶部新增排序下拉菜单，支持按添加时间 / 首字母 / 名称长度排序，每种双向。Sort dropdown at the top of the tag list: added time / name / length, each in both directions.
- 将标签列表改为单列、左对齐、行高统一的表格化布局。Single-column, left-aligned, table-like tag list with uniform row height and width.
- 排序偏好跨文献库与重启持久保存。Sort preference persists across libraries and restarts.
- 保留全部原生标签筛选功能。Preserves all native tag filtering.

[1.0.1]: https://github.com/zhongrubo/zotero-tag-sort/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/zhongrubo/zotero-tag-sort/releases/tag/v1.0.0