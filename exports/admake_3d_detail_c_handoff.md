# Handoff: Admake 3D Structural Detail C

## Source Context

Workspace:

`D:\Dropbox\_Documents\Admake`

Source PDF:

`C:\Users\nguyenbuu.DESKTOP-TOEFTR1\Downloads\SGP26-CSPS combined - 20260424_Internal comments.pdf`

User request:

Read pages 23 to 28 of the PDF, identify the context, pay close attention to beam and column dimensions, then export a 3D OBJ for the shown connection detail.

RTK check:

`rtk --version` returned `rtk 0.35.0`.

## PDF Pages Read

Read PDF pages 23 to 28, corresponding to drawing sheets 22 to 27 of 27.

Main context:

The drawings are for the **Extension Building** of the **F1 Pit Straight Building**. They include steel column layout, base plate layout, beam layout, structural sections, typical connection details, and staircase details.

Relevant sheet names:

- Page 23 / sheet 22: `SGP26-CSPS-EX-PL-01`, Extension Building Base Plate & Column Layout Plan
- Page 24 / sheet 23: `SGP26-CSPS-EX-PL-02`, Extension Building Beam Layout Plan
- Page 25 / sheet 24: `SGP26-CSPS-EX-SE-01`, Extension Building Sections, Grid 40 to Grid 44
- Page 26 / sheet 25: `SGP26-CSPS-EX-SE-02`, Extension Building Sections, Grid A to Grid E
- Page 27 / sheet 26: `SGP26-CSPS-EX-CD-01`, Extension Building Typical Connection Details
- Page 28 / sheet 27: `SGP26-CSPS-EX-ST-01`, Extension Building Staircase & Detail

Rendered page images were created here:

`D:\Dropbox\_Documents\Admake\.codex_tmp\pdf_pages_23_28`

Detail C crop:

`D:\Dropbox\_Documents\Admake\.codex_tmp\pdf_pages_23_28\page_27_detail_c_3_1_crop.png`

## Grid Dimensions For 3D Context

Units: `mm`.

Horizontal grid:

- `39 -> 40'`: 500
- `40' -> 40`: 5500
- `40 -> 41`: 4000
- `41 -> 42`: 5000
- `42 -> 43`: 5000
- `43 -> 44`: 6000
- `40 -> 44`: 20000
- `40' -> 44`: 25500 including the 5500 bay

Vertical grid:

- `A' -> A`: 2400
- `A -> B`: 4000
- `B -> C`: 6000
- `C -> D'`: 3750
- `D' -> E`: 3600
- Total `A' -> E`: 19750

Levels:

- `1FL`: 0
- `LFL`: 4850
- `2FL`: 8000
- `RFL`: 12167
- `1FL -> LFL`: 4850
- `LFL -> 2FL`: 3150
- `2FL -> RFL`: 4167

## Steel Sections Identified

Column profiles:

- `EC1`: `UC254x254x73`
- `EC2`: `UC203x203x46`
- `EC3`: `UB457x191x67`
- `ECS`: `UC203x203x46`

Beam and member profiles:

- `EB1`: `UB457x191x67`
- `EB2`: `SHS 200x200x5`
- `EB3`: `UB305x102x25`
- `G1`: `UB254x146x37`
- `G2`: `UB356x171x51`
- `G3`: `UB533x210x82`
- `G4`: `UB356x171x51`
- `G5`: `UB305x165x40`
- `G6`: `UB610x229x101`
- `G7`: `UB356x171x51`
- `L1`: `L90x90x8`
- `LB`: `SHS 50x50x3`
- `P1`: `Z250x2.4`
- `P2`: `Z250x3`
- `S1`: `UB305x102x25`
- `ST`: `TFC180x75x7`

Base plates and steel plates:

- `BP1`: `PL 300x300x25`
- `BP2`: `PL 350x350x25`
- `BP3`: `PL 500x250x25`
- `SP1`: `PL 1000x1000x25`
- `SP2`: `PL 1500x1500x25`
- `SP3`: `PL 2000x2000x25`
- `SP4`: `PL 2000x7500x25`
- `SP5`: `PL 500x500x25`
- Typical stiffener: `PL 10mm THK`

Material notes:

- Column: minimum grade `S275`
- Beam: minimum grade `Q345`
- Bolts: grade `8.8`

## Internal Comments / Markups Noted

Important markups from the internal-comment PDF:

- `G2 and G4 section is the same`
- `All B2 detail name change to B4 detail`
- Added or revised `B8` detail
- `G1` marked/confirmed as `UB254x146x37`
- Sheet CD-01 includes comment: `Update section, bolts and plate size`
- Sheet CD-01 includes comment: `Delete A7`

## Detail Requested For OBJ

The user provided an image of:

`Detail C`, `Scale 1:10`, `3.1 / CD-01`

Title from sheet:

`C. BEAM TO COLUMN WEB CONNECTION`

Visible labels in detail:

- `COLUMN`
- `BEAM`
- `BOLT M16`
- `PL 8 mm THK.`
- `PL 6 mm THK.`

Visible dimensions near detail:

- Plate height shown with `50 + 100 + 50 = 200`
- A `120` dimension is visible near the connection detail
- The detail shows M16 bolt connection through the beam-to-column web plate

## OBJ Export Created

Output folder:

`D:\Dropbox\_Documents\Admake\exports\detail_c_beam_to_column_web_connection`

Generated files:

