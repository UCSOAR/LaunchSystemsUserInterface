<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    onMount(() => {
        // Redirect legacy /air-brakes to /dev-page
        goto('/dev-page');
    });
</script>

<svelte:head>
    <title>Redirecting…</title>
</svelte:head>

<main style="padding:2rem;">
    <p>Redirecting to Dev Page…</p>
</main>
