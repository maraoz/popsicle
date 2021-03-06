import Promise = require('native-or-bluebird');
import Base, { BaseOptions, Headers } from './base';
import Response, { ResponseOptions } from './response';
export interface DefaultsOptions extends BaseOptions {
    url?: string;
    method?: string;
    timeout?: number;
    body?: any;
    options?: any;
    use?: Middleware[];
    transport?: TransportOptions;
}
export interface RequestOptions extends DefaultsOptions {
    url: string;
}
export interface PopsicleError extends Error {
    type: string;
    popsicle: Request;
    original?: Error;
}
export interface RequestJSON {
    url: string;
    headers: Headers;
    body: any;
    timeout: number;
    options: any;
    method: string;
}
export interface TransportOptions {
    open: OpenHandler;
    abort?: AbortHandler;
    use?: Middleware[];
}
export declare type Middleware = (request?: Request) => any;
export declare type RequestPluginFunction = (request?: Request) => any;
export declare type ResponsePluginFunction = (response?: Response) => any;
export declare type OpenHandler = (request: Request) => Promise<ResponseOptions>;
export declare type AbortHandler = (request: Request) => any;
export default class Request extends Base {
    method: string;
    timeout: number;
    body: any;
    options: any;
    response: Response;
    raw: any;
    errored: Error;
    transport: TransportOptions;
    aborted: boolean;
    timedout: boolean;
    opened: boolean;
    started: boolean;
    uploadLength: number;
    downloadLength: number;
    private _uploadedBytes;
    private _downloadedBytes;
    private _promise;
    private _before;
    private _after;
    private _always;
    private _progress;
    constructor(options: RequestOptions);
    use(fn: Middleware | Middleware[]): Request;
    error(message: string, type: string, original?: Error): PopsicleError;
    then(onFulfilled: (response?: Response) => any, onRejected?: (error?: PopsicleError) => any): Promise<any>;
    catch(onRejected: (error?: PopsicleError) => any): Promise<any>;
    exec(cb: (err: Error, response?: Response) => any): void;
    toJSON(): RequestJSON;
    progress(fn: RequestPluginFunction): Request;
    before(fn: RequestPluginFunction): Request;
    after(fn: ResponsePluginFunction): Request;
    always(fn: RequestPluginFunction): Request;
    abort(): Request;
    uploaded: number;
    downloaded: number;
    completed: number;
    completedBytes: number;
    totalBytes: number;
    uploadedBytes: number;
    downloadedBytes: number;
}
