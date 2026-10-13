"""Adapt the approved profile artwork into standalone portfolio SVG images.

Usage: python3 scripts/build_motion.py ../Lakshay-13
The site serves the generated files directly; no build or profile checkout is
needed to deploy it.
"""

import copy
import json
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PROFILE = Path(sys.argv[1]).resolve()
NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", NS)


def tag(name):
    return f"{{{NS}}}{name}"


def artwork(title, width, height, content, definitions, styles):
    root = ET.Element(tag("svg"), {
        "width": str(width), "height": str(height),
        "viewBox": f"0 0 {width} {height}", "role": "img",
        "aria-labelledby": "title",
    })
    ET.SubElement(root, tag("title"), {"id": "title"}).text = title
    root.append(copy.deepcopy(definitions))
    ET.SubElement(root, tag("style")).text = styles + "\n@media(prefers-reduced-motion:reduce){*{animation:none!important}}"
    root.append(content)
    return ET.tostring(root, encoding="unicode") + "\n"


def save(folder, name, svg):
    path = ROOT / "assets" / "motion" / folder / f"{name}.svg"
    path.parent.mkdir(parents=True, exist_ok=True)
    ET.fromstring(svg)
    path.write_text(svg)


projects = json.loads((PROFILE / "assets/projects.json").read_text())
for project in projects:
    source = ET.parse(PROFILE / "assets/projects" / f"{project['id']}.svg").getroot()
    scene = source.find(f".//{tag('g')}[@data-project-scene='true']")
    if scene is None:
        raise ValueError(f"Missing project scene: {project['id']}")
    content = ET.Element(tag("g"), {"transform": "translate(20 0)"})
    content.append(copy.deepcopy(scene))
    styles = "\n".join(element.text or "" for element in source.iter(tag("style")))
    save("projects", project["id"], artwork(
        project["name"], 360, 240, content, source.find(tag("defs")), styles,
    ))

toolkit = ET.parse(PROFILE / "assets/toolkit.svg").getroot()
styles = "\n".join(element.text or "" for element in toolkit.iter(tag("style")))
tiles = []
current = None
for element in toolkit:
    if element.tag == tag("rect") and element.get("y") == "110" and element.get("height") == "120":
        current = {"x": float(element.get("x")), "width": float(element.get("width")), "elements": []}
        tiles.append(current)
    elif current is not None:
        if element.tag == tag("text"):
            current = None
        else:
            current["elements"].append(copy.deepcopy(element))

names = [("python", "Python"), ("codex", "Codex"), ("cloud", "GCP and AWS"),
         ("data", "Databases and SQL"), ("neural", "PINNs and neural networks")]
if len(tiles) != len(names):
    raise ValueError("The profile toolkit layout has changed.")
for tile, (name, title) in zip(tiles, names):
    center = tile["x"] + tile["width"] / 2
    content = ET.Element(tag("g"), {"transform": f"translate({80 - center * 1.2:.3f} -120) scale(1.2)"})
    for element in tile["elements"]:
        content.append(element)
    save("skills", name, artwork(title, 160, 120, content, toolkit.find(tag("defs")), styles))

print(f"Built {len(projects)} project scenes and {len(names)} skill illustrations.")
