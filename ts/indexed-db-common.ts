/**
 * Common options
 */
export interface IIndexedDbCommonOptions {
    /**
     * Name of the IndexedDB database
     */
    databaseName: string;
    /**
     * Version of the database
     * @default 1
     */
    databaseVersion?: number;
    /**
     * Name of the IndexedDB objectStore
     */
    objectStoreName: string;
}
