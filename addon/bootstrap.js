/* Zotero Tag Sort - bootstrap (Zotero 7+)
 * License: AGPL-3.0
 */

var ZoteroTagSort;

function log(msg) {
	Zotero.debug("Zotero Tag Sort: " + msg);
}

function install(data, reason) {
	log("Installed (" + reason + ")");
}

async function startup({ id, version, rootURI }, reason) {
	log("Starting " + version);
	Services.scriptloader.loadSubScript(rootURI + "content/zotero-tag-sort.js");
	ZoteroTagSort.init({ id, version, rootURI });
	ZoteroTagSort.addToAllWindows();
}

function onMainWindowLoad({ window }) {
	ZoteroTagSort.addToWindow(window);
}

function onMainWindowUnload({ window }) {
	ZoteroTagSort.removeFromWindow(window);
}

function shutdown(data, reason) {
	log("Shutting down (" + reason + ")");
	if (ZoteroTagSort) {
		ZoteroTagSort.destroy();
	}
	ZoteroTagSort = undefined;
}

function uninstall(data, reason) {
	log("Uninstalled (" + reason + ")");
}
