import { buildSite } from '../support/site';
import { BUILDS } from './builds';

export default function setup(): void {
	for (const { dir, basePath } of Object.values(BUILDS)) buildSite(dir, basePath);
}
