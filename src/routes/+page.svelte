<script lang="ts">
	import { resolve } from '$app/paths';
	import DropCap from '#lib/brand/DropCap.svelte';
	import { m } from '#lib/i18n.ts';
	import { continueStore, MODULE_ROUTES } from '#lib/state/modulePrefs.svelte.ts';

	const modules = [
		{
			href: '/sight-reading',
			name: m.nav_sight_reading,
			description: m.module_sight_reading_description,
			sub: m.module_sight_reading_sub
		},
		{
			href: '/rhythm',
			name: m.nav_rhythm,
			description: m.module_rhythm_description,
			sub: m.module_rhythm_sub
		},
		{
			href: '/theory',
			name: m.nav_theory,
			description: m.module_theory_description,
			sub: m.module_theory_sub
		},
		{
			href: '/ear',
			name: m.nav_ear,
			description: m.module_ear_description,
			sub: m.module_ear_sub
		}
	] as const;

	const entry = $derived(continueStore.entry);
	const welcome = m.welcome();
</script>

<svelte:head>
	<title>{m.page_title({ page: m.nav_dashboard() })}</title>
</svelte:head>

<div class="page">
	{#if entry}
		<section aria-labelledby="continue-heading">
			<h2 id="continue-heading" class="label">{m.continue_heading()}</h2>
			<a class="continue" href={resolve(MODULE_ROUTES[entry.module])}>
				<span class="continue-name">{m.continue_heading()}</span>
				<span class="continue-detail">{entry.summary}</span>
				<span class="continue-action">{m.continue_action()}</span>
			</a>
		</section>
	{:else}
		<section class="prose welcome" style="display: flow-root">
			<p><DropCap letter={welcome.charAt(0)} />{welcome.slice(1)}</p>
		</section>
	{/if}

	<section aria-labelledby="modules-heading">
		<h2 id="modules-heading" class="label">{m.modules_heading()}</h2>
		<ul class="modules">
			{#each modules as module (module.href)}
				<li>
					<a href={resolve(module.href)}>
						<span class="module-name">{module.name()}</span>
						<span>{module.description()}</span>
						<span class="quiet">{module.sub()}</span>
						<span class="quiet open">{m.module_open()}</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	.continue {
		display: grid;
		gap: 0.25rem;
		padding: 1.25rem 1.5rem;
		border: 1px solid var(--accent);
		background: var(--accent-soft);
		border-radius: var(--radius);
		text-decoration: none;
	}

	.continue-name {
		font-size: 1.3rem;
	}

	.continue-action,
	.quiet {
		color: var(--ink-soft);
		font-size: 0.9rem;
	}

	.welcome {
		margin-bottom: 1rem;
	}

	.modules {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
		gap: 1rem;
	}

	.modules a {
		display: grid;
		gap: 0.2rem;
		height: 100%;
		padding: 1.1rem 1.2rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		text-decoration: none;
		transition: border-color 120ms ease;
	}

	.modules a:hover {
		border-color: var(--ink-soft);
	}

	.module-name {
		font-size: 1.1rem;
		font-weight: 600;
	}

	.open {
		margin-top: 0.5rem;
	}
</style>
