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
import { nodeResolve as resolve } from '@rollup/plugin-node-resolve';
import svelte from 'rollup-plugin-svelte';
import { uglify } from 'rollup-plugin-uglify';

// Internal Imports
//...

// Standard Imports
//...


export default {
  input: 'src/supplement-resolver.js',
  output: {
    file: 'lib/supplement-resolver.js',
    format: 'es'
  },
  plugins: [
		resolve({
			// Needed to ensure .svelte deps get resolved properly.
			extensions: ['.mjs', '.js', '.json', '.node', '.svelte'],
			resolveOnly: [ /^svelte.*/ ],
		}),
    svelte({
      // You can restrict which files are compiled
      // using `include` and `exclude`
      include: 'src/ui/**/*.svelte',

      // By default, the client-side compiler is used. You
      // can also use the server-side rendering compiler
      // generate: 'ssr',

      // ensure that extra attributes are added to head
      // elements for hydration (used with ssr: true)
      // hydratable: true,
    }),
		// uglify({
		// 	mangle: {
		//		
		// 	}
		// }),
  ]
}
