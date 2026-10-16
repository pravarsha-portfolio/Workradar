# WorkRadar UX design for Figma

The 15 frames in this folder are the WorkRadar design file. Each SVG is made of real rectangles, vector icons and live text. When you import it into Figma you get an editable frame, not a flat picture.

The frames are exported straight from the running app (`npm run figma:export`), so the design and the MVP always match.

## Import into Figma (2 minutes)

1. Open Figma and create a new design file named **WorkRadar UX Design**.
2. The design uses three free Google fonts that Figma includes: Bricolage Grotesque, IBM Plex Sans and IBM Plex Mono. In the desktop app they work out of the box. If Figma shows a missing font notice after import, pick the same family in the Text panel.
3. Select all 15 `WorkRadar-*.svg` files in this folder and drag them onto the Figma canvas at once. Figma creates one frame per file and names it after the file.
4. Arrange the frames in rows: cover and desktop screens on the first row, dialogs and states on the second, mobile and design system on the third. Select them all and use **Tidy up** from the right panel.
5. Optional: right click any group (for example `brief`, `panel`, `item`) and choose **Frame selection**, then add auto layout if you want to keep editing the layout in Figma.
6. Click **Share › Copy link**, set access to **Anyone with the link can view**, and submit that link.

## Make it clickable (optional, 5 minutes)

In **Prototype** mode, connect:

| From | To |
| --- | --- |
| 01 Dashboard › "Open priority feed" | 02 Priority feed |
| 01 Dashboard › first item title | 03 Item details |
| 03 Item details › "Decide and unblock Arjun" | 04 Decision recorded |
| 03 Item details › "Assign" | 05 Assign dialog (Open overlay) |
| 03 Item details › "Snooze" | 06 Snooze dialog (Open overlay) |
| 01 Dashboard › "Nudge Legal" | 07 Nudge dialog (Open overlay) |
| Top search bar | 08 Search results |

## Frames

| Frame | What it shows |
| --- | --- |
| 00 Cover | Product promise, the four questions, primary flow, frame index |
| 01 Dashboard | AI brief, five stat tiles, top work, who is blocked, launch readiness, what happened |
| 02 Priority feed | Filters with counts, ranked list with reason chips and inline actions |
| 03 Item details | Summary, blocker callout, decision picker, suggested next step, thread, details |
| 04 Decision recorded | The same item after the PM decides: teammate unblocked, launch checklist ticks |
| 05 Assign dialog | Teammates with role and open workload |
| 06 Snooze dialog | Three time presets that return the item automatically |
| 07 Nudge dialog | Ready to send message to an external blocker with copy |
| 08 Search results | Keyword search with highlights, operator hints |
| 09 Search no results | No results state with recovery actions |
| 10 Empty state | Radar clear |
| 11 Error state | GitHub sync failure banner and source health with one click recovery |
| 12 Mobile dashboard | 390 px layout |
| 13 Mobile item details | 390 px layout |
| 14 Design system | Color tokens, type scale, buttons, pills, chips, score, stripes, principles |

PNG previews of every frame are in `previews/`.

## Another route: import the live app

If you prefer, install the free **html.to.design** Figma plugin, paste the URL of the running app (local `npm run dev` URL or the hosted demo), and it imports the page as Figma layers with auto layout.
