import { resolve } from 'node:path';
import { buildSite, serveStatic } from '../support/site.ts';
import { E2E_SITES } from './sites.ts';

for (const site of Object.values(E2E_SITES)) {
	const dir = resolve(import.meta.dirname, '../..', site.dir);
	buildSite(dir, site.basePath);
	serveStatic(dir, site.port, site.basePath);
	console.log(`Serving ${site.dir} at http://localhost:${site.port}${site.basePath}/`);
}
