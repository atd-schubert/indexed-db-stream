import {Readable} from "stream";
import {IIndexedDbCommonOptions} from "./indexed-db-common";

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

    private cursor?: IDBCursorWithValue;

    private dbDatabase?: IDBDatabase;
    private dbTransaction?: IDBTransaction;

    constructor(protected options: IIndexedDbReadStreamOptions) {
        super({objectMode: true});
    }

    public _read(size: number): void {
        if (!this.dbDatabase) {
            // lazy init
            return this.openConnection();
        }
    }

    public _destroy(err: Error | undefined, callback: (err?: Error) => void): void {
        // close all here
        this.cursor = undefined;
        // transaction already closed if not exists
        if (this.dbTransaction) {
            this.dbTransaction.abort();
            this.dbTransaction = undefined;
        }
        if (this.dbDatabase) {
            this.dbDatabase.close();
            this.dbDatabase = undefined;
        }
        // emit "end"
        this.push(null);
        return callback(err);
    }

    private openConnection() {
        const {databaseName, objectStoreName, cursorDirection, databaseVersion, indexName, range} = this.options;

        const dbRequest = indexedDB.open(databaseName, databaseVersion);
        dbRequest.addEventListener("success", (dbEvent: any) => {
            this.dbDatabase = dbEvent.target.result;
            let tx: IDBRequest;
            try {
                this.dbTransaction = this.dbDatabase.transaction([objectStoreName], "readonly");

                let store: IDBObjectStore | IDBIndex = this.dbTransaction.objectStore(objectStoreName);

                if (indexName) {
                    store = (store as IDBObjectStore).index(indexName);
                }

                tx = store.openCursor(range, cursorDirection);
            } catch (err) {
                return this.emit("error", err);
            }

            tx.addEventListener("success", (event: any) => {
                if (event.target.result) {
                    this.cursor = event.target.result;
                    // this.push returns boolean
                    // if false - pause pushing values
                    this.push(this.cursor.value);
                    if (this.cursor) {
                        this.cursor.continue();
                    }
                    return;
                }
                // transaction finished
                // set undefined, because call abort() on finished throw exception
                this.dbTransaction = undefined;
                this.destroy();
            });
            tx.addEventListener("error", (event: any) => {
                this.emit("error", event.target.result);
            });
        });
        dbRequest.addEventListener("error", (event: any) => {
            this.emit("error", event.target.result);
        });
    }
}
