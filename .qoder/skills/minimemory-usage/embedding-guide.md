# Embedding Integration Guide

## multilingual-e5-large-instruct Integration

### Key Conventions

| Parameter | Value |
|-----------|-------|
| Dimension | 1024 |
| Metric | cosine |
| Embedding Key | `__emb:e5-multi-large-instruct_d1024_cosine:<id>` |
| Chunk Key | `__chunk:<id>` |

### Passage vs Query Prefixes

E5 models require different prefixes for different use cases:

- **Passage (documents/chunks)**: `passage: <chunk_text>`
- **Query (user questions)**: `query: <question>`

### External Embedding Generation with llama.cpp

```bash
# Generate passage embedding
./embedding -m multilingual-e5-large-instruct-*.gguf \
  -p "passage: Redis is an in-memory database supporting multiple data structures."

# Generate query embedding  
./embedding -m multilingual-e5-large-instruct-*.gguf \
  -p "query: What data structures does Redis support?"
```

### Complete Workflow

```
Step 1: Store chunk text
────────────────────────
MC> OBJSET __chunk:doc1:0 text/plain "Your document content here..."
MC> TAGADD __chunk:doc1:0 tag1 tag2
MC> METASET __chunk:doc1:0 source documentation

Step 2: Generate and store embedding
────────────────────────────────────
# Run llama.cpp externally, then:
MC> SETNX __emb:e5-multi-large-instruct_d1024_cosine:doc1:0 <f1> <f2> ... <f1024>

Step 3: Build knowledge graph (optional)
────────────────────────────────────────
MC> METASET topic:redis type topic
MC> GRAPH.ADDEDGE topic:redis HAS_CHUNK __chunk:doc1:0
MC> GRAPH.EDGEPROP.SET topic:redis HAS_CHUNK __chunk:doc1:0 confidence 0.92

Step 4: Search with constraints
───────────────────────────────
# Generate query embedding first, then:
MC> EVIDENCE.SEARCHF 5 cosine 1024 <q1> ... <q1024> \
    GRAPHFROM topic:redis GRAPHREL HAS_CHUNK GRAPHDEPTH 1 \
    TAG tag1 META source documentation
```

## EVIDENCE.SEARCHF Parameters

| Parameter | Description |
|-----------|-------------|
| `<topk>` | Number of results to return |
| `<metric>` | Similarity metric: `cosine`, `l2`, `ip` |
| `<dim>` | Vector dimension (must match stored embeddings) |
| `<q1..qdim>` | Query vector values |
| `TAG <t>` | Filter by tag (can specify multiple) |
| `META <f> <v>` | Filter by metadata field=value |
| `KEYPREFIX <p>` | Filter by embedding key prefix |
| `GRAPHFROM <n>` | Start node for graph traversal |
| `GRAPHREL <r>` | Edge relation type to traverse |
| `GRAPHDEPTH <d>` | Maximum traversal depth |

## Server-Side Embedding (Optional)

Enable in `mcs.conf`:

```conf
embedding.enabled yes
embedding.model_path /path/to/model.gguf
embedding.host localhost
embedding.port 8080
# Optional: auto-start llama.cpp server
embedding.llama_server /path/to/llama-server
embedding.autostart yes
```

After enabling, use these commands:

```text
# Generate and return embedding
MC> EMBED QUERY What is Redis?
MC> EMBED PASSAGE Redis is an in-memory database...

# Generate and store embedding
MC> EMBED.SET __emb:e5-multi-large-instruct_d1024_cosine:doc1:0 PASSAGE Redis is...
```

## Best Practices

1. **Consistent naming**: Always include model name, dimension, and metric in embedding keys
2. **One embedding space**: Don't mix different models in the same key prefix
3. **Graph for filtering**: Use GRAPHFROM/GRAPHREL to narrow search space before similarity search
4. **Tags and metadata**: Add meaningful tags and metadata for additional filtering
5. **Prefix discipline**: Always use `passage:` for documents and `query:` for questions
