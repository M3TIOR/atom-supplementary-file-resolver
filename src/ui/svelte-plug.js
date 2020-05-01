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
//...

// Internal Imports
//...

// Standard Imports
//...

/**
 * A Svelte Component accessor class wrapper utility to make Svelte Components
 * usable by Atom via the workspace 'addModalPanel' API.
 * https://flight-manual.atom.io/api/v1.45.0/Workspace/#instance-addModalPanel
 *
 * @class
 * @param {SvelteComponent} ComponentConstructor - The constructor method
 *   exposed by the Svelte Component initializer via import or require
 *   statements.
 * @param {object} componentOptions - Options to be passed to the component
 *   constructor durring intialization.
 */
export default class SveltePlug {
	constructor(ComponentConstructor, componentOptions) {
		// Create root element (with hook for Javascript API)
		this.element = document.createElement('div');

		componentOptions = Object.assign(componentOptions || {}, {target: this.element});
		this.svelte = new ComponentConstructor(...componentOptions);
	}

	// Tear down any state and detach
	destroy() { this.element.remove(); this.svelte.$destoy(); }
	// Needed to interface with atom.workspace.addModalPanel().
	getElement() { return this.element; }
	// Accessor for svelte object just in case.
	getSvelte() { return this.svelte; }
	// Returns an object that can be retrieved when package is activated
	serialize() {}
}
