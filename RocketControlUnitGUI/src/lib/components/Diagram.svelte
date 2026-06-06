<script>
  import MainBackgroundLight from '$lib/MainBackground.svg?raw';
  import MainBackgroundDark from '$lib/MainBackgroundDark.svg?raw';
</script>

<div class="diagram-wrapper">
  <div class="light-svg">{@html MainBackgroundLight}</div>
  <div class="dark-svg">{@html MainBackgroundDark}</div>
</div>

<style>
  .diagram-wrapper {
    width: 100%;
    height: 100%;
  }

  .diagram-wrapper :global(svg) {
    width: 100%;
    height: 100%;
  }

  /* Light mode: show light, hide dark */
  .dark-svg { display: none; }

  /* Dark mode: hide light, show dark */
  :global(.dark) .light-svg { display: none; }
  :global(.dark) .dark-svg { display: block; }

  .diagram-wrapper :global(svg *) {
    transition: all 0.15s ease;
  }
</style>