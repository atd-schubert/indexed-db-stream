import { expect } from "chai";
import { IndexedDbWriteStream } from "./index";

import { TEST_DATA, TEST_DATABASE_NAME_PREFIX, TEST_DATABASE_VERSION, TEST_OBJECT_STORE_NAME} from "./spec-common";
const TEST_DATABASE_NAME: string = TEST_DATABASE_NAME_PREFIX + "write";

describe("IndexDB write stream", () => {
    before((done: MochaDone) => {
        const dbRequest = indexedDB.open(TEST_DATABASE_NAME, TEST_DATABASE_VERSION);
        dbRequest.addEventListener("success", () => {
            done();
        });
        dbRequest.addEventListener("upgradeneeded", (dbEvent: any) => {
            const database: IDBDatabase = dbEvent.target.result;
            database.createObjectStore(TEST_OBJECT_STORE_NAME, { keyPath: "id"})
                .createIndex("value", "value");
        });
    });
    after(() => {
        indexedDB.deleteDatabase(TEST_DATABASE_NAME);
    });
    it("should write all data in store", (done: MochaDone) => {
        const writer = new IndexedDbWriteStream({
            databaseName: TEST_DATABASE_NAME,
            databaseVersion: TEST_DATABASE_VERSION,
            objectStoreName: TEST_OBJECT_STORE_NAME,
        });
        for (const data of TEST_DATA) {
            writer.write(data);
        }
        writer.end();
        writer.on("finish", () => {
            done();
        });
    });
    it("should have stored all data entries", (done: MochaDone) => {
        const dbRequest = indexedDB.open(TEST_DATABASE_NAME, TEST_DATABASE_VERSION);
        dbRequest.addEventListener("success", (dbEvent: any) => {
            const tx = dbEvent.target.result.transaction([TEST_OBJECT_STORE_NAME], "readwrite")
                .objectStore(TEST_OBJECT_STORE_NAME).count();
            tx.addEventListener("error", /* istanbul ignore next */(event: any) => {
                done(event.target.error);
            });
            tx.addEventListener("success", (event: any) => {
                expect(event.target.result).to.equal(TEST_DATA.length);
                done();
            });
        });
    });
    it("should emit error on duplicates", (done: MochaDone) => {
        const writer = new IndexedDbWriteStream({
            databaseName: TEST_DATABASE_NAME,
            databaseVersion: TEST_DATABASE_VERSION,
            objectStoreName: TEST_OBJECT_STORE_NAME,
        });
        writer.on("error", (err) => {
            expect(err.message).to.contain("already exists");
            done();
        })
            .write(TEST_DATA[0]);
        writer.end();
    });

    it("should emit error when object-store is not available", (done: MochaDone) => {
        const writer = new IndexedDbWriteStream({
            databaseName: "n-a",
            databaseVersion: 1,
            objectStoreName: "n-a",
        });
        writer.on("error", (err) => {
            expect(err.message).to.contain("not found");
            done();
        })
            .write(TEST_DATA[0]);
        writer.end();
    });

    // it.skip("should emit error when browser is in incognito mode");
});
