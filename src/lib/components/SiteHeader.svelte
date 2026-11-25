<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/i18n.ts';
	import Logo from './Logo.svelte';

	const links = [
		{ href: '/', label: m.nav_dashboard },
		{ href: '/sight-reading', label: m.nav_sight_reading },
		{ href: '/rhythm', label: m.nav_rhythm },
		{ href: '/theory', label: m.nav_theory },
		{ href: '/ear', label: m.nav_ear },
		{ href: '/settings', label: m.nav_settings }
	] as const;

	const isCurrent = (href: string): boolean =>
		href === '/' ? page.route.id === '/' : (page.route.id?.startsWith(href) ?? false);
</script>

<header class="site-header">
	<a class="brand" href={resolve('/')} aria-label={m.nav_home()}>
		<Logo size={38} />
		<span class="name">D.O.lfine</span>
	</a>
	<nav aria-label={m.nav_label()}>
		{#each links as link (link.href)}
			<a href={resolve(link.href)} aria-current={isCurrent(link.href) ? 'page' : undefined}>
				{link.label()}
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
		gap: var(--space-3) var(--space-5);
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--rule);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		text-decoration: none;
	}

	.name {
		font-size: var(--step-1);
		letter-spacing: 0.04em;
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-4);
		font-variant: small-caps;
		letter-spacing: 0.06em;
		text-transform: lowercase;
		font-size: var(--step-0);
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
