/*
 * SPDX-License-Identifier: Apache-2.0
 */
// Deterministic JSON.stringify()
import {Context, Contract, Info, Returns, Transaction} from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import {Document} from './document';

@Info({title: 'Document Transfer', description: 'Smart contract for document transfer'})
export class DocumentTransferContract extends Contract {

    @Transaction()
    public async InitLedger(ctx: Context): Promise<void> {
        const documents: Document[] = [
            {
                docType:'pdf',
                ID: 'doc1',
                Size: 5,
                Owner: 'Tomoko',
                Link:''
            },
            {
                docType:'pdf',
                ID: 'doc1',
                Size: 5,
                Owner: 'Tomoko',
                Link:''
            }
        ];

        for (const document of documents) {
            document.docType = 'document';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(document.ID, Buffer.from(stringify(sortKeysRecursive(document))));
            console.info(`Document ${document.ID} initialized`);
        }
    }

    // Createdocument issues a new document to the world state with given details.
    @Transaction()
    public async CreateDocument(ctx: Context, docType:string, id: string, size: number, owner: string, link: string): Promise<void> {
        const exists = await this.DocumentExists(ctx, id);
        if (exists) {
            throw new Error(`The document ${id} already exists`);
        }

        const document = {
            docType:docType,
            ID: id,
            Size: size,
            Owner: owner,
            Link: link
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(document))));
    }

    // Readdocument returns the document stored in the world state with given id.
    @Transaction(false)
    public async ReadDocument(ctx: Context, id: string): Promise<string> {
        const documentJSON = await ctx.stub.getState(id); // get the document from chaincode state
        if (!documentJSON || documentJSON.length === 0) {
            throw new Error(`The document ${id} does not exist`);
        }
        return documentJSON.toString();
    }

    // Updatedocument updates an existing document in the world state with provided parameters.
    @Transaction()
    public async UpdateDocument(ctx: Context, docType:string, id: string, size: number, owner: string, link: string): Promise<void> {
        const exists = await this.DocumentExists(ctx, id);
        if (!exists) {
            throw new Error(`The document ${id} does not exist`);
        }

        // overwriting original document with new document
        const updatedDoc = {
            docType:docType,
            ID: id,
            Size: size,
            Owner: owner,
            Link: link
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedDoc))));
    }

    // Deletedocument deletes an given document from the world state.
    @Transaction()
    public async DeleteDocument(ctx: Context, id: string): Promise<void> {
        const exists = await this.DocumentExists(ctx, id);
        if (!exists) {
            throw new Error(`The document ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // documentExists returns true when document with given ID exists in world state.
    @Transaction(false)
    @Returns('boolean')
    public async DocumentExists(ctx: Context, id: string): Promise<boolean> {
        const documentJSON = await ctx.stub.getState(id);
        return documentJSON && documentJSON.length > 0;
    }

    // Transferdocument updates the owner field of document with given id in the world state, and returns the old owner.
    @Transaction()
    public async TransferDocument(ctx: Context, id: string, newOwner: string): Promise<string> {
        const documentString = await this.ReadDocument(ctx, id);
        const document = JSON.parse(documentString);
        const oldOwner = document.Owner;
        document.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(document))));
        return oldOwner;
    }

    // GetAlldocuments returns all documents found in the world state.
    @Transaction(false)
    @Returns('string')
    public async GetAllDocuments(ctx: Context): Promise<string> {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all documents in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

}
