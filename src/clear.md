# Clear generated files

Run these from the repo root. They delete everything inside each folder and keep the folders themselves.

```bash
find src/marp-inline-slide -mindepth 1 -delete &&
find wiki/pages -mindepth 1 -delete
```

To see what would be deleted first, run the same commands without `-delete`:

```bash
find src/marp-inline-slide wiki/pages -mindepth 1
```
