const result = await Bun.build({
  entrypoints: ['./src/main.ts'],
  outdir: './dist',
  minify: true,
  sourcemap: 'inline',
  target: 'browser',
});

if (result.success) {
  console.log('Build complete!');
} else {
  console.error('Build failed:', result.logs);
}

export { };
