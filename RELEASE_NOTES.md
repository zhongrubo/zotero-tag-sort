# Zotero Tag Sort v1.0.11

v1.0.11 新增了插件图标，并随附近期针对「标签挤在一行」问题的一系列稳定性修复。

v1.0.11 adds a plugin icon, together with recent stability fixes for the "tags squeezed onto
one row" issue.

## 🎨 新增 / New

- **插件图标 / Plugin icon** — 新增圆角蓝色方块 + 白色上下排序箭头图标（48px / 96px PNG，附 SVG 源文件），
  用于 Zotero 插件列表展示。Added a plugin icon (rounded blue tile with white up/down sort arrows;
  48px/96px PNG plus SVG source) for the Zotero add-ons list.

## 🐛 修复 / Fixed

- **进一步根治「标签挤在同一行」 / Further eliminated the flow-layout regression**
  - 新增「元素链」方式定位并修补 TagList 类（从容器 render 返回的元素逐步取得），不再依赖 window.require，
    布局补丁在标签选择器渲染时必然生效。The TagList class is now located via the rendered element
    chain, so the layout patch applies reliably without window.require.
  - 新增启动自愈机制：窗口加载后自动重注入排序栏、重新应用排序与单列布局；并已改为「早停」——
    确认生效后立即停止，启动开销可忽略。Added a startup self-heal that re-applies sorting/layout
    and now stops early once confirmed, keeping startup overhead negligible.
  - 新增诊断日志，便于定位补丁是否生效。Added diagnostic logging for the patch status.

## ✨ 既有功能（不变）/ Existing features (unchanged)

- 排序下拉菜单：按添加时间 / 首字母 / 名称长度排序，每种双向，实时生效并持久保存。
  Sort dropdown: added time / name / length, each bidirectional, persisted.
- 「取消选择」按钮：一键清除所有已勾选标签，无选择时自动置灰。
  "Clear selection" button, grayed out when nothing is selected.
- 标签线框、表格化单列布局、深色模式适配、保留原生筛选。
  Tag wireframes, single-column layout, dark-mode support, native filtering preserved.
- 排序栏两个圆角矩形框等宽、文字居中，排序按钮使用上下箭头图标。
  Equal-width rounded boxes with centered text; sort button uses an up/down-arrow icon.

## 📦 安装 / Installation

1. 在下方 Assets 下载 `zotero-tag-sort.xpi`。Download `zotero-tag-sort.xpi` from the Assets below.
2. Zotero → 工具 → 插件（Add-ons）→ 右上角齿轮 → 「从文件安装附加组件…」→ 选择 `.xpi`。
   In Zotero: Tools → Add-ons → gear icon → “Install Add-on From File…” and pick the `.xpi`.

Zotero 会自动替换旧版本，已保存的排序偏好保持不变。
Zotero will replace the old version automatically; your saved sort preference is kept.

## ✅ 兼容性 / Compatibility

- Zotero 7.0 – 11.x
- Windows / macOS / Linux
- 500+ 标签保持流畅 / Smooth with 500+ tags

## 🔗 链接 / Links

- 源码 / Source：https://github.com/zhongrubo/zotero-tag-sort
- 更新日志 / Changelog：[CHANGELOG](https://github.com/zhongrubo/zotero-tag-sort/blob/main/CHANGELOG.md)
- 许可证 / License：[AGPL-3.0](https://github.com/zhongrubo/zotero-tag-sort/blob/main/LICENSE)
