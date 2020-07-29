import {
    Rule,
    SchematicContext,
    Tree
} from '@angular-devkit/schematics';
import { UpdateChanges } from '../common/UpdateChanges';
import { getIdentifierPositions } from '../common/tsUtils';
import { LanguageService } from 'typescript';
import ts = require('typescript/lib/tsserverlibrary');
import * as fs from 'fs';
import * as path from 'path';

function noop() { }

function nowString() {
    // E.g. "12:34:56.789"
    const d = new Date();
    return `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`;
}

const version = '10.1.0';

//tslint:disable
export class ServerHost implements ts.server.ServerHost {
    readonly args: string[];
    readonly newLine: string;
    readonly useCaseSensitiveFileNames: boolean;

    constructor(public host: Tree) {
        this.args = ts.sys.args;
        this.newLine = ts.sys.newLine;
        this.useCaseSensitiveFileNames = ts.sys.useCaseSensitiveFileNames;
    }

    public write(data: string): void {
        this.host.overwrite(ts.sys.getExecutingFilePath(), data);
    }

    public writeOutputIsTTY(): boolean {
        return ts.sys.writeOutputIsTTY!();
    }

    public readFile(path: string, encoding?: string): string | undefined {
        if (!this.fileExists(path)) { return; }
        console.log("Read File:" + path);
        return this.host.read(path).toString(encoding);
    }

    public getFileSize(path: string): number {
        return ts.sys.getFileSize!(path);
    }

    public writeFile(path: string, data: string, writeByteOrderMark?: boolean): void {
        // return ts.sys.writeFile(path, data, writeByteOrderMark);
        if (path && this.fileExists(path)) { this.host.overwrite(path, data); }
    }

    /**
     * @pollingInterval - this parameter is used in polling-based watchers and
     * ignored in watchers that use native OS file watching
     */
    public watchFile(path: string, callback: ts.FileWatcherCallback, pollingInterval?: number):
        ts.FileWatcher {
        return ts.sys.watchFile!(path, callback, pollingInterval);
    }

    public watchDirectory(path: string, callback: ts.DirectoryWatcherCallback, recursive?: boolean):
        ts.FileWatcher {
        return ts.sys.watchDirectory!(path, callback, recursive);
    }

    public resolvePath(path: string): string {
        return ts.sys.resolvePath(path);
    }

    public fileExists(path: string): boolean {
        // ts.sys.fileExists(path)
        console.log("File Exists: " + path);
        return this.host.exists(path);
    }

    public directoryExists(path: string): boolean { // TODO
        return ts.sys.directoryExists(path);
    }

    public createDirectory(path: string): void { // TODO
        return ts.sys.createDirectory(path);
    }

    public getExecutingFilePath(): string { // TODO?
        return ts.sys.getExecutingFilePath();
    }

    public getCurrentDirectory(): string {
        // return ts.sys.getCurrentDirectory();
        return this.host.root.path;
    }

    public getDirectories(path: string): string[] { // TODO
        return ts.sys.getDirectories(path);
    }

    public readDirectory( // TODO
        path: string, extensions?: ReadonlyArray<string>, exclude?: ReadonlyArray<string>,
        include?: ReadonlyArray<string>, depth?: number): string[] {
        return ts.sys.readDirectory(path, extensions, exclude, include, depth);
    }

    public getModifiedTime(path: string): Date | undefined {
        return ts.sys.getModifiedTime!(path);
    }

    public setModifiedTime(path: string, time: Date): void {
        return ts.sys.setModifiedTime!(path, time);
    }

    public deleteFile(path: string): void {
        // return ts.sys.deleteFile!(path);
        this.host.delete(path);
    }

    public createHash(data: string): string {
        return ts.sys.createHash!(data);
    }

    public createSHA256Hash(data: string): string {
        return ts.sys.createSHA256Hash!(data);
    }

    public getMemoryUsage(): number {
        return ts.sys.getMemoryUsage!();
    }

    public exit(exitCode?: number): void {
        return ts.sys.exit(exitCode);
    }

    public realpath(path: string): string {
        return ts.sys.realpath!(path);
    }

    public setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): any {
        return ts.sys.setTimeout!(callback, ms, ...args);
    }

    public clearTimeout(timeoutId: any): void {
        return ts.sys.clearTimeout!(timeoutId);
    }

    public clearScreen(): void {
        return ts.sys.clearScreen!();
    }

    public base64decode(input: string): string {
        return ts.sys.base64decode!(input);
    }

    public base64encode(input: string): string {
        return ts.sys.base64encode!(input);
    }

    public setImmediate(callback: (...args: any[]) => void, ...args: any[]): any {
        return setImmediate(callback, ...args);
    }

    public clearImmediate(timeoutId: any): void {
        return clearImmediate(timeoutId);
    }

    public require(initialPath: string, moduleName: string) {
        try {
            const modulePath = require.resolve(moduleName, {
                paths: [initialPath],
            });
            return {
                module: require(modulePath),
                error: undefined,
            };
        } catch (e) {
            return {
                module: undefined,
                error: e as Error,
            };
        }
    }
}

export class Logger implements ts.server.Logger {
    private fd = -1;
    private seq = 0;
    private inGroup = false;
    private firstInGroup = true;

