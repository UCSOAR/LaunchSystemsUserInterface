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
		switchCommand: string;
		enableCommand: string;
		disableCommand: string;
		settings?: any;
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
			switchCommand: 'RSC_CAMERA1_SWITCH',
			enableCommand: 'RSC_CAM1_ENABLE',
			disableCommand: 'RSC_CAM1_DISABLE'
		},
		{
			id: 2,
			name: 'Camera 2',
			enabled: false,
			switchCommand: 'RSC_CAMERA2_SWITCH',
			enableCommand: 'RSC_CAM2_ENABLE',
			disableCommand: 'RSC_CAM2_DISABLE'
		},
		{
			id: 3,
			name: 'Camera 3',
			enabled: false,
			switchCommand: 'RSC_CAMERA3_SWITCH',
			enableCommand: 'RSC_CAM3_ENABLE',
			disableCommand: 'RSC_CAM3_DISABLE'
		}
	];

// per-camera settings map (keeps settings separate so each camera is independent)
const defaultCameraSettings = (id: number) => ({
	recording: false,
	frequencyMHz: 1258,
	power: '25mW'
});

let cameraSettings: Record<number, any> = {};
// ensure defaults are available during SSR to avoid undefined template reads
for (const c of cameras) cameraSettings[c.id] = defaultCameraSettings(c.id);

// initialize per-camera defaults for SSR so template bindings are safe
// per-camera busy flags for pending commands (not persisted)
let cameraBusy: Record<number, boolean> = {};
for (const c of cameras) cameraBusy[c.id] = false;

let loadedPersistedState = false;
let globalVideoTxOn = false;
let globalVideoFrequencyMHz = 1258;
let globalVideoPower = '25mW';

// settings will be initialized on mount (browser-only)

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

		// load camera persisted states (browser-only)
		try {
			if (typeof window !== 'undefined') {
				const raw = localStorage.getItem('camera_states');
				if (raw) {
					const parsed = JSON.parse(raw);
					// support legacy format where parsed is a map of id -> {enabled,settings}
					const data = parsed.cameras ? parsed : { cameras: parsed, selectedCameraId: parsed.selectedCameraId };
					// restore enabled flags and separate settings map
					cameraSettings = {};
					cameras = cameras.map((c) => {
						const saved = data.cameras[c.id] ?? {};
						cameraSettings[c.id] = { ...defaultCameraSettings(c.id), ...(saved.settings ?? saved) };
						return { ...c, enabled: saved.enabled ?? c.enabled };
					});
					// restore selectedCameraId if present
					if (data.selectedCameraId) selectedCameraId = data.selectedCameraId;
						// restore global video tx state if present
						if (data.videoTxOn !== undefined) globalVideoTxOn = data.videoTxOn;
						if (data.videoFrequencyMHz !== undefined) globalVideoFrequencyMHz = data.videoFrequencyMHz;
						if (data.videoPower !== undefined) globalVideoPower = data.videoPower;
				} else {
					cameraSettings = {};
					cameras = cameras.map((c) => {
						cameraSettings[c.id] = defaultCameraSettings(c.id);
						return c;
					});
				}
			}
		} catch (e) {
			cameraSettings = {};
			cameras = cameras.map((c) => {
				cameraSettings[c.id] = defaultCameraSettings(c.id);
				return c;
			});
		}

		// mark that initial load finished so reactive persist can start
		loadedPersistedState = true;

		return () => {
			clearInterval(heartbeatInterval);
		};
	});

	const setCameraEnabled = async (camera: Camera, enabled: boolean) => {
		cameras = cameras.map((currentCamera) =>
			currentCamera.id === camera.id ? { ...currentCamera, enabled } : currentCamera
		);

		await writeArbitraryCommand('NODE_FCB', enabled ? camera.enableCommand : camera.disableCommand);

		// persist camera enabled state and settings
		if (loadedPersistedState) persistCameraStates();
	};

	const handleCameraToggle = async (event: Event, camera: Camera) => {
		const target = event.target as HTMLInputElement;
		await setCameraEnabled(camera, target.checked);
	};

	const selectCamera = async (camera: Camera) => {
		if (camera.id === selectedCameraId) return;

		selectedCameraId = camera.id;
		await writeArbitraryCommand('NODE_FCB', camera.switchCommand);
	};

const persistCameraStates = () => {
	try {
		const map: Record<number, any> = {};
		for (const c of cameras) map[c.id] = { enabled: c.enabled, settings: cameraSettings[c.id] };
		const payload = {
			selectedCameraId,
			cameras: map,
			videoTxOn: globalVideoTxOn,
			videoFrequencyMHz: globalVideoFrequencyMHz,
			videoPower: globalVideoPower
		};
		localStorage.setItem('camera_states', JSON.stringify(payload));
	} catch (e) {
		// ignore
	}
};

const updateCameraSetting = async (cameraId: number, partial: Partial<any>) => {
	cameraSettings = { ...cameraSettings, [cameraId]: { ...cameraSettings[cameraId], ...partial } };
	// persist immediately
	if (loadedPersistedState) persistCameraStates();
};

const sendCameraCommand = async (cameraId: number, command: string) => {
	// forward to backend / proto via existing command mechanism
	await writeArbitraryCommand('NODE_FCB', command);
};

