/**
 * Supported document types in EaseRead, grouped by reading category.
 *
 * Category summary:
 *  - Fiction:           NOVEL | SHORT_STORY | NOVELLA | GRAPHIC_NOVEL | POETRY_COLLECTION | ANTHOLOGY
 *  - Non-Fiction:       SELF_HELP | BIOGRAPHY | AUTOBIOGRAPHY | MEMOIR | ESSAY | ENCYCLOPEDIA
 *  - Academic/Research: RESEARCH_PAPER | TEXTBOOK | THESIS | DISSERTATION | JOURNAL | MONOGRAPH
 *  - Other:             OTHER
 */
export enum DocumentType {
  // ── Fiction ──────────────────────────────────────────────────────────────
  NOVEL = 'NOVEL',
  SHORT_STORY = 'SHORT_STORY',
  NOVELLA = 'NOVELLA',
  GRAPHIC_NOVEL = 'GRAPHIC_NOVEL',
  POETRY_COLLECTION = 'POETRY_COLLECTION',
  ANTHOLOGY = 'ANTHOLOGY',

  // ── Non-Fiction ──────────────────────────────────────────────────────────
  SELF_HELP = 'SELF_HELP',
  BIOGRAPHY = 'BIOGRAPHY',
  AUTOBIOGRAPHY = 'AUTOBIOGRAPHY',
  MEMOIR = 'MEMOIR',
  ESSAY = 'ESSAY',
  ENCYCLOPEDIA = 'ENCYCLOPEDIA',

  // ── Academic & Research ──────────────────────────────────────────────────
  RESEARCH_PAPER = 'RESEARCH_PAPER',
  TEXTBOOK = 'TEXTBOOK',
  THESIS = 'THESIS',
  DISSERTATION = 'DISSERTATION',
  JOURNAL = 'JOURNAL',
  MONOGRAPH = 'MONOGRAPH',

  // ── Other ─────────────────────────────────────────────────────────────────
  OTHER = 'OTHER',
}

/**
 * Fiction document types — these get spoiler prevention ON by default.
 * All other types default to spoiler prevention OFF.
 */
export const FICTION_DOCUMENT_TYPES: ReadonlySet<DocumentType> = new Set([
  DocumentType.NOVEL,
  DocumentType.SHORT_STORY,
  DocumentType.NOVELLA,
  DocumentType.GRAPHIC_NOVEL,
  DocumentType.POETRY_COLLECTION,
  DocumentType.ANTHOLOGY,
]);

/**
 * Returns the default value of `preventSpoilers` for a given document type.
 * Fiction types → true; everything else → false.
 */
export function defaultPreventSpoilers(type: DocumentType): boolean {
  return FICTION_DOCUMENT_TYPES.has(type);
}
