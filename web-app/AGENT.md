import notes from '../data.json';

is an array of Note

    'wiktionary1',
    'wiktionary2',
    'wiktionary3',
    'wiktionary4',
    'wiktionary5',
    'wiktionary6'

are html in a string, when its cell is rendered - there should be button "Show" to show this html in a modal

make a Cell component, which is a Table.Cell, but should have two states - hidden and not. If hidden , cell is black, but can be shown if user clicks on cell

if cell is already white, clicking on it should not make it black again.

Cell should have this state locally and also should be susbcribed to global button "show/hide" which will make all black or white if clicked (it resets the state). but note that there are 3 types of cell - front and back and info, so they should be subscribed to one of 3 global show/hide states too

table rows should be virtualized if not already to be efficient

there should be an app header, it should contain name of app "Apkg explorer" and theme change button group "light/dark/system" (starting value is system, should be saved in localstorage) - this header should be not sticky (just at the top of page)

the table should be one list

table columns are:

1. number
2. Word :
   km word [button to play audio word_audio], km word romanization
3. Sentence
   km sentence [button to play audio sent_audio], km sentence romanization
4. En word
   worden [pos]
5. En sentence
6. Info
   Ety, pronunciation, senses, derivedTerms, [Open wiktionary] (in a modal button)

cells under columns 2 3 listen for global change of buttons [Show/Hide front]
cells under columns 4 5 listen for global change of buttons [Show/Hide back]
cells under columns 6 listen for global change of buttons [Show/Hide info]

The buttons [Show/Hide front] [Show/Hide back] [Show/Hide info] should be rendered inside of popup, it should be attached to top right side of view and be allowed to minimize into a small button (so can minimize/maximize)

table should take 100% of width of screen, no x scrolling, only y

size of columns think Yourself.

Use shadcn-svelte

All latest libraries.

Make beautiful ui.

I forgot to tell that NoteCell should also take optional param audioUrl: string | undefined

if audioUrl is present then should render button [Play] in the bottom

Why? bc NoteCell should show audio button even if text in the cell is hidden/disabled/black

NodeCell should have not only audioUrl param, but also wiktionary1,2,3,4,5,6

so that wiktionary button are also visible even if Cell is dark

Also, No need to render NodeCell if its empty (no children and no buttons)
