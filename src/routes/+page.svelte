<script lang="ts">
	import { resolve } from '$app/paths';
	import DropCap from '#lib/brand/DropCap.svelte';
	import { continueStore, MODULE_ROUTES } from '#lib/state/modulePrefs.svelte.ts';

	const modules = [
		{
			href: '/sight-reading',
			name: 'Sight reading',
			description: 'Dandelot-style reading',
			sub: 'Performance · Practice'
		},
		{
			href: '/rhythm',
			name: 'Inner rhythm',
			description: 'Jazz rhythm reading',
			sub: 'Reading · Polyrhythm'
		},
		{
			href: '/theory',
			name: 'Music theory',
			description: 'Jazz harmony',
			sub: 'Three parent scales'
		},
		{
			href: '/ear',
			name: 'Ear training',
			description: 'Hear jazz harmony',
			sub: 'Chords · Modes · more'
		}
	] as const;

	const entry = $derived(continueStore.entry);
</script>

<svelte:head>
	<title>Dashboard · D.O.lfine</title>
</svelte:head>

<div class="page">
	{#if entry}
		<section aria-labelledby="continue-heading">
			<h2 id="continue-heading" class="label">Continue</h2>
			<a class="continue" href={resolve(MODULE_ROUTES[entry.module])}>
				<span class="continue-name">Continue</span>
				<span class="continue-detail">{entry.summary}</span>
				<span class="continue-action">Resume with your last settings</span>
			</a>
		</section>
	{:else}
		<section class="prose welcome" style="display: flow-root">
			<p>
				<DropCap letter="W" />elcome to D.O.lfine, a quiet place to practise reading, rhythm and
				harmony. Choose a module below, set it exactly as you like, and start. Nothing here adapts
				on its own yet: every level and setting is yours to pick.
			</p>
		</section>
	{/if}

	<section aria-labelledby="modules-heading">
		<h2 id="modules-heading" class="label">Modules</h2>
		<ul class="modules">
			{#each modules as module (module.href)}
				<li>
					<a href={resolve(module.href)}>
						<span class="module-name">{module.name}</span>
						<span>{module.description}</span>
						<span class="quiet">{module.sub}</span>
						<span class="quiet open">Open setup →</span>
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
