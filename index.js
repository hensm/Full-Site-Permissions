const { Cu } = require("chrome");
const { SitePermissions } = Cu.import("resource:///modules/SitePermissions.jsm");
const { viewFor } = require("sdk/view/core");
const { browserWindows } = require("sdk/windows");

const windowUtils = require('sdk/window/utils');


let orig;

function replace(window) {

	if (!orig) {
		orig = window.gIdentityHandler.updateSitePermissions;
	}

	window.gIdentityHandler.updateSitePermissions = function () {
		while (this._permissionList.hasChildNodes())
			this._permissionList.removeChild(this._permissionList.lastChild);

		let uri = window.gBrowser.currentURI;

		for (let permission of SitePermissions.listPermissions()) {
			let state = SitePermissions.get(uri, permission);

			/*if (state == SitePermissions.UNKNOWN)
			continue;*/

			let item = this._createPermissionItem(permission, state);
			this._permissionList.appendChild(item);
		}
	};
	console.log(window.gIdentityHandler.updateSitePermissions.toString());
}

function restore(window) {
	window.gIdentityHandler.updateSitePermissions = orig;
}


exports.main = function(options, callbacks) {
	for (let w of windowUtils.windows(null, { includePrivate: true })) {
		replace(w);
	}
	browserWindows.on("open", function(browserWindow) {
		replace(viewFor(browserWindow));
	});
}
exports.onUnload = function() {
	for (let w of windowUtils.windows(null, { includePrivate: true })) {
		restore(w);
	}
}
