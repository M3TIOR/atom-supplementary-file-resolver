'use babel';
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

//function isDecendant(path, )

async function openSingle(file) {

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
	// directory tree descent is easily solved using path lengths
	entries.sort(([kA, vA], [kB, vB]) => kA.length < kB.length ? 1:-1);

	// back-propagate ancestor's resolvers to their children.
	entries.map(([key, value], start, a) => {
		// if value is not null, we skip backpropagation.
		for (let i = start; (value === null) && (i < a.length); i++){
			let [ancestorKey, ancestorValue] = a[i];
			if (key.startsWith(ancestorKey) && ancestorValue !== null){
				return [key, ancestorValue];
			}
		}

		// if we have no ancestors to inherit from, use the default
		return [key, basicResolver];
	});

	return entries;
}

// class MockTreeFS() {
// 	constructor(paths){
// 		// Can have more than one tree when more than one root exists.
// 		this.trees = {};
// 	}
//
// 	add(p) {
// 		let currentNode = null;
// 		const parsed = path.parse(p);
//
// 		if ( ! this.trees[parsed.root] )
// 			this.trees[parsed.root] = {};
//
// 		currentNode = this.trees[parsed.root];
// 		for (let dir in parsed.dir.split(path.sep)){
// 			if (! currentNode[dir]){
// 				currentNode[dir] = {};
// 				currentNode = currentNode[dir];
// 			}
// 		}
//
// 		if (! currentNode[parsed.base]) {
// 			currentNode[parsed.base] = {};
// 		}
// 	}
//
// 	rm(p) {
// 		let currentNode = null;
// 		const parsed = path.parse(p);
//
// 		if (! currentNode = this.trees[parsed.root])
// 			return null;
//
// 		for (let dir in parsed.dir.split(path.sep)){
// 			if (! currentNode = currentNode[dir])
// 				return null;
// 		}
//
// 		if (! currentNode = currentNode[parsed.base])
// 			return null;
// 		else
// 			return currentNode;
// 	}
//
// 	open(p) {
// 		let currentNode = null;
// 		const parsed = path.parse(p);
//
// 		if (! currentNode = this.trees[parsed.root])
// 			return null;
//
// 		for (let dir in parsed.dir.split(path.sep)){
// 			if (! currentNode = currentNode[dir])
// 				return null;
// 		}
//
// 		if (! currentNode = currentNode[parsed.base])
// 			return null;
// 		else
// 			return currentNode;
// 	}
//
// 	map() {
//
// 	}
// }

export default {
	subscriptions: null,
	resolverMap: null,
	ui: null,

	activate(state) {
		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable();

		// Create root UI query element
		// https://flight-manual.atom.io/api/v1.45.0/Workspace/#instance-addModalPanel
		this.ui = atom.workspace.addModalPanel({ // eslint-disable-line
			item: new SveltePlug(Chooser, {
				props: { onSelection: openSingle },
			}),
			visible: false,
		});

		// Wire up the dialog close method in our Svelte UI
		this.ui.getElement().getSvelte().$set({closeDialog: this.ui.hide});

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

		const initialResolverPairs = atom.project.getPaths().map(resolverPathPair); // eslint-disable-line
		// Map ordering is done within backpropagation.
		this.resolverMap = new Map(backpropagateResolvers(initialResolverPairs));

		// Register command that toggles this view
		this.subscriptions.add(atom.commands.add('atom-workspace', { //eslint-disable-line
			'm3tior-supplement-resolver:choose': () => this.chooser(),
			'm3tior-supplement-resolver:openAll': () => this.openAll(),
		}));
	},

	deactivate() {
		this.subscriptions.dispose();
		this.ui.remove();
	},

	serialize() {
		return {}; // Nothing to be serialized here.
	},

	openAll() {
		this.runResolver().forEach((filename) => openSingle(filename));
	},

	runResolver() {
		const editor = atom.workspace.getActiveTextEditor(); // eslint-disable-line
		const grammar = editor.getGrammar();
		const target = editor.getPath();

		let key = null;
		for (let resolverLocation of this.resolverMap.keys())
			if (target.startsWith(key = resolverLocation)) break;

		/**
		 * XXX: This is a hack. Grammar.fileTypes is not a part of the
		 *   Atom public API and is subject to change at any time. So
		 *   this may require a lot of maintenance. I wanted to offer it
		 *   as a feature just so there's less for the resolver writers to do.
		 */
		return this.resolverMap.get(key)(target, grammar.fileTypes);
	},


	chooser() {
		if (this.ui.isVisible() === true) {
			this.ui.getElement().getSvelte().$set({
				filenames: this.runResolver(),
			});

			this.ui.show();
		}
	},
};
