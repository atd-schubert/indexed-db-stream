import { Readable } from "stream";
import { IIndexedDbCommonOptions } from "./indexed-db-common";

/**
 * Options to create a readable Stream for the IndexedDB
 */
export interface IIndexedDbReadStreamOptions extends IIndexedDbCommonOptions {
    /**
     * Name of the index that should be read
     */
    indexName?: string;
    /**
     * Optional range for the query
     */
    range?: IDBKeyRange;
    /**
     * Search direction of the cursor
     */
    cursorDirection?: "next" | "nextunique" | "prev" | "prevunique";
}

/**
 * Readable IndexedDB stream
 */
export class IndexedDbReadStream extends Readable {
    constructor(options: IIndexedDbReadStreamOptions) {
        super({ objectMode: true });

        const dbRequest = indexedDB.open(options.databaseName, options.databaseVersion);
        dbRequest.addEventListener("success", (dbEvent: any) => {
            let tx: IDBRequest;
            try {
                let store: IDBObjectStore | IDBIndex = dbEvent.target.result.transaction([options.objectStoreName])
                    .objectStore(options.objectStoreName);
                if (options.indexName) {
                    store = (store as IDBObjectStore).index(options.indexName);
                }
                tx = store.openCursor(options.range, options.cursorDirection);
            } catch(err) {
                return this.emit("error", err);
            }

            tx.addEventListener("success", (event: any) => {
                if (event.target.result) {
                    this.push(event.target.result.value);
                    return event.target.result.continue();
                }
                this.push(null);
            });
            tx.addEventListener("error", (event: any) => {
                this.emit("error", event.target.result);
            });
        });
        dbRequest.addEventListener("error", (event: any) => {
            this.emit("error", event.target.result);
        });
    }
    public _read(): void {
        return;
    }
}
