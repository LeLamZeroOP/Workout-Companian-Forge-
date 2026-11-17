export function downloadJson(name: string, value: unknown) {
  const anchor = document.createElement('a');
  const focused = document.activeElement;
  let url: string | undefined;
  try {
    url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
    anchor.href = url; anchor.download = name; anchor.hidden = true;
    document.body.append(anchor); anchor.click();
  } finally {
    anchor.remove();
    if (focused instanceof HTMLElement && focused.isConnected) focused.focus({ preventScroll: true });
    if (url) { const createdUrl = url; window.setTimeout(() => URL.revokeObjectURL(createdUrl), 1000); }
  }
}
export function readBackup(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024) return Promise.reject(new Error('Backup exceeds the 10 MB limit.'));
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Could not read backup.')); reader.readAsText(file);
  });
}
