'use strict';

if (typeof module !== 'undefined') {
  module.exports = {
    test_page: 'tests/index.html?hidepassed',
    disable_watching: true,
    launch_in_ci: ['chromium'],
    launch_in_dev: ['chromium'],
    browser_start_timeout: 120,
    browser_args: {
      chromium: {
        ci: [
          // --no-sandbox is needed when running chromium inside a container
          // include when running in CI or when the process is running as root
          process.env.CI ||
          (typeof process.getuid === 'function' && process.getuid() === 0)
            ? '--no-sandbox'
            : null,
          '--headless',
          '--disable-dev-shm-usage',
          // GitHub Actions runners have no real GPU; without this, Chromium's
          // GPU process intermittently crashes on launch ("Network service
          // crashed", "GpuControl.CreateCommandBuffer" errors) and the whole
          // browser then never connects to testem within the 120s timeout,
          // failing every test in the run rather than just the WebGL-dependent
          // ones. Deliberately NOT paired with --disable-software-rasterizer
          // (this repo used to pass both): that flag blocks headless Chromium's
          // software WebGL fallback entirely, which is what let MapLibre/map
          // tests actually run at all instead of being permanently skipped
          // (see tests/helpers/webgl.ts, TODO.md). --disable-gpu alone doesn't
          // affect that fallback — verified directly against this same
          // Chromium build.
          '--disable-gpu',
          '--mute-audio',
          '--remote-debugging-port=0',
          '--window-size=1440,900',
        ].filter(Boolean),
      },
    },
  };
}
