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
          '--disable-software-rasterizer',
          // GitHub Actions runners have no real GPU; without this, Chromium's
          // GPU process intermittently crashes on launch ("Network service
          // crashed", "GpuControl.CreateCommandBuffer" errors) and the whole
          // browser then never connects to testem within the 120s timeout,
          // failing every test in the run rather than just the WebGL-dependent
          // ones. Doesn't change which tests pass/fail otherwise — WebGL/map
          // tests already can't run here regardless (see TODO.md).
          '--disable-gpu',
          '--mute-audio',
          '--remote-debugging-port=0',
          '--window-size=1440,900',
        ].filter(Boolean),
      },
    },
  };
}
