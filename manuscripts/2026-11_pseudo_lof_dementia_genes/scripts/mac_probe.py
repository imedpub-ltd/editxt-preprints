"""Stage 4a: Probe Mac Studio Apple M4 Max GPU/MPS and installed ML/bio libraries."""

import importlib.util
import platform

print(
    "Host:",
    platform.node(),
    "Machine:",
    platform.machine(),
    "Python:",
    platform.python_version(),
)
pkgs = [
    "torch",
    "mlx",
    "transformers",
    "scipy",
    "numpy",
    "pandas",
    "sklearn",
    "Bio",
    "RNA",
]
avail = {p: bool(importlib.util.find_spec(p)) for p in pkgs}
if avail["torch"]:
    import torch

    avail["torch_version"] = torch.__version__
    avail["mps_available"] = bool(torch.backends.mps.is_available())
    avail["mps_built"] = bool(torch.backends.mps.is_built())
if avail["transformers"]:
    import transformers

    avail["transformers_version"] = transformers.__version__
print("CAPABILITIES:", avail)
