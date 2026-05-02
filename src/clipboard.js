// Autobilling clipboard helpers

function copyToClipboard(text, onDone) {
  if (!text) return;
  function done() {
    if (onDone) onDone(text);
  }

  navigator.clipboard.writeText(text).then(done).catch(function () {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    done();
  });
}
