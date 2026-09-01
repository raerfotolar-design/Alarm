import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function safeFileName(title: string): string {
  const cleaned = title.trim().replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ _-]/g, '').slice(0, 60);
  return cleaned.length > 0 ? cleaned : 'raer-not';
}

export async function exportTextAsFile(title: string, content: string): Promise<void> {
  const fileName = `${safeFileName(title)}.txt`;
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(content);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/plain', dialogTitle: title });
  }
}

export async function exportAllAsFile(
  fileName: string,
  sections: { heading: string; body: string }[]
): Promise<void> {
  const content = sections.map((s) => `## ${s.heading}\n\n${s.body}`).join('\n\n---\n\n');
  await exportTextAsFile(fileName, content);
}