// reactive: persist when cameraSettings or cameras or selectedCameraId change after initial load
$: if (loadedPersistedState) {
	// reference these so Svelte tracks them
	cameraSettings; cameras; selectedCameraId;
	persistCameraStates();
}

const pressPowerButton = async (cameraId: number) => {
	await sendCameraCommand(cameraId, `RSC_CAM${cameraId}_POWER_BUTTON`);
};

const pressWifiButton = async (cameraId: number) => {
	await sendCameraCommand(cameraId, `RSC_CAM${cameraId}_WIFI_BUTTON`);
};

const toggleRecording = async (cameraId: number) => {
	const prev = cameraSettings[cameraId]?.recording;
	const next = !prev;

	// immediate toggle for UI
	cameraSettings = { ...cameraSettings, [cameraId]: { ...cameraSettings[cameraId], recording: next } };
	persistCameraStates();

	// send command in background (do not block UI)
	sendCameraCommand(cameraId, next ? `RSC_CAM${cameraId}_REC_START` : `RSC_CAM${cameraId}_REC_STOP`).catch(() => {
		// optionally revert on failure — for now, leave UI toggled
	});
};

const toggleVideoTx = async (cameraId: number) => {
	// legacy per-camera toggle — map to global toggle
	globalVideoTxOn = !globalVideoTxOn;
	persistCameraStates();
	// send global command
	sendCameraCommand(0, globalVideoTxOn ? `RSC_CAM_TX_ON` : `RSC_CAM_TX_OFF`).catch(() => {});
};

const toggleVideoTxGlobal = async () => {
	globalVideoTxOn = !globalVideoTxOn;
	persistCameraStates();
	sendCameraCommand(0, globalVideoTxOn ? `RSC_CAM_TX_ON` : `RSC_CAM_TX_OFF`).catch(() => {});
};

const setGlobalVideoFrequency = async (freqMHz: number) => {
	const clamped = Math.max(1258, Math.min(1280, Math.round(freqMHz)));
	// send global freq command
	sendCameraCommand(0, `RSC_CAM_TX_FREQ_${clamped}`).catch(() => {});
	globalVideoFrequencyMHz = clamped;
	if (loadedPersistedState) persistCameraStates();
};

const setGlobalVideoPower = async (power: string) => {
	const numeric = power.replace(/[^0-9]/g, '') || '25';
	sendCameraCommand(0, `RSC_CAM_TX_POWER_${numeric}`).catch(() => {});
	globalVideoPower = power;
	if (loadedPersistedState) persistCameraStates();
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
			{#if selectedCamera.enabled}
				<div class="video-placeholder">
					<div class="camera-mark">{selectedCamera.id}</div>
					<p>{selectedCamera.name}</p>
				</div>
			{/if}

			<div class="camera-settings">
				<h3>{selectedCamera.name} — Settings</h3>
				<div class="settings-row">
					<button class="btn" on:click={() => pressPowerButton(selectedCamera.id)}>Power Button</button>
					<button class="btn" on:click={() => pressWifiButton(selectedCamera.id)}>WiFi Button</button>
					<button class="btn {cameraSettings[selectedCamera.id].recording ? 'recording' : ''}" on:click={() => toggleRecording(selectedCamera.id)}>
						{#if cameraSettings[selectedCamera.id].recording}
							Recording
						{:else}
							Start Recording
						{/if}
					</button>
				</div>
				<!-- Frequency and Power are global controls (see right panel) -->
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

		<div class="global-tx">
			<p class="tx-label">Video TX</p>
			<SlideToggle
				name="global_video_tx"
				active="bg-primary-500 dark:bg-primary-500"
				size="sm"
				checked={globalVideoTxOn}
				on:click={() => toggleVideoTxGlobal()}
			/>
			<div class="global-tx-controls">
				<label>Frequency (MHz)
					<select class="numeric-input" bind:value={globalVideoFrequencyMHz} on:change={(e) => setGlobalVideoFrequency(Number((e.target).value))}>
						<option value={1258}>1258</option>
						<option value={1280}>1280</option>
					</select>
				</label>
				<label>Power
					<select class="power-select" bind:value={globalVideoPower} on:change={(e) => setGlobalVideoPower((e.target).value)}>
						<option>25mW</option>
						<option>200mW</option>
						<option>1W</option>
						<option>4W</option>
					</select>
				</label>
			</div>
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

	.camera-settings {
		display: grid;
		gap: 0.75rem;
		color: rgba(255,255,255,0.9);
		padding: 1rem;
	}

	.settings-row {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.btn {
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		background: rgba(255,255,255,0.06);
		border: 1px solid rgba(255,255,255,0.08);
		color: inherit;
		font-weight:700;
	}

	.btn.recording {
		background: rgb(var(--color-success-400));
		color: white;
		border-color: rgb(var(--color-success-400));
	}

	/* make power and frequency text black (camera settings and global controls) */
	.camera-settings .numeric-input,
	.camera-settings .power-select,
	.global-tx-controls .numeric-input,
	.global-tx-controls .power-select {
		color: black;
		background: white;
		border-radius: 4px;
		padding: 0.25rem 0.4rem;
		border: 1px solid rgba(0,0,0,0.15);
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
