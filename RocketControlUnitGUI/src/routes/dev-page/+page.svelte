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
    let flashPending = false;
    let explodeActive = false;

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

    // Immediate UI toggle; backend write is fire-and-forget to avoid UI lag
    const toggleAirBrakes = () => {
        const nextOpenAirBrakes = !openAirBrakes;
        openAirBrakes = nextOpenAirBrakes;

        // Fire-and-forget; log errors but don't block UI
        writeArbitraryCommand(
            'NODE_FCB',
            nextOpenAirBrakes ? 'RSC_AIR_BRAKES_ENABLE' : 'RSC_AIR_BRAKES_DISABLE'
        ).catch((err) => console.error('AirBrakes command failed', err));
    };

    // Sends the flash erase command via PocketBase. Command name: ERASE_FLASH
    const eraseFlash = async () => {
        if (flashPending) return;

        flashPending = true;

        try {
            await writeArbitraryCommand('NODE_PBB', 'RSC_ERASE_FLASH');
        } finally {
            flashPending = false;
        }
    };
</script>

<svelte:head>
    <title>Dev Page</title>
</svelte:head>

<main class="dev-page">
    <section class="half half-left">
        <button
            type="button"
            class="dev-switch"
            class:open={openAirBrakes}
            on:click={toggleAirBrakes}
            aria-pressed={openAirBrakes}
        >
            <span class="switch-state">{openAirBrakes ? 'Open' : 'Closed'}</span>
            <span class="switch-label">Air Brakes</span>
        </button>
    </section>

    <section class="half half-right">
        <button
            type="button"
            class="dev-switch"
            class:pending={flashPending}
            on:click={eraseFlash}
            aria-pressed={flashPending}
            disabled={flashPending}
        >
            <span class="switch-state">{flashPending ? 'Erasing' : 'Idle'}</span>
            <span class="switch-label">Erase Flash</span>
        </button>
    </section>

    <!-- Explode prank button: small, bottom-centered -->
    <button
        type="button"
        class="explode-btn"
        on:click={() => {
            if (explodeActive) return;
            explodeActive = true;
            setTimeout(() => (explodeActive = false), 1200);
        }}
        aria-pressed={explodeActive}
    >
        {#if explodeActive}
            🚀 BOOM!
        {:else}
            Explode
        {/if}
    </button>
</main>

<style>
    .dev-page {
        display: grid;
        grid-template-columns: 1fr 1fr;
        width: 100%;
        height: 100%;
        min-height: calc(100vh - 5rem);
        padding: 1rem;
        gap: 1rem;
        background: rgb(var(--color-surface-900));
    }

    .half {
        display: block;
        width: 100%;
        height: 100%;
    }

    .dev-switch {
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

    .dev-switch.open {
        border-color: rgb(var(--color-primary-500));
        background:
            linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px),
            rgb(var(--color-primary-900));
        background-size: 4rem 4rem;
    }

    .dev-switch.pending {
        border-color: rgb(var(--color-amber-500));
        background: linear-gradient(180deg, rgba(255,255,255,0.02), transparent), rgb(var(--color-surface-900));
    }

    .dev-switch:disabled {
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
        .dev-page {
            grid-template-columns: 1fr;
            min-height: calc(100vh - 4rem);
            padding: 0.75rem;
        }

        .dev-switch {
            min-height: 24rem;
        }
    }

    .explode-btn {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        bottom: 1.25rem;
        background: rgb(var(--color-rose-600));
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 999px;
        box-shadow: 0 6px 18px rgba(0,0,0,0.35);
        cursor: pointer;
        font-weight: 700;
        transition: transform 0.12s ease, opacity 0.12s ease;
        z-index: 60;
    }

    .explode-btn[aria-pressed="true"] {
        transform: translateX(-50%) scale(1.08);
        opacity: 0.95;
    }

</style>