- OBJ: `D:\Dropbox\_Documents\Admake\exports\detail_c_beam_to_column_web_connection\detail_c_beam_to_column_web_connection.obj`
- MTL: `D:\Dropbox\_Documents\Admake\exports\detail_c_beam_to_column_web_connection\detail_c_beam_to_column_web_connection.mtl`
- README: `D:\Dropbox\_Documents\Admake\exports\detail_c_beam_to_column_web_connection\README_detail_c.txt`
- Generator script: `D:\Dropbox\_Documents\Admake\.codex_tmp\generate_detail_c_connection_obj.py`

OBJ validation:

- Loaded successfully with `trimesh`
- Scene bounds: `[[-101.5, -101.5, -340.0], [101.5, 760.0, 340.0]]`
- OBJ source vertex count: `782`
- OBJ source face count: `1050`
- Trimesh loaded vertex count: `776`
- Trimesh triangulated face count: `1452`
- Materials/groups detected: `column_steel`, `beam_steel`, `plate_8mm`, `plate_6mm`, `bolt_dark`, `weld_dark`

## OBJ Modelling Assumptions

The detail image does not give a unique column/beam mark, so the OBJ used representative profiles from the same drawing set:

- Column: `EC2/ECS`, modelled as `UC203x203x46`
- Beam: `G1`, modelled as `UB254x146x37`
- Connection plate: `PL 6mm`, modelled as a 200 mm high plate with 120 mm projection from the visible Detail 3.1 dimension
- Column web reinforcement/stiffeners: `PL 8mm`, modelled on both web faces plus top/bottom stiffener plates
- Bolts: `M16`, modelled as three bolt assemblies on one vertical line, interpreting `50-100-50 / 200` as 50 mm edge distances and 100 mm first-to-last bolt spacing
- Bolt holes are not boolean-cut into the OBJ; bolts, washers, and nuts are explicit mesh geometry

## Continuation Update

After reopening the handoff, Detail C / 3.1 was rechecked against a clearer crop:

`D:\Dropbox\_Documents\Admake\.codex_tmp\pdf_pages_23_28\page_27_detail_c_3_1_zoom_a.png`

The OBJ/MTL/README were regenerated on `2026-04-28` with:

- `PL6_fin_plate_200h_x_120proj`
- Three `M16` bolt assemblies instead of two
- Added `PL8_column_stiffener_top` and `PL8_column_stiffener_bottom`
- Beam start moved close to the column face so the fin plate and bolt line pass through the beam web

## CD-01 Full Sheet OBJ Export

Full sheet export for `SGP26-CSPS-EX-CD-01` was created on `2026-04-28`.

Output folder:

`D:\Dropbox\_Documents\Admake\exports\sheet_cd01_connection_models`

Generator script:

`D:\Dropbox\_Documents\Admake\.codex_tmp\generate_cd01_connection_objs.py`

Generated files:

- `SGP26-CSPS-EX-CD-01_sheet_all_details.obj`
- `detail_A1_beam_to_column_flange_connection.obj`
- `detail_A2_beam_to_column_flange_connection.obj`
- `detail_A3_beam_to_column_flange_connection.obj`
- `detail_A4_beam_to_column_flange_connection.obj`
- `detail_A5_beam_to_column_flange_connection.obj`
- `detail_A6_beam_to_column_flange_connection.obj`
- `detail_B1_beam_to_beam_connection.obj`
- `detail_B2_beam_to_beam_connection.obj`
- `detail_B3_beam_to_beam_connection.obj`
- `detail_B4_beam_to_beam_connection.obj`
- `detail_B5_beam_to_beam_connection.obj`
- `detail_B6_beam_to_beam_connection.obj`
- `detail_B7_beam_to_beam_connection.obj`
- `detail_B8_beam_to_beam_connection.obj`
- `detail_C_beam_to_column_web_connection.obj`
- `detail_D1_splice_connection.obj`
- `detail_D2_splice_connection.obj`
- `detail_E_rhs_connection.obj`
- `detail_F_bracing_connection.obj`
- `detail_L_purlin_bracket.obj`
- `purlin_connection.obj`
- `sag_rod_detail_typ.obj`
- `sheet_cd01_connection_models.mtl`
- `README_sheet_cd01_connection_models.txt`

Bolt asset mapping:

- `M12`: `f14.fbx` scaled `12/14`
- `M16`: `f20.fbx` scaled `16/20`
- `M20`: `f20.fbx` native scale
- `M24`: `f20.fbx` scaled `24/20`
- `M27`: `f20.fbx` scaled `27/20`

Sheet notes:

- `A7` was not exported because CD-01 has a `Delete A7` markup.
- `B8` was exported from the yellow marked-up row.
- The exports are diagrammatic coordination OBJs from the PDF sheet. They are not fabrication-ready shop models and do not boolean-cut bolt holes.
- All exported OBJs loaded successfully with `trimesh`.

## Suggested Next Chat Prompt

Use this prompt in a new chat if continuing outside this project:

```text
Tôi đang dựng 3D cho F1 Pit Straight Building từ file PDF:
C:\Users\nguyenbuu.DESKTOP-TOEFTR1\Downloads\SGP26-CSPS combined - 20260424_Internal comments.pdf

Hãy tiếp tục từ handoff này. Tôi đã đọc pages 23-28 và đã xuất OBJ cho Detail C / 3.1 / CD-01 tại:
D:\Dropbox\_Documents\Admake\exports\detail_c_beam_to_column_web_connection\detail_c_beam_to_column_web_connection.obj

Nhiệm vụ tiếp theo: kiểm tra/hoàn thiện mô hình OBJ beam-to-column web connection theo đúng Detail C, đặc biệt PL 8mm, PL 6mm, bolt M16, column/beam section, và nếu cần xuất lại OBJ/MTL.
```
