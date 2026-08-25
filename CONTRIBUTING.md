# 贡献指南 / Contributing

感谢你考虑为 **Zotero Tag Sort** 贡献代码、文档或反馈！以下说明能帮助你快速上手。

Thanks for considering contributing to **Zotero Tag Sort**! The following notes will help you
get started.

## 报告问题 / Reporting issues

- 请先搜索已有 Issue，避免重复。Search existing issues first.
- 描述问题请包含：Zotero 版本、操作系统、复现步骤、以及 `工具 → 开发 → 查看错误日志` 中的相关报错。
  Include your Zotero version, OS, reproduction steps, and relevant errors from
  Tools → Developer → View Errors.

## 开发环境 / Development setup

```sh
# 1. 克隆仓库
git clone https://github.com/zhongrubo/zotero-tag-sort.git
cd zotero-tag-sort

# 2. 修改 addon/ 下的源码

# 3. 打包（需要 zip）
./build.sh

# 4. 在 Zotero 中安装生成的 zotero-tag-sort.xpi 进行测试
```

无需额外依赖，插件为纯 JavaScript + CSS。
No dependencies are required — the plugin is plain JavaScript + CSS.

## 项目结构 / Structure

```text
addon/
  manifest.json            # 插件清单
  bootstrap.js             # 引导入口（Zotero 7+）
  prefs.js                 # 默认偏好
  style.css                # 样式
  content/zotero-tag-sort.js  # 核心逻辑
build.sh                   # 打包脚本
```

## 核心实现 / How it works

插件通过以下方式工作：
The plugin works by:

1. 包装 `Zotero.TagSelector.prototype.render`，用 `React.cloneElement` 重排最终标签数组。
   Wrapping `Zotero.TagSelector.prototype.render` and re-sorting the final tag array via
   `React.cloneElement`.
2. 覆写 `TagList.prototype.updatePositions`，将标签列表改为单列布局。
   Overriding `TagList.prototype.updatePositions` to force a single-column layout.
3. 注入排序下拉菜单（XUL `menupopup`）与样式（CSS 设计令牌）。
   Injecting the sort dropdown (a XUL `menupopup`) and styles (CSS design tokens).

改动核心逻辑前，建议先阅读 Zotero 源码中以下文件：
Before changing core logic, read these Zotero source files:

- `chrome/content/zotero/containers/tagSelectorContainer.jsx`
- `chrome/content/zotero/components/tagSelector.jsx`
- `chrome/content/zotero/components/tagSelector/tagSelectorList.jsx`

## 测试 / Testing

建议在以下场景手动验证：
Manually verify at least these cases:

- 三种排序 × 双向，且切换文献库 / 重启 Zotero 后偏好仍保留。
  All six sort options, and the preference survives library switch / restart.
- 浅色 / 深色主题下的线框与排序条外观。
  Wireframe and sort bar appearance in light and dark themes.
- 勾选标签筛选文献（原生功能不被破坏）。
  Filtering items by checking tags still works.
- 折叠 / 展开标签栏后排序条仍在、排序仍生效。
  The sort bar reappears and sorting still applies after collapsing/expanding the tag pane.
- 500+ 标签时的流畅度。
  Smoothness with 500+ tags.

## 代码风格 / Code style

- 使用 Tab 缩进（与 Zotero 源码一致）。Use tabs for indentation (matching Zotero source).
- 中文与英文注释并存。Keep bilingual comments.
- 提交信息用简洁的英文或中文，说明「做了什么」。
  Keep commit messages concise and descriptive.

## 提交 PR / Submitting pull requests

1. Fork 本仓库并新建分支。Fork the repo and create a branch.
2. 做出改动并本地测试。Make your changes and test locally.
3. 更新 `CHANGELOG.md`。Update `CHANGELOG.md`.
4. 发起 PR，描述改动目的与测试结果。Open a PR describing the purpose and test results.

## 许可证 / License

提交即表示你同意在 [AGPL-3.0](./LICENSE) 下授权你的贡献。
By submitting, you agree to license your contribution under [AGPL-3.0](./LICENSE).