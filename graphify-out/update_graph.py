import json, os, time
from pathlib import Path
from graphify.extract import extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json, to_html

t0 = time.time()
scan_root = Path('.').resolve()
print(f"Starting Graphify update for {scan_root.name}...")

# 1. Collect codebase source files
code_files = []
for p in (scan_root / "src").rglob("*"):
    if p.is_file() and p.suffix in [".ts", ".tsx"] and not p.name.endswith(".test.ts") and not p.name.endswith(".test.tsx"):
        code_files.append(p)

for p in (scan_root / "scripts").glob("*.py"):
    if p.is_file():
        code_files.append(p)

print(f"Collected {len(code_files)} core source files from src/ and scripts/")

# 2. Extract AST
print("Extracting AST...")
ast_result = extract(code_files, cache_root=scan_root, parallel=False)
Path('graphify-out/.graphify_ast.json').write_text(json.dumps(ast_result, indent=2, ensure_ascii=False), encoding='utf-8')
print(f"AST extraction complete: {len(ast_result['nodes'])} nodes, {len(ast_result['edges'])} edges")

# 3. Create merged extraction
merged = {
    'nodes': ast_result['nodes'],
    'edges': ast_result['edges'],
    'hyperedges': [],
    'input_tokens': 0,
    'output_tokens': 0
}
Path('graphify-out/.graphify_extract.json').write_text(json.dumps(merged, indent=2, ensure_ascii=False), encoding='utf-8')

# 4. Build graph & cluster
print("Building graph and computing Louvain communities...")
G = build_from_json(merged, root=str(scan_root), directed=False)
if G.number_of_nodes() > 0:
    communities = cluster(G)
    cohesion = score_all(G, communities)
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)

    # Meaningful labels for Vocal Muse communities
    community_labels = {
        0: "Track Management & Studio Pipeline",
        1: "Cadence, Stress & Indic Romanizer",
        2: "Style Memory & Artistic Ghostwriter RAG",
        3: "Audio Capture, Latency & Live Punch-In",
        4: "Studio Arsenal & Lyrical Intelligence",
        5: "Headspace Journal & Evolution Analytics",
    }
    labels = {cid: community_labels.get(cid, f"Module Cluster {cid}") for cid in communities}
    questions = suggest_questions(G, communities, labels)

    # 5. Export JSON and HTML
    Path('graphify-out/graph.json').unlink(missing_ok=True)
    to_json(G, communities, 'graphify-out/graph.json')
    to_html(G, communities, 'graphify-out/graph.html')

    # 6. Generate report
    detection_mock = {
        "files": {"code": [str(f) for f in code_files], "document": ["README.md", "AGENTS.md"]},
        "total_files": len(code_files),
        "total_words": 120000,
        "scan_root": str(scan_root)
    }
    tokens = {'input': 0, 'output': 0}
    report = generate(G, communities, cohesion, labels, gods, surprises, detection_mock, tokens, str(scan_root), suggested_questions=questions)
    Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding='utf-8')

    analysis = {
        'communities': {str(k): v for k, v in communities.items()},
        'cohesion': {str(k): v for k, v in cohesion.items()},
        'gods': gods,
        'surprises': surprises,
        'questions': questions,
    }
    Path('graphify-out/.graphify_analysis.json').write_text(json.dumps(analysis, indent=2, ensure_ascii=False), encoding='utf-8')

    print(f"Graphify update SUCCESS in {time.time()-t0:.2f}s!")
    print(f"Results: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges across {len(communities)} communities.")
else:
    print("Error: G has 0 nodes.")
