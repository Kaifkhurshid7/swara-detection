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
