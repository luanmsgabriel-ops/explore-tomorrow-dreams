# Travel Match visual asset note — 2026-09-12

Temporary note: the generated sprite introduced visible pixelation and cropping because a 600×500 sprite was subdivided into 20 visual cells and then enlarged to full mobile-card size. The corrective implementation replaces sprite cells with dedicated 880×1168 vertical assets and exact 3:4 card geometry. This note is superseded by the follow-up PR and can be removed after merge if the checkpoint is consolidated elsewhere.
