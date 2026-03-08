from import_parser import parse_musicxml, parse_latex

xml_content = """<score-partwise>
  <part id="P1">
    <measure number="1">
      <note><pitch><step>C</step><alter>0</alter></pitch></note>
      <note><pitch><step>D</step><alter>-1</alter></pitch></note>
    </measure>
  </part>
</score-partwise>"""

print("MusicXML:", parse_musicxml(xml_content))

latex_content = r"\sa \komalre \ga \tivrama \pa \dha \ni"
print("LaTeX:", parse_latex(latex_content))
