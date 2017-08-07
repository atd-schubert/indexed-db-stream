import { Writable } from "stream";
import { IIndexedDbCommonOptions } from "./indexed-db-common";

/**
 * Options to create a writable Stream for the IndexedDB
 */
/* tslint:disable:no-empty-interface */
export interface IIndexedDbWriteStreamOptions extends IIndexedDbCommonOptions {}
/* tslint:enable */

/**
 * writable IndexedDB stream
 */
export class IndexedDbWriteStream extends Writable {
    constructor(protected options: IIndexedDbWriteStreamOptions) {
        super({ objectMode: true });
    }
    public _write(chunk: any, encoding: string, next: () => void): void {
        const dbRequest = indexedDB.open(this.options.databaseName, this.options.databaseVersion);
        dbRequest.addEventListener("success", (dbEvent: any) => {
            let tx: IDBRequest;
            try {
                tx = dbEvent.target.result.transaction([this.options.objectStoreName], "readwrite")
                    .objectStore(this.options.objectStoreName)
                    .add(chunk);

            } catch (err) {
                this.emit("error", err);
                return;
            }
            tx.addEventListener("success", () => {
                next();
            });
            tx.addEventListener("error", (event: any) => {
                this.emit("error", event.target.error);
            });
        });
        dbRequest.addEventListener("error", (event: any) => {
            // This can not tested well, but can be fired in browsers incognito mode!
            this.emit("error", event.target.error);
        });
    }
}
