# 更新日志 / Changelog

本项目所有值得注意的变更都会记录在此。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.2] - 2026-08-26

第二版。整合了开发期间（含此前标记为 1.0.3–1.0.12 的内部迭代）的全部功能与修复。

Second release, consolidating all features and fixes from the development iterations.

### 修复 / Fixed

- 修复 macOS 上关闭主窗口（不退出应用）后重新打开窗口时，标签列表回退为流式布局、排序失效的问题。
  Fixed the layout/sorting not applying after closing and reopening the main window on macOS
  (without quitting the app).
- 修复标签偶尔挤在同一行的问题（react-virtualized 位置缓存；已通过覆写位置函数、元素链定位、
  自愈等多层机制根治）。Fixed the occasional flow-layout regression (react-virtualized position
  cache; addressed via getter override, element-chain patching and self-heal).
- 修复 manifest 缺少 update_url 导致无法安装的问题。Fixed a missing update_url that blocked
  installation.

### 新增 / Added

- 排序下拉菜单：按添加时间 / 首字母 / 名称长度排序，每种双向，实时生效并持久保存。
  Sort dropdown: added time / name / length, each bidirectional, persisted.
- 「取消选择」按钮：一键清除所有已勾选标签。A "Clear selection" button.
- 标签线框、单列表格化布局、深色模式适配。Tag wireframes, single-column layout, dark mode.
- 插件图标。Plugin icon.

## [1.0.1] - 2026-08-18

第一版。First release.

[1.0.2]: https://github.com/zhongrubo/zotero-tag-sort/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/zhongrubo/zotero-tag-sort/releases/tag/v1.0.1
