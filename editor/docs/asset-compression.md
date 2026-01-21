# Asset compression

This project loads large `.glb` files and high-res textures. To cut load time:

1) Compress GLB meshes (Draco):
```bash
npx gltf-transform draco input.glb output.glb
```

2) Convert textures to KTX2 (BasisU):
```bash
toktx --bcmp --t2 --assign-oetf sRGB --assign-primaries bt709 output.ktx2 input.png
```

3) Repack GLB to reference KTX2 textures:
```bash
npx gltf-transform etc1s input.glb output.glb --basisu /path/to/basisu
```

Notes:
- The runtime loader already supports KTX2 via `useGLTFWithKTX2`.
- After converting, replace the original `.glb` in `editor/public/models`.
