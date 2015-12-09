const { Cu } = require("chrome");
const { viewFor } = require("sdk/view/core");
const { browserWindows } = require("sdk/windows");
const { SitePermissions } = Cu.import("resource:///modules/SitePermissions.jsm");

let orig;

function replace(browserWindow) {
	console.log(browserWindow);
	let xulWindow = viewFor(browserWindow).window;

	if (!orig) {
		orig = xulWindow.gIdentityHandler.updateSitePermissions;
	}

	xulWindow.gIdentityHandler.updateSitePermissions = function () {
		while (this._permissionList.hasChildNodes())
			this._permissionList.removeChild(this._permissionList.lastChild);

		let uri = xulWindow.gBrowser.currentURI;

		for (let permission of SitePermissions.listPermissions()) {
			let state = SitePermissions.get(uri, permission);

			/*if (state == SitePermissions.UNKNOWN)
			continue;*/

			let item = this._createPermissionItem(permission, state);
			this._permissionList.appendChild(item);
		}
	};
}

function restore(browserWindow) {
	let xulWindow = viewFor(browserWindow).window;

	xulWindow.gIdentityHandler.updateSitePermissions = orig;
}

browserWindows.on("open", replace);

exports.main = function(options, callbacks) {
	for (let browserWindow of browserWindows) {
		replace(browserWindow);
	}
}
exports.onUnload = function() {
	for (let browserWindow of browserWindows) {
		restore(browserWindow);
	}
}