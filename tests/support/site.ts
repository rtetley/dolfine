import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const VITE = join(ROOT, 'node_modules/vite/bin/vite.js');

export function buildSite(outDir: string, basePath = ''): void {
	rmSync(outDir, { recursive: true, force: true });
	execFileSync(process.execPath, [VITE, 'build', '--logLevel', 'error'], {
		cwd: ROOT,
		stdio: 'inherit',
		env: { ...process.env, BUILD_DIR: outDir, BASE_PATH: basePath }
	});
}

const TYPES: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.svg': 'image/svg+xml',
	'.woff2': 'font/woff2',
	'.txt': 'text/plain'
};

function resolveFile(dir: string, path: string): string | null {
	const safe = normalize(decodeURIComponent(path)).replace(/^(\.\.[/\\])+/, '');
	const candidates = [join(dir, safe), join(dir, `${safe}.html`), join(dir, safe, 'index.html')];
	return candidates.find((file) => existsSync(file) && statSync(file).isFile()) ?? null;
}

/** Serves a static build the way GitHub Pages does: `/base/route` → `route.html`, else 404. */
export function serveStatic(dir: string, port: number, basePath = ''): Server {
	return createServer((request, response) => {
		const { pathname } = new URL(request.url ?? '/', 'http://localhost');
		if (basePath && pathname === basePath) {
			response.writeHead(301, { location: `${basePath}/` }).end();
			return;
		}
		const file = pathname.startsWith(`${basePath}/`)
			? resolveFile(dir, pathname.slice(basePath.length))
			: null;
		if (!file) {
			response.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
			return;
		}
		response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
		response.end(readFileSync(file));
	}).listen(port);
}
