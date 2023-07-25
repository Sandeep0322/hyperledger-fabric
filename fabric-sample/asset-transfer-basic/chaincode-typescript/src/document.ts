/*
  SPDX-License-Identifier: Apache-2.0
*/

import {Object, Property} from 'fabric-contract-api';

@Object()
export class Document {
    @Property()
    public docType: string;

    @Property()
    public ID: string;

    @Property()
    public Size: number;

    @Property()
    public Owner: string;

    @Property()
    public Link: string;
}
