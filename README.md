## anki-apkg-parser

**anki-apkg-parser** - nodejs helper for parsing Anki `.apkg` files. You can unpack the deck and get list of notes, cards, media files, models. This library uses `sqlite` as a dependency, so you can make any SQL queries yourself;

## Installation 

`npm i anki-apkg-parser`

## Usage

Basic usage:
```typescript
    import { Apkg } from 'anki-apkg-parser';

    const deck = 'deck.apkg';

    const deckPath = path.join(__dirname, deck);
    const unpackedFolder = path.join(__dirname, 'unpacked');
    
    // always wrap unpacking code with try/catch
    try {
        // Function "create" runs unpacking the deck and creates Apkg instance;
        const apkg = await Apkg.create(deckPath, unpackedFolder);

        // get JSON mapping of media files in deck
        const media = await apkg.getMedia(); // { '0': 'car.jpg', '1': 'cup.mp3' }
        
        // get sqlite3 database instance
        const db = await apkg.getDb();


        // fetch list of all notes
        const notes = await db.getNotes();

        // fetch colleciton raw
        const collection = await db.getCollection();

        // get deck config
        const config = await db.getDeckConfig();

        // get deck models
        const models = await db.getModels();

        // make raw query
        const result = await db.get('SELECT * FROM col');

    } catch (e) {
        console.log('Fail during unpacking apkg', e);
    }
...
```

.apkg files are simply ZIP archives. What's inside ?

- `0`, `1`, `2` - media files (images, sounds, videos). 
- `collection.anki2` - legacy database pre-2.1
- `collection.anki21` - anki 2.1+
- `collection.anki21b` - latest db version
- `media` - json mapping of media files (see the first one) - {1: 'car.jpg', '2': ...}
- `meta` - Meta data, if exists