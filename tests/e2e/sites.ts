export const E2E_SITES = {
	root: { dir: '.test-builds/e2e-root', basePath: '', port: 4173 },
	pages: { dir: '.test-builds/e2e-pages', basePath: '/dolfine', port: 4174 }
} as const;

export const siteUrl = (site: keyof typeof E2E_SITES): string =>
	`http://localhost:${E2E_SITES[site].port}${E2E_SITES[site].basePath}/`;
