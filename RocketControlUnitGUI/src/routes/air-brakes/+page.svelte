<script lang="ts">
	import { onMount } from 'svelte';
	import { initTimestamps } from '$lib/timestamps';
	import { initStores, auth } from '$lib/stores';
	import { usePocketbase } from '$lib/hooks/usePocketbase';

	const timestamps = initTimestamps();
	const stores = initStores();
	const { authenticate, sendHeartbeat, writeArbitraryCommand } = usePocketbase(timestamps, stores);

	let openAirBrakes = false;
	let commandPending = false;

	onMount(() => {
		let heartbeatInterval: ReturnType<typeof setInterval>;

		const handleAuth = async () => {
			$auth = await authenticate();

			if ($auth === true) {
				heartbeatInterval = setInterval(async () => {
					await sendHeartbeat();
				}, 5000);
			}
		};

		handleAuth();

		return () => {
			clearInterval(heartbeatInterval);
		};
	});

	const toggleAirBrakes = async () => {
		if (commandPending) return;

		const nextOpenAirBrakes = !openAirBrakes;
		openAirBrakes = nextOpenAirBrakes;
		commandPending = true;

		try {
			await writeArbitraryCommand(
				'NODE_FCB',
				nextOpenAirBrakes ? 'RSC_AIR_BRAKES_ENABLE' : 'RSC_AIR_BRAKES_DISABLE'
			);
		} finally {
			commandPending = false;
		}
	};
</script>

<svelte:head>
	<title>Air Brakes</title>
</svelte:head>

<main class="air-brakes-page">
	<button
		type="button"
		class:open={openAirBrakes}
		class="air-brakes-switch"
		on:click={toggleAirBrakes}
		aria-pressed={openAirBrakes}
		disabled={commandPending}
	>
		<span class="switch-state">{openAirBrakes ? 'Open' : 'Closed'}</span>
		<span class="switch-label">Air Brakes</span>
	</button>
</main>

<style>
	.air-brakes-page {
		display: grid;
		width: 100%;
		height: 100%;
		min-height: calc(100vh - 5rem);
		padding: 1rem;
		background: rgb(var(--color-surface-900));
	}

	.air-brakes-switch {
		display: grid;
		place-items: center;
		align-content: center;
		gap: 1rem;
		width: 100%;
		height: 100%;
		min-height: 28rem;
		border: 2px solid rgba(255, 255, 255, 0.16);
		background:
			linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
			#10131a;
		background-size: 4rem 4rem;
		color: rgba(255, 255, 255, 0.86);
		text-transform: uppercase;
		transition:
			border-color 0.16s ease,
			background-color 0.16s ease,
			color 0.16s ease;
	}

	.air-brakes-switch.open {
		border-color: rgb(var(--color-primary-500));
		background:
			linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px),
			rgb(var(--color-primary-900));
		background-size: 4rem 4rem;
	}

	.air-brakes-switch:disabled {
		cursor: wait;
		opacity: 0.78;
	}

	.switch-state {
		font-size: clamp(4rem, 11vw, 11rem);
		font-weight: 800;
		line-height: 0.9;
	}

	.switch-label {
		font-size: clamp(1.25rem, 3vw, 2.75rem);
		font-weight: 700;
		letter-spacing: 0;
	}

	@media (max-width: 700px) {
		.air-brakes-page {
			min-height: calc(100vh - 4rem);
			padding: 0.75rem;
		}

		.air-brakes-switch {
			min-height: 24rem;
		}
	}
</style>
