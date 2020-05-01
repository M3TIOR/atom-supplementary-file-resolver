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
import path from 'path';
import fs from 'fs';



/**
 * A very basic supplementary file resolver.
 *
 * @param {string} ogfilepath -
 *   The file path we want to resolve relative of.
 * @param {Array} extensions -
 *   A string array of extensions to match from the current grammar.
 * @returns {Array} - Contains string paths to resolved supplements.
 * @description
 *   This header resolver looks for files in the current directory, any files
 *   with the same name as the source file, and a different, realevant
 *   extension are returned as results.
 */
export default function(ogfilepath, extensions){
	const searchLocation = path.dirname(ogfilepath);
	const validexts = extensions.filter(e => e !== ogext);
	const ogext = path.extname(ogfilepath);
	const ogbase = path.basename(ogfilepath, ogext);

	const contents = fs.readdirSync(searchLocation, {withFileTypes: true});

	return contents
		.filter((dirent) => {
			const dext = path.extname(dirent.name);
			const dbase = path.basename(dirent.name, dext);
			// Make sure we don't accidentally try to open folders..
			return dirent.isFile() && dbase === ogbase && validexts.includes(dext);
		})
		.map((dirent) => {
			return path.join(searchLocation, dirent.name);
		});
}
