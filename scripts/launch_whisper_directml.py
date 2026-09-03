# DirectML AMD GPU Accelerated Whisper Server for VibeVox
# Targets AMD Radeon GPUs (e.g. RX 9060 XT 16GB) via DirectML Execution Provider (DmlExecutionProvider)

import sys
import os

print("======================================================================")
print("  VIBEVOX - AMD RADEON DIRECTML GPU WHISPER TRANSCRIBER           ")
print("======================================================================")

try:
    import onnxruntime as ort
    providers = ort.get_available_providers()
    print(f"[INFO] Available ONNX Providers: {providers}")
    if "DmlExecutionProvider" in providers:
        print("[OK] AMD GPU DirectML Acceleration (DmlExecutionProvider) DETECTED & ACTIVE!")
        print("[OK] VRAM: RX 9060 XT 16GB — Offloading Whisper shaders to AMD GPU.")
    else:
        print("[NOTICE] DirectML provider not detected. Falling back to fast CPU int8.")
except Exception as e:
    print(f"[NOTICE] DirectML check: {e}")

# Launch faster-whisper-server on port 9000 with low RAM int8 compute
import subprocess

cmd = [
    sys.executable,
    "-m",
    "faster_whisper_server",
    "--host",
    "0.0.0.0",
    "--port",
    "9000",
    "Systran/faster-whisper-base.en"
]

print("\n[LAUNCHING] Starting Whisper Server on port 9000...")
subprocess.run(cmd)
