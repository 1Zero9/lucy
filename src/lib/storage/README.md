# R2 storage layer

Files belong in R2, metadata belongs in D1.

R2 objects remain private. Before serving an object:
1. validate authenticated session
2. load attachment metadata using owner-scoped D1 query
3. retrieve trusted R2 key from that record
4. stream object
