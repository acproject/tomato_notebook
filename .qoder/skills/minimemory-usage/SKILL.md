---
name: minimemory-usage
description: Use MiniMemory/MiniCache Server for KV storage, graph operations, and evidence search with embeddings. Use when working with Redis-like operations, GRAPH commands, EVIDENCE.SEARCHF, or llama.cpp embedding integration.
---

# MiniMemory/MiniCache Server Usage

## Quick Start

### Start Server
```bash
cd build/bin
./mini_cache_server --config conf/mcs.conf
```

### Connect Client
```bash
./mini_cache_cli -h 127.0.0.1 -p 6379
```

## Basic KV Operations

```text
MC> PING
MC> SET mykey "Hello World"
MC> GET mykey
MC> EXISTS mykey
MC> DEL mykey
MC> SET counter "10"
MC> INCR counter
```

## Database Selection

```text
MC> SELECT 1
MC> SET db1key "Database 1 Value"
MC> SELECT 0
MC> GET db1key          # Returns nil (different database)
```

## Transactions

```text
MC> MULTI
MC> SET tx_key1 "Value 1"
MC> SET tx_key2 "Value 2"
MC> EXEC
```

## Expiration

```text
MC> SET expire_key "This will expire"
MC> PEXPIRE expire_key 50000    # 50 seconds
MC> PTTL expire_key             # Check remaining TTL
```

## Graph Operations

### Data Model
- Edge: `__edge:<from>:<rel>:<to>` (auto-encoded)
- Metadata: `__meta:<subject>:<field> = <value>`
- Chunk: `OBJSET __chunk:<id> <mime> <data>`
- Embedding: `SETNX __emb:<space>:<id> <f1> <f2> ...`

### Basic Graph Commands

```text
# Create nodes and edges
MC> METASET topic:redis type topic
MC> GRAPH.ADDEDGE topic:redis HAS_CHUNK __chunk:doc1:0
MC> GRAPH.EDGEPROP.SET topic:redis HAS_CHUNK __chunk:doc1:0 confidence 0.92

# Query neighbors (fixed 6 slots: rel, to, edge_props, edge_meta, from_meta, to_meta)
MC> GRAPH.NEIGHBORSX2 topic:redis HAS_CHUNK 10 EDGE_METAKEYS 1 confidence FROM_METAKEYS 1 type TO_METAKEYS 1 source

# Check edge existence
MC> GRAPH.HASEDGE topic:redis HAS_CHUNK __chunk:doc1:0

# Delete edge
MC> GRAPH.DELEDGE topic:redis HAS_CHUNK __chunk:doc1:0
```

## Evidence Search with Embeddings

### Recommended Embedding Convention (multilingual-e5-large-instruct)

- Key format: `__emb:e5-multi-large-instruct_d1024_cosine:<id>`
- Dimension: 1024
- Metric: cosine
- Passage prefix: `passage: <chunk_text>`
- Query prefix: `query: <question>`

### Workflow

```text
# 1. Store chunk text
MC> OBJSET __chunk:doc1:0 text/plain "Redis is an in-memory database"
MC> TAGADD __chunk:doc1:0 redis kv
MC> METASET __chunk:doc1:0 source wiki

# 2. Store embedding (generated externally via llama.cpp)
MC> SETNX __emb:e5-multi-large-instruct_d1024_cosine:doc1:0 <f1> <f2> ... <f1024>

# 3. Build graph for candidate filtering
MC> GRAPH.ADDEDGE topic:redis HAS_CHUNK __chunk:doc1:0

# 4. Search with graph constraints
MC> EVIDENCE.SEARCHF 5 cosine 1024 <q1> ... <q1024> GRAPHFROM topic:redis GRAPHREL HAS_CHUNK GRAPHDEPTH 1 TAG redis
```

### EVIDENCE.SEARCHF Syntax

```
EVIDENCE.SEARCHF <topk> <metric> <dim> <q1..qdim> 
  [TAG t]... 
  [META f v]... 
  [KEYPREFIX p] 
  [GRAPHFROM n] 
  [GRAPHREL r] 
  [GRAPHDEPTH d]
```

## Graph Commands Reference

| Command | Description |
|---------|-------------|
| `GRAPH.ADDEDGE <from> <rel> <to>` | Add edge |
| `GRAPH.DELEDGE <from> <rel> <to>` | Delete edge + metadata |
| `GRAPH.HASEDGE <from> <rel> <to>` | Check edge exists |
| `GRAPH.EDGEPROP.SET <from> <rel> <to> <field> <value>` | Set edge property |
| `GRAPH.EDGEPROP.GET <from> <rel> <to> [field]` | Get edge property |
| `GRAPH.NEIGHBORS <node> [rel] [limit]` | List neighbors |
| `GRAPH.NEIGHBORSX2 <node> [rel] [limit] ...` | Structured neighbors (6 slots) |
| `GRAPH.EDGE.LIST2 <node> [rel] [limit] ...` | List edges (7 slots) |
| `GRAPH.PATH <from> <to> [rel] [maxDepth]` | Shortest path |

## Configuration (mcs.conf)

```conf
bind 0.0.0.0
port 6379
#requirepass password123

appendonly yes
appendfilename ./data/appendonly.aof
appendfsync everysec

save 1 1
save 15 10
save 60 1000

maxmemory 2gb
maxmemory-policy allkeys-lru
```

## Additional Resources

- For complete test cases, see [test-cases.md](test-cases.md)
- For embedding integration details, see [embedding-guide.md](embedding-guide.md)
