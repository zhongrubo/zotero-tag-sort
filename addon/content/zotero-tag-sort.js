/* Zotero Tag Sort - main logic (Zotero 7+)
 *
 * Adds a sort dropdown above the tag selector and a clean, framed,
 * table-like (single-column) layout for tag items, while preserving
 * all native tag filtering behavior.
 *
 * License: AGPL-3.0
 */

"use strict";

var ZoteroTagSort = {
	id: null,
	version: null,
	rootURI: null,
	initialized: false,

	_patched: false,
	_renderPatched: false,
	_layoutPatched: false,
	_originalRender: null,
	_originalSortTags: null,
	_originalUpdatePositions: null,
	_originalRenderTagList: null,
	_originalComponentDidMountTagList: null,
	_originalComponentDidUpdateTagList: null,
	_TagListClass: null,
	_originalRenderTagSelector: null,
	_TagSelectorClass: null,

	SORT_MODES: ["alpha-asc", "alpha-desc", "time-desc", "time-asc", "length-asc", "length-desc"],
	PREF_SORT_MODE: "extensions.zotero-tag-sort.sortMode",

	_strings: {
		zh: {
			sortTitle: "标签排序",
			sort: "排序",
			deselect: "取消选择",
			deselectTitle: "清除所有已选择的标签",
			"alpha-asc": "首字母 A → Z",
			"alpha-desc": "首字母 Z → A",
			"time-desc": "添加时间 新 → 旧",
			"time-asc": "添加时间 旧 → 新",
			"length-asc": "名称长度 短 → 长",
			"length-desc": "名称长度 长 → 短",
		},
		en: {
			sortTitle: "Sort tags",
			sort: "Sort",
			deselect: "Clear",
			deselectTitle: "Clear all selected tags",
			"alpha-asc": "Alphabetical A → Z",
			"alpha-desc": "Alphabetical Z → A",
			"time-desc": "Added time New → Old",
			"time-asc": "Added time Old → New",
			"length-asc": "Name length Short → Long",
			"length-desc": "Name length Long → Short",
		},
	},

	init({ id, version, rootURI }) {
		if (this.initialized) return;
		this.id = id;
		this.version = version;
		this.rootURI = rootURI;
		this.initialized = true;
	},

	log(msg) {
		Zotero.debug("Zotero Tag Sort: " + msg);
	},

	logError(e) {
		Zotero.debug("Zotero Tag Sort error: " + (e && e.stack ? e.stack : e));
	},

	/* ---------------- i18n ---------------- */

	getLocale() {
		let locale = "en-US";
		try {
			locale = Zotero.locale
				|| (Services.locale && Services.locale.appLocaleAsBCP47)
				|| "en-US";
		}
		catch (e) {}
		return String(locale).toLowerCase().indexOf("zh") === 0 ? "zh" : "en";
	},

	t(key) {
		const lang = this.getLocale();
		return (this._strings[lang] && this._strings[lang][key]) || this._strings.en[key] || key;
	},

	/* ---------------- prefs ---------------- */

	getSortMode() {
		let mode = "alpha-asc";
		try {
			mode = Zotero.Prefs.get(this.PREF_SORT_MODE, true);
		}
		catch (e) {}
		return this.SORT_MODES.indexOf(mode) !== -1 ? mode : "alpha-asc";
	},

	setSortMode(mode) {
		if (this.SORT_MODES.indexOf(mode) === -1) return;
		try {
			// The "true" (global) flag uses the pref name verbatim, matching the
			// "extensions.zotero-tag-sort.*" name declared in prefs.js.
			Zotero.Prefs.set(this.PREF_SORT_MODE, mode, true);
		}
		catch (e) {
			this.logError(e);
		}
	},

	isTableLayoutEnabled() {
		try {
			return Zotero.Prefs.get("extensions.zotero-tag-sort.enableTableLayout", true) !== false;
		}
		catch (e) {
			return true;
		}
	},

	/* ---------------- window management ---------------- */

	addToAllWindows() {
		for (const win of Zotero.getMainWindows()) {
			if (!win.ZoteroPane) continue;
			this.addToWindow(win);
		}
	},

	removeFromAllWindows() {
		for (const win of Zotero.getMainWindows()) {
			this.removeFromWindow(win);
		}
	},

	addToWindow(window) {
		try {
			const doc = window && window.document;
			if (!doc || !doc.getElementById("zotero-tag-selector")) {
				// The document may not be ready yet — retry a few times.
				const n = (window.__zoteroTagSortAddAttempts || 0) + 1;
				window.__zoteroTagSortAddAttempts = n;
				if (n <= 20) {
					setTimeout(() => this.addToWindow(window), 300);
				}
				return;
			}
			this.injectStylesheet(doc);
			this.injectSortBar(window);
			this.ensurePatched(window, 0);
			this.startSelfHeal(window);
		}
		catch (e) {
			this.logError(e);
		}
	},

	// Periodic "self-heal" for the first ~15s after the window loads: re-inject
	// the sort bar if it vanished and re-apply sorting/layout, so the plugin
	// recovers from any startup timing race automatically.
	startSelfHeal(window) {
		if (window.__zoteroTagSortHealing) return;
		window.__zoteroTagSortHealing = true;
		let count = 0;
		let applied = false;
		const timer = window.setInterval(() => {
			count++;
			try {
				this.injectSortBar(window);
				this.applySort(window);
				if (this.forceLayoutRecompute(window)) {
					applied = true;
				}
			}
			catch (e) {}
			const doc = window.document;
			const barPresent = !!(doc && doc.getElementById("zotero-tag-sort-bar"));
			// Per-window check: the render patch must be applied to THIS window's
			// freshly-created TagSelector class (module-level flags are unreliable
			// across window reopen).
			const Z = window.Zotero;
			const renderPatched = !!(Z && Z.TagSelector && Z.TagSelector.prototype
				&& Z.TagSelector.prototype.__zoteroTagSortRenderPatched);
			// Early-stop as soon as everything is confirmed working, so the
			// startup helper adds only a few light ticks instead of running the
			// full 15 seconds.
			if (renderPatched && barPresent && applied) {
				window.clearInterval(timer);
			}
			else if (count >= 15) {
				window.clearInterval(timer);
			}
		}, 1000);
	},

	removeFromWindow(window) {
		try {
			const doc = window && window.document;
			if (!doc) return;
			const container = doc.getElementById("zotero-tag-selector");
			if (container && container.__zoteroTagSortObserver) {
				container.__zoteroTagSortObserver.disconnect();
				delete container.__zoteroTagSortObserver;
			}
			if (container && container.__zoteroTagSortSelectionObserver) {
				container.__zoteroTagSortSelectionObserver.disconnect();
				delete container.__zoteroTagSortSelectionObserver;
			}
			for (const id of ["zotero-tag-sort-bar", "zotero-tag-sort-menu", "zotero-tag-sort-stylesheet"]) {
				const el = doc.getElementById(id);
				if (el) el.remove();
			}
		}
		catch (e) {
			this.logError(e);
		}
	},

	destroy() {
		this.unpatchAll();
		this.removeFromAllWindows();
	},

	/* ---------------- stylesheet ---------------- */

	injectStylesheet(doc) {
		if (doc.getElementById("zotero-tag-sort-stylesheet")) return;
		const link = doc.createElement("link");
		link.id = "zotero-tag-sort-stylesheet";
		link.type = "text/css";
		link.rel = "stylesheet";
		link.href = this.rootURI + "style.css";
		doc.documentElement.appendChild(link);
	},

	/* ---------------- patching ---------------- */

	ensurePatched(window, attempt) {
		const Z = window.Zotero;
		if (Z && Z.TagSelector) {
			// Always (re-)patch when a window is opened. The tag-selector classes
			// are per-window: after closing and reopening the main window (without
			// quitting the app) they are freshly created, so stale module-level
			// flags must not skip re-patching. patchAll() is idempotent via
			// per-class prototype flags.
			this.patchAll(window);
			this.applySortSoon(window);
			return;
		}
		if (attempt < 80) {
			setTimeout(() => this.ensurePatched(window, attempt + 1), 250);
		}
		else if (this._retryLogged === undefined) {
			this._retryLogged = true;
			this.log("Zotero.TagSelector not found after retries.");
		}
	},

	patchAll(window) {
		const Z = window.Zotero;
		const cls = Z.TagSelector;
		if (!cls || !cls.prototype.render) return false;

		// 1) Sort: wrap render() and re-sort the final tag array via cloneElement.
		//    Guarded by a per-class prototype flag — tag-selector classes are
		//    re-created for each window, so this re-applies automatically when a
		//    new window is opened.
		if (!cls.prototype.__zoteroTagSortRenderPatched) {
			const React = this.getReact(window);
			if (React && typeof React.cloneElement === "function") {
				this._originalRender = cls.prototype.render;
				const self = this;
				cls.prototype.render = function () {
					const el = self._originalRender.call(this);
					try {
						// Layout: locate and patch the TagList class through the rendered
						// element chain (el.type is the presentational TagSelector class),
						// which does not depend on window.require being available.
						if (el && el.type) {
							self.ensureLayoutPatchedFromElement(el.type);
						}
						const mode = self.getSortMode();
						if (el && el.props && Array.isArray(el.props.tags) && el.props.tags.length > 1) {
							const sorted = self.sortTags(el.props.tags, mode);
							return React.cloneElement(el, { tags: sorted });
						}
					}
					catch (e) {
						self.logError(e);
					}
					return el;
				};
				cls.prototype.__zoteroTagSortRenderPatched = true;
				this.log("Render (sort) patch applied via React.cloneElement");
			}
			else {
				this.log("React unavailable; using degraded sort patch");
				this.patchSortTagsFallback(cls);
				cls.prototype.__zoteroTagSortRenderPatched = true;
			}
		}

		// 2) Layout: force a single-column, left-aligned, full-width list.
		if (this.isTableLayoutEnabled()) {
			try {
				const req = this.getRequire(window);
				let TagList = null;
				if (req) {
					for (const id of ["components/tagSelector/tagSelectorList.js", "components/tagSelector/tagSelectorList"]) {
						try {
							TagList = req(id);
							if (TagList) break;
						}
						catch (e) {}
					}
				}
				if (TagList && TagList.prototype
						&& TagList.prototype.render
						&& !TagList.prototype.__zoteroTagSortLayoutPatched) {
					this._TagListClass = TagList;
					this._originalUpdatePositions = TagList.prototype.updatePositions;
					this._originalRenderTagList = TagList.prototype.render;
					this._originalComponentDidMountTagList = TagList.prototype.componentDidMount;
					this._originalComponentDidUpdateTagList = TagList.prototype.componentDidUpdate;
					this.applyLayoutPatch(TagList);
					TagList.prototype.__zoteroTagSortLayoutPatched = true;
					this.log("Layout patch applied via require");
				}
			}
			catch (e) {
				this.logError(e);
			}
		}

		return true;
	},

	patchSortTagsFallback(cls) {
		if (!cls.prototype.sortTags) return;
		this._originalSortTags = cls.prototype.sortTags;
		const self = this;
		cls.prototype.sortTags = function (tags) {
			const mode = self.getSortMode();
			self.sortTagsInPlace(tags, mode);
		};
	},

	applyLayoutPatch(TagList) {
		const originalRender = TagList.prototype.render;
		const originalComponentDidMount = TagList.prototype.componentDidMount;
		const originalComponentDidUpdate = TagList.prototype.componentDidUpdate;

		// 1) Vertical positions. Kept so that the native size/position getter and
		//    renderTag's truncation logic still see correct values.
		TagList.prototype.updatePositions = function () {
			const tagPaddingTop = this.props.uiDensity === "comfortable" ? 2 : 1;
			const tagPaddingBottom = tagPaddingTop;

			let scrollbarWidth = 12;
			try {
				scrollbarWidth = Math.max(Zotero.Utilities.Internal.getScrollbarWidth(), 6);
			}
			catch (e) {}
			this.scrollbarWidth = scrollbarWidth;

			const panePaddingTop = 9;
			const panePaddingLeft = 8;
			const tagSpaceBetweenY = 2;
			const rowHeight = tagPaddingTop + this.props.lineHeight + tagPaddingBottom + tagSpaceBetweenY;

			const positions = [];
			for (let i = 0; i < this.props.tags.length; i++) {
				positions[i] = [panePaddingLeft, panePaddingTop + i * rowHeight];
			}
			this.positions = positions;
		};

		// 2) Override the instance size/position getter so every cell is ALWAYS
		//    laid out in a single left-aligned column at full row width. It does
		//    not depend on this.positions, so it works even if the native flow
		//    layout previously computed (and react-virtualized cached) flow
		//    positions.
		TagList.prototype.render = function () {
			const inst = this;
			inst.cellSizeAndPositionGetter = ({ index }) => {
				const tagPaddingTopBottom = inst.props.uiDensity === "comfortable" ? 2 : 1;
				const panePaddingTop = 9;
				const panePaddingLeft = 8;
				const tagSpaceBetweenY = 2;
				const lineHeight = Number.isFinite(inst.props.lineHeight) ? inst.props.lineHeight : 15;
				const rowHeight = tagPaddingTopBottom + lineHeight + tagPaddingTopBottom + tagSpaceBetweenY;

				let scrollbarWidth = 12;
				try {
					scrollbarWidth = Math.max(Zotero.Utilities.Internal.getScrollbarWidth(), 6);
				}
				catch (e) {}
				inst.scrollbarWidth = scrollbarWidth;

				const paneWidth = Number.isFinite(inst.props.width) ? inst.props.width : 200;
				const rowWidth = Math.max(paneWidth - 18 - scrollbarWidth, 50);

				return {
					width: rowWidth,
					height: lineHeight + 2 * tagPaddingTopBottom,
					x: panePaddingLeft,
					y: panePaddingTop + index * rowHeight
				};
			};
			return originalRender.call(this);
		};

		// 3) Force the Collection to refresh its cached cell positions on every
		//    update. react-virtualized's Collection caches cell metadata and only
		//    re-reads the size/position getter when the cell count changes or
		//    when recomputeCellSizesAndPositions() is called. Without this, the
		//    tag list can stay stuck in the native flow layout (tags squeezed
		//    side by side) after the plugin loads.
		TagList.prototype.componentDidUpdate = function (prevProps, prevState, snapshot) {
			if (originalComponentDidUpdate) {
				originalComponentDidUpdate.call(this, prevProps, prevState, snapshot);
			}
			if (this.collectionRef && this.collectionRef.current
					&& typeof this.collectionRef.current.recomputeCellSizesAndPositions === "function") {
				try {
					this.collectionRef.current.recomputeCellSizesAndPositions();
				}
				catch (e) {}
			}
		};

		// 4) On every fresh mount, force the Collection to recompute positions
		//    right away, so a tag selector that first rendered with the native
		//    flow layout switches to the single-column layout immediately.
		TagList.prototype.componentDidMount = function () {
			if (originalComponentDidMount) {
				originalComponentDidMount.call(this);
			}
			if (this.collectionRef && this.collectionRef.current
					&& typeof this.collectionRef.current.recomputeCellSizesAndPositions === "function") {
				try {
					this.collectionRef.current.recomputeCellSizesAndPositions();
				}
				catch (e) {}
			}
		};
	},

	// Fallback that locates the TagList class WITHOUT window.require, by walking
	// the rendered element chain: the container render returns <TagSelector>,
	// whose type is the TagSelector class; TagSelector.render() returns <TagList>,
	// whose type is the TagList class we need to patch. This guarantees the
	// layout patch applies on any Zotero build where the tag selector renders.
	ensureLayoutPatchedFromElement(TagSelectorClass) {
		if (!this.isTableLayoutEnabled()) return;
		if (!TagSelectorClass || !TagSelectorClass.prototype
				|| typeof TagSelectorClass.prototype.render !== "function"
				|| TagSelectorClass.prototype.__zoteroTagSortSelectorPatched) {
			return;
		}
		TagSelectorClass.prototype.__zoteroTagSortSelectorPatched = true;
		const origSelRender = TagSelectorClass.prototype.render;
		this._TagSelectorClass = TagSelectorClass;
		this._originalRenderTagSelector = origSelRender;
		const self = this;
		TagSelectorClass.prototype.render = function () {
			const selEl = origSelRender.call(this);
			const TagListClass = selEl && selEl.type;
			if (TagListClass && TagListClass.prototype
					&& typeof TagListClass.prototype.render === "function"
					&& !TagListClass.prototype.__zoteroTagSortLayoutPatched) {
				try {
					self._TagListClass = TagListClass;
					self._originalUpdatePositions = TagListClass.prototype.updatePositions;
					self._originalRenderTagList = TagListClass.prototype.render;
					self._originalComponentDidMountTagList = TagListClass.prototype.componentDidMount;
					self._originalComponentDidUpdateTagList = TagListClass.prototype.componentDidUpdate;
					self.applyLayoutPatch(TagListClass);
					TagListClass.prototype.__zoteroTagSortLayoutPatched = true;
					self.log("Layout patch applied via element chain");
				}
				catch (e) {
					self.logError(e);
				}
			}
			return selEl;
		};
	},

	unpatchAll() {
		try {
			const Z = Zotero;
			if (Z && Z.TagSelector) {
				if (this._originalRender && Z.TagSelector.prototype.render !== this._originalRender) {
					Z.TagSelector.prototype.render = this._originalRender;
				}
				if (this._originalSortTags && Z.TagSelector.prototype.sortTags !== this._originalSortTags) {
					Z.TagSelector.prototype.sortTags = this._originalSortTags;
				}
			}
			if (this._TagListClass) {
				if (this._originalUpdatePositions) {
					this._TagListClass.prototype.updatePositions = this._originalUpdatePositions;
				}
				if (this._originalRenderTagList) {
					this._TagListClass.prototype.render = this._originalRenderTagList;
				}
				if (this._originalComponentDidMountTagList) {
					this._TagListClass.prototype.componentDidMount = this._originalComponentDidMountTagList;
				}
				if (this._originalComponentDidUpdateTagList) {
					this._TagListClass.prototype.componentDidUpdate = this._originalComponentDidUpdateTagList;
				}
			}
			if (this._TagSelectorClass && this._originalRenderTagSelector
					&& this._TagSelectorClass.prototype.render !== this._originalRenderTagSelector) {
				this._TagSelectorClass.prototype.render = this._originalRenderTagSelector;
			}
		}
		catch (e) {
			this.logError(e);
		}
		this._originalRender = null;
		this._originalSortTags = null;
		this._originalUpdatePositions = null;
		this._originalRenderTagList = null;
		this._originalComponentDidMountTagList = null;
		this._originalComponentDidUpdateTagList = null;
		this._TagListClass = null;
		this._originalRenderTagSelector = null;
		this._TagSelectorClass = null;
		this._renderPatched = false;
		this._layoutPatched = false;
		this._patched = false;
	},

	/* ---------------- react/require helpers ---------------- */

	getRequire(window) {
		try {
			if (window.require) return window.require;
		}
		catch (e) {}
		try {
			if (window.wrappedJSObject && window.wrappedJSObject.require) return window.wrappedJSObject.require;
		}
		catch (e) {}
		return null;
	},

	getReact(window) {
		try {
			const req = this.getRequire(window);
			if (req) return req("react");
		}
		catch (e) {}
		try {
			if (window.React) return window.React;
		}
		catch (e) {}
		return null;
	},

	/* ---------------- sorting ---------------- */

	// Sort the final rendered tag objects ({name, color, ...}).
	sortTags(tags, mode) {
		if (!tags || tags.length < 2) return tags;
		const arr = tags.slice();
		arr.sort(this._comparator(mode, (t) => t.name));
		return arr;
	},

	// In-place sort for the degraded fallback ({tag, ...}).
	sortTagsInPlace(tags, mode) {
		if (!tags || tags.length < 2) return;
		tags.sort(this._comparator(mode, (t) => t.tag));
	},

	_comparator(mode, getName) {
		const collation = (Zotero.Intl && Zotero.Intl.collation) || null;
		const alpha = (a, b) => {
			if (collation) {
				try {
					return collation.compareString(1, a, b);
				}
				catch (e) {}
			}
			return a.localeCompare(b);
		};
		const len = (s) => {
			try {
				return Array.from(s).length;
			}
			catch (e) {
				return String(s).length;
			}
		};
		const tagIDs = new Map();
		const getID = (name) => {
			let id = tagIDs.get(name);
			if (id === undefined) {
				try {
					id = Zotero.Tags.getID(name) || 0;
				}
				catch (e) {
					id = 0;
				}
				tagIDs.set(name, id);
			}
			return id;
		};

		return (x, y) => {
			const a = getName(x);
			const b = getName(y);
			switch (mode) {
				case "time-desc":
					return (getID(b) - getID(a)) || alpha(a, b);
				case "time-asc":
					return (getID(a) - getID(b)) || alpha(a, b);
				case "alpha-desc":
					return alpha(b, a);
				case "length-asc":
					return (len(a) - len(b)) || alpha(a, b);
				case "length-desc":
					return (len(b) - len(a)) || alpha(a, b);
				case "alpha-asc":
				default:
					return alpha(a, b);
			}
		};
	},

	/* ---------------- sort UI ---------------- */

	injectSortBar(window) {
		const doc = window.document;
		const container = doc.getElementById("zotero-tag-selector");
		if (!container) return;

		let menu = doc.getElementById("zotero-tag-sort-menu");
		if (!menu) {
			menu = this.createSortMenu(doc, window);
			const popupset = doc.querySelector("popupset") || doc.documentElement;
			popupset.appendChild(menu);
		}

		let bar = doc.getElementById("zotero-tag-sort-bar");
		if (!bar || bar.parentNode !== container) {
			bar = this.createSortBar(doc, window);
			container.insertBefore(bar, container.firstChild);
		}
		this.updateSortButtonLabel(doc);
		this.updateDeselectButton(window);
		container.classList.toggle("zotero-tag-sort-table", this.isTableLayoutEnabled());

		// Detect tag-selector re-mounts (childList changes on the container).
		if (!container.__zoteroTagSortObserver) {
			const obs = new window.MutationObserver(() => {
				this.injectSortBar(window);
				this.applySort(window);
			});
			obs.observe(container, { childList: true });
			container.__zoteroTagSortObserver = obs;
		}

		// Keep the deselect button's enabled state in sync with the tag selection
		// (class changes on .tag-selector-item when a tag is checked/unchecked).
		if (!container.__zoteroTagSortSelectionObserver) {
			const obs = new window.MutationObserver((mutations) => {
				for (const m of mutations) {
					if (m.type === "attributes" && m.attributeName === "class") {
						this.updateDeselectButton(window);
						break;
					}
				}
			});
			obs.observe(container, { subtree: true, attributes: true, attributeFilter: ["class"] });
			container.__zoteroTagSortSelectionObserver = obs;
		}
	},

	createSortBar(doc, window) {
		const bar = doc.createElement("div");
		bar.id = "zotero-tag-sort-bar";
		bar.className = "tag-selector-sort-bar";

		const btn = doc.createElement("button");
		btn.id = "zotero-tag-sort-button";
		btn.className = "tag-selector-sort-button";
		btn.type = "button";
		btn.title = this.t("sortTitle");

		// Sorting-shaped icon (up/down chevrons), rendered as inline SVG so it
		// looks identical on Windows / macOS / Linux.
		const icon = this.createSortIcon(doc);

		const label = doc.createElement("span");
		label.id = "zotero-tag-sort-label";
		label.className = "tag-selector-sort-label";

		btn.appendChild(icon);
		btn.appendChild(label);

		btn.addEventListener("click", (ev) => {
			ev.preventDefault();
			ev.stopPropagation();
			const menu = doc.getElementById("zotero-tag-sort-menu");
			if (menu) {
				this.updateSortMenuChecked(doc);
				menu.openPopup(btn, "after_end", 0, 0, false, true);
			}
		});

		bar.appendChild(btn);

		// "Cancel selection" (clear all selected tags) button on the right side
		// of the same row as the sort dropdown.
		const deselectBtn = this.createDeselectButton(doc, window);
		bar.appendChild(deselectBtn);

		return bar;
	},

	createSortIcon(doc) {
		const NS = "http://www.w3.org/2000/svg";
		const svg = doc.createElementNS(NS, "svg");
		svg.setAttribute("class", "tag-selector-sort-icon");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("width", "14");
		svg.setAttribute("height", "14");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", "currentColor");
		svg.setAttribute("stroke-width", "2");
		svg.setAttribute("stroke-linecap", "round");
		svg.setAttribute("stroke-linejoin", "round");
		svg.setAttribute("aria-hidden", "true");
		const up = doc.createElementNS(NS, "path");
		up.setAttribute("d", "m7 9 5-5 5 5");
		const down = doc.createElementNS(NS, "path");
		down.setAttribute("d", "m7 15 5 5 5-5");
		svg.appendChild(up);
		svg.appendChild(down);
		return svg;
	},

	createDeselectButton(doc, window) {
		const btn = doc.createElement("button");
		btn.id = "zotero-tag-sort-deselect-button";
		btn.className = "tag-selector-deselect-button";
		btn.type = "button";
		btn.title = this.t("deselectTitle");
		btn.disabled = true;

		const icon = doc.createElement("span");
		icon.className = "tag-selector-deselect-icon";
		icon.textContent = "✕";

		const label = doc.createElement("span");
		label.className = "tag-selector-deselect-label";
		label.textContent = this.t("deselect");

		btn.appendChild(icon);
		btn.appendChild(label);

		btn.addEventListener("click", (ev) => {
			ev.preventDefault();
			ev.stopPropagation();
			this.deselectAll(window);
		});

		return btn;
	},

	deselectAll(window) {
		try {
			const tagSelector = this.getTagSelectorInstance(window);
			if (tagSelector && typeof tagSelector.deselectAll === "function") {
				tagSelector.deselectAll();
			}
			this.updateDeselectButton(window);
		}
		catch (e) {
			this.logError(e);
		}
	},

	updateDeselectButton(window) {
		try {
			const doc = window.document;
			const btn = doc.getElementById("zotero-tag-sort-deselect-button");
			if (!btn) return;
			let hasSelection = false;
			const tagSelector = this.getTagSelectorInstance(window);
			if (tagSelector) {
				if (typeof tagSelector.getTagSelection === "function") {
					const sel = tagSelector.getTagSelection();
					hasSelection = !!sel && sel.size > 0;
				}
				else if (tagSelector.selectedTags) {
					hasSelection = tagSelector.selectedTags.size > 0;
				}
			}
			btn.disabled = !hasSelection;
		}
		catch (e) {}
	},

	createSortMenu(doc, window) {
		const menu = doc.createXULElement("menupopup");
		menu.id = "zotero-tag-sort-menu";
		menu.setAttribute("position", "after_end");

		const groups = [
			["alpha-asc", "alpha-desc"],
			["time-desc", "time-asc"],
			["length-asc", "length-desc"],
		];

		for (let gi = 0; gi < groups.length; gi++) {
			if (gi > 0) {
				menu.appendChild(doc.createXULElement("menuseparator"));
			}
			for (const mode of groups[gi]) {
				const item = doc.createXULElement("menuitem");
				item.id = "zotero-tag-sort-" + mode;
				item.setAttribute("type", "radio");
				item.setAttribute("name", "zotero-tag-sort");
				item.setAttribute("label", this.t(mode));
				item.setAttribute("value", mode);
				item.addEventListener("command", () => {
					this.setSortMode(mode);
					this.updateSortButtonLabel(doc);
					this.applySort(window);
				});
				menu.appendChild(item);
			}
		}

		return menu;
	},

	updateSortButtonLabel(doc) {
		const label = doc.getElementById("zotero-tag-sort-label");
		const btn = doc.getElementById("zotero-tag-sort-button");
		if (label) {
			label.textContent = this.t("sort");
		}
		if (btn) {
			const mode = this.getSortMode();
			btn.title = this.t("sortTitle") + "：" + this.t(mode);
		}
	},

	updateSortMenuChecked(doc) {
		const mode = this.getSortMode();
		for (const m of this.SORT_MODES) {
			const item = doc.getElementById("zotero-tag-sort-" + m);
			if (!item) continue;
			if (m === mode) {
				item.setAttribute("checked", "true");
			}
			else {
				item.removeAttribute("checked");
			}
		}
	},

	getTagSelectorInstance(window) {
		let tagSelector = window.ZoteroPane && window.ZoteroPane.tagSelector;
		if (!tagSelector && window.ZoteroPane_Local) {
			tagSelector = window.ZoteroPane_Local.tagSelector;
		}
		if (!tagSelector) {
			tagSelector = this.findContainerInstance(window);
		}
		return tagSelector;
	},

	// Fallback: locate the tag-selector React component instance by walking the
	// fiber tree attached to the #zotero-tag-selector DOM container. This does
	// not depend on window.ZoteroPane being available.
	findContainerInstance(window) {
		try {
			const doc = window.document;
			const rootEl = doc.getElementById("zotero-tag-selector");
			if (!rootEl) return null;
			for (const key of Object.keys(rootEl)) {
				if (key.indexOf("__reactContainer$") === 0 || key.indexOf("__reactFiber$") === 0) {
					const queue = [rootEl[key]];
					while (queue.length) {
						const f = queue.shift();
						if (!f) continue;
						const st = f.stateNode;
						if (st && typeof st === "object"
								&& typeof st.getTagSelection === "function"
								&& typeof st.forceUpdate === "function") {
							return st;
						}
						if (f.child) queue.push(f.child);
						if (f.sibling) queue.push(f.sibling);
					}
				}
			}
		}
		catch (e) {}
		return null;
	},

	// Directly force the virtualized Collection to re-read the size/position
	// getter. This works even when the tag selector is idle (no React
	// re-render), so the single-column layout can never stay stuck in the
	// native flow layout (tags squeezed side by side).
	forceLayoutRecompute(window) {
		try {
			const inst = this.getTagSelectorInstance(window);
			if (inst && inst.tagListRef && inst.tagListRef.current
					&& inst.tagListRef.current.collectionRef
					&& inst.tagListRef.current.collectionRef.current) {
				const coll = inst.tagListRef.current.collectionRef.current;
				if (typeof coll.recomputeCellSizesAndPositions === "function") {
					coll.recomputeCellSizesAndPositions();
					return true;
				}
			}
		}
		catch (e) {}
		return false;
	},

	applySort(window) {
		try {
			const tagSelector = this.getTagSelectorInstance(window);
			if (tagSelector && typeof tagSelector.forceUpdate === "function") {
				tagSelector.forceUpdate();
			}
			this.forceLayoutRecompute(window);
		}
		catch (e) {
			this.logError(e);
		}
	},

	applySortSoon(window) {
		// Retry over a longer window: the tag-selector instance may still be
		// initializing when the plugin patches the classes.
		for (let i = 0; i < 20; i++) {
			setTimeout(() => {
				this.applySort(window);
				this.forceLayoutRecompute(window);
			}, i * 500);
		}
	},
};
