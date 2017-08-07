# IndexedDB Stream

Use node.js streams to read from / write to an IndexedDB.

## How to use

First install with `npm` or `yarn`:

```bash
npm install --save indexed-db-stream
yarn install --save indexed-db-stream
```

Use this library in your JavaScript or TypeScript project:

#### JavaScript

```javascript
const indexedDbStream = require('indexed-db-stream');

// Keep in mind that you have to create your database first on the "onupgradeneeded" event!
const writer = new indexedDbStream.IndexedDbWriteStream({
    databaseName: 'myDatabase',
    databaseVersion: 1, // optional
    objectStoreName: 'myStore'
});

writer.write({text: 'first chunk'});
writer.write({text: 'second chunk'});
// ...
writer.end();

// -- same for the reader --

const reader = new indexedDbStream.IndexedDbReadStream({
    databaseName: 'myDatabase',
    databaseVersion: 1, // optional
    objectStoreName: 'myStore',
    indexName: 'myIndex', // optional
    cursorDirection: 'next' // optional
});

reader.pipe(/* ... */);
reader.on("data", function(chunk) {
    console.log('This is from your IndexedDB:', chunk);
});
reader.on("end", function() {
    console.log('Reader finished...');
});
```

#### TypeScript

```typescript
import { IndexedDbReadStream, IndexedDbWriteStream } from "indexed-db-stream"

// Keep in mind that you have to create your database first on the "onupgradeneeded" event!
const writer: IndexedDbWriteStream = new IndexedDbWriteStream({
    databaseName: 'myDatabase',
    databaseVersion: 1, // optional
    objectStoreName: 'myStore'
});

writer.write({text: 'first chunk'});
writer.write({text: 'second chunk'});
// ...
writer.end();

// -- same for the reader --

const reader: IndexedDbReadStream = new IndexedDbReadStream({
    databaseName: 'myDatabase',
    databaseVersion: 1, // optional
    objectStoreName: 'myStore',
    indexName: 'myIndex', // optional
    cursorDirection: 'next' // optional
});

reader.pipe(/* ... */);
reader.on("data", (chunk: any) => {
    console.log('This is from your IndexedDB:', chunk);
});
reader.on("end", () => {
    console.log('Reader finished...');
});
```

## NPM Tasks

* `npm run doc`: Create an API documentation with `typedoc`.
* `npm run browser-test`: Create a test that you can run in your browser (target: `browser-test/index.html`).
* `npm test`: Run tests with `karma` automated in several browsers and create a coverage-report.

## Contribution

Make an issue on [GitHub](https://github.com/atd-schubert/indexed-db-stream), or even better a pull request and try to fulfill the software tests. 


## License

This library is under [ISC License](https://spdx.org/licenses/ISC.html) © by Arne Schubert.