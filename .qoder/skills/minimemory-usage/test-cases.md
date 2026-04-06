# MiniMemory Test Cases

## 1. Basic Connection Test

```sh
MC> PING
MC> SET mykey "Hello World"
MC> GET mykey
MC> EXISTS mykey
MC> DEL mykey
MC> GET mykey
```

## 2. Database Selection Test

```sh
MC> SELECT 1
MC> SET db1key "Database 1 Value"
MC> GET db1key
MC> SELECT 0
MC> GET db1key
MC> SET db0key "Database 0 Value"
MC> SELECT 1
MC> GET db0key
```

## 3. Transaction Test

```sh
MC> MULTI
MC> SET tx_key1 "Transaction Value 1"
MC> SET tx_key2 "Transaction Value 2"
MC> EXEC
MC> GET tx_key1
MC> GET tx_key2
```

## 4. Watch Key Test

```sh
MC> SET watch_key "Initial Value"
MC> MULTI
MC> WATCH watch_key
MC> SET watch_key "New Value"
MC> EXEC
MC> GET watch_key
```

## 5. Expiration Test

```sh
MC> SET expire_key "This will expire"
MC> PEXPIRE expire_key 50000
MC> PTTL expire_key
MC> GET expire_key
# Wait 5 seconds
MC> GET expire_key
```

## 6. Keyspace Operations Test

```sh
MC> FLUSHDB
MC> SET key1 "value1"
MC> SET key2 "value2"
MC> SET key3 "value3"
MC> KEYS *                  
MC> SCAN key*
```

## 7. Numeric Operations Test

```sh
MC> SET counter "10"
MC> INCR counter
MC> GET counter
MC> SETNX numbers 1.0 2.0 3.0 4.0     
MC> GETNX numbers                     
```

## 8. Persistence Test

```sh
MC> SET persist_key "This will be saved"
MC> SAVE
# Restart server
MC> GET persist_key
```

## 9. Stress Test Script

```bash
#!/bin/bash
NUM_CLIENTS=5
NUM_COMMANDS=100

for ((i=1; i<=$NUM_CLIENTS; i++)); do
  (
    echo "Client $i starting..."
    for ((j=1; j<=$NUM_COMMANDS; j++)); do
      echo "SET key_${i}_${j} value_${i}_${j}" | ./mini_cache_cli -h 127.0.0.1 -p 6379 > /dev/null
      echo "GET key_${i}_${j}" | ./mini_cache_cli -h 127.0.0.1 -p 6379 > /dev/null
    done
    echo "Client $i completed"
  ) &
done

wait
echo "All clients completed"
```

## 10. Graph and Evidence Search Test

```sh
# Write chunk and embedding
MC> OBJSET __chunk:doc1:0 text/plain "Redis is an in-memory database"
MC> SETNX __emb:demo_d3_cosine:doc1:0 0.10 0.20 0.30
MC> TAGADD __chunk:doc1:0 redis kv
MC> METASET __chunk:doc1:0 source wiki

# Build graph: topic -> chunk
MC> METASET topic:redis type topic
MC> GRAPH.ADDEDGE topic:redis HAS_CHUNK __chunk:doc1:0
MC> GRAPH.EDGEPROP.SET topic:redis HAS_CHUNK __chunk:doc1:0 confidence 0.92

# Structured neighbors (fixed slots): [rel, to, edge_props, edge_meta, from_meta, to_meta]
MC> GRAPH.NEIGHBORSX2 topic:redis HAS_CHUNK 10 EDGE_METAKEYS 1 confidence FROM_METAKEYS 1 type TO_METAKEYS 1 source

# Enumerate edges (fixed slots): [from, rel, to, edge_props, edge_meta, from_meta, to_meta]
MC> GRAPH.EDGE.LIST2 topic:redis HAS_CHUNK 10 EDGE_METAKEYS 1 confidence FROM_METAKEYS 1 type TO_METAKEYS 1 source

# Evidence search: only search in chunks reachable from topic:redis
MC> EVIDENCE.SEARCHF 5 cosine 3 0.11 0.19 0.29 GRAPHFROM topic:redis GRAPHREL HAS_CHUNK GRAPHDEPTH 1 TAG redis META source wiki
```

## 11. multilingual-e5-large-instruct End-to-End Example

```sh
# 1) Write chunk text
MC> OBJSET __chunk:doc2:0 text/plain "Redis supports multiple data structures like string/list/set/zset/hash."
MC> TAGADD __chunk:doc2:0 redis
MC> METASET __chunk:doc2:0 source handbook

# 2) Generate passage embedding externally with llama.cpp:
#    ./embedding -m multilingual-e5-large-instruct-*.gguf -p "passage: Redis supports multiple data structures..."
MC> SETNX __emb:e5-multi-large-instruct_d1024_cosine:doc2:0 <f1> <f2> ... <f1024>

# 3) Build graph for EVIDENCE.SEARCHF candidate filtering
MC> METASET topic:redis type topic
MC> GRAPH.ADDEDGE topic:redis HAS_CHUNK __chunk:doc2:0

# 4) Generate query embedding externally:
#    ./embedding -m multilingual-e5-large-instruct-*.gguf -p "query: What data structures does Redis have?"

# 5) Search with graph + tag/meta constraints
MC> EVIDENCE.SEARCHF 5 cosine 1024 <q1> <q2> ... <q1024> GRAPHFROM topic:redis GRAPHREL HAS_CHUNK GRAPHDEPTH 1 TAG redis META source handbook
```
