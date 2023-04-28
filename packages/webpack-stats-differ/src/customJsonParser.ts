import * as fs from "fs";
import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { streamObject } from 'stream-json/streamers/StreamObject';


export const customJsonParser = (filePath: string): Promise<{ [key: string]: any }> => {
    return new Promise((resolve, reject) => {
        const result: { [key:string]: any } = {}
        const pipeline = chain([
            fs.createReadStream(filePath),
            parser(),
            streamObject(),
        ]);
        pipeline.on('data', (data) => {
            result[data.key] = data.value;
        })
        pipeline.on('end', () => {
            resolve(result);
        })
        pipeline.on('error', (err: any) => {
            reject(err);
        })
    })
}
