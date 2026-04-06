#!/usr/bin/env node
import chalk from 'chalk';
import Conf from 'conf';
declare const config: Conf<{
    apiUrl: string;
}>;
declare class APIClient {
    private baseUrl;
    constructor();
    private request;
    get<T>(path: string): Promise<T>;
    post<T>(path: string, body?: unknown): Promise<T>;
    put<T>(path: string, body?: unknown): Promise<T>;
    delete<T>(path: string): Promise<T>;
}
declare const api: APIClient;
declare const spinner: import("ora").Ora;
export { api, spinner, config, chalk };
//# sourceMappingURL=index.d.ts.map