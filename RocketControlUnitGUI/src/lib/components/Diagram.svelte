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

  .diagram-wrapper :global(.added-sensor text),
  .diagram-wrapper :global(.added-heater text) {
    fill: var(--diagram-outline-color);
    font-family: Quicksand, sans-serif;
    font-size: 13px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .diagram-wrapper :global(.added-sensor circle),
  .diagram-wrapper :global(.added-sensor line),
  .diagram-wrapper :global(.added-sensor polyline),
  .diagram-wrapper :global(.added-heater rect),
  .diagram-wrapper :global(.added-heater path) {
    stroke: var(--diagram-outline-color);
  }

  .diagram-wrapper :global(#Pressure\ Vessel) {
    display: none;
  }

  .diagram-wrapper :global(#VENT) {
    display: none;
  }

  .diagram-wrapper :global(.diagram-label) {
    fill: var(--diagram-outline-color);
    font-family: Quicksand, sans-serif;
    font-size: 15px;
    text-anchor: middle;
    dominant-baseline: middle;
  }
</style>