import * as fs from 'node:fs';

const filename = './node_modules/nextra-theme-docs/dist/style.css';

fs.readFile(filename, 'utf8', (err, data) => {
  if (err) {
    // biome-ignore lint/suspicious/noConsoleLog: Allowed in script
    console.log(err);
    return;
  }

  if (data.includes('@layer nextra')) {
    return;
  }

  const newContent = `
@layer nextra {
  ${data}
}
`;

  fs.writeFile(filename, newContent, 'utf8', (err) => {
    if (err) {
      // biome-ignore lint/suspicious/noConsoleLog: Allowed in script
      console.log(err);
    }
  });
});
