<!------------------------------------------------------------------------------
Copyright (c) 2020 Ruby Allison Rose (aka. M3TIOR)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
------------------------------------------------------------------------------->

<script>
	export let filenames = [];
	export let onSelection = async function(selection){};
	export let closeDialog = function(){};

	function select(selection){
		if (selection != null){
			// Call the callback first thing.
			onSelection(filenames[selection]);

			// This is much faster than creating a new list and repopulating it.
			// Although it could use a sort to be more user friendly.
			if (selection < filenames.length)
				filenames[selection] = filenames[filenames.length];

			filenames.pop();

			//filenames.sort();
		}
		else {
			closeDialog();
		}
	}
	function placeSelector(selection){
		return () => select(selection);
	}
</script>

{#each filenames as file, index}
	<div>
		<span class="title">{file}</span>
		<button class="btn btn-default" on:click={placeSelector(index)}>Open</button>
	</div>
{/each}
<button class="btn btn-default" on:click={placeSelector(null)}>Cancle</button>