    constructor(
        private readonly traceToConsole: boolean,
        private readonly level: ts.server.LogLevel,
        private readonly logFilename?: string,
    ) {
        if (logFilename) {
            try {
                const dir = path.dirname(logFilename);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }
                this.fd = fs.openSync(logFilename, 'w');
            } catch {
                // swallow the error and keep logging disabled if file cannot be opened
            }
        }
    }

    static padStringRight(str: string, padding: string) {
        return (str + padding).slice(0, padding.length);
    }

    close() {
        if (this.fd >= 0) {
            fs.close(this.fd, noop);
        }
    }

    getLogFileName() {
        return this.logFilename;
    }

    perftrc(s: string) {
        this.msg(s, ts.server.Msg.Perf);
    }

    info(s: string) {
        this.msg(s, ts.server.Msg.Info);
    }

    err(s: string) {
        this.msg(s, ts.server.Msg.Err);
    }

    startGroup() {
        this.inGroup = true;
        this.firstInGroup = true;
    }

    endGroup() {
        this.inGroup = false;
    }

    loggingEnabled() {
        return !!this.logFilename || this.traceToConsole;
    }

    hasLevel(level: ts.server.LogLevel) {
        return this.loggingEnabled() && this.level >= level;
    }

    msg(s: string, type: ts.server.Msg = ts.server.Msg.Err) {
        if (!this.canWrite) return;

        s = `[${nowString()}] ${s}\n`;
        if (!this.inGroup || this.firstInGroup) {
            const prefix = Logger.padStringRight(type + ' ' + this.seq.toString(), '          ');
            s = prefix + s;
        }
        this.write(s);
        if (!this.inGroup) {
            this.seq++;
        }
    }

    private get canWrite() {
        return this.fd >= 0 || this.traceToConsole;
    }

    private write(s: string) {
        if (this.fd >= 0) {
            const buf = Buffer.from(s);
            // tslint:disable-next-line no-null-keyword
            fs.writeSync(this.fd, buf, 0, buf.length, /*position*/ null!);  // TODO: GH#18217
        }
        if (this.traceToConsole) {
            console.warn(s);
        }
    }
}

export default function (): Rule {
    return (host: Tree, context: SchematicContext) => {
        context.logger.info(`Applying migration for Ignite UI for Angular to version ${version}`);
        const update = new UpdateChanges(__dirname, host, context);
        const ngService = update.ngService;
        update.applyChanges();

        const serverHost = new ServerHost(host);
        const logger = new Logger(true, ts.server.LogLevel.verbose);
        const projectService = new ts.server.ProjectService({
            host: serverHost,
            logger: logger,
            cancellationToken: ts.server.nullCancellationToken,
            useSingleInferredProject: true,
            useInferredProjectPerProjectRoot: true,
            typingsInstaller: ts.server.nullTypingsInstaller,
            // globalPlugins: ['@angular/language-service'],
            // suppressDiagnosticEvents: true,
            // allowLocalPluginLoads: false,
            // pluginProbeLocations: [],
        });
        projectService.setHostConfiguration({
            formatOptions: projectService.getHostFormatCodeOptions(),
            extraFileExtensions: [
                {
                    extension: '.html',
                    isMixedContent: false,
                    scriptKind: ts.ScriptKind.External,
                }
            ]
        });
        projectService.configurePlugin({
            pluginName: '@angular/language-service',
            configuration: {
                angularOnly: true,
            },
        });

        // replace DropPosition.None with DropPosition.AfterDropTarget
        for (const entryPath of update.tsFiles) {
            let content = host.read(entryPath).toString();
            if (content.indexOf('DropPosition.None') !== -1) {
                const pos = getIdentifierPositions(content, 'DropPosition');
                for (let i = pos.length; i--;) {
                    const end = pos[i].end + 5;
                    const isMatch = content.slice(pos[i].start, end) === 'DropPosition.None';
                    if (isMatch) {
                        content = content.slice(0, pos[i].start) + 'DropPosition.AfterDropTarget' + content.slice(end);
                    }
                }
                host.overwrite(entryPath, content);
            }

            let scriptInfo = projectService.getOrCreateScriptInfoForNormalizedPath(ts.server.asNormalizedPath(entryPath), false);
            const normalizedFileName = ts.server.toNormalizedPath(entryPath);
            let project = projectService.getDefaultProjectForFile(normalizedFileName, false);
            project = projectService.getDefaultProjectForFile(normalizedFileName, false);

            // getOrCreateOpenScriptInfo
            if (!project) {
                let fileName = projectService.openClientFile("." + entryPath);
                fileName = projectService.openClientFile("." + entryPath);
                project = projectService.findProject(fileName.configFileName);
                const attached = scriptInfo.attachToProject(project);
            }

            const infProject = scriptInfo.containingProjects[0];
            const infLangServ = infProject.getLanguageService();

            const langServ = project.getLanguageService(true);
            const regex = new RegExp(/selectedRows\(\)/, 'g');
            let match;
            while ((match = regex.exec(content)) !== null) {
                const quickInfo = ngService.getQuickInfoAtPosition(entryPath, match.index);
                let otherQuickinfo = langServ.getQuickInfoAtPosition(entryPath, match.index);
                otherQuickinfo = langServ.getQuickInfoAtPosition(entryPath, match.index);
            }
        }

        for (const entryPath of update.templateFiles) {
            // TODO
        }
    };
}
