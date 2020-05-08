// Copyright (c) 2020 Ruby Allison Rose (aka. M3TIOR)
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


// External Imports
import { CompositeDisposable } from 'atom';
import _eval from 'eval';

// Internal Imports
import Chooser from './ui/chooser.svelte';
import SveltePlug from './ui/svelte-plug';
import basicResolver from './basic-resolver';

// Standard Imports
import path from 'path';
import fs from 'fs';



function openSingle(file) {
	atom.workspace.open(file);
}

function resolverPathPair(p) {
	const target = path.join(p, ".supplements.js");
	// First access check's whether or not we have a resolver to parse.
	try { fs.accessSync(target); } catch (e) { return [p, null]; }
	try {
		// Doesn't need executable perms. We're going to _eval it.
		fs.accessSync(target, fs.constants.R_OK);
	}
	catch (e) {
		// TODO: warn users that we couldn't read their resolver because
		//   of file permission issues. (This is extremely usefull.)
		//atom.notifications.addWarning();
	}

	// Encoding coerces readFileSync's return value into a string for _eval.
	const contents = fs.readFileSync(target, { encoding: "utf8" });
	const resolver = _eval(contents, target, {__dirname: p});
	if (typeof resolver !== "function") {
		// TODO: let users know their resolver's export was malformed.
		return [p, null];
	}

	return [p, resolver];
}

function backpropagateResolvers(entries) {
	console.log("Backpropagating resolvers.");
	// directory tree descent is easily solved using path lengths
	if ( entries.length > 1 ){
		// Sorting can only be done on arrays with more than one element.
		// otherwise it throws an unprocessable entity error.
		entries.sort(([kA, vA], [kB, vB]) => (kA.length < kB.length) ? 1:-1);
	}

	// back-propagate ancestor's resolvers to their children.
	entries = entries.map(([key, value], current, a) => {
		// if value is not null, we skip backpropagation.
		if (value == null){
			for (let i = current+1; i < a.length; i++){
				let [ancestorKey, ancestorValue] = a[i];
				if (key.startsWith(ancestorKey) && ancestorValue != null){
					return [key, ancestorValue];
				}
			}

			// if we have no ancestors to inherit from, use the default
			return [key, basicResolver];
		}
	});

	return entries;
}

export default {
	subscriptions: null,
	resolverMap: null,
	modalComponent: null,
	ui: null,

	activate(state) {
		console.info("Initializing M3TIOR's Supplement Resolver");
		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable();

		console.info("Initializing a Svelte-Atom plugin for the Chooser UI element.");
		this.modalComponent = new SveltePlug(Chooser, {
			props: { onSelection: openSingle },
		});

		// Create root UI query element
		// https://flight-manual.atom.io/api/v1.45.0/Workspace/#instance-addModalPanel
		console.info("Initializing UI Modal Panel");
		// NOTE: undocumented API change in Atom. This method now returns a Panel
		//   instance which no longer has the accessor class .isVisible();
		//   moving onward I'm assuming that's taken care of via a getter and
		//   a setter.
		//
		// NOTE: The previous assertion is wrong. When passing in an item to the
		//   addModalPanel() function, it must be a DOM object, otherwise the
		//   output of it isn't a Panel. The behavior is "undefined". I really
		//   wish the Atom devs would have been nice enough to add an error when
		//   the input item type isn't supported. At the very least the
		//   documentation could reflect the behavior! But currently it doesn't!
		this.ui = atom.workspace.addModalPanel({ // eslint-disable-line
			item: this.modalComponent.getElement(),
			visible: false,
			autoFocus: false,
		});

		// Wire up the dialog close method in our Svelte UI
		this.modalComponent.svelte.$set({closeDialog: () => this.ui.hide()});

		console.info("Initializing startup Resolver list.");
		const initialResolverPairs = atom.project.getPaths().map(resolverPathPair); // eslint-disable-line
		// Map ordering is done within backpropagation.
		this.resolverMap = new Map(backpropagateResolvers(initialResolverPairs));

		console.info("Registering event Subscriptions.");
		this.subscriptions.add(atom.project.onDidChangePaths((roots) => { // eslint-disable-line
			// Arrays have faster operations, more helpful API.
			let entries = [...this.resolverMap.entries()];
			// Filter out paths that may have been removed.
			entries = entries.filter(([key, value]) => roots.includes(key));

			// Add new paths check if they contiain new resolvers
			const oldKeys = entries.map(([key, value]) => key);
			let newEntries = roots
				.filter(r => ! oldKeys.includes(r))
				.map(resolverPathPair);

			// Append in new entries.
			entries = entries.concat(newEntries);

			this.resolverMap = new Map(backpropagateResolvers(entries));
		}));

		// Register command that toggles this view
		this.subscriptions.add(atom.commands.add('atom-workspace', { //eslint-disable-line
			// NOTE: Something about how V8 interprets lambda functions makes
			//   the following suitable for calling "this" on the parent object.
			//   Using "this.chooser" without the lambda wrapper breaks
			//   the "this" accessor in the "this.chooser" function when it's called.
			'm3tior-supplement-resolver:choose': () => this.chooser(),
			'm3tior-supplement-resolver:openAll': () => this.openAll(),
		}));

		console.info("Initialization of M3TIOR's Supplement Resolver Completed!");
		console.log(this);
	},

	deactivate() {
		console.info("Deactivating M3TIOR's Supplement Resolver.");
		this.subscriptions.dispose();
		this.modalComponent.destroy();
		this.ui.remove();
	},

	serialize() {
		console.info("Atom is trying to serialize our running state.");
		return {}; // Nothing to be serialized here.
	},

	openAll() {
		this.runResolver().forEach((filename) => openSingle(filename));
	},

	runResolver() {
		console.info("Attempting to find and run file resolver.");
		const editor = atom.workspace.getActiveTextEditor(); // eslint-disable-line
		const grammar = editor.getGrammar();
		const target = editor.getPath();

		let key = null;
		for (let resolverLocation of this.resolverMap.keys())
			if (target.startsWith(key = resolverLocation)) break;

		// NOTE: Don't try and inline this like I did. It obfuscates errors...
		const resolve = this.resolverMap.get(key);
		/**
		 * XXX: This is a hack. Grammar.fileTypes is not a part of the
		 *   Atom public API and is subject to change at any time. So
		 *   this may require a lot of maintenance. I wanted to offer it
		 *   as a feature just so there's less for the resolver writers to do.
		 */
		return resolve(target, grammar.fileTypes);
	},


	chooser() {
		console.info("Attempting to open the file chooser.");
		if (this.ui.isVisible() === false) {
			const results = this.runResolver();

			if (results.length < 1){
				atom.notifications.addInfo("Could not find supplements to this file.", {})
				return;
			}

			this.modalComponent.svelte.$set({
				filenames: results,
			});

			this.ui.show();
		}
	},
};
