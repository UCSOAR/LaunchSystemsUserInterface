<script lang="ts">
	import { onMount } from 'svelte';
	import { SlideToggle } from '@skeletonlabs/skeleton';
	import { initTimestamps } from '$lib/timestamps';
	import { initStores, auth } from '$lib/stores';
	import { usePocketbase } from '$lib/hooks/usePocketbase';

	type Camera = {
		id: number;
		name: string;
		enabled: boolean;
		enableCommand: string;
		disableCommand: string;
	};

	const timestamps = initTimestamps();
	const stores = initStores();
	const { authenticate, sendHeartbeat, writeArbitraryCommand } = usePocketbase(timestamps, stores);

	let selectedCameraId = 1;
	let cameras: Camera[] = [
		{
			id: 1,
			name: 'Camera 1',
			enabled: false,
			enableCommand: 'RSC_CAM1_ENABLE',
			disableCommand: 'RSC_CAM1_DISABLE'
		},
		{
			id: 2,
			name: 'Camera 2',
			enabled: false,
			enableCommand: 'RSC_CAM2_ENABLE',
			disableCommand: 'RSC_CAM2_DISABLE'
		},
		{
			id: 3,
			name: 'Camera 3',
			enabled: false,
			enableCommand: 'RSC_CAM3_ENABLE',
			disableCommand: 'RSC_CAM3_DISABLE'
		}
	];

	$: selectedCamera = cameras.find((camera) => camera.id === selectedCameraId) ?? cameras[0];

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

	const setCameraEnabled = async (camera: Camera, enabled: boolean) => {
		cameras = cameras.map((currentCamera) =>
			currentCamera.id === camera.id ? { ...currentCamera, enabled } : currentCamera
		);

		await writeArbitraryCommand('NODE_FCB', enabled ? camera.enableCommand : camera.disableCommand);
	};

	const handleCameraToggle = async (event: Event, camera: Camera) => {
		const target = event.target as HTMLInputElement;
		await setCameraEnabled(camera, target.checked);
	};

	const selectCamera = async (camera: Camera) => {
		if (camera.id === selectedCameraId) return;

		const switchCount = (camera.id - selectedCameraId + cameras.length) % cameras.length;
		selectedCameraId = camera.id;

		for (let i = 0; i < switchCount; i++) {
			await writeArbitraryCommand('NODE_FCB', 'RSC_CAMERA_SWITCH');
		}
	};
</script>

<svelte:head>
	<title>Live Feed</title>
</svelte:head>

<main class="live-feed-page">
	<section class="feed-panel" aria-label="Live camera feed">
		<div class="feed-toolbar">
			<p class="feed-title">{selectedCamera.name}</p>
			<p class:online={selectedCamera.enabled} class="feed-status">
				{selectedCamera.enabled ? 'Enabled' : 'Disabled'}
			</p>
		</div>

		<div class="video-window">
			<div class="video-placeholder">
				<div class="camera-mark">{selectedCamera.id}</div>
				<p>{selectedCamera.name}</p>
			</div>
		</div>
	</section>

	<aside class="camera-controls" aria-label="Camera controls">
		<div class="camera-selector">
			{#each cameras as camera}
				<button
					type="button"
					class:selected={camera.id === selectedCameraId}
					class="camera-select-button"
					on:click={() => selectCamera(camera)}
					aria-pressed={camera.id === selectedCameraId}
				>
					{camera.name}
				</button>
			{/each}
		</div>

		<div class="camera-toggles">
			{#each cameras as camera}
				<div class="camera-toggle-row">
					<div>
						<p>{camera.name}</p>
						<span>{camera.enabled ? 'Enabled' : 'Disabled'}</span>
					</div>

					<SlideToggle
						name={`camera_${camera.id}_toggle`}
						active="bg-primary-500 dark:bg-primary-500"
						size="sm"
						checked={camera.enabled}
						on:click={(event) => handleCameraToggle(event, camera)}
					/>
				</div>
			{/each}
		</div>
	</aside>
</main>

<style>
	.live-feed-page {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 20rem;
		gap: 1rem;
		width: 100%;
		height: 100%;
		min-height: calc(100vh - 5rem);
		padding: 1rem;
		background: rgb(var(--color-surface-900));
	}

	.feed-panel,
	.camera-controls {
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.035);
	}

	.feed-panel {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		min-height: 0;
	}

	.feed-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		min-height: 3.25rem;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.12);
	}

	.feed-title {
		font-size: 1.1rem;
		font-weight: 700;
	}

	.feed-status {
		min-width: 5.5rem;
		padding: 0.25rem 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 999px;
		color: rgb(var(--color-warning-400));
		text-align: center;
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.feed-status.online {
		color: rgb(var(--color-success-400));
	}

	.video-window {
		display: grid;
		place-items: center;
		min-height: 0;
		margin: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.16);
		background:
			linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
			#05070b;
		background-size: 3rem 3rem;
	}

	.video-placeholder {
		display: grid;
		place-items: center;
		gap: 0.75rem;
		color: rgba(255, 255, 255, 0.62);
		font-weight: 700;
		text-transform: uppercase;
	}

	.camera-mark {
		display: grid;
		place-items: center;
		width: 5rem;
		height: 5rem;
		border: 2px solid rgba(255, 255, 255, 0.36);
		border-radius: 50%;
		font-size: 2rem;
		color: rgba(255, 255, 255, 0.82);
	}

	.camera-controls {
		display: grid;
		align-content: start;
		gap: 1rem;
		padding: 1rem;
	}

	.camera-selector {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.5rem;
	}

	.camera-select-button {
		min-height: 2.5rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.05);
		color: inherit;
		font-weight: 700;
	}

	.camera-select-button.selected {
		border-color: rgb(var(--color-primary-500));
		background: rgb(var(--color-primary-500));
		color: white;
	}

	.camera-toggles {
		display: grid;
		gap: 0.75rem;
	}

	.camera-toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		min-height: 4.5rem;
		padding: 0.85rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.04);
	}

	.camera-toggle-row p {
		font-weight: 700;
	}

	.camera-toggle-row span {
		color: rgba(255, 255, 255, 0.62);
		font-size: 0.8rem;
	}

	@media (max-width: 900px) {
		.live-feed-page {
			grid-template-columns: 1fr;
			grid-template-rows: minmax(26rem, 1fr) auto;
			min-height: auto;
		}

		.camera-controls {
			order: -1;
		}
	}
</style>
