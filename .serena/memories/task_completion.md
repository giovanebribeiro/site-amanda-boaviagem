# Task Completion

Run before marking any coding task done:

```sh
npm run lint    # must pass with no errors (also runs automatically before npm run dev)
```

No test suite exists. Verify visual output via `npm run dev` (localhost:3000).

For releases: `npm run release` then push tags to trigger Netlify deploy.
