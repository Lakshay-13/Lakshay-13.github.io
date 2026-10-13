# Portfolio motion artwork

These self-contained SVGs reuse the approved project scenes and toolkit marks
from [the profile artwork](https://github.com/Lakshay-13/Lakshay-13/tree/7011367f74ecdaf07239e01cd0a8e8ca634469b8/assets).
They illustrate each project's workflow rather than measured results or product
screenshots. Animation respects the visitor's reduced-motion setting.

To rebuild from that profile checkout:

```sh
python3 scripts/build_motion.py ../Lakshay-13
```

The deployed page only needs the generated SVGs. Logos are embedded in each file;
their original provider sources are recorded in `sources.json`.
