Cordova Extension
===

The Cordova extension provides support to Cordova applications within Brackets. When installed, you will
get a Cordova icon in the right hand part of Brackets. If your current application isn't detected as a 
Cordova application, it will be disabled. If it is a Cordova application, the icon will light up and you 
can click it to open a bottom panel.

The Cordova extension makes use of an already installed Cordova CLI. It will *not* install the CLI for you.
It assumes you've already downloaded SDKs, etc, and generally can do things via the CLI. The extension just
aims to make it a bit easier to use, and use from within your editors.

Current Features
===

You can install, and remove, platforms.
You can emulate platforms.
Run does not work. (I think.)

You can install, and remove, plugins.

History
===
[7/21/2014] New support for checking for a Cordova project. Addresses #3

[7/11/2014] Autoclose panel on change to non-Cordova project.

[7/11/2014] Autocomplete for plugins. First release.

[7/10/2014] Added support for add, remove plugins. You can't search yet (ie no autocomplete). Removing a plugin
doesn't handle cases where plugin X is required by Y. This will be handled.
