'use strict';

const http = require('node:http');
const https = require('node:https');

// Proxy target for the vite dev server. Deliberately NOT the browser-facing
// APP_URL from compose.yaml: that is the OrbStack HTTPS domain, whose
// certificate node's https client rejects ("self-signed certificate in
// certificate chain" — node ignores the system CA store), 500-ing every
// proxied page request so the browser never loads testem.js. The dev server
// is colocated in this container, so target it directly over plain http.
const APP_URL = process.env.TESTEM_APP_URL || 'http://127.0.0.1:4200';

function testemProxy(targetURL) {
  const target = new URL(targetURL);
  const transport = target.protocol === 'https:' ? https : http;

  return function testemProxyHandler(app) {
    app.all('*', (req, res, next) => {
      let url = req.url;

      if (url === '/testem.js' || url.startsWith('/testem/')) {
        return next();
      }

      let match = /^(\/\d+)\/tests\/index.html/.exec(url);

      if (match) {
        url = url.slice(match[1].length);
      }

      let upstream = new URL(url, target);
      let proxyRequest = transport.request(
        upstream,
        {
          method: req.method,
          headers: {
            ...req.headers,
            host: upstream.host,
          },
        },
        (proxyResponse) => {
          res.statusCode = proxyResponse.statusCode ?? 500;

          if (proxyResponse.statusMessage) {
            res.statusMessage = proxyResponse.statusMessage;
          }

          for (let [header, value] of Object.entries(proxyResponse.headers)) {
            if (value !== undefined) {
              res.setHeader(header, value);
            }
          }

          proxyResponse.pipe(res);
        }
      );

      proxyRequest.on('error', (error) => {
        res.status(500).json({
          message: error.message,
        });
      });

      req.pipe(proxyRequest);
    });
  };
}

module.exports = {
  test_page: 'tests/index.html?hidepassed',
  disable_watching: true,
  launch_in_ci: ['chromium'],
  launch_in_dev: ['chromium'],
  browser_start_timeout: 120,
  browser_args: {
    chromium: {
      ci: [
        process.env.CI ||
        (typeof process.getuid === 'function' && process.getuid() === 0)
          ? '--no-sandbox'
          : null,
        '--headless',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
        // Same fix as testem.js: without this, the dev-container Chromium's
        // GPU process can crash on launch and the browser never connects to
        // testem within the timeout, failing every `test:ember:dev` run.
        '--disable-gpu',
        '--mute-audio',
        '--remote-debugging-port=0',
        '--window-size=1440,900',
      ].filter(Boolean),
    },
  },
  middleware: [testemProxy(APP_URL)],
};
