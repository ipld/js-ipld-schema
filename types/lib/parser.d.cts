declare class peg$SyntaxError extends SyntaxError {
    static buildMessage(expected: any, found: any): string;
    constructor(message: any, expected: any, found: any, location: any);
    expected: any;
    found: any;
    location: any;
    format(sources: any): string;
}
declare function peg$parse(input: any, options: any): any;
export declare let StartRules: string[];
export { peg$SyntaxError as SyntaxError, peg$parse as parse };
//# sourceMappingURL=parser.d.cts.map