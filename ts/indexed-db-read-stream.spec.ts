import { expect } from "chai";
import { IndexedDbReadStream } from "./index";

import { TEST_DATA, TEST_DATABASE_NAME_PREFIX, TEST_DATABASE_VERSION, TEST_OBJECT_STORE_NAME} from "./spec-common";
const TEST_DATABASE_NAME: string = TEST_DATABASE_NAME_PREFIX + "read";

/* tslint:disable:no-empty */
function noop() {}
/* tslint:enable */

describe("IndexDB read stream", () => {
    before((done: MochaDone) => {
        const dbRequest = indexedDB.open(TEST_DATABASE_NAME, TEST_DATABASE_VERSION);
        dbRequest.addEventListener("success", (dbEvent: any) => {
            const objectStore = dbEvent.target.result.transaction([TEST_OBJECT_STORE_NAME], "readwrite")
                .objectStore(TEST_OBJECT_STORE_NAME);
            for (const data of TEST_DATA) {
                objectStore.add(data);
            }
            done();
        });

        dbRequest.addEventListener("upgradeneeded", (dbEvent: any) => {
            const database: IDBDatabase = dbEvent.target.result;
            database.createObjectStore(TEST_OBJECT_STORE_NAME, { keyPath: "id"})
                .createIndex("index", "index");
        });
    });
    after(() => {
        indexedDB.deleteDatabase(TEST_DATABASE_NAME);
    });
    it("should stream all data from store", (done: MochaDone) => {
        let pos: number = 0;
        const reader = new IndexedDbReadStream({
            databaseName: TEST_DATABASE_NAME,
            databaseVersion: TEST_DATABASE_VERSION,
            objectStoreName: TEST_OBJECT_STORE_NAME,
        });
        reader.on("error", /* istanbul ignore next */ (err: Error) => {
            done(err);
        });
        reader.on("data", (data: any) => {
            expect(data).to.deep.equal(TEST_DATA[pos]);
            pos += 1;
        });
        reader.on("end", () => {
            expect(pos).to.equal(TEST_DATA.length);
            done();
        });
    });
    it("should stream all data from store in backwards direction", (done: MochaDone) => {
        let pos: number = 0;
        const reader = new IndexedDbReadStream({
            cursorDirection: "prev",
            databaseName: TEST_DATABASE_NAME,
            databaseVersion: TEST_DATABASE_VERSION,
            objectStoreName: TEST_OBJECT_STORE_NAME,
        });
        reader.on("error", /* istanbul ignore next */ (err: Error) => {
            done(err);
        });
        reader.on("data", (data: any) => {
            expect(data).to.deep.equal(TEST_DATA[TEST_DATA.length - pos - 1]);
            pos += 1;
        });
        reader.on("end", () => {
            expect(pos).to.equal(TEST_DATA.length);
            done();
        });
    });

    it("should stream all data from a store index", (done: MochaDone) => {
        let pos: number = 0;
        const reader = new IndexedDbReadStream({
            databaseName: TEST_DATABASE_NAME,
            databaseVersion: TEST_DATABASE_VERSION,
            indexName: "index",
            objectStoreName: TEST_OBJECT_STORE_NAME,
        });
        reader.on("error", /* istanbul ignore next */ (err: Error) => {
            done(err);
        });
        reader.on("data", (data: any) => {
            expect(data).to.deep.equal(TEST_DATA[pos]);
            pos += 1;
        });
        reader.on("end", () => {
            expect(pos).to.equal(TEST_DATA.length);
            done();
        });
    });
    it("should stream all data from a store index in backwards direction", (done: MochaDone) => {
        let pos: number = 0;
        const reader = new IndexedDbReadStream({
            cursorDirection: "prev",
            databaseName: TEST_DATABASE_NAME,
            databaseVersion: TEST_DATABASE_VERSION,
            indexName: "index",
            objectStoreName: TEST_OBJECT_STORE_NAME,
        });
        reader.on("error", /* istanbul ignore next */ (err: Error) => {
            done(err);
        });
        reader.on("data", (data: any) => {
            expect(data).to.deep.equal(TEST_DATA[TEST_DATA.length - pos - 1]);
            pos += 1;
        });
        reader.on("end", () => {
            expect(pos).to.equal(TEST_DATA.length);
            done();
        });
    });
    it("should stream unique data from a store index", (done: MochaDone) => {
        let pos: number = 0;
        const indexes = ["a", "b", "c", "d", "e"];
        const reader = new IndexedDbReadStream({
            cursorDirection: "nextunique",
            databaseName: TEST_DATABASE_NAME,
            databaseVersion: TEST_DATABASE_VERSION,
            indexName: "index",
            objectStoreName: TEST_OBJECT_STORE_NAME,
        });
        reader.on("error", /* istanbul ignore next */ (err: Error) => {
            done(err);
        });
        reader.on("data", (data: any) => {
            expect(data.index).to.deep.equal(indexes[pos]);
            pos += 1;
        });
        reader.on("end", () => {
            expect(pos).to.equal(indexes.length);
            done();
        });
    });
    it("should stream unique data from a store index in backwards direction", (done: MochaDone) => {
        let pos: number = 0;
        const indexes = ["e", "d", "c", "b", "a"];
        const reader = new IndexedDbReadStream({
            cursorDirection: "prevunique",
            databaseName: TEST_DATABASE_NAME,
            databaseVersion: TEST_DATABASE_VERSION,
            indexName: "index",
            objectStoreName: TEST_OBJECT_STORE_NAME,
        });
        reader.on("error", /* istanbul ignore next */ (err: Error) => {
            done(err);
        });
        reader.on("data", (data: any) => {
            expect(data.index).to.deep.equal(indexes[pos]);
            pos += 1;
        });
        reader.on("end", () => {
            expect(pos).to.equal(indexes.length);
            done();
        });
    });

    it("should stop streaming data from a store index after destroy", (done: MochaDone) => {
        let pos: number = 0;
        const indexes = ["a", "b", "c", "d", "e"];
        const reader = new IndexedDbReadStream({
            cursorDirection: "nextunique",
            databaseName: TEST_DATABASE_NAME,
            databaseVersion: TEST_DATABASE_VERSION,
            indexName: "index",
            objectStoreName: TEST_OBJECT_STORE_NAME,
        });
        reader.on("error", /* istanbul ignore next */ (err: Error) => {
            done(err);
        });
        reader.on("data", (data: any) => {
            expect(data.index).to.deep.equal(indexes[pos]);
            pos += 1;
            reader.destroy();
        });
        reader.on("end", () => {
            expect(pos).to.equal(1);
            done();
        });
    });
    it("should emit error when object-store is not available", (done: MochaDone) => {
        const reader = new IndexedDbReadStream({
            databaseName: "n-a",
            databaseVersion: 1,
            objectStoreName: "n-a",
        });
        reader.on("error", (err) => {
            expect(err.message).to.contain("not found");
            done();
        });
        reader.on("data", noop);
    });
    it("should emit error when index of object-store is not available", (done: MochaDone) => {
        const reader = new IndexedDbReadStream({
            databaseName: TEST_DATABASE_NAME,
            databaseVersion: TEST_DATABASE_VERSION,
            indexName: "n-a",
            objectStoreName: TEST_OBJECT_STORE_NAME,
        });
        reader.on("error", (err) => {
            expect(err.message).to.contain("not found");
            done();
        });
        reader.on("data", noop);
    });
});
