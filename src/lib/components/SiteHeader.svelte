<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Logo from './Logo.svelte';

	const links = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/sight-reading', label: 'Sight reading' },
		{ href: '/rhythm', label: 'Inner rhythm' },
		{ href: '/theory', label: 'Music theory' },
		{ href: '/ear', label: 'Ear training' },
		{ href: '/settings', label: 'Settings' }
	] as const;

	const isCurrent = (href: string): boolean =>
		href === '/' ? page.route.id === '/' : (page.route.id?.startsWith(href) ?? false);
</script>

<header class="site-header">
	<a class="brand" href={resolve('/')} aria-label="D.O.lfine home">
		<Logo size={38} />
		<span class="name">D.O.lfine</span>
	</a>
	<nav aria-label="Main">
		{#each links as link (link.href)}
			<a href={resolve(link.href)} aria-current={isCurrent(link.href) ? 'page' : undefined}>
				{link.label}
			</a>
		{/each}
	</nav>
</header>

<style>
	.site-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem 1.5rem;
		padding: 0.9rem 1.5rem;
		border-bottom: 1px solid var(--rule);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		text-decoration: none;
	}

	.name {
		font-size: 1.3rem;
		letter-spacing: 0.04em;
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1.1rem;
		font-variant: small-caps;
		letter-spacing: 0.06em;
		text-transform: lowercase;
		font-size: 0.95rem;
	}

	nav a {
		text-decoration: none;
		color: var(--ink-soft);
		padding: 0.1rem 0;
		border-bottom: 1px solid transparent;
	}

	nav a:hover,
	nav a[aria-current='page'] {
		color: var(--ink);
		border-bottom-color: var(--accent);
	}
</style>
