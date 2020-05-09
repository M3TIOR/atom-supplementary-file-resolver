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
 * @param {function} ComponentConstructor - The constructor method
 *   exposed by the Svelte Component initializer via import or require
 *   statements.
 * @param {object} componentOptions - Options to be passed to the component
 *   constructor durring intialization.
 */
export default class SvelteCharm {
	constructor(ComponentConstructor, panelRegistrar, options) {
		// Create root element (with hook for Javascript API)
		this.element = document.createElement('div');
		this.element.className = "svelte-container";

		options = options || {};

		// NOTE: in both instances make sure the target object is options
		//   so user specified values are all squashed and overwritten by
		//   the necessary values provided here.
		const svelteOptions = Object.assign(options, {
			target: this.element,
			accessors: options.serializedPropertiesWhitelist != null,
		});
		const panelOptions = Object.assign(options, {
			// NOTE: When passing in an item to the
			//   addModalPanel() function, it must be a DOM object, otherwise the
			//   output of it isn't a Panel. The behavior is "undefined". I really
			//   wish the Atom devs would have been nice enough to add an error when
			//   the input item type isn't supported. At the very least the
			//   documentation could reflect the behavior! But currently it doesn't!
			//   (I really really want to preserve my rage for this bullshit)
			item: this.element,
		});

		// Post process state accessable variables for the Panel.
		if (options.state != null) {
			if (options.state.visible != null)
				panelOptions.visible = options.state.visible;
		}

		// It's unlike javascript developers to check for unused options in
		// an option object. So this should be possible.
		this.panel = panelRegistrar.call(atom.workspace, panelOptions);

		this.serializedPropertiesWhitelist = options.serializedPropertiesWhitelist;

		// Register all Panel functions manually since we can't inherit them.
		// https://flight-manual.atom.io/api/v1.45.0/Panel/
		this.onDidChangeVisible = this.panel.onDidChangeVisible.bind(this.panel);
		this.onDidDestoy = this.panel.onDidDestroy.bind(this.panel);
		this.getPriority = this.panel.getPriority.bind(this.panel);
		this.getItem = this.panel.getItem.bind(this.panel);
		this.isVisible = this.panel.isVisible.bind(this.panel);
		this.show = this.panel.show.bind(this.panel);
		this.hide = this.panel.hide.bind(this.panel);

		// Do property resolution for the Svelte object last so it's function
		// implementation can have access to all the Panel API functions.
		if (typeof svelteOptions.props === "function")
			svelteOptions.props = svelteOptions.props(this);

		// Handle state accessable variables for the Svelte Component
		if (options.state != null) {
			if (options.serializedPropertiesWhitelist != null) {
				const props = {};
				for (const property of options.serializedPropertiesWhitelist) {
					props[property] = options.state.props[property];
				}

				svelteOptions.props = Object.assign(svelteOptions.props || {}, props);
			}
		}

		this.svelte = new ComponentConstructor(svelteOptions);

		// Register all Svelte API functions manually since I don't know how to
		// inherit them either. https://svelte.dev/docs#Client-side_component_API
		this.$set = this.svelte.$set.bind(this.svelte);
		this.$on = this.svelte.$on.bind(this.svelte);
		// Omitting $destroy because it's handled by the "destroy" method.
	}

	// Returns an object that can be retrieved when package is activated
	serialize() {
		const charm = { visible: this.isVisible() };
		if (this.serializedPropertiesWhitelist != null){
			for (const property of this.serializedPropertiesWhitelist) {
				charm[property] = this.svelte[property];
			}
		}
		return charm;
	}

	// Tear down any state and detach
	destroy() {
		this.element.remove();
		this.svelte.$destoy();
		this.panel.destroy();
	}
}
