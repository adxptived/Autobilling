const { execFile } = require('child_process');
const path = require('path');

const distPath = path.resolve(__dirname, '..', 'dist');
const url = 'chrome://extensions';

function openChromeExtensions() {
  const candidates = process.platform === 'win32'
    ? [
        'chrome.exe',
        path.join(process.env.ProgramFiles || '', 'Google/Chrome/Application/chrome.exe'),
        path.join(process.env['ProgramFiles(x86)'] || '', 'Google/Chrome/Application/chrome.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
        'msedge.exe',
      ]
    : process.platform === 'darwin'
      ? ['open']
      : ['google-chrome', 'chromium', 'xdg-open'];

  function tryNext(index) {
    if (index >= candidates.length) {
      console.log(`Open ${url} manually, then choose: ${distPath}`);
      return;
    }

    const command = candidates[index];
    const args = process.platform === 'darwin' && command === 'open'
      ? ['-a', 'Google Chrome', url]
      : [url];

    execFile(command, args, (error) => {
      if (error) return tryNext(index + 1);
      console.log(`Opened ${url}`);
      console.log(`Click "Load unpacked" and select: ${distPath}`);
    });
  }

  tryNext(0);
}

openChromeExtensions();
