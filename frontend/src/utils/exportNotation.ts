import { AnalyzeResponse } from "../api/client";

type Detection = NonNullable<AnalyzeResponse["detections"]>[0];

const classToXml: Record<string, { step: string, alter: string }> = {
  "Sa": { step: "C", alter: "0" },
  "Komal Re": { step: "D", alter: "-1" },
  "Re": { step: "D", alter: "0" },
  "Komal Ga": { step: "E", alter: "-1" },
  "Ga": { step: "E", alter: "0" },
  "Ma": { step: "F", alter: "0" },
  "Tivra Ma": { step: "F", alter: "1" },
  "Pa": { step: "G", alter: "0" },
  "Komal Dha": { step: "A", alter: "-1" },
  "Dha": { step: "A", alter: "0" },
  "Komal Ni": { step: "B", alter: "-1" },
  "Ni": { step: "B", alter: "0" },
};

export function exportToMusicXML(rows: Detection[][]): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Swaralipi Translation</part-name>
    </score-part>
  </part-list>
  <part id="P1">\n`;

  rows.forEach((row, i) => {
    xml += `    <measure number="${i + 1}">\n`;
    row.forEach(det => {
      // Ignore taal vibhag for XML notes
      if (det.class_name === "Taal Vibhag" || !classToXml[det.class_name]) return;
      const mapping = classToXml[det.class_name];
      xml += `      <note>
        <pitch>
          <step>${mapping.step}</step>
          <alter>${mapping.alter}</alter>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>\n`;
    });
    xml += `    </measure>\n`;
  });

  xml += `  </part>\n</score-partwise>`;
  return xml;
}

export function exportToText(rows: Detection[][]): string {
  let text = "";
  rows.forEach((row) => {
    const line = row.map(det => {
      if (det.class_name === "Taal Vibhag") return "|";
      return det.hindi_symbol;
    }).join(" ");
    text += line + "\n";
  });
  return text.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function exportToPrintableHtml(rows: Detection[][]): string {
  const lines = rows.map((row) =>
    row.map((det) => {
      if (det.class_name === "Taal Vibhag") return "|";
      return det.hindi_symbol;
    }).join(" ")
  );

  const escapedLines = lines.map((line) => escapeHtml(line));
  const generatedAt = new Date().toLocaleString();

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Swaralipi PDF Export</title>
    <style>
      :root {
        color-scheme: light;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 32px;
        font-family: "Noto Serif Devanagari", "Nirmala UI", "Mangal", serif;
        background: #f5f5f5;
        color: #111;
      }

      .sheet {
        max-width: 900px;
        margin: 0 auto;
        background: #fff;
        border: 2px solid #111;
        padding: 36px 40px;
      }

      .eyebrow {
        font: 700 11px/1.2 Arial, sans-serif;
        letter-spacing: 0.35em;
        text-transform: uppercase;
        color: #666;
        margin-bottom: 10px;
      }

      h1 {
        margin: 0 0 24px;
        font: 700 28px/1.1 Arial, sans-serif;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .notation {
        border-top: 2px solid #111;
        border-bottom: 2px solid #111;
        padding: 18px 0;
      }

      .line {
        font-size: 28px;
        line-height: 1.9;
        letter-spacing: 0.08em;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .line + .line {
        margin-top: 8px;
      }

      .footer {
        margin-top: 18px;
        font: 600 11px/1.4 Arial, sans-serif;
        color: #666;
      }

      @media print {
        body {
          background: #fff;
          padding: 0;
        }

        .sheet {
          max-width: none;
          border: none;
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <div class="eyebrow">Digital Swaralipi Export</div>
      <h1>Swaralipi Sheet</h1>
      <section class="notation">
        ${escapedLines.map((line) => `<div class="line">${line}</div>`).join("")}
      </section>
      <div class="footer">Generated from Swaralipi Lab on ${escapeHtml(generatedAt)}</div>
    </main>
    <script>
      window.onload = () => {
        window.print();
      };
    </script>
  </body>
</html>`;
}

export function exportToPdf(rows: Detection[][]) {
  const html = exportToPrintableHtml(rows);
  const printWindow = window.open("", "_blank", "width=900,height=1200");
  if (!printWindow) {
    throw new Error("Unable to open print window for PDF export.");
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
