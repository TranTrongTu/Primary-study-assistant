# Retrieval evaluation

A small, repeatable measurement of the question "does retrieval put the right chunk in front of the LLM?", for each search method the app uses: vector search (pgvector, cosine distance), keyword search (pg_trgm) and their fusion with Reciprocal Rank Fusion (RRF).

```sh
python -m scripts.rag_eval      # needs the database and the embedding API key
```

The latest numbers are in [RESULTS.md](RESULTS.md) (per question too) and `results.json`.

## How it works

- **Corpus:** ten short Vietnamese lessons at primary-school level (`corpus/`), written for this purpose: maths, science, history, geography and Vietnamese grammar. Some topics overlap on purpose (plant respiration and human respiration, the water cycle and the circulatory system) so that a search has something to confuse.
- **Questions:** 32 questions in three groups (`questions.json`):
  - `paraphrase`: asked in different words from the lesson, the way a child would ask.
  - `keyword`: contains an exact name, term or number from the lesson.
  - `no_diacritics`: typed without Vietnamese tone marks ("phan so la gi").
- **Labels:** each question carries an `evidence` phrase copied from one lesson. A chunk is relevant when it contains that phrase. The labels therefore do not depend on chunk ids and survive a change of chunk size.
- **Pipeline under test:** the lessons are split with the app's own splitter, embedded with the production embedding model and stored in a scratch database built from the Alembic migrations. The questions are run through `vector_search`, `keyword_search` and `RRF` imported from `backend/src/RAG/retrieval`. Nothing is re-implemented, so the numbers describe the deployed code.
- **Metrics:** hit@k is the share of questions with a relevant chunk in the top k. MRR is the mean of 1/rank of the first relevant chunk. Everything is cut off at 5, the number of chunks the app passes to the LLM.

## What it found, and what changed

The first run measured the code as it was:

| Method | hit@1 | hit@5 | MRR | hit@5, no diacritics |
|---|---|---|---|---|
| vector | 0.62 | 0.84 | 0.73 | 0.44 |
| keyword | 0.41 | 0.78 | 0.55 | 0.44 |
| hybrid | 0.66 | 0.84 | 0.74 | 0.56 |

Two things stood out. Hybrid search was barely better than vector search alone, because the keyword side was weak. And questions typed without diacritics, which is how many pupils type, failed about half the time on every method.

Both pointed at keyword search, which ordered chunks by `content <-> question`: trigram similarity between the question and the *whole* 500-character chunk. A short question shares few trigrams with any long chunk, so the ranking was close to noise, and a question without tone marks shares almost none with accented text.

Keyword search now uses strict word similarity (`<<<->`, which scores the best-matching part of the chunk) on `unaccent()`-ed text on both sides. Same data, same script:

| Method | hit@1 | hit@5 | MRR | hit@5, no diacritics |
|---|---|---|---|---|
| vector | 0.62 | 0.84 | 0.73 | 0.44 |
| keyword | 0.69 | 0.94 | 0.79 | 0.89 |
| hybrid | 0.75 | 0.91 | 0.82 | 0.67 |

Four variants were scored (word similarity, unaccent, both, and the strict form of both). The last two gave the same hybrid result; the strict form was kept because it aligns matches to word boundaries, which suits Vietnamese, where every syllable is separated by a space.

## Limits of this measurement

- **It is small.** With 32 questions, one question is 3 percentage points. The numbers show direction, not a precise score.
- **The variant was chosen on the same questions it is reported on.** There is no held-out set, so the improvement is probably somewhat optimistic.
- **Retrieval only.** It does not judge the generated answer, and it skips the LLM step that rewrites a follow-up question using the conversation history.
- **Text files only.** PDF and image uploads go through other extractors.

## Known weaknesses left open

- **Hybrid is now below keyword search alone on questions without diacritics** (0.67 against 0.89). The embedding model does poorly on such text (0.44), and RRF gives both lists equal weight, so the weak list pulls good keyword results down.
- **RRF can drop a chunk that one method ranked first.** With k = 60, a chunk ranked sixth in both lists outscores a chunk ranked first in only one. This happens once in the current results.

Both are candidates for the next change (weighting the lists, or normalising the question before embedding it), and this harness is how that change would be judged.
